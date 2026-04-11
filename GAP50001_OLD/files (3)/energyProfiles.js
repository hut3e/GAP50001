/**
 * ISO 50001 GAP — Energy Profiles API
 * /api/energy-profiles
 * Quản lý hồ sơ nguồn năng lượng gắn với phiên Survey (1 survey ↔ 1 profile)
 */
"use strict";

const express       = require("express");
const mongoose      = require("mongoose");
const EnergyProfile = require("../models/EnergyProfile");
const router        = express.Router();

const isValidId = id => mongoose.Types.ObjectId.isValid(id);

function emit(req, surveyId, event, data) {
  req.app?.locals?.io?.to(String(surveyId)).emit(event, data || {});
}

// ── GET /api/energy-profiles?surveyId=xxx ─────────────────────────
router.get("/", async (req, res) => {
  try {
    const { surveyId } = req.query;
    const filter = {};
    if (surveyId && isValidId(surveyId)) filter.surveyId = surveyId;
    const list = await EnergyProfile.find(filter).sort({ createdAt:-1 }).limit(100).lean();
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/energy-profiles/by-survey/:surveyId ──────────────────
router.get("/by-survey/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const doc = await EnergyProfile.findOne({ surveyId }).lean();
    if (!doc) return res.status(404).json({ error:"EnergyProfile not found for this survey" });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/energy-profiles/:id ──────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error:"Invalid id" });
    const doc = await EnergyProfile.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error:"Not found" });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/energy-profiles ─────────────────────────────────────
// Upsert: nếu đã có profile cho surveyId → return existing với 200
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.surveyId || !isValidId(body.surveyId)) {
      return res.status(400).json({ error:"surveyId hợp lệ là bắt buộc." });
    }
    const existing = await EnergyProfile.findOne({ surveyId: body.surveyId });
    if (existing) {
      // Merge rather than reject
      Object.assign(existing, body);
      await existing.save();
      return res.json(existing.toObject());
    }
    const doc = await EnergyProfile.create(body);
    emit(req, body.surveyId, "energy:updated", { surveyId: body.surveyId });
    res.status(201).json(doc.toObject());
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error:"EnergyProfile đã tồn tại cho survey này." });
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/energy-profiles/:id ─────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error:"Invalid id" });
    const doc = await EnergyProfile.findById(req.params.id);
    if (!doc) return res.status(404).json({ error:"Not found" });
    Object.assign(doc, req.body || {});
    await doc.save();
    emit(req, doc.surveyId, "energy:updated", { id: doc._id });
    res.json(doc.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/energy-profiles/by-survey/:surveyId ─────────────────
// Upsert từ surveyId (dùng trong frontend để luôn có profile)
router.put("/by-survey/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const body = { ...(req.body||{}), surveyId };
    let doc = await EnergyProfile.findOne({ surveyId });
    if (doc) {
      Object.assign(doc, body);
      await doc.save();
    } else {
      doc = await EnergyProfile.create(body);
    }
    emit(req, surveyId, "energy:updated", { surveyId });
    res.json(doc.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/energy-profiles/:id ──────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error:"Invalid id" });
    const doc = await EnergyProfile.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error:"Not found" });
    res.json({ deleted:true, id: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/energy-profiles/by-survey/:surveyId/sources ─────────
// Thêm một nguồn NL mới vào profile
router.post("/by-survey/:surveyId/sources", async (req, res) => {
  try {
    const { surveyId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const src = req.body || {};
    if (!src.sourceId) {
      const count = await EnergyProfile.aggregate([
        { $match:{ surveyId: new mongoose.Types.ObjectId(surveyId) } },
        { $project:{ count:{ $size:"$sources" } } },
      ]);
      const n = count[0]?.count || 0;
      src.sourceId = `ES-${String(n+1).padStart(3,"0")}`;
    }
    const doc = await EnergyProfile.findOneAndUpdate(
      { surveyId },
      { $push:{ sources: src } },
      { new:true, upsert:false }
    );
    if (!doc) return res.status(404).json({ error:"EnergyProfile not found" });
    emit(req, surveyId, "energy:updated", { surveyId });
    res.status(201).json(doc.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/energy-profiles/by-survey/:surveyId/sources/:sourceId ─
router.put("/by-survey/:surveyId/sources/:sourceId", async (req, res) => {
  try {
    const { surveyId, sourceId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const doc = await EnergyProfile.findOne({ surveyId });
    if (!doc) return res.status(404).json({ error:"EnergyProfile not found" });
    const idx = doc.sources.findIndex(s => String(s._id) === sourceId || s.sourceId === sourceId);
    if (idx < 0) return res.status(404).json({ error:"Source not found" });
    Object.assign(doc.sources[idx], req.body || {});
    doc.markModified("sources");
    await doc.save();
    emit(req, surveyId, "energy:updated", { surveyId });
    res.json(doc.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/energy-profiles/by-survey/:surveyId/sources/:sourceId ─
router.delete("/by-survey/:surveyId/sources/:sourceId", async (req, res) => {
  try {
    const { surveyId, sourceId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const doc = await EnergyProfile.findOneAndUpdate(
      { surveyId },
      { $pull:{ sources:{ $or:[{ _id: isValidId(sourceId)?new mongoose.Types.ObjectId(sourceId):null },{ sourceId }] } } },
      { new:true }
    );
    if (!doc) return res.status(404).json({ error:"Not found" });
    emit(req, surveyId, "energy:updated", { surveyId });
    res.json({ deleted:true, id: sourceId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/energy-profiles/by-survey/:surveyId/stats ───────────
router.get("/by-survey/:surveyId/stats", async (req, res) => {
  try {
    const { surveyId } = req.params;
    if (!isValidId(surveyId)) return res.status(400).json({ error:"Invalid surveyId" });
    const doc = await EnergyProfile.findOne({ surveyId }).lean();
    if (!doc) return res.json({ total_GJ:0, total_TOE:0, total_cost:0, sources:0, seus:0 });
    const seus = (doc.sources||[]).filter(s=>s.is_seu).length;
    res.json({
      total_GJ:    doc.total_annual_GJ  ||0,
      total_TOE:   doc.total_annual_TOE ||0,
      total_cost:  doc.total_annual_cost||0,
      sources:     (doc.sources||[]).length,
      seus,
      is_large_consumer: doc.is_large_consumer||false,
      data_quality:      doc.data_quality||"unknown",
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
