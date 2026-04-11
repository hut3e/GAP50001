/**
 * ISO 50001 GAP Survey — Backend server
 * MongoDB + Express + Socket.IO, routes: surveys, evidence, gap
 */
const http = require("http");
const path = require("path");
const os = require("os");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const fs = require("fs");

/** Lấy địa chỉ IP LAN (IPv4) của máy chủ để điện thoại cùng mạng có thể truy cập */
function getLocalNetworkIP() {
  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) return iface.address;
      }
    }
  } catch (_) {}
  return null;
}

const surveyRoutes = require("./routes/surveys");
const gapRoutes = require("./routes/gap");
const evidenceRoutes = require("./routes/evidence");
const dropdownRoutes = require("./routes/dropdowns");
const { BUILTIN } = dropdownRoutes;
const { UPLOAD_ROOT, ensureDir } = require("./uploadConfig");
const Evidence = require("./models/Evidence");
const Survey = require("./models/Survey");
const DropdownItem = require("./models/DropdownItem");
const { VALID_CATEGORIES } = require("./models/DropdownItem");
const { GAP_CHECKLIST } = require("./gap.constants");

const PORT = process.env.PORT || 5002;
const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/iso50001gap";

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000, // Thời gian chờ chọn server
  connectTimeoutMS: 10000,         // Thời gian chờ kết nối TCP
  socketTimeoutMS: 45000,          // Thời gian chờ socket
  maxPoolSize: 10,
  bufferCommands: true,            // Mongoose buffer queries khi đang connecting
};

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/surveys", surveyRoutes);
app.use("/api/surveys/:surveyId/evidence", evidenceRoutes);
app.use("/api/iso50001/gap", gapRoutes);
app.use("/api/dropdowns", dropdownRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error("[API error]", err.message || err);
  const msg = err.message || "Lỗi máy chủ";
  const isMongo = /buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg);
  const isMulter = err.code === "LIMIT_FILE_SIZE" || err.code === "LIMIT_UNEXPECTED_FILE" || (err.message && err.message.includes("Định dạng file"));
  if (isMongo) res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
  else if (isMulter) res.status(400).json({ error: msg || "File không hợp lệ hoặc vượt quá 25MB." });
  else res.status(500).json({ error: msg });
});

const getDbName = () => mongoose.connection.db?.databaseName || (MONGODB_URI.match(/\/([^/?]+)(\?|$)/) || [null, "iso50001gap"])[1];

app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    service: "ISO 50001 GAP Survey API",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    database: getDbName(),
    note: "Database xuất hiện trong MongoDB Compass sau khi Lưu phiên khảo sát lần đầu.",
  })
);

app.get("/api/info", (_req, res) =>
  res.json({
    database: getDbName(),
    mongoConnected: mongoose.connection.readyState === 1,
    message: "DB name: " + getDbName() + ". Trong MongoDB Compass kết nối localhost:27017 sẽ thấy DB này sau khi lưu phiên lần đầu.",
  })
);

/** IP LAN của máy chủ — dùng cho QR khi Host chạy trên localhost, điện thoại quét cần truy cập qua IP */
app.get("/api/local-ip", (_req, res) => {
  const ip = getLocalNetworkIP();
  res.json({ localIp: ip || "", ok: !!ip });
});

// Lưu ý: mobile-capture được phục vụ từ frontend (Vite/dev hoặc build static). Backend không còn redirect ở đây.

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  // Cho phép cả WebSocket lẫn polling để đảm bảo mobile & desktop đều kết nối được
  transports: ["websocket", "polling"],
  // Tăng timeout để tránh disconnect sớm trên mobile
  pingTimeout: 30000,
  pingInterval: 10000,
  // Cho phép upgrade từ polling lên websocket
  allowUpgrades: true,
  // Kích thước payload tối đa (ảnh mobile có thể lớn)
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
});

