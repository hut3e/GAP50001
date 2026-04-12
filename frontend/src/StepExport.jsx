/**
 * ISO50001Gap — frontend/StepExport.jsx
 * Step 9: Premium Export Dashboard — Summary + Export GAP/Lite/Excel/HTML reports
 */
import { useState, useMemo } from "react";
import { C, FONT, GAP_CHECKLIST as DEFAULT_CHECKLIST, RISK_CATEGORIES, SCORE_CFG, ACTION_PHASES } from "./gap.ui.constants.js";
import { Btn, Tag, Modal } from "./gap.atoms.jsx";

const CLAUSES = [
  { num:"§4", col:C.blue  }, { num:"§5", col:C.violet }, { num:"§6", col:C.teal },
  { num:"§7", col:C.greenL}, { num:"§8", col:C.orange }, { num:"§9", col:C.red  },
  { num:"§10", col:C.navy },
];
const CLAUSE_NAMES = { "§4":"Bối cảnh","§5":"Lãnh đạo","§6":"Hoạch định",
  "§7":"Hỗ trợ","§8":"Vận hành","§9":"Đánh giá","§10":"Cải tiến" };

export default function StepExport({ survey, surveyId, onExport, onSave, loading, setToast, apiUrl, setApiUrl, checklist: checklistProp }) {
  const [excelLoading, setExcelLoading] = useState(false);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [liteLoading, setLiteLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: "" });
  const GAP_CHECKLIST = checklistProp || DEFAULT_CHECKLIST;

  const resp = survey.responses || {};
  const riskData = survey.risk_assessments || {};

  const clauseAvg = (num, responseData) => {
    const items = GAP_CHECKLIST.filter(i => i.clause.startsWith(num.replace("§", "")));
    const s = items.filter(i => (responseData[i.id]?.score || 0) > 0);
    if (!s.length) return 0;
    const wSum = s.reduce((a, i) => a + ((responseData[i.id].score || 0) * (i.weight || 1)), 0);
    const wTot = s.reduce((a, i) => a + (i.weight || 1), 0);
    return wSum / wTot;
  };

  const stats = useMemo(() => {
    const all = GAP_CHECKLIST;
    const scored = all.filter(i => (resp[i.id]?.score || 0) > 0);
    const n = scored.length;
    const crit = scored.filter(i => resp[i.id].score <= 1).length;
    const maj  = scored.filter(i => resp[i.id].score === 2).length;
    const min  = scored.filter(i => resp[i.id].score === 3).length;
    const good = scored.filter(i => resp[i.id].score >= 4).length;
    const sumScores = scored.reduce((a, i) => a + ((resp[i.id].score || 0) * (i.weight || 1)), 0);
    const totalW = scored.reduce((a, i) => a + (i.weight || 1), 0);
    const avg = totalW > 0 ? sumScores / totalW : 0;
    const needImproveCount = crit + maj + min;
    const needImprovePct = n > 0 ? Math.round((needImproveCount / n) * 1000) / 10 : 0;
    
    const riskItems = survey.risk_items || {};
    const allRisks = RISK_CATEGORIES.flatMap(cat => {
      const custom = riskItems[cat.id];
      if (custom && custom.length > 0) return custom;
      return (cat.items || []).map(i => ({
        ...i,
        likelihood: riskData[i.id]?.likelihood ?? 0,
        impact: riskData[i.id]?.impact ?? 0,
      }));
    });
    const highRisks = allRisks.filter(r => (r.likelihood || 0) * (r.impact || 0) >= 9).length;
    
    return { total: all.length, scored: n, crit, maj, min, good, avg, needImproveCount, needImprovePct, highRisks };
  }, [resp, riskData, survey.risk_items, GAP_CHECKLIST]);

  const clauseScores = CLAUSES.map(cl => ({
    ...cl, score: clauseAvg(cl.num, resp),
  }));

  const canExport = !!survey.meta?.ref_no && !!survey.client?.name;
  const actions = survey.action_plan || [];

  const doExport = async (type) => {
    let activeId = survey._id || surveyId;
    if (!activeId && onSave) {
      activeId = await onSave();
    }
    if (!activeId) {
      setToast?.({ type: "error", msg: `Phiên khảo sát cần "Lưu phiên" trước khi Export.` });
      return;
    }
    const setLoadState = type === "excel" ? setExcelLoading : type === "html" ? setHtmlLoading : setLiteLoading;
    setLoadState(true);
    setConfirmModal({ open: false, type: "" });
    try {
      const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
      const paths = {
        "docx": `/api/surveys/${activeId}/export-docx`,
        "excel": `/api/surveys/${activeId}/export-excel`,
        "html": `/api/surveys/${activeId}/export-html`,
        "lite_docx": `/api/surveys/${activeId}/export-lite-docx`,
        "lite_html": `/api/surveys/${activeId}/export-lite-html`,
      };
      const res = await fetch(`${base}${paths[type] || paths["docx"]}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(()=>"")}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = type.includes("html") ? "html" : type.includes("excel") ? "xlsx" : "docx";
      a.download = `GAP_${survey.meta?.ref_no || "Report"}_${type}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      setToast?.({ type: "success", msg: `✅ Đã xuất ${type.toUpperCase()} thành công!` });
    } catch (err) {
      setToast?.({ type: "error", msg: `Lỗi xuất ${type}: ${err.message}` });
    } finally { setLoadState(false); }
  };

  const validationItems = [
    { ok: !!survey.meta?.ref_no, label: "Mã khảo sát" },
    { ok: !!survey.client?.name, label: "Tên tổ chức" },
    { ok: !!survey.verifier?.org, label: "Đơn vị tư vấn" },
    { ok: !!survey.verifier?.lead, label: "Trưởng đoàn" },
    { ok: stats.scored > 10, label: `Tiến độ đánh giá (${stats.scored}/${stats.total})` },
    { ok: Object.keys(riskData).length > 3, label: `Nhận diện rủi ro (${Object.keys(riskData).length})` },
    { ok: actions.length > 0, label: `Kế hoạch hành động (${actions.length})` },
    { ok: (survey.site_assessments || []).length > 0, label: "Đánh giá hiện trường" },
  ];
  const validCount = validationItems.filter(x => x.ok).length;
  const validPct = Math.round((validCount / validationItems.length) * 100);

  // Styling Variables
  const heroColor = stats.avg >= 4 ? C.teal : stats.avg >= 3 ? C.green : stats.avg >= 2 ? C.orange : C.red;
  const heroGradient = `linear-gradient(135deg, ${C.bg2} 0%, ${C.bg1} 100%)`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 40 }}>
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* HERO SECTION - DASHBOARD SUMMARY                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: heroGradient,
        borderRadius: 24, border: `1px solid ${C.bd0}`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
        padding: 40,
        position: "relative", overflow: "hidden",
        display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center"
      }}>
        {/* Hero Background Glow */}
        <div style={{
          position: "absolute", top: -100, right: -100, width: 400, height: 400,
          background: `radial-gradient(circle, ${heroColor}20 0%, transparent 70%)`,
          borderRadius: "50%", pointerEvents: "none"
        }} />

        {/* Global Score Circular Identity */}
        <div style={{
          width: 180, height: 180, borderRadius: "50%",
          background: `conic-gradient(${heroColor} ${stats.avg * 20}%, ${C.bg4} 0)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
          boxShadow: `0 0 40px ${heroColor}30`,
          flexShrink: 0
        }}>
          <div style={{
            width: 156, height: 156, borderRadius: "50%",
            background: C.bg1, border: `1px solid ${C.bd1}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ fontSize: 13, color: C.t2, textTransform: "uppercase", letterSpacing: 1 }}>Điểm GAP</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: heroColor, lineHeight: 1.1, fontFamily: "'Rajdhani',sans-serif" }}>
              {stats.avg.toFixed(1)}
            </div>
            <div style={{ fontSize: 14, color: C.t2 }}>/ 5.0</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.t0, marginBottom: 8, letterSpacing: "-0.02em" }}>
            Tổng quan Đánh giá ISO 50001
          </div>
          <div style={{ fontSize: 15, color: C.t2, marginBottom: 28, lineHeight: 1.5 }}>
            {survey.client?.name || "Chưa có thông tin công ty"}. 
            Hoàn thành <strong style={{ color: C.t0 }}>{stats.scored}/{stats.total}</strong> tiêu chí. 
            Phát hiện <strong style={{ color: C.red }}>{stats.highRisks}</strong> rủi ro cao.
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16 }}>
            <MetricCard label="Nghiêm trọng" count={stats.crit} col={C.red} icon="⛔" />
            <MetricCard label="Khoảng cách lớn" count={stats.maj} col={C.orange} icon="⚠️" />
            <MetricCard label="Cần cải thiện" count={stats.min} col={C.amber} icon="⚙️" />
            <MetricCard label="Phù hợp" count={stats.good} col={C.teal} icon="✅" />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CLAUSE SCORES & PROGRESS                                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 32 }}>
        
        {/* Clause Scores Radar/Bars */}
        <div style={{ background: C.bg2, borderRadius: 20, padding: 32, border: `1px solid ${C.bd0}`, boxShadow: `0 10px 30px rgba(0,0,0,0.1)` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.t0, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 24, background: C.blue, borderRadius: 4 }}/> Phân tích Mức độ đáp ứng
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {clauseScores.map(cl => {
              const sc = cl.score;
              const cfg = SCORE_CFG[Math.round(sc)] || SCORE_CFG[0];
              return (
                <div key={cl.num} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, fontSize: 15, fontWeight: 700, color: cl.col }}>{cl.num}</div>
                  <div style={{ flex: 1, height: 16, background: C.bg4, borderRadius: 8, overflow: "hidden", position: "relative" }}>
                    <div style={{ 
                      height: "100%", width: `${(sc / 5) * 100}%`, 
                      background: `linear-gradient(90deg, ${cfg.bg}, ${cfg.col})`, 
                      borderRadius: 8, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" 
                    }}/>
                  </div>
                  <div style={{ width: 36, textAlign: "right", fontSize: 15, fontWeight: 700, color: cfg.col, fontFamily: "'Fira Code',monospace" }}>
                    {sc > 0 ? sc.toFixed(1) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Readiness Checklist */}
        <div style={{ background: C.bg2, borderRadius: 20, padding: 32, border: `1px solid ${C.bd0}`, boxShadow: `0 10px 30px rgba(0,0,0,0.1)`, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.t0, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 24, background: validPct === 100 ? C.teal : C.amber, borderRadius: 4 }}/> Điều kiện Xuất báo cáo
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: validPct === 100 ? C.teal : C.amber, fontFamily: "'Rajdhani',sans-serif" }}>
              {validPct}%
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", paddingRight: 4 }}>
            {validationItems.map(x => (
              <div key={x.label} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                background: x.ok ? `${C.teal}10` : `${C.bg3}`,
                border: `1px solid ${x.ok ? C.teal + "30" : C.bd0}`,
                borderRadius: 12, transition: "all 0.2s"
              }}>
                <div style={{ 
                  width: 24, height: 24, borderRadius: "50%", 
                  background: x.ok ? C.teal : C.bg4, color: x.ok ? "#000" : C.t2,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 
                }}>
                  {x.ok ? "✓" : "!"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: x.ok ? C.tealL : C.t1 }}>{x.label}</div>
              </div>
            ))}
          </div>

          {!canExport && (
             <div style={{ marginTop: 20, padding: 14, background: `${C.red}15`, borderRadius: 12, border: `1px solid ${C.red}30`, color: C.redL, fontSize: 13, fontWeight: 600, textAlign: "center" }}>
               ⚠ Vui lòng hoàn thành Thông tin chung trước khi xuất.
             </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* EXPORT OPTIONS GRID - SaaS Style Cards                       */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.t0, marginBottom: 24, textAlign: "center", letterSpacing: "-0.01em" }}>
          Tùy chọn Xuất Báo cáo
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          
          <ExportPlatformCard
            icon="📄" title="Full Report" subtitle="DOCX" 
            desc="Báo cáo đầy đủ, chuyên nghiệp dùng cho in ấn và trình duyệt lãnh đạo."
            color={C.blue} glow={C.blue}
            features={["Toàn bộ điều khoản §4–§10", "Biểu đồ & Ma trận rủi ro", "Action Plan chi tiết"]}
            btnLabel="Xuất bản DOCX" onClick={() => onExport()} loading={loading} disabled={!canExport}
          />

          <ExportPlatformCard
            icon="⚡" title="Lite Audit" subtitle="DOCX"
            desc="Tóm tắt kết quả đánh giá nhanh hiện trường, tối ưu để đọc lướt."
            color={C.orange} glow={C.orange}
            features={["Chỉ số & Kết quả GAP", "Rủi ro khu vực (kèm ảnh)", "Cơ hội cải tiến"]}
            btnLabel="Xuất bản Lite" onClick={() => setConfirmModal({ open: true, type: "lite_docx" })} loading={liteLoading} disabled={!canExport}
          />

          <ExportPlatformCard
            icon="🌐" title="Interactive Web" subtitle="HTML"
            desc="Báo cáo web động dạng Single-Page, hiện đại, xem mượt trên Mọi thiết bị."
            color={C.violet} glow={C.violet}
            features={["Giao diện Responsive", "Lọc & Tìm kiếm gap", "Trình chiếu cuộc họp"]}
            btnLabel="Mở báo cáo Web" onClick={() => setConfirmModal({ open: true, type: "html" })} loading={htmlLoading} disabled={!canExport}
          />

          <ExportPlatformCard
            icon="📊" title="Raw Data Matrix" subtitle="XLSX"
            desc="Dữ liệu thô dùng cho phân tích số liệu, tích hợp hệ thống khác."
            color={C.green} glow={C.green}
            features={["Bảng điểm chi tiết", "Phân loại Rủi ro", "Export ảnh hiện trường"]}
            btnLabel="Tải dữ liệu Excel" onClick={() => setConfirmModal({ open: true, type: "excel" })} loading={excelLoading} disabled={!canExport}
          />

        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* API URL CONFIG                                               */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <details style={{ background: `${C.bg2}80`, borderRadius: 12, padding: "12px 20px", border: `1px solid ${C.bd0}`, backdropFilter: "blur(4px)" }}>
          <summary style={{ cursor: "pointer", fontSize: 13, color: C.t2, fontWeight: 600, outline: "none" }}>⚙️ Cấu hình máy chủ API</summary>
          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
              spellCheck="false"
              style={{
                width: 250, background: C.bg0, border: `1px solid ${C.bd1}`, borderRadius: 8,
                padding: "8px 12px", color: C.tealL, fontSize: 13, fontFamily: "'Fira Code',monospace",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
              }}/>
          </div>
        </details>
      </div>

      {/* CONFIRM MODAL */}
      <Modal open={confirmModal.open} onClose={() => setConfirmModal({ open: false, type: "" })} title="Xác nhận Kết xuất" width={440}>
        <div style={{ padding: "8px 16px 24px" }}>
          <div style={{ fontSize: 15, color: C.t1, lineHeight: 1.6, marginBottom: 24, textAlign: "center" }}>
            Hệ thống sẽ tổng hợp dữ liệu bản trình bày <strong style={{ color: C.t0, fontSize: 16 }}>{confirmModal.type?.replace("lite_","Lite ").toUpperCase()}</strong>.<br/>Quá trình này mất khoảng vài giây.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <Btn v="ghost" sz="md" onClick={() => setConfirmModal({ open: false, type: "" })}>Hủy</Btn>
            <Btn v="blue" sz="md" onClick={() => doExport(confirmModal.type)}>🚀 Tạo Báo Cáo</Btn>
          </div>
        </div>
      </Modal>

    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────

