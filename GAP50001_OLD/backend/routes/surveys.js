/**
 * ISO 50001 GAP — Survey CRUD API (MongoDB)
 */
const express = require("express");
const mongoose = require("mongoose");
const Survey = require("../models/Survey");

const router = express.Router();

function mongoConnected() {
  return mongoose.connection.readyState === 1;
}

function requireMongo(req, res, next) {
  const state = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  // Allow state 2 (connecting): mongoose buffers queries and executes once connected
  if (state === 1 || state === 2) return next();
  return res.status(503).json({
    error: "MongoDB chưa kết nối. Vui lòng thử lại sau vài giây.",
    code: "MONGO_DISCONNECTED",
  });
}

// GET /api/surveys/ref/:ref_no — by ref_no (phải đặt trước /:id)
router.get("/ref/:ref_no", requireMongo, async (req, res) => {
  try {
    const doc = await Survey.findOne({ "meta.ref_no": req.params.ref_no }).lean();
    if (!doc) return res.status(404).json({ error: "Survey not found" });
    res.json(doc);
  } catch (err) {
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg });
  }
});

function safeRegex(str) {
  try {
    return new RegExp(String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  } catch (_) {
    return null;
  }
}

// GET /api/surveys — list (optional ?client= & ?ref_no=)
router.get("/", requireMongo, async (req, res) => {
  try {
    const { client, ref_no, limit = 50 } = req.query;
    const q = {};
    if (client && String(client).trim()) {
      const re = safeRegex(client);
      if (re) q["client.name"] = re;
    }
    if (ref_no && String(ref_no).trim()) {
      const re = safeRegex(ref_no);
      if (re) q["meta.ref_no"] = re;
    }
    const list = await Survey.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json(list);
  } catch (err) {
    console.error("[surveys list]", err);
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg || "Lỗi tải danh sách phiên." });
  }
});

// GET /api/surveys/:id — by id
router.get("/:id", requireMongo, async (req, res) => {
  try {
    const doc = await Survey.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: "Survey not found" });
    res.json(doc);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg || "Lỗi tải phiên." });
  }
});

// POST /api/surveys — create (tạo DB iso50001gap khi ghi document đầu tiên)
router.post("/", requireMongo, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.meta?.ref_no) return res.status(400).json({ error: "meta.ref_no required" });
    const clientName = body.client?.name != null ? String(body.client.name).trim() : "";
    if (!clientName) return res.status(400).json({ error: "client.name required" });
    const existing = await Survey.findOne({ "meta.ref_no": body.meta.ref_no }).maxTimeMS(15000);
    if (existing) return res.status(409).json({ error: "ref_no already exists", id: existing._id });
    const survey = await Survey.create(body);
    res.status(201).json(survey);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "ref_no duplicate" });
    console.error("[surveys POST]", err);
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg || "Lỗi tạo phiên." });
  }
});

// PUT /api/surveys/:id — update
router.put("/:id", requireMongo, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false, maxTimeMS: 15000 }
    ).lean();
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    res.json(survey);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    console.error("[surveys PUT]", err);
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg || "Lỗi cập nhật phiên." });
  }
});

// DELETE /api/surveys/:id
router.delete("/:id", requireMongo, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
    const msg = err.message || "";
    if (/buffering|connection|timeout|ECONNREFUSED|MongoNetworkError/i.test(msg))
      return res.status(503).json({ error: "MongoDB chưa kết nối hoặc phản hồi chậm.", code: "MONGO_DISCONNECTED" });
    res.status(500).json({ error: msg });
  }
});

module.exports = router;