// Expose Socket.IO instance để các route (evidence, ...) có thể emit realtime
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join:survey", async (surveyId) => {
    const sid = surveyId != null ? String(surveyId).trim() : "";
    if (!sid) return;
    await socket.join(`survey:${sid}`);
    const room = io.sockets.adapter.rooms.get(`survey:${sid}`);
    const clients = room ? room.size : 1;
    // Báo cho socket này biết đã vào room thành công
    socket.emit("joined:survey", { surveyId: sid, clients });
    // Báo cho tất cả client khác trong room biết có peer mới
    socket.to(`survey:${sid}`).emit("peer:joined", { surveyId: sid, clients });
  });

  socket.on("leave:survey", (surveyId) => {
    const sid = surveyId != null ? String(surveyId).trim() : "";
    if (sid) socket.leave(`survey:${sid}`);
  });
  socket.on("evidence:image", async (payload) => {
    const { surveyId: rawSurveyId, clauseId, note, imageBase64, filename: givenName, context } = payload || {};
    const surveyId = typeof rawSurveyId === "string" ? rawSurveyId.trim() : "";
    if (!surveyId || !imageBase64) {
      socket.emit("evidence:error", { message: "surveyId and imageBase64 required" });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      socket.emit("evidence:error", { message: "Invalid surveyId (Session đánh giá không hợp lệ). Quét lại QR từ Host." });
      return;
    }
    try {
      if (mongoose.connection.readyState !== 1) {
        socket.emit("evidence:error", { message: "MongoDB not connected" });
        return;
      }
      const base64Data = (imageBase64 || "").replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(base64Data, "base64");
      const ext = (imageBase64.match(/^data:image\/(\w+);/) || [null, "jpg"])[1] || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext.toLowerCase()) ? ext.toLowerCase() : "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
      ensureDir(UPLOAD_ROOT);
      const dir = path.join(UPLOAD_ROOT, String(surveyId));
      ensureDir(dir);
      fs.writeFileSync(path.join(dir, filename), buf);
      const doc = await Evidence.create({
        surveyId,
        clauseId: (clauseId || "").trim() || undefined,
        context: context && typeof context === "object" ? context : undefined,
        type: "image",
        filename,
        originalName: givenName || `mobile-${filename}`,
        mimeType: `image/${safeExt}`,
        size: buf.length,
        path: path.join(String(surveyId), filename),
        note: (note || "").trim() || undefined,
        source: "mobile",
      });
      io.to(`survey:${surveyId}`).emit("evidence:added", doc);
      socket.emit("evidence:saved", doc);
    } catch (err) {
      console.error("[socket evidence:image]", err);
      socket.emit("evidence:error", { message: err.message });
    }
  });
});

/** Seed tất cả built-in dropdown items vào MongoDB nếu chưa có */
async function seedDropdowns() {
  let inserted = 0, updated = 0;
  try {
    for (const cat of VALID_CATEGORIES) {
      const items = BUILTIN[cat] || [];
      for (let i = 0; i < items.length; i++) {
        const t = items[i];
        const doc = {
          category: cat,
          id: t.id,
          name: t.name,
          icon: t.icon || "📌",
          desc: t.desc || "",
          checks: t.checks || [],
          ref_std: t.ref_std || "",
          isCustom: false,
          order: i,
          active: true,
        };
        const existing = await DropdownItem.findOne({ category: cat, id: t.id }).lean();
        if (!existing) {
          await DropdownItem.create(doc);
          inserted++;
        } else if (!existing.isCustom) {
          // Cập nhật built-in nếu tên/icon thay đổi
          await DropdownItem.updateOne(
            { category: cat, id: t.id },
            { $set: { name: doc.name, icon: doc.icon, desc: doc.desc, ref_std: doc.ref_std, order: doc.order } }
          );
          updated++;
        }
      }
    }
    console.log(`[Seed Dropdowns] inserted=${inserted}, updated=${updated}`);
  } catch (err) {
    console.error("[Seed Dropdowns] Error:", err.message);
  }
}

/** Seed GAP_CHECKLIST vào collection checklistitems nếu chưa có */
async function seedChecklistItems() {
  try {
    const ChecklistItem = mongoose.connection.db.collection("checklistitems");
    let inserted = 0, updated = 0;
    for (let i = 0; i < GAP_CHECKLIST.length; i++) {
      const item = GAP_CHECKLIST[i];
      const existing = await ChecklistItem.findOne({ id: item.id });
      if (!existing) {
        await ChecklistItem.insertOne({ ...item, order: i, active: true, isCustom: false });
        inserted++;
      } else {
        await ChecklistItem.updateOne(
          { id: item.id },
          { $set: { clause: item.clause, title: item.title, weight: item.weight, cat: item.cat, legal: item.legal, order: i } }
        );
        updated++;
      }
    }
    console.log(`[Seed Checklist] inserted=${inserted}, updated=${updated}`);
  } catch (err) {
    console.error("[Seed Checklist] Error:", err.message);
  }
}

