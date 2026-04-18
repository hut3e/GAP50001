/**
 * Auth routes — Login, Logout, Profile, User CRUD (Admin), Login stats
 * 
 * Password Security: SHA-256 pre-hash + bcrypt (NIST SP 800-132 compliant)
 * ┌─────────────┐    ┌────────────────┐    ┌──────────────────┐
 * │ Raw password │ ─> │ SHA-256 digest │ ─> │ bcrypt(salt=12)  │ ─> DB
 * └─────────────┘    └────────────────┘    └──────────────────┘
 * 
 * Lý do dùng SHA-256 + bcrypt:
 * - SHA-256: đảm bảo password không vượt 72 bytes (bcrypt limit) và thêm 1 lớp hash
 * - bcrypt (cost=12): chống brute-force bằng adaptive hash, resistant GPU attacks
 * - Theo ISO 27001 A.10.1.1: Cryptographic controls
 */
const express = require("express");
const crypto  = require("crypto");
const bcrypt  = require("bcryptjs");
const User    = require("../models/User");
const { signToken, authRequired, adminRequired } = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

// ── SHA-256 + bcrypt helpers ──────────────────────────────
/** Pre-hash password bằng SHA-256 trước khi đưa vào bcrypt */
function sha256(plain) {
  return crypto.createHash("sha256").update(plain, "utf8").digest("hex");
}

/** Hash password: SHA-256 → bcrypt */
async function hashPassword(plainPassword) {
  const sha = sha256(plainPassword);
  return bcrypt.hash(sha, SALT_ROUNDS);
}

/** Verify password: SHA-256 → bcrypt.compare */
async function verifyPassword(plainPassword, hashedPassword) {
  const sha = sha256(plainPassword);
  return bcrypt.compare(sha, hashedPassword);
}

// ── Password strength validation (ISO 27001 A.9.4.3) ─────
function validatePasswordStrength(password) {
  const errors = [];
  if (!password || password.length < 8) errors.push("Mật khẩu phải tối thiểu 8 ký tự.");
  if (password.length > 128) errors.push("Mật khẩu tối đa 128 ký tự.");
  if (!/[A-Z]/.test(password)) errors.push("Mật khẩu phải chứa ít nhất 1 chữ hoa.");
  if (!/[a-z]/.test(password)) errors.push("Mật khẩu phải chứa ít nhất 1 chữ thường.");
  if (!/[0-9]/.test(password)) errors.push("Mật khẩu phải chứa ít nhất 1 chữ số.");
  if (!/[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?]/.test(password)) errors.push("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.");
  return errors;
}

// ──────────────────────────────────────────────────────────
// SEED admin mặc định khi khởi động (chỉ tạo nếu chưa có user nào)
// SECURITY: Set env vars SEED_ADMIN_USER, SEED_ADMIN_PASS, SEED_ADMIN_EMAIL
// Never hardcode credentials in source code
// ──────────────────────────────────────────────────────────
async function seedDefaultAdmin() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const adminUser = process.env.SEED_ADMIN_USER;
      const adminPass = process.env.SEED_ADMIN_PASS;
      const adminEmail = process.env.SEED_ADMIN_EMAIL || "";

      if (!adminUser || !adminPass) {
        console.warn("[Auth] SEED_ADMIN_USER / SEED_ADMIN_PASS not set — skipping default admin creation.");
        console.warn("[Auth] Set these env vars to create initial admin on first boot.");
        return;
      }

      const hash = await hashPassword(adminPass);
      await User.create({
        username: adminUser,
        password: hash,
        displayName: "System Administrator",
        email: adminEmail,
        role: "admin",
        isActive: true,
        createdBy: "system",
      });
      console.log(`✅ Default admin created: ${adminUser} (SHA-256 + bcrypt)`);
    }
  } catch (err) {
    console.error("[Auth] Seed admin error:", err.message);
  }
}

