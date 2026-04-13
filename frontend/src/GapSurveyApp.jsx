/**
 * ISO50001Gap — frontend/GapSurveyApp.jsx
 * Main wizard: 7-step GAP Survey Tool for ISO 50001:2018
 *
 * Usage:
 *   import GapSurveyApp from './GapSurveyApp';
 *   <GapSurveyApp apiUrl="http://localhost:5002"/>
 *
 * Tối ưu:
 *   - Dùng React.lazy + Suspense cho các step nặng để giảm JS tải ban đầu.
 */
import React, { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { C, FONT, STEPS, INIT_SURVEY, GAP_CHECKLIST as DEFAULT_CHECKLIST, RISK_CATEGORIES, SCORE_CFG } from "./gap.ui.constants.js";
import { GLOBAL_CSS, Btn, Tag, Toast, SectionHeader } from "./gap.atoms.jsx";

// Các step nặng được lazy‑load để giảm bundle ban đầu
const StepOrg        = lazy(() => import("./StepOrg.jsx"));
const StepClauses    = lazy(() => import("./StepClauses.jsx"));
const StepRisk       = lazy(() => import("./StepRisk.jsx"));
const StepProcess    = lazy(() => import("./StepProcess.jsx"));
const StepSite       = lazy(() => import("./StepSite.jsx"));
const StepMeters     = lazy(() => import("./StepMeters.jsx"));
const StepActions    = lazy(() => import("./StepActions.jsx"));
const StepEvidence   = lazy(() => import("./StepEvidence.jsx"));
const StepExport     = lazy(() => import("./StepExport.jsx"));
const AdminDashboard  = lazy(() => import("./AdminDashboard.jsx"));
const KanbanDashboard = lazy(() => import("./KanbanDashboard.jsx"));
const LoginPage       = lazy(() => import("./LoginPage.jsx"));
const UserManagement  = lazy(() => import("./UserManagement.jsx"));
const LiteGapAudit    = lazy(() => import("./LiteGapAudit.jsx"));

// ── Completion checks per step ───────────────────────────────────
function stepDone(step, survey, checklist = DEFAULT_CHECKLIST) {
  const r = survey.responses || {};
  switch (step) {
    case 0: return !!survey.meta?.ref_no && !!survey.client?.name;
    case 1: return checklist.filter(i=>(r[i.id]?.score||0)>0).length >= 10;
    case 2: return Object.keys(survey.risk_assessments||{}).length >= 3;
    case 3: return Object.keys(survey.process_gaps||{}).length >= 3;
    case 4: return (survey.site_assessments||[]).length > 0;
    case 5: return (survey.meters||[]).length > 0;
    case 6: return (survey.action_plan||[]).length > 0;
    case 7: return true;
    case 8: return false;
    default: return false;
  }
}

// ── All risks (giống StepRisk: risk_items hoặc cat.items + risk_assessments) ──
function getAllRisks(survey) {
  const rd = survey.risk_assessments || {};
  const riskItems = survey.risk_items || {};
  return RISK_CATEGORIES.flatMap(cat => {
    const custom = riskItems[cat.id];
    if (custom && custom.length > 0) return custom;
    return (cat.items || []).map(i => ({
      ...i,
      likelihood: rd[i.id]?.likelihood ?? 0,
      impact: rd[i.id]?.impact ?? 0,
    }));
  });
}

// ── Sidebar quick-stats ──────────────────────────────────────────
function QuickStats({ survey, checklist = DEFAULT_CHECKLIST }) {
  const r = survey.responses || {};
  const scored = checklist.filter(i=>(r[i.id]?.score||0)>0);
  const crit = scored.filter(i=>r[i.id].score<=1).length;
  const maj  = scored.filter(i=>r[i.id].score===2).length;
  const allRisks = useMemo(() => getAllRisks(survey), [survey]);
  const highR = allRisks.filter(rk => (rk.likelihood || 0) * (rk.impact || 0) >= 9).length;
  const wSum = scored.reduce((a, i) => a + ((r[i.id].score || 0) * (i.weight || 1)), 0);
  const wTot = scored.reduce((a, i) => a + (i.weight || 1), 0);
  const avg = wTot > 0 ? (wSum / wTot).toFixed(1) : "—";

  return (
    <div style={{ margin: 12, padding: 14, background: C.bg2, borderRadius: 10, border: `1px solid ${C.bd1}` }}>
      <div style={{ fontSize: FONT.label, color: C.t3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Tóm tắt nhanh
      </div>
      {[
        { l: "Điểm TB", v: avg, c: C.blueL },
        { l: "Nghiêm TG", v: crit, u: crit > 0 ? "⚠ " : "", c: crit > 0 ? C.red : C.t2 },
        { l: "KG Lớn", v: maj, c: maj > 0 ? C.orange : C.t2 },
        { l: "Rủi ro cao", v: highR, c: highR > 0 ? C.red : C.t2 },
        { l: "Actions", v: (survey.action_plan || []).length, c: C.tealL },
        { l: "Hiện trường", v: (survey.site_assessments || []).length, c: C.skyL },
      ].map(x => (
        <div key={x.l} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: FONT.body, color: C.t2 }}>{x.l}</span>
          <span style={{ fontSize: FONT.body, fontWeight: 700, color: x.c }}>{x.u}{x.v}</span>
        </div>
      ))}
      {survey.client?.name && (
        <div style={{ marginTop: 12, padding: "8px 10px", background: C.bg3, borderRadius: 8 }}>
          <div style={{ fontSize: FONT.label, color: C.t2, marginBottom: 2 }}>Tổ chức</div>
          <div style={{ fontSize: FONT.body, color: C.t0, fontWeight: 600, lineHeight: 1.4 }}>
            {survey.client.name.length > 30 ? survey.client.name.slice(0, 28) + "…" : survey.client.name}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Logo upload (góc trái / phải TopBar) ──────────────────────────
const LOGO_SIZE = { w: 120, h: 40 };
function LogoSlot({ value, onChange, title }) {
  const handleFile = (e) => {
    const f = e.target?.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => onChange(r.result);
    r.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
      {value ? (
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <img src={value} alt={title} style={{ maxWidth: LOGO_SIZE.w, maxHeight: LOGO_SIZE.h, objectFit: "contain", display: "block" }} />
          <button type="button" onClick={() => onChange("")} title="Xóa logo" style={{ marginLeft: 6, width: 22, height: 22, borderRadius: 4, border: "none", background: C.red + "30", color: C.redL, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
        </div>
      ) : (
        <label
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: LOGO_SIZE.w,
            height: LOGO_SIZE.h,
            border: `1px dashed ${C.bd0}`,
            borderRadius: 8,
            background: C.bg3 + "80",
            color: C.t2,
            fontSize: FONT.caption,
            transition: "border-color .2s, background .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.background = C.bg3; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.bd0; e.currentTarget.style.background = C.bg3 + "80"; }}
        >
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          📷 {title}
        </label>
      )}
    </div>
  );
}

// ── Top bar ──────────────────────────────────────────────────────
function TopBar({ step, total, survey, setSurvey, adminMode, kanbanMode, onToggleAdmin, onToggleKanban, onToggleLite, checklist = DEFAULT_CHECKLIST, currentUser, onLogout, isMobile, setSidebarOpen }) {
  const r = survey.responses || {};
  const crit = checklist.filter(i=>(r[i.id]?.score||0)===1).length;
  const maj  = checklist.filter(i=>(r[i.id]?.score||0)===2).length;
  const meta = survey.meta || {};
  const setMeta = (key, val) => setSurvey(prev => ({ ...prev, meta: { ...prev.meta, [key]: val } }));
  return (
    <div style={{
      minHeight: 56,
      padding: "0 16px 0 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      borderBottom: `1px solid ${C.bd0}`,
      background: `linear-gradient(90deg,${C.bg1},${C.bg2})`,
      position: "sticky",
      top: 0,
      zIndex: 200,
      backdropFilter: "blur(12px)",
      gap: 16,
    }}>
      {/* Góc trái: Logo trái + Tên app */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, minWidth: 0 }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: "none", border: "none", color: C.t0, fontSize: 24, cursor: "pointer", marginRight: -4, padding: "0 4px" }}>☰</button>
        )}
        {!isMobile && <LogoSlot value={meta.logo_left_url} onChange={v => setMeta("logo_left_url", v)} title="Logo trái" />}
        {!isMobile && <div style={{ width: 1, height: 28, background: C.bd0, flexShrink: 0 }} />}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Rajdhani',sans-serif",
            fontSize: isMobile ? FONT.title : FONT.headline,
            fontWeight: 700,
            background: `linear-gradient(135deg,${C.blue},${C.tealL})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            whiteSpace: "nowrap"
          }}>
            ISO 50001
          </div>
          {!isMobile && (
            <>
              <span style={{ fontSize: FONT.body, fontWeight: 600, color: C.t1 }}>
                {adminMode ? "Admin Dashboard" : "Field Survey Tool"}
              </span>
              <Tag c={C.blue}>v2024-2025</Tag>
            </>
          )}
        </div>
      </div>
      {/* Giữa: Thống kê gap */}
      {!adminMode && !isMobile && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, justifyContent: "center", minWidth: 0 }}>
          {crit > 0 && <Tag c={C.red}>{crit} Nghiêm trọng</Tag>}
          {maj > 0 && <Tag c={C.orange}>{maj} Khoảng cách lớn</Tag>}
          {crit === 0 && maj === 0 && <Tag c={C.tealL}>Chưa có gap nghiêm trọng</Tag>}
        </div>
      )}
      {/* Góc phải: Tiến độ + Logo phải + Admin */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12, flexShrink: 0 }}>
        {!adminMode && !isMobile && (
          <>
            <span style={{ fontSize: FONT.body, fontWeight: 600, color: C.t2 }}>{step + 1}/{total}</span>
            <div style={{ width: 88, height: 4, background: C.bg4, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${((step + 1) / total) * 100}%`,
                background: `linear-gradient(90deg,${C.blue},${C.tealL})`,
                transition: "width .3s ease",
              }}/>
            </div>
          </>
        )}
        {!isMobile && <LogoSlot value={meta.logo_right_url} onChange={v => setMeta("logo_right_url", v)} title="Logo phải" />}
        {onToggleLite && !adminMode && (
          <button onClick={onToggleLite} style={{
            padding: isMobile ? "6px 10px" : "6px 14px", borderRadius: 8, border: `1px solid ${C.orange}50`,
            background: `linear-gradient(135deg, ${C.orange}18, ${C.amber}10)`,
            color: C.orangeL, fontSize: isMobile ? 18 : 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, transition: "all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${C.orange}30, ${C.amber}20)`; e.currentTarget.style.transform = "scale(1.03)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${C.orange}18, ${C.amber}10)`; e.currentTarget.style.transform = ""; }}
          >⚡ {!isMobile && "Audit"}</button>
        )}
        <Btn v="ghost" sz="sm" onClick={onToggleKanban}>
          {kanbanMode ? "← Về KS" : isMobile ? "📊" : "📊 Kanban"}
        </Btn>
        <Btn v="ghost" sz="sm" onClick={onToggleAdmin}>
          {adminMode ? "← Về KS" : isMobile ? "👑" : "👑 Admin"}
        </Btn>
        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 0, padding: "4px 8px", background: `${C.bg3}80`, borderRadius: 8, border: `1px solid ${C.bd1}` }}>
            {!isMobile && <span style={{ fontSize: 13, color: C.tealL, fontWeight: 600 }}>{currentUser.displayName || currentUser.username}</span>}
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: `${C.blue}20`, color: C.blueL, fontWeight: 600 }}>{currentUser.role}</span>
            {onLogout && <button onClick={onLogout} style={{ background: "none", border: "none", color: C.t2, cursor: "pointer", fontSize: 16, padding: "0 4px" }} title="Đăng xuất">🚪</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Load survey dropdown (xem lại dữ liệu GAP đã lưu) ──────────────
function LoadSurveyDropdown({ onLoadList, onSelect, apiBase }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await onLoadList();
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [onLoadList]);
  return (
    <div style={{ position: "relative" }}>
      <Btn v="outline" sz="sm" onClick={() => { setOpen(!open); if (!open) load(); }}>
        📂 Tải phiên / Xem lại
      </Btn>
      {open && (
        <div style={{ position: "absolute", left: 0, top: "100%", marginTop: 6, background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: 10, maxHeight: 280, overflowY: "auto", zIndex: 100, minWidth: 240, boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
          <div style={{ padding: "8px 12px", fontSize: FONT.label, color: C.t3, borderBottom: `1px solid ${C.bd1}` }}>
            Chọn phiên để xem lại dữ liệu đánh giá GAP đã lưu
          </div>
          {loading ? <div style={{ padding: 12, fontSize: FONT.body, color: C.t2 }}>Đang tải...</div> : list.length === 0 ? <div style={{ padding: 12, fontSize: FONT.body, color: C.t2 }}>Chưa có phiên.</div> : list.map(s => (
            <button key={s._id} type="button" onClick={() => { onSelect(s._id); setOpen(false); }} style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", color: C.t0, fontSize: FONT.body, cursor: "pointer", borderBottom: `1px solid ${C.bd1}` }}>
              {s.meta?.ref_no || s._id} — {s.client?.name || "—"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────
function Sidebar({ step, setStep, survey, checklist = DEFAULT_CHECKLIST, onSave, saveLoading, onLoadList, onLoadOne, onNewSurvey, apiUrl, surveyId, apiInfo, onOpenAdminTab, onOpenUserManagement, currentUser, isMobile, sidebarOpen, setSidebarOpen }) {
  return (
    <div style={{
      width: 260,
      minWidth: 260,
      flexShrink: 0,
      background: C.bg1,
      borderRight: `1px solid ${C.bd0}`,
      position: isMobile ? "fixed" : "sticky",
      zIndex: isMobile ? 300 : "auto",
      left: isMobile ? (sidebarOpen ? 0 : -260) : 0,
      top: 56,
      height: "calc(100vh - 56px)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      transition: "left 0.3s ease",
      boxShadow: isMobile && sidebarOpen ? `5px 0 20px rgba(0,0,0,0.5)` : "none"
    }}>
      {/* Lưu / Tải / Phiên mới — đồng bộ DB & xem lại đánh giá GAP */}
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.bd0}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: FONT.body, textTransform: "uppercase", letterSpacing: "0.06em", color: C.t3, marginBottom: 4 }}>
          Phiên khảo sát
        </div>
        <LoadSurveyDropdown onLoadList={onLoadList} onSelect={onLoadOne} apiBase={apiUrl} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Btn v="blue" sz="sm" onClick={onSave} disabled={saveLoading} style={{ flex: 1, minWidth: 0 }}>
            {saveLoading ? "…" : "💾 Lưu phiên"}
          </Btn>
          <Btn v="ghost" sz="sm" onClick={onNewSurvey}>
            Phiên mới
          </Btn>
        </div>
        {surveyId && (
          <div style={{ fontSize: FONT.body, color: C.tealL }}>
            Đã lưu DB • Auto-save khi sửa form
          </div>
        )}
      </div>
      {STEPS.map((s, i) => {
        const done = stepDone(i, survey, checklist);
        const active = step === i;
        return (
          <button key={s.id} onClick={() => { setStep(i); if (isMobile) setSidebarOpen(false); }}
            style={{
              width: "100%",
              background: active ? `${C.blue}22` : "transparent",
              border: "none",
              borderLeft: active ? `4px solid ${C.blue}` : "4px solid transparent",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              transition: "all .15s",
              textAlign: "left",
            }}>
            <span style={{ fontSize: FONT.headline, flexShrink: 0 }}>{s.icon}</span>
            <span style={{
              fontSize: FONT.body,
              color: active ? C.blueL : C.t1,
              fontWeight: active ? 700 : 500,
              flex: 1,
              lineHeight: 1.35,
            }}>{s.label}</span>
            {done && <span style={{ color: C.tealL, fontSize: FONT.subheading }}>✓</span>}
          </button>
        );
      })}
      <QuickStats survey={survey} checklist={checklist}/>

      {/* Nhóm menu Quản trị */}
      <div style={{ marginTop: 8, padding: "8px 12px 12px", borderTop: `1px solid ${C.bd0}` }}>
        <div style={{ fontSize: FONT.body, textTransform: "uppercase", letterSpacing: "0.06em", color: C.t3, marginBottom: 6 }}>
          Quản trị hệ thống
        </div>
        {[
          { id: "clients", label: "Quản trị khách hàng", icon: "🏭" },
          { id: "auditors", label: "Quản trị Auditors", icon: "🔬" },
          { id: "audit_plan", label: "Kế hoạch đánh giá GAP", icon: "🧭" },
          { id: "logistics", label: "Quản trị Logistics & Khách sạn", icon: "🧳" },
          { id: "checklist", label: "Quản trị điều khoản GAP", icon: "📝" },
          { id: "export", label: "Form Export báo cáo", icon: "📄" },
          { id: "calendar", label: "Quản trị Lịch & Jobs", icon: "🗓️", kanban: true },
          { id: "telegram", label: "Cấu hình Telegram", icon: "📣", kanban: true, adminOnly: true },
          { id: "user_management", label: "Quản trị người dùng", icon: "👥", userMgmt: true, adminOnly: true },
        ].filter(m => !m.adminOnly || currentUser?.role === 'admin').map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (isMobile) setSidebarOpen(false);
              if (m.userMgmt && onOpenUserManagement) return onOpenUserManagement();
              if (onOpenAdminTab) onOpenAdminTab(m.id, m.kanban);
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginTop: 2,
              background: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              color: C.t1,
              fontSize: FONT.body,
            }}
          >
            <span style={{ fontSize: FONT.title }}>{m.icon}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{m.label}</span>
          </button>
        ))}
      </div>
      {apiInfo && (
        <div style={{ margin: "0 12px 12px", padding: "8px 10px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.bd0}` }}>
          <div style={{ fontSize: FONT.body, color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>MongoDB</div>
          <div style={{ fontSize: FONT.body, fontWeight: 600, color: C.t1 }}>DB: {apiInfo.database || "iso50001gap"}</div>
          <div style={{ fontSize: FONT.body, color: C.t2, marginTop: 2 }}>{apiInfo.note || "DB xuất hiện trong Compass sau khi Lưu phiên lần đầu."}</div>
        </div>
      )}
    </div>
  );
}