/**
 * Migration: bổ sung các trường mảng mặc định vào các phiên cũ chưa có.
 * Chỉ thêm vào nếu trường KHÔNG TỒN TẠI trong document (null/undefined),
 * không ghi đè mảng rỗng do người dùng cố ý xóa.
 */
async function migrateOldSurveys() {
  try {
    const LEGAL_DEFAULTS = [
      { code:"Luật 50/2010/QH12", subject:"Luật Sử dụng NL tiết kiệm và HQ; Luật 77/2025/QH15", doc_type:"Luật", articles:"Điều 4–7, 35–42", threshold:"Bắt buộc tất cả CSTN", status:"pending" },
      { code:"NĐ 30/2026/NĐ-CP", subject:"Nghị định 30/2026", doc_type:"Nghị định", articles:"Điều 10–30", threshold:"", status:"pending" },
      { code:"TT 25/2020/TT-BCT", subject:"Quản lý NL tại cơ sở CN trọng điểm", doc_type:"Thông tư", articles:"Điều 4–20", threshold:"≥1.000 TOE/năm", status:"pending" },
      { code:"TT 25/2020/TT-BCT", subject:"Kiểm toán năng lượng", doc_type:"Thông tư", articles:"Điều 5–15", threshold:"Mỗi 3 năm — CSTN", status:"pending" },
      { code:"TT 38/2014/TT-BCT", subject:"Đào tạo quản lý năng lượng (EMR)", doc_type:"Thông tư", articles:"Điều 4–9", threshold:"Bắt buộc EMR", status:"pending" },
      { code:"TT 36/2016/TT-BCT", subject:"Dán nhãn năng lượng và MEPS", doc_type:"Thông tư", articles:"Danh mục thiết bị", threshold:"Thiết bị trong danh mục", status:"pending" },
      { code:"QĐ 280/QĐ-TTg", subject:"VNEEP3 (2019–2030)", doc_type:"QĐ TTg", articles:"Mục tiêu 8–10% TKNL", threshold:"", status:"pending" },
      { code:"NĐ 06/2022/NĐ-CP", subject:"Giảm phát thải KNK", doc_type:"Nghị định", articles:"Điều 6, 15", threshold:"≥3.000 tCO₂e/năm", status:"pending" },
      { code:"QĐ 1725/QĐ-BCT (2024)", subject:"Danh mục mặt hàng kiểm tra hiệu suất NL", doc_type:"QĐ BCT", articles:"Danh mục thiết bị", threshold:"Thiết bị trong danh mục", status:"pending" },
    ];
    const ISO_DEFAULTS = [
      { standard_id:"ISO 50001:2018", focus:"Tiêu chuẩn gốc — EnMS Requirements" },
      { standard_id:"ISO 50002:2014", focus:"Energy Audits — Kiểm toán năng lượng" },
      { standard_id:"ISO 50003:2014", focus:"Certification Bodies — Tổ chức chứng nhận" },
      { standard_id:"ISO 50004:2014", focus:"Implementation Guidance — Hướng dẫn triển khai" },
      { standard_id:"ISO 50006:2014", focus:"EnPI & EnB Measurement" },
      { standard_id:"ISO 50015:2014", focus:"M&V — Đo lường và xác minh NL" },
      { standard_id:"ISO 50021:2019", focus:"EnPI/EnB Selection Guidelines" },
      { standard_id:"ISO 50047:2016", focus:"Energy Savings Determination" },
    ];
    const ROADMAP_DEFAULTS = [
      { timeframe:"T+0 → T+1", activity:"Đóng khoảng cách nghiêm trọng (Score 1)", deliverable:"Tài liệu EnMS cơ bản hoàn chỉnh", criteria:"Không còn NC Score 1" },
      { timeframe:"T+1 → T+3", activity:"Xây dựng đầy đủ EnMS §4–§10", deliverable:"EnB, EnPI, SEU, Chính sách NL", criteria:"Score trung bình ≥ 3.5/5" },
      { timeframe:"T+3 → T+6", activity:"Vận hành EnMS và thu thập bằng chứng", deliverable:"Hồ sơ vận hành 3+ tháng", criteria:"Bằng chứng thực tế tại SEU" },
      { timeframe:"T+6 → T+9", activity:"Đánh giá nội bộ + Action khắc phục", deliverable:"Báo cáo đánh giá nội bộ, CAR", criteria:"Tất cả NC được đóng" },
      { timeframe:"T+9 → T+12", activity:"Đánh giá chứng nhận (Stage 1 + Stage 2)", deliverable:"Chứng nhận ISO 50001:2018", criteria:"Không có NC Major từ CBTT" },
    ];

    let migrated = 0;
    const col = mongoose.connection.db.collection("surveys");
    // Thêm legal_registry nếu field chưa tồn tại
    const r1 = await col.updateMany(
      { legal_registry: { $exists: false } },
      { $set: { legal_registry: LEGAL_DEFAULTS } }
    );
    migrated += r1.modifiedCount;
    // Thêm iso_standards_registry nếu chưa tồn tại
    const r2 = await col.updateMany(
      { iso_standards_registry: { $exists: false } },
      { $set: { iso_standards_registry: ISO_DEFAULTS } }
    );
    migrated += r2.modifiedCount;
    // Thêm certification_roadmap nếu chưa tồn tại
    const r3 = await col.updateMany(
      { certification_roadmap: { $exists: false } },
      { $set: { certification_roadmap: ROADMAP_DEFAULTS } }
    );
    migrated += r3.modifiedCount;
    // Thêm custom_clauses nếu chưa tồn tại
    const r4 = await col.updateMany(
      { custom_clauses: { $exists: false } },
      { $set: { custom_clauses: [] } }
    );
    migrated += r4.modifiedCount;
    // Thêm logistics_trips nếu chưa tồn tại
    const r5 = await col.updateMany(
      { logistics_trips: { $exists: false } },
      { $set: { logistics_trips: [] } }
    );
    migrated += r5.modifiedCount;
    if (migrated > 0) console.log(`[Migrate Surveys] ${migrated} field(s) backfilled across old surveys.`);
    else console.log("[Migrate Surveys] All surveys already up-to-date.");
  } catch (err) {
    console.error("[Migrate Surveys] Error:", err.message);
  }
}

