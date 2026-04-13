/**
 * Auth middleware — JWT token verification + role-based access control
 */
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "gap50001_sec_key_2026_!@#$%";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "24h";

/** Tạo JWT token */
function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role, displayName: user.displayName || user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/** Middleware: Verify JWT — gắn req.user nếu hợp lệ */
function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : (req.query.token || null);
  if (!token) return res.status(401).json({ error: "Chưa đăng nhập. Vui lòng đăng nhập.", code: "AUTH_REQUIRED" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", code: "TOKEN_EXPIRED" });
    return res.status(401).json({ error: "Token không hợp lệ.", code: "INVALID_TOKEN" });
  }
}

/** Middleware: Yêu cầu role admin */
function adminRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Chưa đăng nhập.", code: "AUTH_REQUIRED" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Chỉ Admin mới có quyền truy cập.", code: "ADMIN_REQUIRED" });
  next();
}

/** Middleware: Yêu cầu role auditor hoặc admin */
function auditorRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Chưa đăng nhập.", code: "AUTH_REQUIRED" });
  if (!["admin", "auditor"].includes(req.user.role)) return res.status(403).json({ error: "Chỉ Admin/Auditor mới có quyền truy cập.", code: "AUDITOR_REQUIRED" });
  next();
}

/** Middleware: Optional auth — gắn req.user nếu có token, không block nếu không có */
function authOptional(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : (req.query.token || null);
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_) {}
  }
  next();
}

module.exports = { JWT_SECRET, JWT_EXPIRES, signToken, authRequired, adminRequired, auditorRequired, authOptional };