// ── Bottom nav ───────────────────────────────────────────────────
function BottomNav({ step, setStep, total, isMobile }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      alignItems: "center",
      marginTop: 24,
      paddingTop: 16,
      borderTop: `1px solid ${C.bd1}`,
    }}>
      <Btn v="ghost" sz="md" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
        ← Trước
      </Btn>
      <div style={{ display: "flex", gap: isMobile ? 4 : 6, flexWrap: "wrap", justifyContent: "center" }}>
        {STEPS.map((_, i) => (
          (!isMobile || Math.abs(i - step) <= 3) && (
            <button key={i} onClick={() => setStep(i)}
              style={{
                width: isMobile ? 8 : 10,
                height: isMobile ? 8 : 10,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                transition: "all .2s",
                background: i === step ? C.blue : i < step ? C.tealL + "99" : C.bg4,
              }}/>
          )
        ))}
      </div>
      {step < total - 1
        ? <Btn v="blue" sz="md" onClick={() => setStep(s => Math.min(total - 1, s + 1))}>Tiếp theo →</Btn>
        : <span style={{ fontSize: FONT.body, color: C.t2 }}>Sử dụng nút xuất bên trên</span>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
const base = (url) => (url ? url.replace(/\/$/, "") : "");

export default function GapSurveyApp({ apiUrl: initApi = "http://localhost:5002" }) {
  const [step,    setStep   ] = useState(0);
  const [survey,  setSurvey ] = useState(() => {
    // Tự động sinh mã khảo sát ngẫu nhiên không trùng lặp
    const init = JSON.parse(JSON.stringify(INIT_SURVEY));
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    if(init.meta) init.meta.ref_no = `GAP-${year}-${rand}`;
    return init;
  });
  const [surveyId, setSurveyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast,   setToast  ] = useState(null);
  const [apiUrl,  setApiUrl ] = useState(initApi);
  const [apiInfo, setApiInfo] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [kanbanMode, setKanbanMode] = useState(false);
  const [kanbanInitialTab, setKanbanInitialTab] = useState("kanban");
  const [adminInitialTab, setAdminInitialTab] = useState("surveys");
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const autoSaveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const [userManagementMode, setUserManagementMode] = useState(false);
  const [liteAuditOpen, setLiteAuditOpen] = useState(false);

  // ── Mobile State ──
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Force strict viewport for in-app browsers (Zalo, etc.)
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    const handleResize = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(window.innerWidth <= 1100 || isMobileUA);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Auth state ──
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("gap_token") || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gap_user")); } catch { return null; }
  });

  const handleLogin = useCallback(async (username, password) => {
    const explicit = base(initApi);
    const fallback = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "") : "";
    const b = explicit || fallback;
    const res = await fetch(`${b}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Đăng nhập thất bại");
    setAuthToken(data.token);
    setCurrentUser(data.user);
    localStorage.setItem("gap_token", data.token);
    localStorage.setItem("gap_user", JSON.stringify(data.user));
  }, [initApi]);

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem("gap_token");
    localStorage.removeItem("gap_user");
  }, []);

  // Auto-save đồng bộ DB mỗi khi dữ liệu thay đổi (sau khi nhập modal/form)
  useEffect(() => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    const canSave =
      b &&
      (surveyId || (survey.meta?.ref_no?.trim() && survey.client?.name?.trim()));
    if (!canSave) return;
    autoSaveTimerRef.current = window.setTimeout(() => {
      const url = surveyId ? `${b}/api/surveys/${surveyId}` : `${b}/api/surveys`;
      const method = surveyId ? "PUT" : "POST";
      fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(survey),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((e) => Promise.reject({ status: res.status, ...e }));
          return res.json().catch(() => ({}));
        })
        .then((e) => {
          if (e && e._id) {
            if (!surveyId) {
              setSurveyId(e._id);
              setToast({ type: "success", msg: "Đã tạo phiên và lưu vào DB." });
            }
            lastSavedRef.current = Date.now();
          }
        })
        .catch((err) => {
          if (err && err.status === 409 && err.id) {
            // Auto-retry as PUT
            setSurveyId(err.id);
            fetch(`${b}/api/surveys/${err.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(survey),
            })
            .then(res => res.json().catch(()=>({})))
            .then(e => {
              if (e && e._id) lastSavedRef.current = Date.now();
            }).catch(()=>{});
          } else if (err && err.status === 409) {
            setToast({ type: "error", msg: `Mã khảo sát ${survey.meta.ref_no} đã tồn tại! Vui lòng đổi mã khác để tiếp tục lưu.` });
          }
        });
    }, 1800);
    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [survey, surveyId, apiUrl]);

  useEffect(() => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    if (!b) return;
    fetch(`${b}/health`)
      .then((r) => r.json())
      .then((d) => setApiInfo({ database: d.database || "iso50001gap", note: d.note || "DB xuất hiện trong MongoDB Compass sau khi Lưu phiên lần đầu." }))
      .catch(() => setApiInfo({ database: "iso50001gap", note: "Kết nối backend để xem trạng thái. DB tạo khi Lưu phiên lần đầu." }));
  }, [apiUrl]);

  // Load checklist từ DB (fallback về static nếu API lỗi)
  useEffect(() => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    if (!b) return;
    fetch(`${b}/api/iso50001/gap/checklist`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((items) => { if (Array.isArray(items) && items.length > 0) setChecklist(items); })
      .catch(() => {}); // giữ static default nếu lỗi
  }, [apiUrl]);

  // Đảm bảo đã có surveyId trong MongoDB trước khi lưu bằng chứng
  const ensureSurveyId = useCallback(async () => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    if (surveyId) return surveyId;
    if (!b) {
      setToast({ type: "error", msg: "Chưa cấu hình API URL để lưu dữ liệu." });
      throw new Error("API URL not set");
    }
    if (!survey.meta?.ref_no?.trim() || !survey.client?.name?.trim()) {
      setToast({ type: "error", msg: "Vui lòng nhập Mã khảo sát và Tên tổ chức trước khi thêm bằng chứng." });
      throw new Error("Missing meta.ref_no or client.name");
    }
    setSaving(true);
    try {
      const res = await fetch(`${b}/api/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(survey),
      });
      const e = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Nếu ref_no đã tồn tại (409), tái sử dụng phiên cũ thay vì coi là lỗi
        if (res.status === 409 && e.id) {
          setSurveyId(e.id);
          setToast({
            type: "success",
            msg: "Đã nối lại phiên khảo sát có cùng Mã tham chiếu. Bằng chứng sẽ gắn vào phiên này.",
          });
          return e.id;
        }
        if (res.status === 503 || e.code === "MONGO_DISCONNECTED") {
          setToast({ type: "error", msg: "MongoDB chưa kết nối. Khởi động MongoDB (cổng 27017) và backend trước khi thêm bằng chứng." });
          throw new Error("Mongo disconnected");
        }
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      if (e._id) {
        setSurveyId(e._id);
        setToast({ type: "success", msg: "✓ Đã tự động tạo phiên khảo sát trong DB. Bạn có thể thêm bằng chứng cho từng điều khoản." });
        return e._id;
      }
      throw new Error("Không nhận được _id từ server");
    } catch (err) {
      if (!err.silent) {
        setToast((prev) => prev || { type: "error", msg: `Lỗi tạo phiên tự động: ${err.message || err}` });
      }
      throw err;
    } finally {
      setSaving(false);
    }
  }, [apiUrl, survey, surveyId, setToast, setSaving]);

  const handleSave = useCallback(async () => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    if (!b && !survey.meta?.ref_no) {
      setToast({ type: "error", msg: "Nhập mã khảo sát và tên tổ chức trước khi lưu." });
      return;
    }
    if (!survey.client?.name?.trim()) {
      setToast({ type: "error", msg: "Vui lòng nhập Tên tổ chức / Công ty (bắt buộc để lưu DB)." });
      return;
    }
    setSaving(true); setToast(null);
    try {
      const url = surveyId ? `${b}/api/surveys/${surveyId}` : `${b}/api/surveys`;
      let res = await fetch(url, {
        method: surveyId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(survey),
      });
      let e = await res.json().catch(() => ({}));
      
      // Auto-retry as PUT if POST hits a 409 Conflict due to AutoSave race conditions
      if (!res.ok && res.status === 409 && e.id) {
        setSurveyId(e.id);
        res = await fetch(`${b}/api/surveys/${e.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(survey),
        });
        e = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        if (res.status === 503 || e.code === "MONGO_DISCONNECTED") {
          setToast({ type: "error", msg: "MongoDB chưa kết nối. Khởi động MongoDB (cổng 27017) và khởi động lại backend. DB 'iso50001gap' sẽ được tạo khi lưu thành công." });
          return null;
        }
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      if (e._id) setSurveyId(e._id);
      setToast({ type: "success", msg: "✓ Đã lưu phiên khảo sát vào DB iso50001gap." });
      return e._id || surveyId;
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("timed out") || msg.includes("buffering") || msg.includes("ECONNREFUSED")) {
        setToast({ type: "error", msg: "MongoDB phản hồi chậm hoặc chưa kết nối." });
      } else {
        setToast({ type: "error", msg: `Lỗi lưu: ${msg}` });
      }
      return null;
    } finally {
      setSaving(false);
    }
  }, [survey, surveyId, apiUrl]);

  const handleLoadList = useCallback(async () => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    const res = await fetch(`${b}/api/surveys?limit=100`);
    if (res.status === 503) {
      setToast({ type: "error", msg: "MongoDB chưa kết nối. Khởi động MongoDB và backend để tải danh sách phiên." });
      return [];
    }
    if (!res.ok) return [];
    return res.json();
  }, [apiUrl]);

  const handleLoadOne = useCallback(async (id) => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    const res = await fetch(`${b}/api/surveys/${id}`);
    if (res.status === 503) {
      setToast({ type: "error", msg: "MongoDB chưa kết nối. Khởi động MongoDB và backend." });
      throw new Error("MongoDB chưa kết nối");
    }
    if (!res.ok) throw new Error("Không tải được phiên.");
    const data = await res.json();
    const clientData = data.client || {};
    const metaData = data.meta || {};
    const execSummaryItems = Array.isArray(metaData.exec_summary_items) && metaData.exec_summary_items.length > 0
      ? metaData.exec_summary_items
      : (metaData.exec_summary && typeof metaData.exec_summary === "string")
        ? metaData.exec_summary.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
        : [];
    const normalized = {
      ...INIT_SURVEY,
      ...data,
      meta: { ...INIT_SURVEY.meta, ...metaData, exec_summary_items: execSummaryItems },
      client: {
        ...INIT_SURVEY.client,
        ...clientData,
        contact_persons: Array.isArray(clientData.contact_persons) ? clientData.contact_persons : [],
      },
      verifier: { ...INIT_SURVEY.verifier, ...(data.verifier || {}) },
      audit_plan: (() => {
        const ap = data.audit_plan || {};
        return { ...INIT_SURVEY.audit_plan, ...ap, auditors: Array.isArray(ap.auditors) ? ap.auditors : [] };
      })(),
      responses: (() => {
        const r = data.responses || {};
        const out = {};
        for (const [k, v] of Object.entries(r)) {
          out[k] = { ...v, evidence_notes: Array.isArray(v?.evidence_notes) ? v.evidence_notes : [] };
        }
        return out;
      })(),
      risk_assessments: data.risk_assessments || {},
      risk_items: data.risk_items || {},
      process_gaps: data.process_gaps || {},
      site_assessments: Array.isArray(data.site_assessments) ? data.site_assessments : [],
      action_plan: Array.isArray(data.action_plan) ? data.action_plan : [],
      legal_status: data.legal_status || {},
      legal_registry: Array.isArray(data.legal_registry) && data.legal_registry.length > 0 ? data.legal_registry : INIT_SURVEY.legal_registry,
      iso_standards_registry: Array.isArray(data.iso_standards_registry) && data.iso_standards_registry.length > 0 ? data.iso_standards_registry : INIT_SURVEY.iso_standards_registry,
      certification_roadmap: Array.isArray(data.certification_roadmap) && data.certification_roadmap.length > 0 ? data.certification_roadmap : INIT_SURVEY.certification_roadmap,
      logistics_trips: Array.isArray(data.logistics_trips) ? data.logistics_trips : [],
    };
    setSurvey(normalized);
    setSurveyId(data._id);
    setToast({ type: "success", msg: "✓ Đã tải phiên. Chuyển từng bước để xem lại dữ liệu đánh giá GAP đã lưu." });
  }, [apiUrl]);

  const handleExport = useCallback(async () => {
    setLoading(true); setToast(null);
    try {
      const payload = { ...survey };
      if (surveyId && !payload._id) payload._id = surveyId;
      
      // Tự động chuyển trạng thái "Hoàn thành" khi thực hiện thao tác xuất báo cáo GAP
      if (payload.kanban_status !== "completed") {
        payload.kanban_status = "completed";
        setSurvey(prev => ({ ...prev, kanban_status: "completed" }));
        if (surveyId) {
          const explicit = base(apiUrl);
          const fallback = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "") : "";
          const b = explicit || fallback;
          await fetch(`${b}/api/surveys/${surveyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).catch(()=>{});
        }
      }

      const res = await fetch(`${base(apiUrl) || ""}/api/iso50001/gap/generate`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json().catch(()=>({ error:"Server error" }));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `ISO50001_GAP_${(survey.meta?.ref_no||"report").replace(/[^A-Za-z0-9_-]/g,"_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ type:"success", msg:"✓ Báo cáo GAP ISO 50001 đã được tạo và tải về!" });
    } catch (e) {
      setToast({ type:"error", msg:`Lỗi: ${e.message} — Kiểm tra backend tại ${apiUrl}` });
    } finally {
      setLoading(false);
    }
  }, [survey, apiUrl]);

  const handleNewSurvey = useCallback(() => {
    const init = JSON.parse(JSON.stringify(INIT_SURVEY));
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    if(init.meta) init.meta.ref_no = `GAP-${year}-${rand}`;
    setSurvey(init);
    setSurveyId(null);
    setStep(0);
    setToast({ type: "success", msg: "Phiên mới đã sẵn sàng." });
  }, []);

  const cur = STEPS[step];

  // ── Login Gate: Hiển thị trang đăng nhập nếu chưa login ──
  if (!authToken || !currentUser) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <Suspense fallback={<div style={{ minHeight: "100vh", background: C.bg0 }} />}>
          <LoginPage onLogin={handleLogin} />
        </Suspense>
      </>
    );
  }

  // ── User Management Mode ──
  if (userManagementMode) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ minHeight: "100vh", background: C.bg0 }}>
          <TopBar
            step={0} total={1}
            survey={survey} setSurvey={setSurvey}
            adminMode={false} kanbanMode={false}
            onToggleAdmin={() => { setUserManagementMode(false); setAdminMode(true); }}
            onToggleKanban={() => { setUserManagementMode(false); setKanbanMode(true); }}
            checklist={checklist}
            currentUser={currentUser} onLogout={handleLogout}
            isMobile={isMobile} setSidebarOpen={setSidebarOpen}
          />
          <div style={{ padding: isMobile ? "16px 12px 24px" : "24px 32px 32px" }}>
            <SectionHeader icon="👥" title="Quản trị người dùng" badge="CRUD · Dashboard · Bảo mật" />
            <Suspense fallback={<div style={{ color: C.t2, fontSize: 15 }}>Đang tải…</div>}>
              <UserManagement apiUrl={apiUrl} token={authToken} currentUser={currentUser} />
            </Suspense>
          </div>
        </div>
      </>
    );
  }

  if (kanbanMode) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ minHeight: "100vh", background: C.bg0 }}>
          <TopBar
            step={0} total={1}
            survey={survey} setSurvey={setSurvey}
            adminMode={false} kanbanMode={true}
            onToggleAdmin={() => { setKanbanMode(false); setAdminMode(true); }}
            onToggleKanban={() => setKanbanMode(false)}
            checklist={checklist}
            isMobile={isMobile} setSidebarOpen={setSidebarOpen}
          />
          <div style={{ padding: isMobile ? "16px 12px 24px" : "24px 32px 32px" }}>
            <SectionHeader icon="📊" title="Kanban & Lịch đánh giá GAP" badge="Kanban · Lịch · Thống kê · Telegram" />
            <Suspense fallback={<div style={{ color: C.t2, fontSize: 15 }}>Đang tải Kanban dashboard…</div>}>
              <KanbanDashboard apiUrl={apiUrl} initialTab={kanbanInitialTab} currentUser={currentUser} />
            </Suspense>
          </div>
        </div>
      </>
    );
  }

  if (adminMode) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ minHeight: "100vh", background: C.bg0 }}>
          <TopBar
            step={0} total={1}
            survey={survey} setSurvey={setSurvey}
            adminMode={true} kanbanMode={false}
            onToggleAdmin={() => setAdminMode(false)}
            onToggleKanban={() => { setAdminMode(false); setKanbanMode(true); }}
            checklist={checklist}
            isMobile={isMobile} setSidebarOpen={setSidebarOpen}
          />
          <div style={{ padding: isMobile ? "16px 12px 24px" : "24px 40px 32px" }}>
            <SectionHeader icon="👑" title="Admin dashboard" badge="Khách hàng · Kế hoạch · Logistics" />
            <Suspense fallback={<div style={{ color: C.t2, fontSize: 15 }}>Đang tải Admin dashboard…</div>}>
              <AdminDashboard apiUrl={apiUrl} initialTab={adminInitialTab} />
            </Suspense>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight:"100vh", background:C.bg0 }}>
        <TopBar
          step={step}
          total={STEPS.length}
          survey={survey}
          setSurvey={setSurvey}
          adminMode={adminMode}
          kanbanMode={false}
          checklist={checklist}
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleLite={() => setLiteAuditOpen(true)}
          onToggleKanban={() => setKanbanMode(true)}
          onToggleAdmin={() => {
            setAdminInitialTab("surveys");
            setAdminMode((m) => !m);
          }}
          isMobile={isMobile}
          setSidebarOpen={setSidebarOpen}
        />
        <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", width: "100%", overflowX: "hidden", position: "relative" }}>
          {isMobile && sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, top: 56, background: "rgba(0,0,0,0.5)", zIndex: 290 }} />
          )}
          <Sidebar
            step={step}
            setStep={setStep}
            survey={survey}
            checklist={checklist}
            onSave={handleSave}
            saveLoading={saving}
            onLoadList={handleLoadList}
            onLoadOne={handleLoadOne}
            onNewSurvey={handleNewSurvey}
            apiUrl={apiUrl}
            surveyId={surveyId}
            apiInfo={apiInfo}
            currentUser={currentUser}
            onOpenAdminTab={(tabId, isKanban = false) => {
              if (isKanban) {
                setKanbanInitialTab(tabId);
                setKanbanMode(true);
                setAdminMode(false);
              } else {
                setAdminInitialTab(tabId);
                setAdminMode(true);
                setKanbanMode(false);
              }
            }}
            onOpenUserManagement={() => {
              setUserManagementMode(true);
              setAdminMode(false);
              setKanbanMode(false);
            }}
            isMobile={isMobile}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <div style={{
            flex: 1,
            minWidth: 0,
            padding: isMobile ? "16px 12px 24px" : "24px 40px 32px",
            overflowY: "auto",
            width: "100%",
            maxWidth: "none",
          }}>
            <SectionHeader icon={cur.icon} title={cur.label} badge="ISO 50001:2018"/>
            <Toast toast={toast} onClose={()=>setToast(null)}/>

            <div className="fade-in">
              <Suspense fallback={<div style={{ color: C.t2, fontSize: 15 }}>Đang tải bước khảo sát…</div>}>
                {step === 0 && <StepOrg     survey={survey} setSurvey={setSurvey}/>}
                {step === 1 && <StepClauses survey={survey} setSurvey={setSurvey} surveyId={surveyId} apiUrl={apiUrl} setToast={setToast} ensureSurveyId={ensureSurveyId} checklist={checklist}/>}
                {step === 2 && <StepRisk    survey={survey} setSurvey={setSurvey}/>}
                {step === 3 && <StepProcess survey={survey} setSurvey={setSurvey}/>}
                {step === 4 && <StepSite    survey={survey} setSurvey={setSurvey}/>}
                {step === 5 && <StepMeters  survey={survey} setSurvey={setSurvey}/>}
                {step === 6 && <StepActions survey={survey} setSurvey={setSurvey} checklist={checklist}/>}
                {step === 7 && <StepEvidence survey={survey} surveyId={surveyId} apiUrl={apiUrl} setToast={setToast} ensureSurveyId={ensureSurveyId} checklist={checklist}/>}
                {step === 8 && (
                  <StepExport
                    survey={survey}
                    surveyId={surveyId}
                    onSave={handleSave}
                    onExport={handleExport}
                    loading={loading}
                    setToast={setToast}
                    apiUrl={apiUrl}
                    setApiUrl={setApiUrl}
                    checklist={checklist}
                  />
                )}
              </Suspense>
            </div>

            <BottomNav step={step} setStep={setStep} total={STEPS.length} isMobile={isMobile} />
          </div>
        </div>

        {/* Lite GAP Audit Modal */}
        {liteAuditOpen && (
          <Suspense fallback={<div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: C.t0, fontSize: 16 }}>Đang tải Lite Audit...</div>}>
            <LiteGapAudit
              open={liteAuditOpen}
              onClose={() => setLiteAuditOpen(false)}
              survey={survey}
              setSurvey={setSurvey}
              apiUrl={apiUrl}
              onSave={handleSave}
              setToast={setToast}
            />
          </Suspense>
        )}
      </div>
    </>
  );
}
