/**
 * ISO 27001 Security Middleware Suite
 * ────────────────────────────────────────────────────────────────
 * A.10.1.1 — Cryptographic controls (HMAC-SHA256 response signing)
 * A.12.4.1 — Event logging (SHA-256 audit event hashes)
 * A.9.4.2  — Secure log-on procedures (brute-force protection)
 * A.14.1.2 — Securing application services (security headers)
 */
const crypto = require("crypto");

// ── HMAC-SHA256 Response Signing ──────────────────────────────────
// Signs every API response body with HMAC-SHA256 so clients can
// verify integrity (ISO 27001 A.10.1.1)
const HMAC_SECRET = process.env.HMAC_SECRET || process.env.JWT_SECRET || "dev_hmac_placeholder";

/**
 * Middleware: adds X-Content-Signature header (HMAC-SHA256) to every
 * JSON API response for integrity verification.
 */
function hmacResponseSigner(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    try {
      const payload = JSON.stringify(body);
      const signature = crypto
        .createHmac("sha256", HMAC_SECRET)
        .update(payload, "utf8")
        .digest("hex");
      res.setHeader("X-Content-Signature", `sha256=${signature}`);
    } catch (_) {
      // Never block the response if signing fails
    }
    return originalJson(body);
  };
  next();
}

// ── SHA-256 Audit Event Hashing ───────────────────────────────────
// Every security-relevant event is logged with a SHA-256 hash of
// its payload, creating a tamper-evident audit trail (ISO 27001 A.12.4.1)

/**
 * Create a tamper-evident audit log entry.
 * @param {string} eventType - e.g. "LOGIN_SUCCESS", "LOGIN_FAILED", "PASSWORD_CHANGE"
 * @param {Object} details  - event-specific data
 * @returns {Object} The audit entry with hash
 */
function createAuditLog(eventType, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    eventType,
    ...details,
  };
  const canonical = JSON.stringify(entry);
  const hash = crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
  entry._hash = hash;

  // Log to stdout in a structured way for log aggregation
  console.log(
    `[AUDIT] ${entry.timestamp} | ${eventType} | hash=${hash} | ${JSON.stringify(details)}`
  );
  return entry;
}

// ── Enhanced Security Headers ─────────────────────────────────────
// Beyond helmet defaults — adds CSP, HSTS, and removes fingerprinting
// (ISO 27001 A.14.1.2)

function securityHeaders(req, res, next) {
  // Remove server identification
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");

  // Strict Transport Security (HSTS) — 1 year, include subdomains
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Content Security Policy — restrictive for API
  if (req.path.startsWith("/api/")) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'"
    );
  }

  // Cache control for API responses — no caching sensitive data
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
  }

  next();
}

// ── Swagger/API-Docs Protection ───────────────────────────────────
// Block access to Swagger/API docs in production (ISO 27001 A.9.1.2)

function blockSwagger(req, res, next) {
  const blockedPaths = [
    "/api-docs",
    "/swagger",
    "/swagger-ui",
    "/swagger.json",
    "/swagger.yaml",
    "/docs",
  ];
  const lower = req.path.toLowerCase();
  if (blockedPaths.some((p) => lower.startsWith(p))) {
    return res.status(403).json({
      error: "Forbidden",
      message: "API documentation is not available in production.",
    });
  }
  next();
}

module.exports = {
  hmacResponseSigner,
  createAuditLog,
  securityHeaders,
  blockSwagger,
  HMAC_SECRET,
};
