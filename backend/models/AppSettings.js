/**
 * AppSettings — lưu cấu hình ứng dụng (Telegram bot, v.v.)
 * Singleton: chỉ có 1 document với key="default"
 */
const mongoose = require("mongoose");

const appSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    telegram: {
      bot_token:    { type: String, default: "" },
      chat_id:      { type: String, default: "" },
      enabled:      { type: Boolean, default: false },
      notify_upcoming_days: { type: Number, default: 3 },  // cảnh báo trước N ngày
      daily_digest_hour:    { type: Number, default: 7 },   // giờ gửi digest (0-23)
      digest_enabled:       { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppSettings", appSettingsSchema);
