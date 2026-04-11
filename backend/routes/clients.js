const express = require("express");
const mongoose = require("mongoose");
const Client = require("../models/Client");
const { syncClientToPostgres } = require("../services/postgres");

const router = express.Router();
const mongoOk = () => mongoose.connection.readyState === 1;

router.get("/", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "Lỗi kết nối MongoDB" });
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.json(clients);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "Lỗi kết nối MongoDB" });
  try {
    const { name, site, industry, annual_energy, cert_status, address, contact_person } = req.body;
    if (!name) return res.status(400).json({ error: "Tên Khách hàng là bắt buộc" });
    
    const client = new Client({ name, site, industry, annual_energy, cert_status, address, contact_person });
    await client.save();
    syncClientToPostgres(client);
    res.json(client);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: "Khách hàng đã tồn tại!" });
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "Lỗi kết nối MongoDB" });
  try {
    const { name, site, industry, annual_energy, cert_status, address, contact_person } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: { name, site, industry, annual_energy, cert_status, address, contact_person } },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ error: "Không tìm thấy khách hàng" });
    syncClientToPostgres(client);
    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "Lỗi kết nối MongoDB" });
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: "Không tìm thấy khách hàng" });
    res.json({ message: "Đã xoá khách hàng" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
