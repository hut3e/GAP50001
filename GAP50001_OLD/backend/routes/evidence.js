/**
 * ISO 50001 GAP — Evidence API: upload tài liệu/ảnh, CRUD, lọc theo điều khoản/vị trí
 */
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { upload, UPLOAD_ROOT, ensureDir } = require("../uploadConfig");
const Evidence = require("../models/Evidence");

const router = express.Router({ mergeParams: true });

function requireMongo(req, res, next) {
  const state = mongoose.connection.readyState;
  if (state === 1 || state === 2) return next(); // 2=connecting: mongoose buffers
  return res.status(503).json({ error: "MongoDB chưa kết nối.", code: "MONGO_DISCONNECTED" });
}

// Emit Socket.IO event nếu backend đã gắn io vào app (server.js)
function emitEvidenceEvent(req, event, payload) {
  try {
    const io = req.app && req.app.get && req.app.get("io");
    if (io) io.emit(event, payload || {});
  } catch (_) {
    // bỏ qua mọi lỗi emit để không ảnh hưởng API chính
  }
}

// GET /api/surveys/:surveyId/evidence — list, filter: clauseId, type, q (search note/filename), source
router.get("/", requireMongo, async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      return res.status(400).json({ error: "Invalid surveyId" });
    }
    const { clauseId, type, source, q, limit = 200 } = req.query;
    const filter = { surveyId: new mongoose.Types.ObjectId(surveyId) };
    if (clauseId) filter.clauseId = clauseId;
    if (type) filter.type = type;
    if (source) filter.source = source;
    if (q && q.trim()) {
      filter.$or = [
        { note: new RegExp(q.trim(), "i") },
        { filename: new RegExp(q.trim(), "i") },
        { originalName: new RegExp(q.trim(), "i") },
      ];
    }
    const list = await Evidence.find(filter)
      .sort({ createdAt: -1, _id: -1 }) // bản mới nhất (theo thời gian + id) luôn ở trên
      .limit(Math.min(Number(limit) || 200, 1000)) // tránh trả về quá 1000 bản ghi
      .lean();
    res.json(list);
  } catch (err) {
    console.error("[evidence list]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/surveys/:surveyId/evidence — upload file (multipart: file, clauseId?, note?, context?)
router.post("/", requireMongo, (req, res, next) => {
  upload.single("file")(req, res, (multerErr) => {
    if (multerErr) {
      const msg = multerErr.code === "LIMIT_FILE_SIZE"
        ? "File vượt quá 25MB."
        : multerErr.message || "Lỗi upload file.";
      return res.status(400).json({ error: msg });
    }
    next();
  });
}, async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      return res.status(400).json({ error: "Invalid surveyId" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Chưa chọn file. Dùng trường 'file' để gửi file." });
    }
    const isImage = (req.file.mimetype || "").startsWith("image/");
    const context = {};
    try {
      if (req.body.context) Object.assign(context, JSON.parse(req.body.context));
    } catch (_) {}
    ensureDir(path.join(UPLOAD_ROOT, String(surveyId)));
    const doc = await Evidence.create({
      surveyId,
      clauseId: (req.body.clauseId || "").trim() || undefined,
      context: Object.keys(context).length ? context : undefined,
      type: isImage ? "image" : "document",
      filename: req.file.filename,
      originalName: (() => {
        // Ưu tiên dùng field 'originalName' do frontend gửi (UTF-8 thuần),
        // tránh lỗi encode khi multer/busboy đọc tên file từ Content-Disposition header.
        if (req.body.originalName && req.body.originalName.trim()) {
          return req.body.originalName.trim();
        }
        // Fallback: thử decode Latin-1 → UTF-8 (multer đọc header sai encoding)
        try {
          const raw = req.file.originalname || req.file.filename;
          const decoded = Buffer.from(raw, "latin1").toString("utf8");
          // Nếu decoded hợp lệ UTF-8 hơn raw thì dùng decoded
          return decoded;
        } catch (_) {
          return req.file.originalname || req.file.filename;
        }
      })(),
      mimeType: req.file.mimetype || "",
      size: req.file.size || 0,
      path: path.join(String(surveyId), req.file.filename),
      note: (req.body.note || "").trim() || undefined,
      source: (req.body.source || "upload").trim() || "upload",
    });

    // Realtime: thông báo cho tất cả client đang xem StepEvidence
    emitEvidenceEvent(req, "evidence:added", {
      surveyId,
      id: doc._id,
      source: doc.source,
      clauseId: doc.clauseId,
      type: doc.type,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("[evidence POST]", err);
    const msg = err.message || "Lỗi lưu bằng chứng.";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối. Kiểm tra backend và thử lại.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg });
  }
});

// POST /api/surveys/:surveyId/evidence/base64 — nhận ảnh từ Socket/mobile (JSON body: imageBase64, clauseId?, note?, filename?)
router.post("/base64", requireMongo, async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      return res.status(400).json({ error: "Invalid surveyId" });
    }
    const { imageBase64, clauseId, note, filename: givenName, source } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: "Thiếu dữ liệu ảnh (imageBase64)." });
    const base64Data = (imageBase64 || "").replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(base64Data, "base64");
    if (buf.length === 0) return res.status(400).json({ error: "Dữ liệu ảnh không hợp lệ." });
    const ext = (imageBase64.match(/^data:image\/(\w+);/) || [null, "jpg"])[1] || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext.toLowerCase()) ? ext.toLowerCase() : "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
    const dir = path.join(UPLOAD_ROOT, String(surveyId));
    ensureDir(UPLOAD_ROOT);
    ensureDir(dir);
    const fullPath = path.join(dir, filename);
    try {
      fs.writeFileSync(fullPath, buf);
    } catch (writeErr) {
      console.error("[evidence base64] writeFile", writeErr);
      return res.status(500).json({ error: "Không ghi được file ảnh lên đĩa." });
    }

    const doc = await Evidence.create({
      surveyId,
      clauseId: (clauseId || "").trim() || undefined,
      type: "image",
      filename,
      originalName: givenName || `mobile-${filename}`,
      mimeType: `image/${safeExt}`,
      size: buf.length,
      path: path.join(String(surveyId), filename),
      note: (note || "").trim() || undefined,
      source: source === "mobile" || source === "camera" ? source : "mobile",
    });

    emitEvidenceEvent(req, "evidence:added", {
      surveyId,
      id: doc._id,
      source: doc.source,
      clauseId: doc.clauseId,
      type: doc.type,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("[evidence base64]", err);
    const msg = err.message || "Lỗi lưu ảnh bằng chứng.";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối. Kiểm tra backend và thử lại.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg });
  }
});

