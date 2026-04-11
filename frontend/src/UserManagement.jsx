/**
 * UserManagement — CRUD tài khoản + Dashboard thống kê login
 * UI/UX hiện đại với glassmorphism cards, animated charts, và responsive tables
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { C, FONT } from "./gap.ui.constants.js";
import { Btn, Toast } from "./gap.atoms.jsx";

const ROLES = { admin: { label: "Admin", color: C.red, icon: "👑" }, auditor: { label: "Auditor", color: C.blue, icon: "🔬" }, viewer: { label: "Viewer", color: C.teal, icon: "👁️" } };

// ── Stat Card ──
function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.bg2}, ${C.bg3})`, border: `1px solid ${C.bd0}`,
      borderRadius: 16, padding: "22px 24px", flex: "1 1 200px", minWidth: 180,
      transition: "all 0.3s", position: "relative", overflow: "hidden",
    }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}10` }} />
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || C.t0, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 14, color: C.t2, marginTop: 6, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>{sub}</div>}
      {trend && <div style={{ fontSize: 12, color: trend > 0 ? C.greenL : C.redL, marginTop: 4, fontWeight: 600 }}>
        {trend > 0 ? "↑" : "↓"} {Math.abs(trend)} hôm nay
      </div>}
    </div>
  );
}

// ── Simple Bar Chart ──
function BarChart({ data, height = 180 }) {
  const max = Math.max(1, ...data.map(d => d.logins));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, padding: "10px 0" }}>
      {data.map((d, i) => {
        const h = Math.max(3, (d.logins / max) * (height - 30));
        const isToday = i === data.length - 1;
        return (
          <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${d.date}: ${d.logins} lần`}>
            <div style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>{d.logins || ""}</div>
            <div style={{
              width: "100%", maxWidth: 24, height: h, borderRadius: "4px 4px 0 0",
              background: isToday ? `linear-gradient(180deg, ${C.blue}, ${C.teal})` : `linear-gradient(180deg, ${C.blue}60, ${C.teal}40)`,
              transition: "height 0.5s ease-out",
            }} />
            {i % 5 === 0 && <div style={{ fontSize: 9, color: C.t3, marginTop: 2, whiteSpace: "nowrap" }}>{d.date.slice(5)}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Role Badge ──
function RoleBadge({ role }) {
  const r = ROLES[role] || ROLES.viewer;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px",
      borderRadius: 20, background: `${r.color}18`, color: r.color,
      fontSize: 12, fontWeight: 700, border: `1px solid ${r.color}30`,
    }}>{r.icon} {r.label}</span>
  );
}

// ── User Form Modal ──
function UserFormModal({ user, onSave, onClose }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: user?.username || "", password: "", displayName: user?.displayName || "",
    email: user?.email || "", phone: user?.phone || "", role: user?.role || "viewer",
  });
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.username.trim()) { setError("Tên tài khoản bắt buộc."); return; }
    if (!isEdit && (!form.password || form.password.length < 8)) { setError("Mật khẩu phải tối thiểu 8 ký tự."); return; }
    setError("");
    onSave(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 500, background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: 20,
        padding: 32, boxShadow: "0 32px 64px rgba(0,0,0,0.5)", animation: "fadeIn 0.3s ease",
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: C.t0 }}>
          {isEdit ? "✏️ Chỉnh sửa tài khoản" : "➕ Tạo tài khoản mới"}
        </h3>
        {error && <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: `${C.red}15`, border: `1px solid ${C.red}40`, color: C.redL, fontSize: 13 }}>{error}</div>}

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6, display: "block" }}>TÀI KHOẢN {isEdit && <span style={{ color: C.t3 }}>(không đổi)</span>}</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={isEdit}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.bd0}`, background: isEdit ? C.bg3 : C.bg1, color: C.t0, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          {!isEdit && <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6, display: "block" }}>MẬT KHẨU</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Tối thiểu 8 ký tự"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.bd0}`, background: C.bg1, color: C.t0, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6, display: "block" }}>TÊN HIỂN THỊ</label>
              <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.bd0}`, background: C.bg1, color: C.t0, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6, display: "block" }}>VAI TRÒ</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.bd0}`, background: C.bg1, color: C.t0, fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                <option value="admin">👑 Admin</option>
                <option value="auditor">🔬 Auditor</option>
                <option value="viewer">👁️ Viewer</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6, display: "block" }}>EMAIL</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.bd0}`, background: C.bg1, color: C.t0, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6, display: "block" }}>ĐIỆN THOẠI</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.bd0}`, background: C.bg1, color: C.t0, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
          <Btn v="ghost" sz="md" onClick={onClose}>Hủy</Btn>
          <Btn v="blue" sz="md" onClick={handleSave}>💾 {isEdit ? "Cập nhật" : "Tạo tài khoản"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ──
function ResetPasswordModal({ user, onSave, onClose }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const handleSave = () => {
    if (pw.length < 8) { setError("Mật khẩu phải tối thiểu 8 ký tự."); return; }
    onSave(pw);
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div style={{ width: 400, background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: 16, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, color: C.t0 }}>🔑 Reset mật khẩu: {user.username}</h3>
        {error && <div style={{ padding: 10, borderRadius: 8, marginBottom: 12, background: `${C.red}15`, color: C.redL, fontSize: 13 }}>{error}</div>}
        <input type="password" placeholder="Mật khẩu mới (tối thiểu 8 ký tự)" value={pw} onChange={e => setPw(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.bd0}`, background: C.bg1, color: C.t0, fontSize: 14, outline: "none", marginBottom: 20, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn v="ghost" sz="sm" onClick={onClose}>Hủy</Btn>
          <Btn v="blue" sz="sm" onClick={handleSave}>Đặt mật khẩu</Btn>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN: UserManagement Component
// ══════════════════════════════════════════════════════════
export default function UserManagement({ apiUrl, token, currentUser }) {
  const [tab, setTab] = useState("dashboard"); // dashboard | users
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(null); // null | "new" | user object
  const [showResetPw, setShowResetPw] = useState(null);
  const [loading, setLoading] = useState(false);

  const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchUsers = useCallback(async () => {
    try {
      const r = await fetch(`${base}/api/auth/users`, { headers }); if (!r.ok) throw new Error("Lỗi tải users");
      setUsers(await r.json());
    } catch (err) { setToast({ type: "error", msg: err.message }); }
  }, [base, token]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${base}/api/auth/stats`, { headers }); if (!r.ok) throw new Error("Lỗi tải stats");
      setStats(await r.json());
    } catch (err) { setToast({ type: "error", msg: err.message }); }
  }, [base, token]);

  useEffect(() => { fetchUsers(); fetchStats(); }, [fetchUsers, fetchStats]);

  const handleCreateUser = async (form) => {
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/auth/users`, { method: "POST", headers, body: JSON.stringify(form) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Lỗi tạo user");
      setToast({ type: "success", msg: `Đã tạo tài khoản ${data.username}` });
      setShowForm(null); fetchUsers(); fetchStats();
    } catch (err) { setToast({ type: "error", msg: err.message }); } finally { setLoading(false); }
  };

  const handleUpdateUser = async (form) => {
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/auth/users/${showForm._id}`, { method: "PUT", headers, body: JSON.stringify(form) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Lỗi cập nhật");
      setToast({ type: "success", msg: `Đã cập nhật ${data.username}` });
      setShowForm(null); fetchUsers(); fetchStats();
    } catch (err) { setToast({ type: "error", msg: err.message }); } finally { setLoading(false); }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Xóa tài khoản "${user.username}"? Hành động không thể hoàn tác!`)) return;
    try {
      const r = await fetch(`${base}/api/auth/users/${user._id}`, { method: "DELETE", headers });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      setToast({ type: "success", msg: `Đã xóa ${user.username}` });
      fetchUsers(); fetchStats();
    } catch (err) { setToast({ type: "error", msg: err.message }); }
  };

  const handleResetPassword = async (newPassword) => {
    try {
      const r = await fetch(`${base}/api/auth/users/${showResetPw._id}/reset-password`, { method: "PUT", headers, body: JSON.stringify({ newPassword }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Lỗi reset mật khẩu");
      setToast({ type: "success", msg: d.message }); setShowResetPw(null);
    } catch (err) { setToast({ type: "error", msg: err.message }); }
  };

  const handleToggleActive = async (user) => {
    try {
      const r = await fetch(`${base}/api/auth/users/${user._id}`, { method: "PUT", headers, body: JSON.stringify({ isActive: !user.isActive }) });
      if (!r.ok) throw new Error("Lỗi cập nhật");
      setToast({ type: "success", msg: `${user.username}: ${user.isActive ? "Đã khóa" : "Đã kích hoạt"}` });
      fetchUsers(); fetchStats();
    } catch (err) { setToast({ type: "error", msg: err.message }); }
  };

  const TABS = [
    { id: "dashboard", label: "📊 Dashboard", icon: "📊" },
    { id: "users", label: "👥 Quản lý tài khoản", icon: "👥" },
  ];

  return (
    <div style={{ padding: "0 8px" }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${C.bd0}`, paddingBottom: 8 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 20px", borderRadius: "8px 8px 0 0", border: "none",
            background: tab === t.id ? `${C.blue}20` : "transparent",
            borderBottom: tab === t.id ? `3px solid ${C.blue}` : "3px solid transparent",
            color: tab === t.id ? C.blueL : C.t2, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ─── DASHBOARD TAB ─── */}
      {tab === "dashboard" && stats && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          {/* Stat Cards */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <StatCard icon="👥" label="Tổng tài khoản" value={stats.totalUsers} color={C.blueL} sub={`${stats.activeUsers} hoạt động`} />
            <StatCard icon="🔓" label="Tổng lượt login" value={stats.totalLogins} color={C.tealL} trend={stats.todayLogins} />
            <StatCard icon="📅" label="Login hôm nay" value={stats.todayLogins} color={C.greenL} />
            <StatCard icon="📆" label="Login 7 ngày" value={stats.weekLogins} color={C.amberL} />
            <StatCard icon="🚫" label="Login thất bại" value={stats.totalFailed} color={C.redL} />
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 28 }}>
            {/* Login trend */}
            <div style={{ background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: 16, padding: 24 }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: C.t0 }}>📈 Xu hướng đăng nhập (30 ngày)</h4>
              <BarChart data={stats.chartData || []} height={160} />
            </div>

            {/* Role Distribution */}
            <div style={{ background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: 16, padding: 24 }}>
              <h4 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: C.t0 }}>🎭 Phân bổ vai trò</h4>
              {Object.entries(stats.roleDistribution || {}).map(([role, count]) => {
                const r = ROLES[role] || ROLES.viewer;
                const pct = stats.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
                return (
                  <div key={role} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: C.t1, fontWeight: 600 }}>{r.icon} {r.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: C.bg4, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${r.color}, ${r.color}88)`, borderRadius: 4, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Activity Table */}
          <div style={{ background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: 16, padding: 24 }}>
            <h4 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: C.t0 }}>🏆 Hoạt động đăng nhập theo tài khoản</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.bd0}` }}>
                    {["Tài khoản", "Tên hiển thị", "Vai trò", "Trạng thái", "Tổng login", "Hôm nay", "7 ngày", "30 ngày", "Lần cuối"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: C.t2, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats.loginsByUser || []).map(u => (
                    <tr key={u.username} style={{ borderBottom: `1px solid ${C.bd1}` }}>
                      <td style={{ padding: "10px 12px", color: C.t0, fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: "10px 12px", color: C.t1 }}>{u.displayName || "—"}</td>
                      <td style={{ padding: "10px 12px" }}><RoleBadge role={u.role} /></td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: u.isActive ? `${C.green}20` : `${C.red}20`, color: u.isActive ? C.greenL : C.redL }}>
                          {u.isActive ? "✓ Active" : "✕ Locked"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: C.blueL }}>{u.totalLogins}</td>
                      <td style={{ padding: "10px 12px", color: u.todayLogins > 0 ? C.greenL : C.t3 }}>{u.todayLogins}</td>
                      <td style={{ padding: "10px 12px", color: C.t1 }}>{u.weekLogins}</td>
                      <td style={{ padding: "10px 12px", color: C.t1 }}>{u.monthLogins}</td>
                      <td style={{ padding: "10px 12px", color: C.t2, fontSize: 13 }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleString("vi-VN") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── USERS TAB ─── */}
      {tab === "users" && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          {/* Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: C.t2 }}>Tổng: <strong style={{ color: C.t0 }}>{users.length}</strong> tài khoản</div>
            <Btn v="blue" sz="md" onClick={() => setShowForm("new")}>➕ Tạo tài khoản mới</Btn>
          </div>

          {/* User Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {users.map(u => (
              <div key={u._id} style={{
                background: C.bg2, border: `1px solid ${C.bd0}`, borderRadius: 14, padding: 20,
                transition: "all 0.2s", position: "relative",
              }} onMouseEnter={e => e.currentTarget.style.borderColor = C.blue + "60"} onMouseLeave={e => e.currentTarget.style.borderColor = C.bd0}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(135deg, ${ROLES[u.role]?.color || C.blue}30, ${ROLES[u.role]?.color || C.blue}10)`,
                    fontSize: 22, border: `1px solid ${ROLES[u.role]?.color || C.blue}30`,
                  }}>{ROLES[u.role]?.icon || "👤"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.t0 }}>{u.displayName || u.username}</div>
                    <div style={{ fontSize: 13, color: C.t2 }}>@{u.username}</div>
                  </div>
                  <RoleBadge role={u.role} />
                </div>

                {/* Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, fontSize: 13 }}>
                  <div><span style={{ color: C.t3 }}>Email:</span> <span style={{ color: C.t1 }}>{u.email || "—"}</span></div>
                  <div><span style={{ color: C.t3 }}>SĐT:</span> <span style={{ color: C.t1 }}>{u.phone || "—"}</span></div>
                  <div><span style={{ color: C.t3 }}>Login:</span> <span style={{ color: C.blueL, fontWeight: 700 }}>{u.loginCount || 0}</span> lần</div>
                  <div><span style={{ color: C.t3 }}>Trạng thái:</span>{" "}
                    <span style={{ color: u.isActive ? C.greenL : C.redL, fontWeight: 600 }}>{u.isActive ? "✓ Active" : "✕ Locked"}</span>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}><span style={{ color: C.t3 }}>Lần cuối:</span> <span style={{ color: C.t2 }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleString("vi-VN") : "Chưa đăng nhập"}</span></div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderTop: `1px solid ${C.bd1}`, paddingTop: 12 }}>
                  <Btn v="ghost" sz="sm" onClick={() => setShowForm(u)}>✏️ Sửa</Btn>
                  <Btn v="ghost" sz="sm" onClick={() => setShowResetPw(u)}>🔑 Reset PW</Btn>
                  <Btn v="ghost" sz="sm" onClick={() => handleToggleActive(u)} style={{ color: u.isActive ? C.orange : C.greenL }}>
                    {u.isActive ? "🔒 Khóa" : "🔓 Mở khóa"}
                  </Btn>
                  {u.username !== currentUser?.username && (
                    <Btn v="ghost" sz="sm" onClick={() => handleDeleteUser(u)} style={{ color: C.red }}>🗑️ Xóa</Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <UserFormModal
          user={showForm === "new" ? null : showForm}
          onSave={showForm === "new" ? handleCreateUser : handleUpdateUser}
          onClose={() => setShowForm(null)}
        />
      )}
      {showResetPw && <ResetPasswordModal user={showResetPw} onSave={handleResetPassword} onClose={() => setShowResetPw(null)} />}
      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}
