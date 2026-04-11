/**
 * CRUD routes for ChecklistItem
 * GET    /api/iso50001/gap/checklist          — list all (sorted)
 * POST   /api/iso50001/gap/checklist          — create one
 * PUT    /api/iso50001/gap/checklist/:itemId  — update by .id field
 * DELETE /api/iso50001/gap/checklist/:itemId  — delete by .id field
 * POST   /api/iso50001/gap/checklist/seed     — seed defaults (idempotent)
 */
const express = require("express");
const ChecklistItem = require("../models/ChecklistItem");
const { GAP_CHECKLIST } = require("../gap.constants");

const router = express.Router();

// GET — trả về toàn bộ checklist đã sort
router.get("/", async (_req, res) => {
  try {
    const items = await ChecklistItem.find().sort({ order: 1, id: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — tạo mới
router.post("/", async (req, res) => {
  try {
    const { id, clause, title, weight, cat, legal, order } = req.body;
    if (!id?.trim() || !clause?.trim() || !title?.trim())
      return res.status(400).json({ error: "id, clause, title là bắt buộc" });
    const existing = await ChecklistItem.findOne({ id: id.trim() });
    if (existing)
      return res.status(409).json({ error: `id "${id}" đã tồn tại` });
    const item = await ChecklistItem.create({
      id: id.trim(), clause: clause.trim(), title: title.trim(),
      weight: Number(weight) || 2,
      cat: cat || "doc",
      legal: legal || "",
      order: Number(order) || 0,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — cập nhật theo .id field (không phải _id Mongo)
router.put("/:itemId", async (req, res) => {
  try {
    const { title, clause, weight, cat, legal, order } = req.body;
    const item = await ChecklistItem.findOneAndUpdate(
      { id: req.params.itemId },
      { $set: { title, clause, weight: Number(weight)||2, cat, legal, order: Number(order)||0 } },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: "Không tìm thấy điều khoản" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — xóa theo .id field
router.delete("/:itemId", async (req, res) => {
  try {
    const item = await ChecklistItem.findOneAndDelete({ id: req.params.itemId });
    if (!item) return res.status(404).json({ error: "Không tìm thấy điều khoản" });
    res.json({ deleted: true, id: req.params.itemId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /seed — nạp dữ liệu mặc định (bỏ qua nếu đã có)
router.post("/seed", async (_req, res) => {
  try {
    let inserted = 0, skipped = 0;
    for (let i = 0; i < GAP_CHECKLIST.length; i++) {
      const item = GAP_CHECKLIST[i];
      const exists = await ChecklistItem.findOne({ id: item.id });
      if (exists) { skipped++; continue; }
      await ChecklistItem.create({ ...item, order: i });
      inserted++;
    }
    const total = await ChecklistItem.countDocuments();
    res.json({ inserted, skipped, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
