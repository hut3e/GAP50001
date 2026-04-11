/**
 * User model — Authentication & Authorization
 * Lưu thông tin user, role, login history
 */
const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  action: { type: String, enum: ["login", "logout", "failed_login", "password_change"], default: "login" },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 50 },
  password: { type: String, required: true },
  displayName: { type: String, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 200 },
  phone: { type: String, trim: true, maxlength: 20 },
  role: { type: String, enum: ["admin", "auditor", "viewer"], default: "viewer" },
  avatar: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  failedLoginCount: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  loginHistory: { type: [loginHistorySchema], default: [] },
  createdBy: { type: String, default: "" },
}, { timestamps: true });

// Giới hạn loginHistory 200 entries
userSchema.pre("save", function(next) {
  if (this.loginHistory && this.loginHistory.length > 200) {
    this.loginHistory = this.loginHistory.slice(-200);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