// GET /api/surveys/:surveyId/evidence/:id — stream file (download/view)
router.get("/:id", requireMongo, async (req, res) => {
  try {
    const { surveyId, id } = req.params;
    const doc = await Evidence.findOne({ _id: id, surveyId }).lean();
    if (!doc) return res.status(404).json({ error: "Evidence not found" });
    const fullPath = path.join(UPLOAD_ROOT, doc.path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "File not found on server" });
    res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.originalName || doc.filename)}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/surveys/:surveyId/evidence/:id — update metadata (clauseId, note, context)
router.put("/:id", requireMongo, async (req, res) => {
  try {
    const { surveyId, id } = req.params;
    const update = {};
    if (req.body.clauseId !== undefined) update.clauseId = String(req.body.clauseId).trim();
    if (req.body.note !== undefined) update.note = String(req.body.note).trim();
    if (req.body.context !== undefined) update.context = req.body.context;
    const doc = await Evidence.findOneAndUpdate(
      { _id: id, surveyId },
      { $set: update },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: "Evidence not found" });
    res.json(doc);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/surveys/:surveyId/evidence/:id
router.delete("/:id", requireMongo, async (req, res) => {
  try {
    const { surveyId, id } = req.params;
    const doc = await Evidence.findOneAndDelete({ _id: id, surveyId });
    if (!doc) return res.status(404).json({ error: "Evidence not found" });
    const fullPath = path.join(UPLOAD_ROOT, doc.path);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (e) { console.warn("[evidence] unlink failed", e.message); }
    }

    emitEvidenceEvent(req, "evidence:deleted", { surveyId, id });

    res.json({ deleted: true, id });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
