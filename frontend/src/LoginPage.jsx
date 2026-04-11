/**
 * LoginPage — Trang đăng nhập ISO 50001 GAP Survey
 * Glassmorphism + animated gradient background
 */
import React, { useState } from "react";
import { C, FONT } from "./gap.ui.constants.js";

const BG_GRADIENT = `radial-gradient(ellipse at 20% 80%, ${C.blue}22 0%, transparent 60%),
  radial-gradient(ellipse at 80% 20%, ${C.teal}22 0%, transparent 60%),
  radial-gradient(ellipse at 50% 50%, ${C.bg0} 0%, ${C.bg1} 100%)`;

export default function LoginPage({ onLogin, error: externalError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(externalError || "");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError("Vui lòng nhập tài khoản và mật khẩu."); return; }
    setLoading(true); setError("");
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: BG_GRADIENT, fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* Animated orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: `${C.blue}0c`, top: "10%", left: "5%", animation: "float 20s ease-in-out infinite", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: `${C.teal}0a`, bottom: "15%", right: "10%", animation: "float 25s ease-in-out infinite reverse", filter: "blur(80px)" }} />
      </div>

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .login-input { width: 100%; padding: 14px 16px; border-radius: 10px; border: 1px solid ${C.bd0}; background: ${C.bg2}80; color: ${C.t0}; font-size: 15px; outline: none; transition: all 0.3s; box-sizing: border-box; }
        .login-input:focus { border-color: ${C.blue}; box-shadow: 0 0 0 3px ${C.blue}30; background: ${C.bg2}; }
        .login-input::placeholder { color: ${C.t3}; }
        .login-btn { width: 100%; padding: 15px; border: none; border-radius: 10px; background: linear-gradient(135deg, ${C.blue}, ${C.teal}); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; letter-spacing: 0.5px; }
        .login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px ${C.blue}40; }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <form onSubmit={handleSubmit} style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: 40,
        background: `${C.bg1}cc`, backdropFilter: "blur(20px) saturate(180%)",
        borderRadius: 20, border: `1px solid ${C.bd0}`,
        boxShadow: `0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px ${C.bd1} inset`,
        animation: "fadeIn 0.6s ease-out",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: 16, marginBottom: 16,
            background: `linear-gradient(135deg, ${C.blue}30, ${C.teal}20)`,
            border: `1px solid ${C.bd0}`,
          }}>
            <span style={{ fontSize: 32 }}>🔐</span>
          </div>
          <h1 style={{
            margin: 0, fontSize: 24, fontWeight: 800,
            background: `linear-gradient(135deg, ${C.blueL}, ${C.tealL})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>ISO 50001·GAP</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: C.t2 }}>Field Survey Platform</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 20,
            background: `${C.red}15`, border: `1px solid ${C.red}40`, color: C.redL,
            fontSize: 14, animation: "shake 0.3s ease-out",
          }}>⚠️ {error}</div>
        )}

        {/* Username */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 8, letterSpacing: "0.03em" }}>
            TÀI KHOẢN
          </label>
          <input
            className="login-input"
            type="text" autoComplete="username" placeholder="Nhập tên đăng nhập"
            value={username} onChange={e => setUsername(e.target.value)}
            autoFocus
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 8, letterSpacing: "0.03em" }}>
            MẬT KHẨU
          </label>
          <div style={{ position: "relative" }}>
            <input
              className="login-input"
              type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="Nhập mật khẩu"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: 48 }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: C.t2, cursor: "pointer", fontSize: 18, padding: 4,
            }}>{showPw ? "🙈" : "👁️"}</button>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "⏳ Đang đăng nhập..." : "🔓 Đăng nhập"}
        </button>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: C.t3 }}>
          © 2024-2026 ISO 50001 GAP Survey Platform<br />
          <span style={{ color: C.t2 }}>Phiên bản v2.0 — Bảo mật bởi JWT + bcrypt</span>
        </div>
      </form>
    </div>
  );
}
