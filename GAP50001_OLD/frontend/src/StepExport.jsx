/**
 * ISO50001Gap — frontend/StepExport.jsx
 * Step 7: Summary dashboard + Export GAP report DOCX
 */
import { useMemo } from "react";
import { C, GAP_CHECKLIST, RISK_CATEGORIES, SCORE_CFG, ACTION_PHASES } from "./gap.ui.constants.js";
import { Btn, Tag, KPIBar } from "./gap.atoms.jsx";

const scoreColor = s => SCORE_CFG[s]?.col || C.grey2;
const scoreBg    = s => SCORE_CFG[s]?.bg  || "transparent";
const scoreLabel = s => SCORE_CFG[s]?.label || "—";

const CLAUSES = [
  { num:"§4",col:C.blue  },{ num:"§5",col:C.violet },{ num:"§6",col:C.teal },
  { num:"§7",col:C.greenL},{ num:"§8",col:C.orange  },{ num:"§9",col:C.red  },
  { num:"§10",col:C.navy },
];
const CLAUSE_NAMES = { "§4":"Bối cảnh","§5":"Lãnh đạo","§6":"Hoạch định",
  "§7":"Hỗ trợ","§8":"Vận hành","§9":"Đánh giá","§10":"Cải tiến" };

function clauseAvg(num, resp) {
  const items = GAP_CHECKLIST.filter(i=>i.clause.startsWith(num.replace("§","")));
  const s = items.map(i=>resp[i.id]?.score||0).filter(v=>v>0);
  return s.length ? s.reduce((a,b)=>a+b,0)/s.length : 0;
}