async function connectMongo(retries = 12, delay = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
      const dbName = mongoose.connection.db?.databaseName || "iso50001gap";
      console.log(`[MongoDB] Connected — database: "${dbName}"`);
      console.log("  → MongoDB Compass: connect to localhost:27017");
      return;
    } catch (err) {
      const isDocker = MONGODB_URI.includes("mongo:");
      const tip = isDocker
        ? "Is the 'mongo' service running? Check: docker compose logs mongo"
        : "Ensure MongoDB is running on port 27017 (or update MONGODB_URI)";
      if (i < retries) {
        console.warn(`[MongoDB] Connection attempt ${i}/${retries} failed: ${err.message}`);
        console.warn(`  → ${tip} — retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error(`[MongoDB] Give up after ${retries} attempts: ${err.message}`);
        console.error(`  → ${tip}`);
      }
    }
  }
}

async function start() {
  ensureDir(UPLOAD_ROOT);

  // Start HTTP server FIRST — app still runs even if MongoDB is temporarily down
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`\n✅ ISO 50001 GAP Survey API: http://localhost:${PORT}`);
    console.log("   Socket.IO: enabled (mobile capture sync)");
    console.log("   GET  /api/surveys");
    console.log("   POST /api/surveys");
    console.log("   GET/POST /api/surveys/:id/evidence");
    console.log("   GET  /api/iso50001/gap/schema");
    console.log("   POST /api/iso50001/gap/generate\n");
  });

  // Connect MongoDB in background (with retry), then seed built-in data
  connectMongo().then(async () => {
    const dbName = mongoose.connection.db?.databaseName || "iso50001gap";
    console.log(`[MongoDB] DB "${dbName}" ready — seeding built-in data...`);
    await seedDropdowns();
    await seedChecklistItems();
    await migrateOldSurveys();
    console.log(`[MongoDB] Seed & migration complete.`);
  });
}

start().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});

// ── Graceful shutdown ────────────────────────────────────────
process.on("SIGTERM", async () => {
  console.log("SIGTERM — closing MongoDB connection...");
  await mongoose.disconnect();
  process.exit(0);
});
