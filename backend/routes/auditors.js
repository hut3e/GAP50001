const express = require("express");
const mongoose = require("mongoose");
const Auditor = require("../models/Auditor");
const { syncAuditorToPostgres } = require("../services/postgres");

const router = express.Router();
const mongoOk = () => mongoose.connection.readyState === 1;

router.get("/", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "Lỗi kết nối MongoDB" });
  try {
    const auditors = await Auditor.find({}).sort({ createdAt: -1 });
    res.json(auditors);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "Lỗi kết nối MongoDB" });
  try {
    const { name, org, role, email, phone } = req.body;
    if (!name) return res.status(400).json({ error: "Tên Chuyên gia là bắt buộc" });
    
    const auditor = new Auditor({ name, org, role, email, phone });
    await auditor.save();
    syncAuditorToPostgres(auditor);
    res.json(auditor);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: "Chuyên gia này đã tồn tại!" });
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "Lỗi kết nối MongoDB" });
  try {
    const { name, org, role, email, phone } = req.body;
    const auditor = await Auditor.findByIdAndUpdate(
      req.params.id,
      { $set: { name, org, role, email, phone } },
      { new: true, runValidators: true }
    );
    if (!auditor) return res.status(404).json({ error: "Không tìm thấy" });
    syncAuditorToPostgres(auditor);
    res.json(auditor);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "Lỗi kết nối MongoDB" });
  try {
    const auditor = await Auditor.findByIdAndDelete(req.params.id);
    if (!auditor) return res.status(404).json({ error: "Không tìm thấy" });
    res.json({ message: "Đã xoá" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