export default function StepExport({ survey, onExport, loading, toast, apiUrl, setApiUrl }) {
  const resp = survey.responses || {};
  const riskData = survey.risk_assessments || {};

  const stats = useMemo(() => {
    const all = GAP_CHECKLIST;
    const scored = all.filter(i=>(resp[i.id]?.score||0)>0);
    const n = scored.length;
    const crit = scored.filter(i=>resp[i.id].score<=1).length;
    const maj  = scored.filter(i=>resp[i.id].score===2).length;
    const min  = scored.filter(i=>resp[i.id].score===3).length;
    const good = scored.filter(i=>resp[i.id].score>=4).length;
    const sumScores = scored.reduce((a,i)=>a+(resp[i.id].score||0),0);
    const avg = n > 0 ? sumScores / n : 0;
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
    return { total:all.length, scored:n, crit, maj, min, good, avg, needImproveCount, needImprovePct, highRisks };
  }, [resp, riskData, survey.risk_items]);

  const clauseScores = CLAUSES.map(cl => ({
    ...cl, score: clauseAvg(cl.num, resp),
  }));

  const canExport = !!survey.meta?.ref_no && !!survey.client?.name;
  const actions = survey.action_plan || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary KPIs */}
      <KPIBar items={[
        { label:"Điểm TB tổng",    value:stats.avg.toFixed(1)+"/5", col:stats.avg>=4?C.teal:stats.avg>=3?C.green:stats.avg>=2?C.orange:C.red, icon:"📊" },
        { label:"Nghiêm trọng",    value:stats.crit,   col:C.red,    icon:"⛔" },
        { label:"Khoảng cách lớn", value:stats.maj,    col:C.orange, icon:"⚠️" },
        { label:"Cần cải thiện",   value:stats.scored ? `${stats.needImproveCount} (${stats.needImprovePct}%)` : "0 (0%)", col:C.amber,  icon:"🔶" },
        { label:"Phù hợp",         value:stats.good,   col:C.teal,   icon:"✅" },
        { label:"Rủi ro cao",      value:stats.highRisks, col:C.red, icon:"🎯" },
        { label:"Action Plans",    value:actions.length,  col:C.blue, icon:"🚀" },
      ]}/>

      {/* Clause scores visual */}
      <div style={{ background: C.bg2, borderRadius: 12, padding: 18, border: `1px solid ${C.bd0}` }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.t0, marginBottom: 14 }}>📊 Điểm GAP theo điều khoản</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {clauseScores.map(cl => {
            const sc = cl.score;
            const scInt = Math.round(sc);
            const cfg = SCORE_CFG[scInt] || SCORE_CFG[0];
            return (
              <div key={cl.num} style={{ background: cfg.bg, border: `1px solid ${cfg.col}40`,
                borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, color: cfg.col }}>{sc > 0 ? sc.toFixed(1) : "—"}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: cl.col }}>{cl.num}</div>
                <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>{CLAUSE_NAMES[cl.num]}</div>
                {sc > 0 && (
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: cfg.col, lineHeight: 1.3 }}>{scoreLabel(scInt)}</div>
                )}
              </div>
            );
          })}
        </div>
        {/* Score bars */}
        <div style={{ marginTop: 16 }}>
          {clauseScores.filter(cl => cl.score > 0).map(cl => (
            <div key={cl.num} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: cl.col, width: 36 }}>{cl.num}</span>
              <div style={{ flex: 1, height: 10, background: C.bg3, borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(cl.score / 5) * 100}%`,
                  background: scoreColor(Math.round(cl.score)), borderRadius: 5, transition: "width .5s" }}/>
              </div>
              <span style={{ fontSize: 14, color: scoreColor(Math.round(cl.score)), fontWeight: 700, width: 36 }}>{cl.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action plan summary */}
      {actions.length > 0 && (
        <div style={{ background: C.bg2, borderRadius: 12, padding: 16, border: `1px solid ${C.bd0}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.t0, marginBottom: 10 }}>🚀 Action Plan Summary</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACTION_PHASES.map(ph => {
              const cnt = actions.filter(a => a.phase === ph.id).length;
              return cnt > 0 ? (
                <div key={ph.id} style={{ background: `${ph.col}15`, border: `1px solid ${ph.col}35`,
                  borderRadius: 8, padding: "8px 14px", fontSize: 15 }}>
                  <span style={{ fontWeight: 700, color: ph.col }}>{cnt}</span>
                  <span style={{ color: C.t1, marginLeft: 6, fontSize: 14 }}>{ph.label.split("—")[1]}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Validation checklist */}
      <div style={{ background: C.bg2, borderRadius: 12, padding: 16, border: `1px solid ${C.bd0}` }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.t0, marginBottom: 10 }}>✅ Kiểm tra trước khi xuất</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { ok: !!survey.meta?.ref_no, label: "Mã khảo sát" },
            { ok: !!survey.client?.name, label: "Tên tổ chức" },
            { ok: !!survey.verifier?.org, label: "Đơn vị tư vấn" },
            { ok: !!survey.verifier?.lead, label: "Trưởng đoàn" },
            { ok: stats.scored > 10, label: `≥10 yêu cầu đánh giá (${stats.scored})` },
            { ok: Object.keys(riskData).length > 3, label: `Đánh giá rủi ro (${Object.keys(riskData).length})` },
            { ok: actions.length > 0, label: `Action Plan (${actions.length})` },
            { ok: (survey.site_assessments || []).length > 0, label: "Có dữ liệu hiện trường" },
          ].map(x => (
            <span key={x.label} style={{
              background: x.ok ? `${C.teal}18` : `${C.red}12`,
              color: x.ok ? C.tealL : C.redL,
              border: `1px solid ${x.ok ? C.teal : C.red}35`,
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 14,
              fontWeight: 600,
            }}>
              {x.ok ? "✓" : "○"} {x.label}
            </span>
          ))}
        </div>
      </div>

      {/* API URL + Export box */}
      <div style={{
        background: `linear-gradient(135deg,${C.bg3},${C.bg4})`,
        borderRadius: 14,
        border: `1px solid ${C.blue}50`,
        padding: 28,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 38, marginBottom: 8 }}>📄</div>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, color: C.blueL, marginBottom: 8 }}>
          Xuất Báo cáo Khảo sát GAP ISO 50001:2018 — DOCX
        </div>
        <div style={{ fontSize: 16, color: C.t1, marginBottom: 16, lineHeight: 1.7 }}>
          Trang bìa · Tóm tắt điều hành · §4–§10 chi tiết từng yêu cầu · Ma trận rủi ro 5×5<br/>
          Tiếp cận quá trình · Khảo sát nhà xưởng/thiết bị · Master Action Plan · Phụ lục pháp lý VN
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.t2 }}>API Backend:</span>
          <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
            style={{
              background: C.bg2,
              border: `1px solid ${C.bd0}`,
              borderRadius: 8,
              padding: "8px 12px",
              color: C.skyL,
              fontSize: 15,
              fontFamily: "'Fira Code',monospace",
              width: 280,
              maxWidth: "100%",
            }}/>
        </div>
        <Btn v="blue" sz="lg" onClick={onExport} loading={loading} disabled={!canExport}
          sx={{ margin: "0 auto", display: "block" }}>
          {loading ? "⏳ Đang tạo báo cáo..." : "⬇ Tạo và tải về báo cáo GAP DOCX"}
        </Btn>
        {!canExport && (
          <div style={{ fontSize: 14, color: C.red, marginTop: 12 }}>
            ⚠ Cần ít nhất: Mã khảo sát + Tên tổ chức
          </div>
        )}
      </div>
    </div>
  );
}
