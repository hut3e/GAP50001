/**
 * ISO 50001 GAP — Backend Server v2.1
 * Express + Socket.IO + MongoDB
 */
"use strict";

const path = require("path");
const os   = require("os");
const fs   = require("fs");
const http = require("http");

const express    = require("express");
const cors       = require("cors");
const mongoose   = require("mongoose");
const { Server: SocketIOServer } = require("socket.io");

const surveysRouter       = require("./routes/surveys");
const evidenceRouter      = require("./routes/evidence_v2"); // v2 supports stepKey
const gapRouter           = require("./routes/gap");
const usersRouter         = require("./routes/users");
const clientsRouter       = require("./routes/clients");
const auditPlansRouter    = require("./routes/auditPlans");
const logisticsRouter     = require("./routes/logistics");
const energyProfileRouter = require("./routes/energyProfiles");

const PORT         = parseInt(process.env.PORT || "5002", 10);
const MONGODB_URI  = process.env.MONGODB_URI  || "mongodb://127.0.0.1:27017/iso50001gap";
const FRONTEND_DIR = process.env.FRONTEND_DIR || path.join(__dirname, "..", "frontend", "dist");
const PUBLIC_DIR   = process.env.PUBLIC_DIR   || path.join(__dirname, "..", "frontend", "public");
const UPLOAD_ROOT  = process.env.UPLOAD_ROOT  || path.join(__dirname, "..", "uploads");

function getLocalIp() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces) {
      if (i.family === "IPv4" && !i.internal) return i.address;
    }
  }
  return "127.0.0.1";
}

const app    = express();
const server = http.createServer(app);
const io     = new SocketIOServer(server, {
  cors: { origin:"*", methods:["GET","POST"] },
  transports: ["websocket","polling"],
  pingTimeout: 60000, pingInterval: 25000,
});
app.locals.io = io;

app.use(cors({ origin:"*", methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"] }));
app.options("*", cors());
app.use(express.json({ limit:"30mb" }));
app.use(express.urlencoded({ extended:true, limit:"30mb" }));

if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive:true });
app.use("/uploads", express.static(UPLOAD_ROOT));

app.get("/api/health", (_req, res) => res.json({
  status:"ok", time:new Date().toISOString(),
  mongo: mongoose.connection.readyState===1?"connected":"disconnected",
  localIp:getLocalIp(), port:PORT,
}));
app.get("/api/local-ip", (_req, res) => res.json({ localIp:getLocalIp(), port:PORT }));

// ── API Routes ────────────────────────────────────────────────
app.use("/api/surveys",                    surveysRouter);
app.use("/api/surveys/:surveyId/evidence", evidenceRouter);   // evidence_v2 (with stepKey)
app.use("/api/iso50001/gap",               gapRouter);
app.use("/api/users",                      usersRouter);
app.use("/api/clients",                    clientsRouter);
app.use("/api/audit-plans",               auditPlansRouter);
app.use("/api/logistics",                  logisticsRouter);
app.use("/api/energy-profiles",            energyProfileRouter);

// ── Mobile capture ────────────────────────────────────────────
app.get("/mobile-capture/:surveyId/:socketPort/:clauseId?", (req, res) => {
  const mobilePage = path.join(PUBLIC_DIR, "mobile-capture.html");
  if (!fs.existsSync(mobilePage)) {
    return res.status(404).send(`<html><body style="background:#0f172a;color:#f1f5f9;padding:24px">
      <h2>⚠️ mobile-capture.html not found</h2>
      <p>Place at: <code>frontend/public/mobile-capture.html</code></p>
      <p>surveyId: <strong>${req.params.surveyId}</strong></p></body></html>`);
  }
  const cfg = JSON.stringify({
    surveyId:   req.params.surveyId,
    socketPort: req.params.socketPort || String(PORT),
    clauseId:   req.params.clauseId || req.query.clauseId || "",
    apiBase:    `${req.protocol}://${req.hostname}:${req.params.socketPort || PORT}`,
  });
  let html = fs.readFileSync(mobilePage, "utf-8");
  html = html.replace("</head>", `<script>window.__MOBILE_CAPTURE_CONFIG__=${cfg};</script>\n</head>`);
  res.setHeader("Content-Type","text/html"); res.send(html);
});

// ── SPA ───────────────────────────────────────────────────────
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));
  app.get("*", (req, res, next) => {
    if (/^\/(api|mobile-capture|uploads)\//.test(req.path)) return next();
    const idx = path.join(FRONTEND_DIR, "index.html");
    if (fs.existsSync(idx)) res.sendFile(idx);
    else res.status(404).send("Run: npm run frontend:build");
  });
}

