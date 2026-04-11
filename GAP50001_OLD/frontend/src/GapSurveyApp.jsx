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
import { C, FONT, STEPS, INIT_SURVEY, GAP_CHECKLIST, RISK_CATEGORIES, SCORE_CFG } from "./gap.ui.constants.js";
import { GLOBAL_CSS, Btn, Tag, Toast, SectionHeader } from "./gap.atoms.jsx";

// Các step nặng được lazy‑load để giảm bundle ban đầu
const StepOrg        = lazy(() => import("./StepOrg.jsx"));
const StepClauses    = lazy(() => import("./StepClauses.jsx"));
const StepRisk       = lazy(() => import("./StepRisk.jsx"));
const StepProcess    = lazy(() => import("./StepProcess.jsx"));
const StepSite       = lazy(() => import("./StepSite.jsx"));
const StepActions    = lazy(() => import("./StepActions.jsx"));
const StepEvidence   = lazy(() => import("./StepEvidence.jsx"));
const StepExport     = lazy(() => import("./StepExport.jsx"));
const AdminDashboard = lazy(() => import("./AdminDashboard.jsx"));

// ── Completion checks per step ───────────────────────────────────
function stepDone(step, survey) {
  const r = survey.responses || {};
  switch (step) {
    case 0: return !!survey.meta?.ref_no && !!survey.client?.name;
    case 1: return GAP_CHECKLIST.filter(i=>(r[i.id]?.score||0)>0).length >= 10;
    case 2: return Object.keys(survey.risk_assessments||{}).length >= 3;
    case 3: return Object.keys(survey.process_gaps||{}).length >= 3;
    case 4: return (survey.site_assessments||[]).length > 0;
    case 5: return (survey.action_plan||[]).length > 0;
    case 6: return true;
    case 7: return false;
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
function QuickStats({ survey }) {
  const r = survey.responses || {};
  const scored = GAP_CHECKLIST.filter(i=>(r[i.id]?.score||0)>0);
  const crit = scored.filter(i=>r[i.id].score<=1).length;
  const maj  = scored.filter(i=>r[i.id].score===2).length;
  const allRisks = useMemo(() => getAllRisks(survey), [survey]);
  const highR = allRisks.filter(rk => (rk.likelihood || 0) * (rk.impact || 0) >= 9).length;
  const avg = scored.length ? (scored.reduce((a,i)=>a+(r[i.id].score||0),0)/scored.length).toFixed(1) : "—";

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
        <div key={x.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
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
function TopBar({ step, total, survey, setSurvey, adminMode, onToggleAdmin }) {
  const r = survey.responses || {};
  const crit = GAP_CHECKLIST.filter(i=>(r[i.id]?.score||0)===1).length;
  const maj  = GAP_CHECKLIST.filter(i=>(r[i.id]?.score||0)===2).length;
  const meta = survey.meta || {};
  const setMeta = (key, val) => setSurvey(prev => ({ ...prev, meta: { ...prev.meta, [key]: val } }));
  return (
    <div style={{
      height: 56,
      padding: "0 16px 0 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: `1px solid ${C.bd0}`,
      background: `linear-gradient(90deg,${C.bg1},${C.bg2})`,
      position: "sticky",
      top: 0,
      zIndex: 200,
      backdropFilter: "blur(12px)",
      gap: 16,
    }}>
      {/* Góc trái: Logo trái + Tên app */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <LogoSlot value={meta.logo_left_url} onChange={v => setMeta("logo_left_url", v)} title="Logo trái" />
        <div style={{ width: 1, height: 28, background: C.bd0, flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Rajdhani',sans-serif",
            fontSize: FONT.headline,
            fontWeight: 700,
            background: `linear-gradient(135deg,${C.blue},${C.tealL})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            ISO 50001·GAP
          </div>
          <span style={{ fontSize: FONT.body, fontWeight: 600, color: C.t1 }}>
            {adminMode ? "Admin Dashboard" : "Field Survey Tool"}
          </span>
          <Tag c={C.blue}>v2024-2025</Tag>
        </div>
      </div>
      {/* Giữa: Thống kê gap */}
      {!adminMode && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, justifyContent: "center", minWidth: 0 }}>
          {crit > 0 && <Tag c={C.red}>{crit} Nghiêm trọng</Tag>}
          {maj > 0 && <Tag c={C.orange}>{maj} Khoảng cách lớn</Tag>}
          {crit === 0 && maj === 0 && <Tag c={C.tealL}>Chưa có gap nghiêm trọng</Tag>}
        </div>
      )}
      {/* Góc phải: Tiến độ + Logo phải + Admin */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {!adminMode && (
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
        <LogoSlot value={meta.logo_right_url} onChange={v => setMeta("logo_right_url", v)} title="Logo phải" />
        <Btn v="ghost" sz="sm" onClick={onToggleAdmin}>
          {adminMode ? "← Về khảo sát" : "👑 Admin dashboard"}
        </Btn>
      </div>
    </div>
  );
}

// ── Lịch sử phiên — inline panel, tự refresh sau mỗi lần lưu ────────
const PAGE_SIZE = 10;
function SurveyHistory({ onLoadList, onSelect, surveyId, refreshTrigger }) {
  const [open, setOpen]       = useState(false);
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ]             = useState("");
  const [page, setPage]       = useState(1);
  const prevTrigger           = useRef(refreshTrigger);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await onLoadList();
      setList(Array.isArray(data) ? data : []);
      setPage(1);
    } finally { setLoading(false); }
  }, [onLoadList]);

  // Tự mở và tải lại khi refreshTrigger thay đổi (sau mỗi lần lưu)
  useEffect(() => {
    if (refreshTrigger !== prevTrigger.current) {
      prevTrigger.current = refreshTrigger;
      setOpen(true);
      load();
    }
  }, [refreshTrigger, load]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && list.length === 0) load();
  };

  const filtered = list.filter(s => {
    if (!q) return true;
    const lq = q.toLowerCase();
    return (s.meta?.ref_no || "").toLowerCase().includes(lq) ||
           (s.client?.name || "").toLowerCase().includes(lq);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;

  return (
    <div>
      {/* Toggle header */}
      <button type="button" onClick={toggle} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 10px", background: open ? `${C.blue}15` : "transparent",
        border: `1px solid ${open ? C.blue+"44" : C.bd1}`,
        borderRadius: open ? "8px 8px 0 0" : 8, cursor: "pointer",
        color: open ? C.blueL : C.t2, fontSize: FONT.label, fontWeight: 600,
        transition: "all .15s",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>📂</span>
          <span>Lịch sử phiên khảo sát</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {list.length > 0 && (
            <span style={{ background: C.blue+"33", color: C.blueL, borderRadius: 10,
              padding: "1px 7px", fontSize: FONT.caption, fontWeight: 700 }}>
              {list.length}
            </span>
          )}
          {loading && <span style={{ fontSize: 10, color: C.t3 }}>⏳</span>}
          <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {/* Panel body */}
      {open && (
        <div style={{ border: `1px solid ${C.blue}44`, borderTop: "none",
          borderRadius: "0 0 8px 8px", background: C.bg2, overflow: "hidden" }}>

          {/* Search + Reload */}
          <div style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}`,
            display: "flex", gap: 6, alignItems: "center" }}>
            <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="🔍 Tìm mã hoặc tên..."
              style={{ flex: 1, background: C.bg3, border: `1px solid ${C.bd1}`,
                borderRadius: 6, padding: "4px 8px", color: C.t1,
                fontSize: FONT.caption, fontFamily: "inherit", outline: "none" }}
            />
            <button type="button" onClick={load} title="Tải lại danh sách"
              style={{ flexShrink: 0, background: "none", border: `1px solid ${C.bd1}`,
                borderRadius: 6, padding: "4px 7px", cursor: "pointer",
                color: C.t2, fontSize: 13, lineHeight: 1 }}>
              🔄
            </button>
          </div>

          {/* Session list */}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "14px", fontSize: FONT.caption, color: C.t3, textAlign: "center" }}>
                Đang tải danh sách...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "14px", fontSize: FONT.caption, color: C.t3, textAlign: "center" }}>
                {list.length === 0 ? "Chưa có phiên nào được lưu." : "Không tìm thấy phiên phù hợp."}
              </div>
            ) : paged.map(s => {
              const isCurrent = s._id === surveyId;
              return (
                <button key={s._id} type="button"
                  onClick={() => { onSelect(s._id); setOpen(false); setQ(""); }}
                  style={{
                    width: "100%", padding: "8px 10px", textAlign: "left",
                    background: isCurrent ? `${C.blue}22` : "transparent",
                    border: "none", borderBottom: `1px solid ${C.bd2}`,
                    cursor: "pointer", transition: "background .1s",
                  }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = C.bg3; }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {isCurrent && <span style={{ color: C.blueL, fontSize: 9 }}>▶</span>}
                    <span style={{ fontSize: FONT.caption, color: isCurrent ? C.blueL : C.tealL,
                      fontWeight: 700, fontFamily: "'Fira Code',monospace",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {s.meta?.ref_no || s._id}
                    </span>
                  </div>
                  <div style={{ fontSize: FONT.caption, color: C.t2, marginTop: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.client?.name || "—"}
                    {s.meta?.survey_date && (
                      <span style={{ color: C.t3, marginLeft: 6, fontSize: 10 }}>{s.meta.survey_date}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer: phân trang + đếm */}
          <div style={{ padding: "5px 10px", borderTop: `1px solid ${C.bd2}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: FONT.caption, color: C.t3 }}>
              {q ? `${filtered.length}/${list.length}` : list.length} phiên
            </span>
            {hasMore && (
              <button type="button" onClick={() => setPage(p => p + 1)}
                style={{ fontSize: FONT.caption, color: C.blueL, background: "none",
                  border: "none", cursor: "pointer", padding: "2px 4px", fontWeight: 600 }}>
                Hiển thị thêm ({filtered.length - paged.length})
              </button>
            )}
            {!hasMore && page > 1 && (
              <button type="button" onClick={() => setPage(1)}
                style={{ fontSize: FONT.caption, color: C.t3, background: "none",
                  border: "none", cursor: "pointer", padding: "2px 4px" }}>
                Thu gọn
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────
const ADMIN_MENU = [
  { id: "surveys",   label: "Kế hoạch đánh giá GAP",  icon: "🎯" },
  { id: "clients",   label: "Quản trị khách hàng",     icon: "🏭" },
  { id: "auditors",  label: "Quản trị Auditors",        icon: "🔬" },
  { id: "logistics", label: "Logistics & Khách sạn",   icon: "🧳" },
  { id: "dropdowns", label: "Quản trị Dropdown",       icon: "🗂️" },
  { id: "export",    label: "Xuất báo cáo GAP",        icon: "📄" },
];

// ── Label section heading ─────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: FONT.caption, textTransform: "uppercase", letterSpacing: "0.1em",
      color: C.t3, fontWeight: 700, padding: "10px 14px 4px",
    }}>
      {children}
    </div>
  );
}

function Sidebar({ step, setStep, survey, onSave, saveLoading, onLoadList, onLoadOne, onNewSurvey, apiUrl, surveyId, apiInfo, onOpenAdminTab, sessionRefreshKey }) {
  return (
    <div style={{
      width: 264,
      minWidth: 264,
      flexShrink: 0,
      background: C.bg1,
      borderRight: `1px solid ${C.bd0}`,
      position: "sticky",
      top: 56,
      height: "calc(100vh - 56px)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ══ 1. QUẢN TRỊ HỆ THỐNG ══════════════════════════════ */}
      <SectionLabel>Quản trị hệ thống</SectionLabel>
      <div style={{ padding: "0 8px 8px" }}>
        {ADMIN_MENU.map((m) => (
          <button key={m.id} type="button"
            onClick={() => onOpenAdminTab && onOpenAdminTab(m.id)}
            style={{
              width: "100%", padding: "6px 8px", marginBottom: 1,
              background: "transparent", border: "none", borderRadius: 6,
              display: "flex", alignItems: "center", gap: 8,
              cursor: "pointer", color: C.t2, fontSize: FONT.label,
              textAlign: "left", transition: "background .12s, color .12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.t0; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.t2; }}
          >
            <span style={{ fontSize: 15, flexShrink: 0, opacity: 0.85 }}>{m.icon}</span>
            <span style={{ flex: 1, lineHeight: 1.3 }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* ══ 2. PHIÊN KHẢO SÁT ══════════════════════════════════ */}
      <div style={{ borderTop: `1px solid ${C.bd0}` }}>
        <div style={{ padding: "10px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: FONT.caption, textTransform: "uppercase", letterSpacing: "0.1em", color: C.t3, fontWeight: 700 }}>
            Phiên khảo sát
          </span>
          {/* DB status — chỉ dot, không text */}
          <span title={apiInfo ? `MongoDB: ${apiInfo.database}` : "Kiểm tra kết nối..."}
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", display: "inline-block",
              background: apiInfo ? C.green : C.bg4,
              boxShadow: apiInfo ? `0 0 6px ${C.green}88` : "none",
            }}/>
            {surveyId && (
              <span style={{ fontSize: FONT.caption, color: C.tealL }}>Auto-save ✓</span>
            )}
          </span>
        </div>

        {/* Nút hành động */}
        <div style={{ padding: "0 10px 8px", display: "flex", gap: 6 }}>
          <button type="button" onClick={onSave} disabled={saveLoading}
            style={{
              flex: 1, padding: "7px 10px", borderRadius: 8,
              background: saveLoading ? C.bg3 : C.blue, border: "none",
              color: "#fff", fontSize: FONT.label, fontWeight: 700,
              cursor: saveLoading ? "not-allowed" : "pointer",
              opacity: saveLoading ? 0.7 : 1, whiteSpace: "nowrap",
              transition: "opacity .15s",
            }}>
            {saveLoading ? "⏳ Đang lưu..." : "💾 Lưu phiên"}
          </button>
          <button type="button" onClick={onNewSurvey}
            style={{
              padding: "7px 10px", borderRadius: 8,
              background: "transparent", border: `1px solid ${C.bd0}`,
              color: C.t2, fontSize: FONT.label, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "border-color .15s, color .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.t1; e.currentTarget.style.color = C.t0; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.bd0; e.currentTarget.style.color = C.t2; }}>
            + Mới
          </button>
        </div>

        {/* Lịch sử phiên — inline, không floating */}
        <div style={{ padding: "0 10px 10px" }}>
          <SurveyHistory onLoadList={onLoadList} onSelect={onLoadOne} surveyId={surveyId} refreshTrigger={sessionRefreshKey} />
        </div>
      </div>

      {/* ══ 3. CÁC BƯỚC KHẢO SÁT ══════════════════════════════ */}
      <div style={{ borderTop: `1px solid ${C.bd0}`, flex: 1 }}>
        <SectionLabel>Các bước đánh giá</SectionLabel>
        {STEPS.map((s, i) => {
          const done = stepDone(i, survey);
          const active = step === i;
          return (
            <button key={s.id} onClick={() => setStep(i)}
              style={{
                width: "100%",
                background: active ? `${C.blue}1a` : "transparent",
                border: "none",
                borderLeft: active ? `3px solid ${C.blue}` : "3px solid transparent",
                padding: "9px 14px 9px 11px",
                display: "flex", alignItems: "center", gap: 8,
                cursor: "pointer", transition: "background .13s",
                textAlign: "left",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${C.bg3}`; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
              <span style={{
                fontSize: FONT.label, color: active ? C.blueL : C.t1,
                fontWeight: active ? 700 : 400, flex: 1, lineHeight: 1.35,
              }}>{s.label}</span>
              {done && (
                <span style={{ fontSize: 11, color: C.tealL, fontWeight: 700,
                  background: `${C.tealL}18`, borderRadius: 4, padding: "1px 5px" }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ 4. TÓM TẮT NHANH ══════════════════════════════════ */}
      <div style={{ borderTop: `1px solid ${C.bd0}` }}>
        <QuickStats survey={survey}/>
      </div>
    </div>
  );
}

// ── Bottom nav ───────────────────────────────────────────────────
function BottomNav({ step, setStep, total }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 24,
      paddingTop: 16,
      borderTop: `1px solid ${C.bd1}`,
    }}>
      <Btn v="ghost" sz="md" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
        ← Trước
      </Btn>
      <div style={{ display: "flex", gap: 6 }}>
        {STEPS.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              transition: "all .2s",
              background: i === step ? C.blue : i < step ? C.tealL + "99" : C.bg4,
            }}/>
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
  const [survey,  setSurvey ] = useState(INIT_SURVEY);
  const [surveyId, setSurveyId] = useState(null);
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast,   setToast  ] = useState(null);
  const [apiUrl,  setApiUrl ] = useState(initApi);
  const [apiInfo, setApiInfo] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState("surveys");
  const autoSaveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);

  // Auto-save đồng bộ DB — retry tối đa 3 lần khi 503 (MongoDB đang connecting)
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

    async function doAutoSave(attempt = 1) {
      const url = surveyId ? `${b}/api/surveys/${surveyId}` : `${b}/api/surveys`;
      const method = surveyId ? "PUT" : "POST";
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(survey),
        });
        if (res.status === 503 && attempt < 4) {
          // MongoDB đang connecting — thử lại sau 3 giây
          autoSaveTimerRef.current = window.setTimeout(() => doAutoSave(attempt + 1), 3000);
          return;
        }
        if (res.status === 409) {
          // ref_no đã tồn tại — lấy id cũ và dùng PUT
          const e = await res.json().catch(() => ({}));
          if (e.id && !surveyId) {
            setSurveyId(e.id);
            lastSavedRef.current = Date.now();
          }
          return;
        }
        if (!res.ok) return; // Các lỗi khác — im lặng trong auto-save
        const e = await res.json().catch(() => ({}));
        if (e && e._id) {
          if (!surveyId) {
            setSurveyId(e._id);
            setSessionRefreshKey(k => k + 1);
            setToast({ type: "success", msg: "✓ Đã tạo phiên và lưu vào DB." });
          }
          lastSavedRef.current = Date.now();
        }
      } catch (_) {
        // Network error — thử lại 1 lần sau 5s
        if (attempt === 1) {
          autoSaveTimerRef.current = window.setTimeout(() => doAutoSave(2), 5000);
        }
      }
    }

    autoSaveTimerRef.current = window.setTimeout(() => doAutoSave(1), 1800);
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

  const handleSave = useCallback(async (attempt = 1) => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    if (!survey.meta?.ref_no?.trim()) {
      setToast({ type: "error", msg: "Nhập Mã khảo sát (meta.ref_no) trước khi lưu." });
      return;
    }
    if (!survey.client?.name?.trim()) {
      setToast({ type: "error", msg: "Vui lòng nhập Tên tổ chức / Công ty (bắt buộc để lưu DB)." });
      return;
    }
    if (attempt === 1) { setSaving(true); setToast(null); }
    try {
      const url = surveyId ? `${b}/api/surveys/${surveyId}` : `${b}/api/surveys`;
      const method = surveyId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(survey),
      });
      const e = await res.json().catch(() => ({}));
      if (res.status === 503) {
        if (attempt < 4) {
          setToast({ type: "info", msg: `MongoDB đang khởi động, thử lại (${attempt}/3)...` });
          await new Promise(r => setTimeout(r, 2500));
          return handleSave(attempt + 1);
        }
        setToast({ type: "error", msg: "MongoDB chưa sẵn sàng sau nhiều lần thử. Kiểm tra backend." });
        return;
      }
      if (res.status === 409 && e.id) {
        // ref_no đã tồn tại — nối lại phiên cũ rồi PUT
        setSurveyId(e.id);
        setToast({ type: "info", msg: "Mã khảo sát đã tồn tại — cập nhật phiên có sẵn..." });
        await new Promise(r => setTimeout(r, 300));
        return handleSave(1); // retry với surveyId mới set
      }
      if (!res.ok) {
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      if (e._id) setSurveyId(e._id);
      lastSavedRef.current = Date.now();
      setSessionRefreshKey(k => k + 1);
      setToast({ type: "success", msg: "✓ Đã lưu phiên khảo sát vào DB." });
    } catch (err) {
      const msg = err.message || "";
      if ((msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED")) && attempt < 3) {
        await new Promise(r => setTimeout(r, 3000));
        return handleSave(attempt + 1);
      }
      setToast({ type: "error", msg: `Lỗi lưu: ${msg}` });
    } finally {
      if (attempt === 1 || !saving) setSaving(false);
    }
  }, [survey, surveyId, apiUrl, saving]);

  const handleLoadList = useCallback(async (attempt = 1) => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    try {
      const res = await fetch(`${b}/api/surveys?limit=200`);
      if (res.status === 503) {
        if (attempt < 3) {
          // MongoDB đang connecting — chờ 2s rồi thử lại
          await new Promise(r => setTimeout(r, 2000));
          return handleLoadList(attempt + 1);
        }
        setToast({ type: "error", msg: "MongoDB chưa kết nối. Vui lòng thử lại sau vài giây." });
        return [];
      }
      if (!res.ok) return [];
      return res.json();
    } catch (_) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 3000));
        return handleLoadList(attempt + 1);
      }
      setToast({ type: "error", msg: "Không kết nối được backend. Kiểm tra server." });
      return [];
    }
  }, [apiUrl]);

  const handleLoadOne = useCallback(async (id, attempt = 1) => {
    const explicit = base(apiUrl);
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "")
        : "";
    const b = explicit || fallback;
    let res;
    try {
      res = await fetch(`${b}/api/surveys/${id}`);
    } catch (_) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 2000));
        return handleLoadOne(id, attempt + 1);
      }
      throw new Error("Không kết nối được backend.");
    }
    if (res.status === 503) {
      if (attempt < 3) {
        setToast({ type: "info", msg: `MongoDB đang khởi động, thử lại lần ${attempt + 1}...` });
        await new Promise(r => setTimeout(r, 2000));
        return handleLoadOne(id, attempt + 1);
      }
      setToast({ type: "error", msg: "MongoDB chưa kết nối. Vui lòng thử lại sau vài giây." });
      throw new Error("MongoDB chưa kết nối");
    }
    if (!res.ok) throw new Error("Không tải được phiên.");
    const data = await res.json();
    // Chuẩn hóa để form/modals hiển thị đúng khi xem lại
    const clientData = data.client || {};
    const metaData = data.meta || {};
    const execSummaryItems = Array.isArray(metaData.exec_summary_items) && metaData.exec_summary_items.length > 0
      ? metaData.exec_summary_items
      : (metaData.exec_summary && typeof metaData.exec_summary === "string")
        ? metaData.exec_summary.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
        : [];
    const normalized = {
      ...data,
      meta: { ...metaData, exec_summary_items: execSummaryItems },
      client: {
        ...clientData,
        contact_persons: Array.isArray(clientData.contact_persons) ? clientData.contact_persons : [],
      },
      verifier: data.verifier || {},
      audit_plan: (() => {
        const ap = data.audit_plan || {};
        return { ...ap, auditors: Array.isArray(ap.auditors) ? ap.auditors : [] };
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
      // Nếu trường chưa tồn tại trong DB (null/undefined) → dùng defaults từ INIT_SURVEY
      // Nếu là [] (người dùng đã xóa hết) → giữ nguyên []
      legal_registry: Array.isArray(data.legal_registry) ? data.legal_registry : INIT_SURVEY.legal_registry,
      iso_standards_registry: Array.isArray(data.iso_standards_registry) ? data.iso_standards_registry : INIT_SURVEY.iso_standards_registry,
      certification_roadmap: Array.isArray(data.certification_roadmap) ? data.certification_roadmap : INIT_SURVEY.certification_roadmap,
      logistics_trips: Array.isArray(data.logistics_trips) ? data.logistics_trips : [],
      custom_clauses: Array.isArray(data.custom_clauses) ? data.custom_clauses : [],
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
    setSurvey(INIT_SURVEY);
    setSurveyId(null);
    setStep(0);
    setToast({ type: "success", msg: "Phiên mới đã sẵn sàng." });
  }, []);

  const cur = STEPS[step];

  if (adminMode) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ minHeight: "100vh", background: C.bg0 }}>
          <TopBar
            step={0}
            total={1}
            survey={survey}
            setSurvey={setSurvey}
            adminMode={true}
            onToggleAdmin={() => setAdminMode(false)}
          />
          <div style={{ padding: "24px 40px 32px" }}>
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
          onToggleAdmin={() => {
            setAdminInitialTab("surveys");
            setAdminMode((m) => !m);
          }}
        />
        <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", width: "100%" }}>
          <Sidebar
            step={step}
            setStep={setStep}
            survey={survey}
            onSave={handleSave}
            saveLoading={saving}
            onLoadList={handleLoadList}
            onLoadOne={handleLoadOne}
            onNewSurvey={handleNewSurvey}
            apiUrl={apiUrl}
            surveyId={surveyId}
            apiInfo={apiInfo}
            sessionRefreshKey={sessionRefreshKey}
            onOpenAdminTab={(tabId) => {
              setAdminInitialTab(tabId);
              setAdminMode(true);
            }}
          />
          <div style={{
            flex: 1,
            minWidth: 0,
            padding: "24px 40px 32px",
            overflowY: "auto",
            width: "100%",
            maxWidth: "none",
          }}>
            <SectionHeader icon={cur.icon} title={cur.label} badge="ISO 50001:2018"/>
            <Toast toast={toast} onClose={()=>setToast(null)}/>

            <div className="fade-in">
              <Suspense fallback={<div style={{ color: C.t2, fontSize: 15 }}>Đang tải bước khảo sát…</div>}>
                {step === 0 && <StepOrg     survey={survey} setSurvey={setSurvey}/>}
                {step === 1 && <StepClauses survey={survey} setSurvey={setSurvey} surveyId={surveyId} apiUrl={apiUrl} setToast={setToast} ensureSurveyId={ensureSurveyId}/>}
                {step === 2 && <StepRisk    survey={survey} setSurvey={setSurvey}/>}
                {step === 3 && <StepProcess survey={survey} setSurvey={setSurvey}/>}
                {step === 4 && <StepSite    survey={survey} setSurvey={setSurvey}/>}
                {step === 5 && <StepActions survey={survey} setSurvey={setSurvey}/>}
                {step === 6 && <StepEvidence survey={survey} surveyId={surveyId} apiUrl={apiUrl} setToast={setToast} ensureSurveyId={ensureSurveyId}/>}
                {step === 7 && (
                  <StepExport
                    survey={survey}
                    onExport={handleExport}
                    loading={loading}
                    toast={toast}
                    apiUrl={apiUrl}
                    setApiUrl={setApiUrl}
                  />
                )}
              </Suspense>
            </div>

            <BottomNav step={step} setStep={setStep} total={STEPS.length}/>
          </div>
        </div>
      </div>
    </>
  );
}