// ──────────────────────────────────────────────────────────
// POST /api/auth/login — Đăng nhập
// ──────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "Vui lòng nhập tài khoản và mật khẩu." });

    const user = await User.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: "Tài khoản không tồn tại." });
    if (!user.isActive) return res.status(403).json({ error: "Tài khoản đã bị khóa. Liên hệ Administrator." });

    // Kiểm tra account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(423).json({ error: `Tài khoản bị khóa tạm thời. Thử lại sau ${remaining} phút.` });
    }

    // Kiểm tra password — hỗ trợ cả legacy (bcrypt thuần) và mới (SHA-256 + bcrypt)
    let valid = await verifyPassword(password, user.password);
    if (!valid) {
      // Fallback: thử bcrypt thuần cho tài khoản cũ chưa migrate
      valid = await bcrypt.compare(password, user.password);
      if (valid) {
        // Migrate sang SHA-256 + bcrypt
        user.password = await hashPassword(password);
        console.log(`[Auth] Migrated password to SHA-256+bcrypt for: ${user.username}`);
      }
    }

    if (!valid) {
      user.failedLoginCount = (user.failedLoginCount || 0) + 1;
      user.loginHistory.push({
        timestamp: new Date(),
        ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
        userAgent: (req.headers["user-agent"] || "").slice(0, 200),
        action: "failed_login",
      });
      // Lock account sau quá nhiều lần sai
      if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        console.warn(`[Auth] Account locked: ${user.username} (${user.failedLoginCount} failed attempts)`);
      }
      await user.save();
      return res.status(401).json({
        error: "Mật khẩu không đúng.",
        remaining: Math.max(0, MAX_FAILED_ATTEMPTS - user.failedLoginCount),
      });
    }

    // Login thành công — reset fail count
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    user.loginHistory.push({
      timestamp: new Date(),
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: (req.headers["user-agent"] || "").slice(0, 200),
      action: "login",
    });
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
      },
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ error: "Lỗi hệ thống. Vui lòng thử lại." });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/auth/me — Lấy thông tin user hiện tại
// ──────────────────────────────────────────────────────────
router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -loginHistory").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/auth/change-password — Đổi mật khẩu
// ──────────────────────────────────────────────────────────
router.put("/change-password", authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Thiếu mật khẩu cũ hoặc mới." });

    // Validate password strength
    const pwErrors = validatePasswordStrength(newPassword);
    if (pwErrors.length > 0) return res.status(400).json({ error: pwErrors.join(" ") });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify current password (hỗ trợ cả 2 format)
    let valid = await verifyPassword(currentPassword, user.password);
    if (!valid) valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: "Mật khẩu hiện tại không đúng." });

    user.password = await hashPassword(newPassword);
    user.loginHistory.push({
      timestamp: new Date(),
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: (req.headers["user-agent"] || "").slice(0, 200),
      action: "password_change",
    });
    await user.save();
    res.json({ ok: true, message: "Đã đổi mật khẩu thành công." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
// ADMIN: User CRUD
// ══════════════════════════════════════════════════════════

// GET /api/auth/users — Danh sách users (Admin only)
router.get("/users", authRequired, adminRequired, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/users — Tạo user mới (Admin only)
router.post("/users", authRequired, adminRequired, async (req, res) => {
  try {
    const { username, password, displayName, email, phone, role } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username và password bắt buộc." });
    if (!["admin", "auditor", "viewer"].includes(role)) return res.status(400).json({ error: "Role không hợp lệ." });

    // Validate password strength
    const pwErrors = validatePasswordStrength(password);
    if (pwErrors.length > 0) return res.status(400).json({ error: pwErrors.join(" ") });

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) return res.status(409).json({ error: "Tên tài khoản đã tồn tại." });

    const hash = await hashPassword(password);
    const user = await User.create({
      username: username.trim().toLowerCase(),
      password: hash,
      displayName: displayName || username,
      email: email || "",
      phone: phone || "",
      role,
      isActive: true,
      createdBy: req.user.username,
    });
    const { password: _, ...userObj } = user.toObject();
    res.status(201).json(userObj);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Tên tài khoản đã tồn tại." });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/users/:id — Cập nhật user (Admin only)
router.put("/users/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const { displayName, email, phone, role, isActive } = req.body || {};
    const update = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (role !== undefined && ["admin", "auditor", "viewer"].includes(role)) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User không tìm thấy." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/users/:id/reset-password — Reset password (Admin only)
router.put("/users/:id/reset-password", authRequired, adminRequired, async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    
    // Validate password strength
    const pwErrors = validatePasswordStrength(newPassword || "");
    if (pwErrors.length > 0) return res.status(400).json({ error: pwErrors.join(" ") });

    const hash = await hashPassword(newPassword);
    const user = await User.findByIdAndUpdate(req.params.id, {
      $set: { password: hash, failedLoginCount: 0, lockedUntil: null },
    }, { new: true }).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User không tìm thấy." });
    res.json({ ok: true, message: `Đã reset mật khẩu cho ${user.username}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auth/users/:id — Xóa user (Admin only, không xóa chính mình)
router.delete("/users/:id", authRequired, adminRequired, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: "Không thể xóa tài khoản đang đăng nhập." });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User không tìm thấy." });
    res.json({ ok: true, deleted: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
// ADMIN: Login Statistics & Dashboard
// ══════════════════════════════════════════════════════════

// GET /api/auth/stats — Thống kê login tổng quát
router.get("/stats", authRequired, adminRequired, async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 3600000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 3600000);

    let totalLogins = 0, totalFailed = 0;
    let todayLogins = 0, weekLogins = 0, monthLogins = 0;
    const loginsByDay = {};
    const loginsByUser = [];

    users.forEach(u => {
      totalLogins += u.loginCount || 0;
      totalFailed += u.failedLoginCount || 0;
      let userDayLogins = 0, userWeekLogins = 0, userMonthLogins = 0;
      (u.loginHistory || []).forEach(h => {
        const t = new Date(h.timestamp);
        if (h.action === "login") {
          if (t >= today) { todayLogins++; userDayLogins++; }
          if (t >= weekAgo) { weekLogins++; userWeekLogins++; }
          if (t >= monthAgo) { monthLogins++; userMonthLogins++; }
          const dayKey = t.toISOString().slice(0, 10);
          loginsByDay[dayKey] = (loginsByDay[dayKey] || 0) + 1;
        }
      });
      loginsByUser.push({
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        isActive: u.isActive,
        totalLogins: u.loginCount || 0,
        lastLogin: u.lastLogin,
        todayLogins: userDayLogins,
        weekLogins: userWeekLogins,
        monthLogins: userMonthLogins,
      });
    });

    // Last 30 days chart data
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 3600000);
      const key = d.toISOString().slice(0, 10);
      chartData.push({ date: key, logins: loginsByDay[key] || 0 });
    }

    res.json({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalLogins,
      totalFailed,
      todayLogins,
      weekLogins,
      monthLogins,
      chartData,
      loginsByUser: loginsByUser.sort((a, b) => b.totalLogins - a.totalLogins),
      roleDistribution: {
        admin: users.filter(u => u.role === "admin").length,
        auditor: users.filter(u => u.role === "auditor").length,
        viewer: users.filter(u => u.role === "viewer").length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users/:id/history — Login history chi tiết
router.get("/users/:id/history", authRequired, adminRequired, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username displayName loginHistory").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ username: user.username, displayName: user.displayName, history: (user.loginHistory || []).reverse().slice(0, 100) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.seedDefaultAdmin = seedDefaultAdmin;
