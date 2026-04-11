/**
 * ISO 50001 GAP — Evidence API v2
 * Thêm: stepKey (lọc theo bước: clause/risk/process/equipment)
 * Drop-in replacement cho routes/evidence.js
 */
"use strict";

const express  = require("express");
const mongoose = require("mongoose");
const path     = require("path");
const fs       = require("fs");
const multer   = require("multer");
const Evidence = require("../models/Evidence");

const router = express.Router({ mergeParams: true });
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(__dirname, "..", "..", "uploads");

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
ensureDir(UPLOAD_ROOT);

// ── multer storage ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, _f, cb) {
    const dir = path.join(UPLOAD_ROOT, String(req.params.surveyId || "tmp"));
    ensureDir(dir); cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext  = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,10)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ALLOWED_MIMES = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/csv","text/plain","application/csv",
    ];
    if (ALLOWED_MIMES.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error(`Loại file không hỗ trợ: ${file.mimetype}`));
    }
  },
});

// ── Helpers ────────────────────────────────────────────────────────
const isValidId = id => mongoose.Types.ObjectId.isValid(id);
const requireMongo = (_req, res, next) =>
  mongoose.connection.readyState === 1 ? next()
  : res.status(503).json({ error:"MongoDB chưa kết nối." });

function emit(req, surveyId, event, data) {
  req.app?.locals?.io?.to(String(surveyId)).emit(event, data || {});
}

// ── GET /  (filter by stepKey OR clauseId) ────────────────────────
router.get("/", requireMongo, async (req, res) => {
  try {
    const { surveyId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const { clauseId, stepKey, type, source, q, limit=500 } = req.query;
    const filter = { surveyId: new mongoose.Types.ObjectId(surveyId) };
    if (clauseId) filter.clauseId = clauseId;
    if (stepKey)  filter.stepKey  = stepKey;
    if (type)     filter.type     = type;
    if (source)   filter.source   = source;
    if (q?.trim()) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i");
      filter.$or = [{ note:re },{ filename:re },{ originalName:re }];
    }
    const list = await Evidence.find(filter).sort({ createdAt:-1 }).limit(Number(limit)).lean();
    res.json(list);
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── GET /count ────────────────────────────────────────────────────
router.get("/count", requireMongo, async (req, res) => {
  try {
    const { surveyId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const byStep = await Evidence.aggregate([
      { $match: { surveyId: new mongoose.Types.ObjectId(surveyId) } },
      { $group: { _id:"$stepKey", count:{ $sum:1 } } },
    ]);
    const total = byStep.reduce((s,x)=>s+x.count,0);
    res.json({ total, byStep });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── GET /:id — serve file ─────────────────────────────────────────
router.get("/:id", requireMongo, async (req, res) => {
  try {
    const { surveyId, id } = req.params;
    if (!isValidId(surveyId)||!isValidId(id)) return res.status(400).json({ error:"Invalid id" });
    const doc = await Evidence.findOne({ _id:id, surveyId }).lean();
    if (!doc) return res.status(404).json({ error:"Not found" });
    const filePath = path.join(UPLOAD_ROOT, doc.path || path.join(surveyId, doc.filename));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error:"File not found on disk" });
    if (req.query.download === "1") {
      const safe = encodeURIComponent(doc.originalName || doc.filename);
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${safe}`);
    }
    res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
    res.sendFile(path.resolve(filePath));
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── POST / — multipart file upload ───────────────────────────────
router.post("/", requireMongo, (req, res, next) => {
  upload.single("file")(req, res, err => {
    if (err) return res.status(400).json({ error: err.code==="LIMIT_FILE_SIZE" ? "File vượt 30MB." : err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { surveyId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    if (!req.file)            return res.status(400).json({ error:"Chưa chọn file." });

    const isImage = req.file.mimetype.startsWith("image/");
    const doc = await Evidence.create({
      surveyId,
      clauseId:     (req.body.clauseId || "").trim() || undefined,
      stepKey:      (req.body.stepKey  || "").trim() || undefined,
      type:         isImage ? "image" : "document",
      filename:     req.file.filename,
      originalName: req.file.originalname || req.file.filename,
      mimeType:     req.file.mimetype || "",
      size:         req.file.size || 0,
      path:         path.join(String(surveyId), req.file.filename),
      note:         (req.body.note   || "").trim() || undefined,
      source:       (req.body.source || "upload").trim() || "upload",
    });
    emit(req, surveyId, "evidence:added", { id:doc._id, source:doc.source, clauseId:doc.clauseId, stepKey:doc.stepKey });
    res.status(201).json(doc);
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── POST /base64 — receive base64 image from mobile/camera ────────
router.post("/base64", requireMongo, async (req, res) => {
  try {
    const { surveyId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const { imageBase64, clauseId, stepKey, note, source="mobile" } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error:"Thiếu imageBase64." });

    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/,"");
    const buf    = Buffer.from(base64,"base64");
    if (!buf.length) return res.status(400).json({ error:"Dữ liệu ảnh rỗng." });

    const ext     = (imageBase64.match(/^data:image\/(\w+);/)||[,"jpg"])[1]||"jpg";
    const safeExt = ["jpg","jpeg","png","gif","webp"].includes(ext.toLowerCase())?ext.toLowerCase():"jpg";
    const fname   = `${Date.now()}-${Math.random().toString(36).slice(2,10)}.${safeExt}`;
    const dir     = path.join(UPLOAD_ROOT, String(surveyId));

    ensureDir(dir);
    fs.writeFileSync(path.join(dir, fname), buf);

    const doc = await Evidence.create({
      surveyId,
      clauseId: (clauseId||"").trim()||undefined,
      stepKey:  (stepKey ||"").trim()||undefined,
      type: "image", filename: fname,
      originalName: `${source}-${fname}`,
      mimeType: `image/${safeExt}`, size: buf.length,
      path: path.join(String(surveyId), fname),
      note: (note||"").trim()||undefined,
      source: ["mobile","camera"].includes(source) ? source : "mobile",
    });
    emit(req, surveyId, "evidence:added", { id:doc._id, source:doc.source, clauseId:doc.clauseId, stepKey:doc.stepKey });
    res.status(201).json(doc);
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── PATCH /:id — update note/clauseId/stepKey ─────────────────────
router.patch("/:id", requireMongo, async (req, res) => {
  try {
    const { surveyId, id } = req.params;
    if (!isValidId(surveyId)||!isValidId(id)) return res.status(400).json({ error:"Invalid id" });
    const { note, clauseId, stepKey } = req.body || {};
    const upd = {};
    if (note    !== undefined) upd.note     = note;
    if (clauseId!== undefined) upd.clauseId = clauseId;
    if (stepKey !== undefined) upd.stepKey  = stepKey;
    const doc = await Evidence.findOneAndUpdate({ _id:id, surveyId }, { $set:upd }, { new:true }).lean();
    if (!doc) return res.status(404).json({ error:"Not found" });
    res.json(doc);
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── DELETE /:id ───────────────────────────────────────────────────
router.delete("/:id", requireMongo, async (req, res) => {
  try {
    const { surveyId, id } = req.params;
    if (!isValidId(surveyId)||!isValidId(id)) return res.status(400).json({ error:"Invalid id" });
    const doc = await Evidence.findOneAndDelete({ _id:id, surveyId }).lean();
    if (!doc) return res.status(404).json({ error:"Not found" });
    // Delete physical file
    const filePath = path.join(UPLOAD_ROOT, doc.path || path.join(surveyId, doc.filename));
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(_) {}
    emit(req, surveyId, "evidence:deleted", { id });
    res.json({ deleted:true, id });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

module.exports = router;