// ── Socket.IO ─────────────────────────────────────────────────
const surveyRooms = new Map();
io.on("connection", (socket) => {
  let joinedSid = null;

  socket.on("join:survey", (sid) => {
    if (!sid) return;
    sid = String(sid).trim();
    joinedSid = sid;
    socket.join(sid);
    if (!surveyRooms.has(sid)) surveyRooms.set(sid, new Set());
    surveyRooms.get(sid).add(socket.id);
    socket.emit("joined:survey", { surveyId:sid, clients:surveyRooms.get(sid).size });
    socket.to(sid).emit("peer:joined", { clients:surveyRooms.get(sid).size });
  });

  socket.on("leave:survey", (sid) => {
    if (!sid) return;
    socket.leave(sid);
    if (surveyRooms.has(sid)) {
      surveyRooms.get(sid).delete(socket.id);
      if (!surveyRooms.get(sid).size) surveyRooms.delete(sid);
    }
  });

  socket.on("evidence:submit", async ({ surveyId, imageBase64, clauseId, note } = {}) => {
    if (!surveyId || !imageBase64) return socket.emit("evidence:error",{error:"Missing fields"});
    try {
      const Evidence = require("./models/Evidence");
      const base64 = imageBase64.replace(/^data:image\/\w+;base64,/,"");
      const buf = Buffer.from(base64,"base64");
      if (!buf.length) return socket.emit("evidence:error",{error:"Empty image"});
      const ext = (imageBase64.match(/^data:image\/(\w+);/)||[,,"jpg"])[1]||"jpg";
      const safeExt = ["jpg","jpeg","png","gif","webp"].includes(ext)?ext:"jpg";
      const fname = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${safeExt}`;
      const dir = path.join(UPLOAD_ROOT, surveyId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(path.join(dir,fname), buf);
      const doc = await Evidence.create({
        surveyId, type:"image", filename:fname,
        originalName:`mobile-${fname}`, mimeType:`image/${safeExt}`,
        size:buf.length, path:path.join(surveyId,fname),
        clauseId:(clauseId||"").trim()||undefined,
        note:(note||"").trim()||undefined, source:"mobile",
      });
      socket.emit("evidence:saved",{id:doc._id,filename:fname});
      io.to(surveyId).emit("evidence:added",{id:doc._id,source:"mobile",clauseId:doc.clauseId});
    } catch (e) { socket.emit("evidence:error",{error:e.message}); }
  });

  socket.on("disconnect", () => {
    if (joinedSid && surveyRooms.has(joinedSid)) {
      surveyRooms.get(joinedSid).delete(socket.id);
      if (!surveyRooms.get(joinedSid).size) surveyRooms.delete(joinedSid);
    }
  });
});

// ── MongoDB ───────────────────────────────────────────────────
async function connectMongo() {
  try {
    await mongoose.connect(MONGODB_URI,{serverSelectionTimeoutMS:10000,socketTimeoutMS:45000});
    console.log(`[MongoDB] Connected`);
  } catch (e) {
    console.error("[MongoDB] Failed:", e.message, "— retry 5s");
    setTimeout(connectMongo, 5000);
  }
}
mongoose.connection.on("disconnected", () => setTimeout(connectMongo, 3000));

connectMongo().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    const ip = getLocalIp();
    console.log(`\n[GAP50001] Backend :${PORT}  |  LAN: http://${ip}:${PORT}\n`);
  });
});

process.on("SIGTERM", () => server.close(() => mongoose.connection.close().then(() => process.exit(0))));

module.exports = { app, server, io };
