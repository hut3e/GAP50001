/**
 * ISO 50001 GAP — Settings model
 * Lưu các cài đặt hệ thống: Telegram Bot, cron jobs, v.v.
 */
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