function MetricCard({ label, count, col, icon }) {
  return (
    <div style={{
      background: `${col}10`, border: `1px solid ${col}25`, borderRadius: 16, padding: "16px",
      display: "flex", flexDirection: "column", gap: 8, position: "relative", overflow: "hidden",
      transition: "transform 0.2s, background 0.2s", cursor: "default"
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.background = `${col}15`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = `${col}10`; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: col, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        <span>{icon}</span> {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: col, fontFamily: "'Rajdhani',sans-serif", lineHeight: 1 }}>
        {count}
      </div>
    </div>
  );
}

function ExportPlatformCard({ icon, title, subtitle, desc, features, color, glow, btnLabel, onClick, loading, disabled }) {
  return (
    <div style={{
      background: C.bg2, borderRadius: 24, border: `1px solid ${C.bd0}`,
      padding: 32, display: "flex", flexDirection: "column", position: "relative",
      boxShadow: `0 10px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.02)`,
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s",
      overflow: "hidden"
    }}
    onMouseEnter={e => {
      if(disabled) return;
      e.currentTarget.style.transform = "translateY(-8px)";
      e.currentTarget.style.boxShadow = `0 20px 40px ${glow}20, inset 0 1px 0 rgba(255,255,255,0.05)`;
      e.currentTarget.style.borderColor = `${glow}50`;
    }}
    onMouseLeave={e => {
      if(disabled) return;
      e.currentTarget.style.transform = "";
      e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.02)`;
      e.currentTarget.style.borderColor = C.bd0;
    }}
    >
      {/* Background ambient glow */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 100, background: `linear-gradient(180deg, ${glow}10, transparent)`, pointerEvents: "none" }} />
      
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, zIndex: 1 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        <div style={{ padding: "4px 10px", borderRadius: 8, background: `${color}15`, color: color, fontSize: 12, fontWeight: 800, letterSpacing: 0.5, border: `1px solid ${color}30` }}>
          {subtitle}
        </div>
      </div>
      
      <div style={{ fontSize: 22, fontWeight: 700, color: C.t0, marginBottom: 8, letterSpacing: "-0.01em", zIndex: 1 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, marginBottom: 24, minHeight: 42, zIndex: 1 }}>{desc}</div>
      
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", flex: 1, display: "flex", flexDirection: "column", gap: 12, zIndex: 1 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: C.t0, fontWeight: 500 }}>
            <span style={{ color: color, fontSize: 16, lineHeight: 1 }}>✦</span> {f}
          </li>
        ))}
      </ul>
      
      <div style={{ zIndex: 1 }}>
        <button onClick={onClick} disabled={disabled || loading} style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: disabled ? C.bg3 : `linear-gradient(135deg, ${color}, ${color}dd)`,
          color: disabled ? C.t3 : "#fff", fontSize: 15, fontWeight: 700,
          border: "none", cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: disabled ? "none" : `0 8px 20px ${color}40`,
          transition: "transform 0.2s, box-shadow 0.2s"
        }}
        onMouseEnter={e => { if(!disabled) { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = `0 12px 25px ${color}50`; } }}
        onMouseLeave={e => { if(!disabled) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 8px 20px ${color}40`; } }}
        >
          {loading ? "⏳ Đang kết xuất..." : btnLabel}
        </button>
      </div>
    </div>
  );
}
