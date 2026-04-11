/**
 * ISO50001Gap — frontend/StepExport.jsx
 * Step 7: Summary dashboard + Export GAP report DOCX
 */
import { useState, useMemo } from "react";
import { C, GAP_CHECKLIST as DEFAULT_CHECKLIST, RISK_CATEGORIES, SCORE_CFG, ACTION_PHASES } from "./gap.ui.constants.js";
import { Btn, Tag, KPIBar, Modal } from "./gap.atoms.jsx";

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

export default function StepExport({ survey, surveyId, onExport, onSave, loading, setToast, apiUrl, setApiUrl, checklist: checklistProp }) {
  const [excelLoading, setExcelLoading] = useState(false);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [liteLoading, setLiteLoading] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [exportType, setExportType] = useState("excel"); // 'excel', 'html', 'lite_docx', 'lite_html'
  const GAP_CHECKLIST = checklistProp || DEFAULT_CHECKLIST;
  const clauseAvg = (num, resp) => {
    const items = GAP_CHECKLIST.filter(i=>i.clause.startsWith(num.replace("§","")));
    const s = items.filter(i=>(resp[i.id]?.score||0)>0);
    if (!s.length) return 0;
    const wSum = s.reduce((a,i)=>a+((resp[i.id].score||0)*(i.weight||1)),0);
    const wTot = s.reduce((a,i)=>a+(i.weight||1),0);
    return wSum / wTot;
  };
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
    const sumScores = scored.reduce((a,i)=>a+((resp[i.id].score||0)*(i.weight||1)),0);
    const totalW = scored.reduce((a,i)=>a+(i.weight||1),0);
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
    return { total:all.length, scored:n, crit, maj, min, good, avg, needImproveCount, needImprovePct, highRisks };
  }, [resp, riskData, survey.risk_items]);

  const clauseScores = CLAUSES.map(cl => ({
    ...cl, score: clauseAvg(cl.num, resp),
  }));

  const canExport = !!survey.meta?.ref_no && !!survey.client?.name;
  const actions = survey.action_plan || [];

  const handleExportExcel = async () => {
    let activeId = survey._id || surveyId;
    if (!activeId) {
      if (onSave) {
        setExcelLoading(true);
        activeId = await onSave();
        setExcelLoading(false);
      }
      if (!activeId) {
        setExcelModalOpen(false);
        if (setToast) {
           setToast({ type: "error", msg: `Phiên khảo sát cần phải "Lưu phiên" trước để Export Excel (Thiếu Tên tổ chức hoặc backend lỗi).` });
        }
        return;
      }
    }
    setExcelLoading(true);
    setExcelModalOpen(false);
    try {
      const apiBase = apiUrl ? apiUrl.replace(/\/$/, "") : "";
      const urlFetch = `${apiBase}/api/surveys/${activeId}/export-excel`;
      
      const res = await fetch(urlFetch);
      if (!res.ok) {
        const errText = await res.text().catch(()=>"");
        throw new Error(`Xuất file Excel thất bại (HTTP ${res.status}): ${errText}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Export_HienTruong_${survey.meta?.ref_no || "GAP"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setToast && setToast({ type: "success", msg: "Đã xuất file Excel hình ảnh/hiện trạng thành công!" });
    } catch (err) {
      setToast && setToast({ type: "error", msg: "Lỗi xuất Excel: " + err.message });
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportHtml = async () => {
    let activeId = survey._id || surveyId;
    if (!activeId) {
      if (onSave) {
        setHtmlLoading(true);
        activeId = await onSave();
        setHtmlLoading(false);
      }
      if (!activeId) {
        setExcelModalOpen(false);
        if (setToast) {
           setToast({ type: "error", msg: `Phiên khảo sát cần phải "Lưu phiên" trước để Export (Thiếu Tên tổ chức hoặc backend lỗi).` });
        }
        return;
      }
    }
    setHtmlLoading(true);
    setExcelModalOpen(false);
    try {
      const apiBase = apiUrl ? apiUrl.replace(/\/$/, "") : "";
      const urlFetch = `${apiBase}/api/surveys/${activeId}/export-html`;
      
      const res = await fetch(urlFetch);
      if (!res.ok) {
        const errText = await res.text().catch(()=>"");
        throw new Error(`Xuất file HTML thất bại (HTTP ${res.status}): ${errText}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Export_HienTruong_${survey.meta?.ref_no || "GAP"}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setToast && setToast({ type: "success", msg: "Đã xuất Báo cáo HTML thành công!" });
    } catch (err) {
      setToast && setToast({ type: "error", msg: "Lỗi xuất HTML: " + err.message });
    } finally {
      setHtmlLoading(false);
    }
  };

  const handleExportLite = async (type) => { // type is 'docx' or 'html'
    let activeId = survey._id || surveyId;
    if (!activeId) {
      if (onSave) {
        setLiteLoading(true);
        activeId = await onSave();
        setLiteLoading(false);
      }
      if (!activeId) {
        setExcelModalOpen(false);
        if (setToast) setToast({ type: "error", msg: `Cần "Lưu phiên" trước để Export Báo cáo Lite.` });
        return;
      }
    }
    setLiteLoading(true);
    setExcelModalOpen(false);
    try {
      const apiBase = apiUrl ? apiUrl.replace(/\/$/, "") : "";
      const urlFetch = `${apiBase}/api/surveys/${activeId}/export-lite-${type}`;
      
      const res = await fetch(urlFetch);
      if (!res.ok) {
        const errText = await res.text().catch(()=>"");
        throw new Error(`Xuất file Báo cáo Nhanh (Lite) ${type.toUpperCase()} thất bại (HTTP ${res.status}): ${errText}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lite_Report_${survey.meta?.ref_no || "GAP"}.${type}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setToast && setToast({ type: "success", msg: `Đã xuất Báo cáo Nhanh (Lite) ${type.toUpperCase()} thành công!` });
    } catch (err) {
      setToast && setToast({ type: "error", msg: `Lỗi xuất Lite ${type.toUpperCase()}: ` + err.message });
    } finally {
      setLiteLoading(false);
    }
  };

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

        <div style={{ margin: "24px auto", width: "80%", height: 1, background: `${C.bd1}80` }} />
        
        <div style={{ fontSize: 24, marginBottom: 8, color: C.orangeL }}>⚡ Báo cáo Nhanh (Lite Report)</div>
        <div style={{ fontSize: 15, color: C.t1, marginBottom: 16 }}>
          Báo cáo Lite chỉ bao gồm các thông tin chính yếu nhất: Thông tin doanh nghiệp, Năng lượng & TOE, Kết quả GAP, SEU, Thiết bị đo lường và Tóm tắt Rủi ro & Cơ hội.
        </div>
        
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 30 }}>
          <Btn v="orange" sz="lg" onClick={() => { setExportType("lite_docx"); setExcelModalOpen(true); }} loading={liteLoading && exportType === 'lite_docx'} disabled={!canExport}>
            {liteLoading && exportType === 'lite_docx' ? "⏳ Đang tạo..." : "📄 Tải Báo cáo Nhanh (Lite DOCX)"}
          </Btn>
          <Btn v="amber" sz="lg" onClick={() => { setExportType("lite_html"); setExcelModalOpen(true); }} loading={liteLoading && exportType === 'lite_html'} disabled={!canExport}>
             {liteLoading && exportType === 'lite_html' ? "⏳ Đang tạo..." : "🌐 Tải Báo cáo Nhanh (Lite HTML)"}
          </Btn>
        </div>

        {/* Separator / Excel Export section */}
        <div style={{ margin: "24px auto", width: "80%", height: 1, background: `${C.bd1}80` }} />
        
        <div style={{ fontSize: 24, marginBottom: 8, color: C.greenL }}>📊 Xuất Báo Cáo Hiện Trạng & Hình Ảnh Rủi Ro (Full)</div>
        <div style={{ fontSize: 15, color: C.t1, marginBottom: 16 }}>
          Cơ hội tiết kiệm năng lượng, rủi ro, hiện trạng và hình ảnh sẽ được tổng hợp đầy đủ theo biểu mẫu bạn chọn.
        </div>
        
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Btn v="green" sz="lg" onClick={() => { setExportType("excel"); setExcelModalOpen(true); }} loading={excelLoading} disabled={!canExport}>
            {excelLoading ? "⏳ Đang tạo..." : "⬇ Tải file Biểu mẫu Excel"}
          </Btn>
          <Btn v="indigo" sz="lg" onClick={() => { setExportType("html"); setExcelModalOpen(true); }} loading={htmlLoading} disabled={!canExport}>
            {htmlLoading ? "⏳ Đang tạo..." : "🌐 Tải file Báo Cáo HTML (Đẹp & Print-ready)"}
          </Btn>
        </div>
      </div>

      <Modal open={excelModalOpen} onClose={() => setExcelModalOpen(false)} title={`Xác nhận xuất báo cáo`} width={500}>
        <div style={{ padding: 16, background: C.bg2, borderRadius: 12 }}>
          <p style={{ fontSize: 16, color: C.t0, lineHeight: 1.6 }}>
            Hệ thống sắp sửa trích xuất:
          </p>
          <ul style={{ color: C.t1, lineHeight: 1.6, fontSize: 15, marginLeft: 20, marginBottom: 20 }}>
            {exportType.startsWith("lite") ? (
              <>
                <li>Tóm tắt thông tin Doanh nghiệp và Đoàn đánh giá</li>
                <li>Hệ số và <b>Quy đổi hiện trạng năng lượng (TOE)</b></li>
                <li>Danh sách <b>SEUs</b> và <b>Đồng hồ đo lường</b></li>
                <li>Bảng tóm tắt kết quả chấm điểm GAP</li>
                <li>Tóm tắt Rủi ro & Cơ hội (Kèm hình ảnh)</li>
              </>
            ) : (
              <>
                <li><b>Khu vực</b> / <b>Khu vực chi tiết</b> đã ghi nhận</li>
                <li><b>Hiện trạng</b> phát hiện rủi ro</li>
                <li><b>Khuyến nghị</b> giải pháp cơ hội tiết kiệm</li>
                <li>Chèn tự động <b>hình ảnh bằng chứng</b> liên quan.</li>
              </>
            )}
          </ul>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn v="ghost" sz="md" onClick={() => setExcelModalOpen(false)}>Hủy</Btn>
            <Btn v={exportType === "excel" ? "green" : exportType.startsWith("lite") ? "orange" : "indigo"} sz="md" onClick={() => {
               if (exportType === "excel") handleExportExcel();
               else if (exportType === "html") handleExportHtml();
               else handleExportLite(exportType.replace("lite_", ""));
            }}>
              Đồng ý, tải báo cáo {exportType.replace("lite_", "").toUpperCase()}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
