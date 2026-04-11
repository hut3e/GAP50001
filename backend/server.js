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
const pgService = require("./services/postgres");
const checklistRoutes = require("./routes/checklist");
const notificationRoutes = require("./routes/notifications");
const dropdownRoutes = require("./routes/dropdowns");
const { UPLOAD_ROOT, ensureDir } = require("./uploadConfig");
const Evidence = require("./models/Evidence");
const Survey = require("./models/Survey");
const scheduler = require("./services/scheduler");

const PORT = process.env.PORT || 5002;
const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/iso50001gap";

const MONGO_OPTIONS = { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 };

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/surveys", surveyRoutes);
app.use("/api/surveys/:surveyId/evidence", evidenceRoutes);
app.use("/api/iso50001/gap", gapRoutes);
app.use("/api/iso50001/gap/checklist", checklistRoutes);
app.use("/api/iso50001/gap/dropdowns", dropdownRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/clients", require("./routes/clients"));
app.use("/api/auditors", require("./routes/auditors"));
app.use("/api/jobs", require("./routes/jobs"));

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
const io = new Server(httpServer, { cors: { origin: "*" } });

// Expose Socket.IO instance để các route (evidence, ...) có thể emit realtime
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join:survey", (surveyId) => {
    const sid = surveyId != null ? String(surveyId).trim() : "";
    if (sid) socket.join(`survey:${sid}`);
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

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
    const dbName = mongoose.connection.db?.databaseName || "iso50001gap";
    console.log("MongoDB connected — database:", dbName);
    console.log("→ Trong Compass, bạn có thể kết nối ngay qua chuẩn mongodb://127.0.0.1:27017");

    // Khởi tạo PostgreSQL
    await pgService.initDB();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    console.error("→ Đảm bảo MongoDB đang chạy và cổng cấu hình không bị xung đột.");
  }
  ensureDir(UPLOAD_ROOT);

  // Khởi động Cron Scheduler (Telegram notifications)
  try { scheduler.startScheduler(); } catch (e) { console.warn("[Scheduler] Không khởi động được:", e.message); }

  let currentPort = typeof PORT === "string" ? parseInt(PORT, 10) : PORT;

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Cảnh báo] Cổng ${currentPort} đang bận, tự động chuyển sang cổng ${currentPort + 1}...`);
      currentPort++;
      httpServer.listen(currentPort, "0.0.0.0");
    } else {
      console.error(err);
      process.exit(1);
    }
  });

  httpServer.listen(currentPort, "0.0.0.0", () => {
    const mongoOk = mongoose.connection.readyState === 1;
    console.log("\n✅ ISO 50001 GAP Survey API: http://localhost:" + currentPort + " (listen 0.0.0.0 — điện thoại có thể kết nối)");
    console.log("   Socket.IO: enabled (đồng bộ ảnh từ điện thoại)");
    console.log("   MongoDB:", mongoOk ? "đã kết nối" : "chưa kết nối");
    console.log("   GET  /api/surveys");
    console.log("   POST /api/surveys\n");
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
