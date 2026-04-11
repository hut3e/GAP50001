/**
 * ISO50001Gap — frontend/StepClauses.jsx
 * Step 2: §4–§10 Clause-by-clause gap scoring + Bằng chứng theo từng điều khoản
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { C, GAP_CHECKLIST as DEFAULT_CHECKLIST, SCORE_CFG, CAT_CFG, WEIGHT_CFG, SPACE, RADIUS, FONT, getAuditHints } from "./gap.ui.constants.js";
import { Tag, ScorePicker, KPIBar, Modal, Btn, QuickHints } from "./gap.atoms.jsx";
import EvidenceClauseModal from "./EvidenceClauseModal.jsx";
import DocumentAssessmentModal from "./DocumentAssessmentModal.jsx";


const CLAUSES = [
  { num:"§4", name:"Bối cảnh của tổ chức",          col:C.blue,   icon:"🌐", subs:["4.1","4.2","4.3","4.4"] },
  { num:"§5", name:"Sự lãnh đạo",                   col:C.violet, icon:"👥", subs:["5.1","5.2","5.3"] },
  { num:"§6", name:"Hoạch định",                 col:C.teal,   icon:"📊", subs:["6.1","6.2","6.3","6.4","6.5","6.6"] },
  { num:"§7", name:"Hỗ trợ",                     col:C.greenL, icon:"🛠️", subs:["7.1","7.2","7.3","7.4","7.5"] },
  { num:"§8", name:"Thực hiện",                   col:C.orange, icon:"⚙️", subs:["8.1","8.2","8.3"] },
  { num:"§9", name:"Đánh giá kết quả thực hiện",           col:C.red,    icon:"📈", subs:["9.1","9.2","9.3"] },
  { num:"§10",name:"Cải tiến",                   col:C.navy,   icon:"🚀", subs:["10.1","10.2"] },
];
const SUB_NAMES = {
  "4.1":"Hiểu tổ chức và bối cảnh của tổ chức","4.2":"Hiểu nhu cầu và mong đợi của các bên quan tâm","4.3":"Xác định phạm vi của hệ thống quản lý năng lượng","4.4":"Hệ thống quản lý năng lượng",
  "5.1":"Sự lãnh đạo và cam kết","5.2":"Chính sách năng lượng","5.3":"Vai trò, trách nhiệm và quyền hạn trong tổ chức",
  "6.1":"Hành động giải quyết rủi ro và cơ hội","6.2":"Mục tiêu, chỉ tiêu năng lượng và hoạch định để đạt được mục tiêu và chỉ tiêu","6.3":"Xem xét năng lượng",
  "6.4":"Chỉ số kết quả thực hiện năng lượng","6.5":"Đường cơ sở năng lượng","6.6":"Hoạch định việc thu thập dữ liệu năng lượng",
  "7.1":"Nguồn lực","7.2":"Năng lực","7.3":"Nhận thức","7.4":"Trao đổi thông tin","7.5":"Thông tin dạng văn bản",
  "8.1":"Hoạch định và kiểm soát việc thực hiện","8.2":"Thiết kế","8.3":"Mua sắm",
  "9.1":"Theo dõi, đo lường, phân tích và đánh giá kết quả thực hiện năng lượng và EnMS","9.2":"Đánh giá nội bộ","9.3":"Xem xét của lãnh đạo",
  "10.1":"Sự không phù hợp và hành động khắc phục","10.2":"Cải tiến liên tục",
};

function avgScore(items, resp) {
  const validItems = items.filter(i => (resp[i.id]?.score || 0) > 0);
  if (!validItems.length) return null;
  const totalWeight = validItems.reduce((acc, i) => acc + (i.weight || 1), 0);
  const weightedSum = validItems.reduce((acc, i) => acc + (resp[i.id].score * (i.weight || 1)), 0);
  return (weightedSum / totalWeight).toFixed(1);
}

/** Tags mặc định từ checklist (cat, weight, legal) */
function defaultTags(item) {
  const catCfg = CAT_CFG[item.cat];
  const weightCfg = WEIGHT_CFG[item.weight];
  const out = [
    { type: "cat", label: catCfg?.label ?? "—" },
    { type: "weight", label: weightCfg?.label ?? "—" },
  ];
  if (item.legal && String(item.legal).trim()) out.push({ type: "legal", label: String(item.legal).trim() });
  return out;
}

/** Màu tag theo type */
function tagColor(t) {
  if (t.type === "cat") return C.blue;
  if (t.type === "weight") return C.amberL ?? C.orange;
  if (t.type === "legal") return C.red;
  return C.sky ?? C.grey2;
}

const EMPTY_STATIC = { name: "", description: "" };
const EMPTY_RELATED = { name: "", seu_ref: "", description: "" };

const base = (url) => (url ? url.replace(/\/$/, "") : "");

export default function StepClauses({ survey, setSurvey, surveyId, apiUrl, setToast, ensureSurveyId, checklist: checklistProp }) {
  const GAP_CHECKLIST = checklistProp || DEFAULT_CHECKLIST;
  const [open, setOpen] = useState({ "§4": true });
  const [evidenceModal, setEvidenceModal] = useState(null);
  const [staticVarModalOpen, setStaticVarModalOpen] = useState(false);
  const [relatedVarModalOpen, setRelatedVarModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [allEvidence, setAllEvidence] = useState([]);
  const [editTagsItem, setEditTagsItem] = useState(null);
  const [editTagsDraft, setEditTagsDraft] = useState([]);
  const [newTagType, setNewTagType] = useState("custom");
  const [newTagLabel, setNewTagLabel] = useState("");
  const apiBase = base(apiUrl) || (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}`.replace(/\/$/, "") : "");
  const resp = survey.responses || {};

  /** Tags hiển thị cho điều khoản: dùng đã lưu hoặc mặc định từ checklist */
  const getTagsForItem = (item) => {
    const saved = resp[item.id]?.tags;
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map((t) => ({ type: t.type || "custom", label: String(t.label ?? "").trim() })).filter((t) => t.label);
    }
    return defaultTags(item);
  };

  const openTagsEditor = (item) => {
    setEditTagsItem(item);
    setEditTagsDraft(getTagsForItem(item).map((t) => ({ ...t })));
    setNewTagLabel("");
    setNewTagType("custom");
  };
  const saveTagsForItem = () => {
    if (!editTagsItem) return;
    setResp(editTagsItem.id, "tags", editTagsDraft.filter((t) => (t.label || "").trim()));
    setEditTagsItem(null);
    setEditTagsDraft([]);
  };
  const addDraftTag = (type, label) => {
    setEditTagsDraft((prev) => [...prev, { type: type || "custom", label: label || "" }]);
  };
  const updateDraftTag = (index, label) => {
    setEditTagsDraft((prev) => prev.map((t, i) => (i === index ? { ...t, label } : t)));
  };
  const removeDraftTag = (index) => {
    setEditTagsDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchAllEvidence = useCallback(async () => {
    if (!surveyId || !apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/surveys/${surveyId}/evidence?limit=500`);
      if (res.ok) setAllEvidence(await res.json());
    } catch (_) {
      setAllEvidence([]);
    }
  }, [surveyId, apiBase]);

  useEffect(() => {
    if (surveyId && apiBase) fetchAllEvidence();
  }, [surveyId, apiBase, fetchAllEvidence]);

  const getEvidenceForClause = useCallback((clauseId) => allEvidence.filter((e) => e.clauseId === clauseId), [allEvidence]);

  const deleteEvidenceInline = useCallback(
    async (evidenceId) => {
      if (!confirm("Xóa bằng chứng này?")) return;
      if (!surveyId || !apiBase) return;
      try {
        const res = await fetch(`${apiBase}/api/surveys/${surveyId}/evidence/${evidenceId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(res.status);
        setToast?.({ type: "success", msg: "Đã xóa bằng chứng." });
        fetchAllEvidence();
      } catch (e) {
        setToast?.({ type: "error", msg: `Lỗi: ${e.message}` });
      }
    },
    [surveyId, apiBase, setToast, fetchAllEvidence]
  );

  const viewEvidenceUrl = (evidenceId) => `${apiBase}/api/surveys/${surveyId}/evidence/${evidenceId}`;

  const setResp = (id, field, val) =>
    setSurvey(p => ({ ...p, responses:{ ...p.responses, [id]:{ ...p.responses[id], [field]:val }}}));

  const appendHint = (id, field, hint) => {
    const currentVal = resp[id]?.[field] || "";
    const newVal = currentVal ? `${currentVal}\n- ${hint}` : `- ${hint}`;
    setResp(id, field, newVal);
  };

  const r634 = resp["6.3.4"] || {};
  const staticVars = Array.isArray(r634.static_variables) ? r634.static_variables : [];
  const relatedVars = Array.isArray(r634.related_variables) ? r634.related_variables : [];

  const setStaticVars = (arr) => setResp("6.3.4", "static_variables", arr);
  const setRelatedVars = (arr) => setResp("6.3.4", "related_variables", arr);

  const getExtraNotes = (id) => Array.isArray(resp[id]?.extra_notes) ? resp[id].extra_notes : [];
  const addExtraNote = (id) => setResp(id, "extra_notes", [...getExtraNotes(id), ""]);
  const setExtraNoteAt = (id, index, value) => {
    const arr = [...getExtraNotes(id)];
    arr[index] = value;
    setResp(id, "extra_notes", arr);
  };
  const removeExtraNote = (id, index) => setResp(id, "extra_notes", getExtraNotes(id).filter((_, i) => i !== index));

  const stats = useMemo(() => {
    const all = GAP_CHECKLIST;
    const scored = all.filter(i => (resp[i.id]?.score||0) > 0);
    const n = scored.length;
    const crit = scored.filter(i => resp[i.id].score <= 1).length;
    const maj  = scored.filter(i => resp[i.id].score === 2).length;
    const min  = scored.filter(i => resp[i.id].score === 3).length;
    const good = scored.filter(i => resp[i.id].score >= 4).length;
    const needImproveCount = crit + maj + min;
    const needImprovePct = n > 0 ? Math.round((needImproveCount / n) * 1000) / 10 : 0;
    return { total:all.length, scored:n, crit, maj, min, good, needImproveCount, needImprovePct };
  }, [resp]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

      <KPIBar items={[
        { label:"Tổng yêu cầu",    value:`${stats.scored}/${stats.total}`, col:C.blue,   icon:"📋" },
        { label:"Nghiêm trọng",    value:stats.crit,  col:C.red,    icon:"⛔" },
        { label:"Khoảng cách lớn", value:stats.maj,   col:C.orange, icon:"⚠️" },
        { label:"Cần cải thiện",   value:stats.scored ? `${stats.needImproveCount} (${stats.needImprovePct}%)` : "0 (0%)", col:C.amber,  icon:"🔶" },
        { label:"Phù hợp",         value:stats.good,  col:C.teal,   icon:"✅" },
      ]}/>

      {/* Hành động Bulk Edit Hồ sơ tài liệu */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button type="button" onClick={() => setDocModalOpen(true)}
          style={{ padding: "8px 16px", background: C.blue, color: C.white, border: "none", borderRadius: RADIUS.md, fontSize: FONT.body, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 2px 5px ${C.blue}40` }}>
          📋 Nhập liệu Hồ sơ tài liệu (Bulk Edit)
        </button>
      </div>

      {/* Scoring guide */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:4 }}>
        {Object.entries(SCORE_CFG).map(([s,cfg]) => (
          <span key={s} style={{ background:cfg.bg, color:cfg.col, border:`1px solid ${cfg.col}30`,
            borderRadius:4, padding:"2px 7px", fontSize:FONT.label, fontWeight:700 }}>
            {s} — {cfg.label}
          </span>
        ))}
      </div>

      {CLAUSES.map(cl => {
        const clItems = GAP_CHECKLIST.filter(i => i.clause.startsWith(cl.num.replace("§","")));
        const avg = avgScore(clItems, resp);
        const avgN = avg ? parseFloat(avg) : 0;
        const avgInt = Math.round(avgN);
        const scfg = SCORE_CFG[avgInt] || SCORE_CFG[0];
        const isOpen = !!open[cl.num];

        return (
          <div key={cl.num} style={{ background:C.bg2, borderRadius:10, overflow:"hidden",
            border:`1px solid ${cl.col}30` }}>
            {/* Clause header */}
            <div onClick={() => setOpen(p=>({...p,[cl.num]:!isOpen}))}
              style={{ padding:"10px 14px", background:`${cl.col}12`,
                borderBottom:isOpen?`1px solid ${cl.col}20`:"none",
                display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <span style={{ fontSize:FONT.headline }}>{cl.icon}</span>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:FONT.title, fontWeight:700, color:C.t0, flex:1 }}>
                {cl.num} — {cl.name}
              </span>
              <span style={{ fontSize:FONT.body, color:C.t2 }}>{clItems.length} yêu cầu</span>
              {avg && (
                <span style={{ background:scfg.bg, color:scfg.col, border:`1px solid ${scfg.col}30`,
                  borderRadius:5, padding:"2px 8px", fontSize:FONT.body, fontWeight:700 }}>
                  TB: {avg}/5.0
                </span>
              )}
              <span style={{ color:C.t2 }}>{isOpen?"▼":"▶"}</span>
            </div>

            {isOpen && (
              <div style={{ padding:14 }}>
                {cl.subs.map(sub => {
                  const subItems = clItems.filter(i => i.clause === sub);
                  if (!subItems.length) return null;
                  const subAvg = avgScore(subItems, resp);
                  const sAvgN = subAvg ? parseFloat(subAvg) : 0;
                  const sCfg = SCORE_CFG[Math.round(sAvgN)] || SCORE_CFG[0];
                  return (
                    <div key={sub} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6,
                        padding:"5px 10px", background:C.bg3, borderRadius:6,
                        borderLeft:`3px solid ${cl.col}` }}>
                        <span style={{ fontFamily:"'Fira Code',monospace", fontSize:FONT.label, color:cl.col, fontWeight:700 }}>{sub}</span>
                        <span style={{ fontSize:FONT.subheading, fontWeight:600, color:C.t0, flex:1 }}>{SUB_NAMES[sub]||sub}</span>
                        {subAvg && (
                          <span style={{ background:sCfg.bg, color:sCfg.col,
                            border:`1px solid ${sCfg.col}30`, borderRadius:4,
                            padding:"1px 7px", fontSize:FONT.label, fontWeight:700 }}>
                            {subAvg}/5.0
                          </span>
                        )}
                      </div>

                      {subItems.map((item, idx) => {
                        const r = resp[item.id] || {};
                        const sc = r.score || 0;
                        const cfg = SCORE_CFG[sc] || SCORE_CFG[0];
                        const wcfg = WEIGHT_CFG[item.weight] || WEIGHT_CFG[1];
                        const ccfg = CAT_CFG[item.cat] || CAT_CFG.practice;
                        const hints = getAuditHints(item.id);
                        return (
                          <div key={item.id} style={{ marginBottom:8, padding:10,
                            background:sc ? `${cfg.col}08` : C.bg3,
                            border:`1px solid ${sc?cfg.col:C.bd2}28`,
                            borderRadius:7 }}>
                            {/* Item header */}
                            <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                              <span style={{ fontFamily:"'Fira Code',monospace", fontSize:FONT.label,
                                color:C.blueL, flexShrink:0, marginTop:2 }}>{item.id}</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:FONT.subheading, color:C.t0, fontWeight:500, lineHeight:1.5 }}>{item.title}</div>
                                <div style={{ display:"flex", gap:5, marginTop:3, flexWrap:"wrap", alignItems:"center" }}>
                                  {getTagsForItem(item).map((t, i) => (
                                    <Tag key={i} c={tagColor(t)}>{t.type === "legal" ? "⚖️ " : ""}{t.label}</Tag>
                                  ))}
                                  <button type="button" onClick={() => openTagsEditor(item)} title="Sửa nhãn phân loại / mức độ / pháp lý"
                                    style={{ marginLeft:4, padding:"2px 8px", fontSize:FONT.caption, background:C.bg4, border:`1px solid ${C.bd0}`, borderRadius:4, color:C.t2, cursor:"pointer" }}>Sửa</button>
                                </div>
                              </div>
                              {sc > 0 && (
                                <span style={{ background:cfg.bg, color:cfg.col,
                                  border:`1px solid ${cfg.col}30`, borderRadius:5,
                                  padding:"2px 8px", fontSize:FONT.label, fontWeight:700, flexShrink:0 }}>
                                  {sc}/5
                                </span>
                              )}
                            </div>
                            {/* Score picker */}
                            <div style={{ marginBottom:sc<=3&&sc>0?8:0 }}>
                              <div style={{ fontSize:FONT.label, color:C.t2, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Điểm đánh giá:</div>
                              <ScorePicker value={sc} onChange={v => setResp(item.id,"score",v)}/>
                            </div>
                            {/* Bằng chứng đã tải — hiển thị ngay dưới nút, số lượng + CRUD tại từng điều khoản */}
                            <div style={{ marginTop:10, paddingTop:8, borderTop:`1px solid ${C.bd1}` }}>
                              <div style={{ fontSize:FONT.label, color:C.t2, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Bằng chứng điều khoản {item.id}</div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEvidenceModal({ clauseId: item.id, clauseTitle: item.title });
                                  if (ensureSurveyId) ensureSurveyId().catch(() => {});
                                }}
                                style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:6,
                                  background:`${C.teal}22`, border:`1px solid ${C.teal}60`, color:C.tealL, fontSize:FONT.body, fontWeight:600, cursor:"pointer", width:"100%", justifyContent:"center" }}>
                                📷 Thêm / xem bằng chứng (tài liệu & ảnh) cho điều khoản này
                              </button>
                              {surveyId && (
                                <div style={{ marginTop:8 }}>
                                  <div style={{ fontSize:FONT.body, color:C.t1, marginBottom:6 }}>
                                    Bằng chứng đã liên kết: <strong style={{ color:C.tealL }}>{getEvidenceForClause(item.id).length}</strong>
                                  </div>
                                  {getEvidenceForClause(item.id).length > 0 ? (
                                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                                      {getEvidenceForClause(item.id).map((ev) => (
                                        <div key={ev._id} style={{ width:120, background:C.bg3, borderRadius:8, overflow:"hidden", border:`1px solid ${C.bd0}` }}>
                                          {ev.type === "image" ? (
                                            <a href={viewEvidenceUrl(ev._id)} target="_blank" rel="noopener noreferrer" style={{ display:"block", height:80, background:C.bg4 }}>
                                              <img src={viewEvidenceUrl(ev._id)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                            </a>
                                          ) : (
                                            <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", background:C.bg4 }}>
                                              <span style={{ fontSize:FONT.display }}>📄</span>
                                            </div>
                                          )}
                                          <div style={{ padding:6, fontSize:FONT.label, color:C.t0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={ev.originalName || ev.filename}>{ev.originalName || ev.filename}</div>
                                          <div style={{ display:"flex", gap:4, padding:"4px 6px 6px" }}>
                                            <a href={viewEvidenceUrl(ev._id)} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"4px 6px", background:C.blue+"40", color:C.blueL, borderRadius:4, fontSize:FONT.label, fontWeight:600, textDecoration:"none" }}>Xem</a>
                                            <button type="button" onClick={()=>deleteEvidenceInline(ev._id)} style={{ padding:"4px 6px", background:C.red+"30", border:`1px solid ${C.red}`, color:C.redL, borderRadius:4, fontSize:FONT.label, fontWeight:600, cursor:"pointer" }}>Xóa</button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ padding:8, background:C.bg3, borderRadius:6, fontSize:FONT.body, color:C.t3 }}>Chưa có bằng chứng. Nhấn nút trên để thêm tài liệu hoặc ảnh.</div>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Note field */}
                            {sc > 0 && (
                              <div style={{ marginTop:6 }}>
                                <div style={{ fontSize:FONT.label, color:C.t2, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Mô tả hiện trạng doanh nghiệp</div>
                                <textarea value={r.note||""} onChange={e=>setResp(item.id,"note",e.target.value)}
                                  placeholder={sc<=2 ? "Mô tả khoảng cách cụ thể phát hiện tại hiện trường..."
                                    : sc===3 ? "Mô tả hiện trạng và điểm cần hoàn thiện..."
                                    : "Mô tả thực trạng / bằng chứng / tài liệu ghi nhận được..."}
                                  rows={2} style={{ width:"100%", background:C.bg4,
                                    border:`1px solid ${C.bd0}`, borderRadius:5, padding:"5px 8px",
                                    color:C.t0, fontSize:FONT.body, resize:"vertical", fontFamily:"inherit" }}/>
                                <QuickHints hints={hints.notes} onSelect={h => appendHint(item.id, "note", h)} />
                                {/* Ghi chú bổ sung — +Add thêm textbox, lưu vào DB (extra_notes) */}
                                <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.bd1}` }}>
                                  <div style={{ fontSize:FONT.label, color:C.t2, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Ghi chú bổ sung</div>
                                  {getExtraNotes(item.id).map((text, idx) => (
                                    <div key={idx} style={{ position:"relative", marginBottom:6 }}>
                                      <textarea value={text||""} onChange={e=>setExtraNoteAt(item.id, idx, e.target.value)}
                                        placeholder={`Ghi chú bổ sung ${idx + 1}...`}
                                        rows={2} style={{ width:"100%", background:C.bg4, border:`1px solid ${C.bd0}`, borderRadius:5, padding:"5px 8px", paddingRight:32, color:C.t0, fontSize:FONT.body, resize:"vertical", fontFamily:"inherit" }}/>
                                      <button type="button" onClick={()=>removeExtraNote(item.id, idx)} title="Xóa ghi chú này" style={{ position:"absolute", right:6, top:6, width:24, height:24, padding:0, display:"flex", alignItems:"center", justifyContent:"center", background:C.red+"30", border:`1px solid ${C.red}`, color:C.redL, borderRadius:4, cursor:"pointer", fontSize:FONT.label }}>×</button>
                                    </div>
                                  ))}
                                  <button type="button" onClick={()=>addExtraNote(item.id)}
                                    style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", marginTop:4, background:`${C.blue}20`, border:`1px solid ${C.blue}50`, color:C.blueL, borderRadius:5, fontSize:FONT.body, fontWeight:600, cursor:"pointer" }}>
                                    + Add
                                  </button>
                                </div>
                              </div>
                            )}
                            {/* Recommendation for gaps */}
                            {sc > 0 && sc <= 3 && (
                              <div style={{ marginTop:5 }}>
                                <div style={{ fontSize:FONT.label, color:C.orangeL, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Yêu cầu khi áp dụng HTQLNL theo tiêu chuẩn ISO 50001:2018</div>
                                <textarea value={r.recommendation||""} onChange={e=>setResp(item.id,"recommendation",e.target.value)}
                                  placeholder="Đề xuất hành động khắc phục / thiết kế yêu cầu cần áp dụng..."
                                  rows={2} style={{ width:"100%", background:`${C.orange}08`,
                                    border:`1px solid ${C.orange}25`, borderRadius:5, padding:"5px 8px",
                                    color:C.t0, fontSize:FONT.body, resize:"vertical", fontFamily:"inherit" }}/>
                                <QuickHints hints={hints.recs} onSelect={h => appendHint(item.id, "recommendation", h)} />
                              </div>
                            )}
                            {/* 6.3.4 — Yếu tố tĩnh & Biến liên quan (theo tiêu chuẩn SEU/EnPI) */}
                            {item.id === "6.3.4" && (
                              <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.bd1}`, display:"flex", flexWrap:"wrap", gap:8 }}>
                                <button type="button" onClick={() => setStaticVarModalOpen(true)}
                                  style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:6,
                                    background:`${C.amber}18`, border:`1px solid ${C.amber}40`, color:C.amberL || C.amber, fontSize:FONT.body, fontWeight:600, cursor:"pointer" }}>
                                  📋 Yếu tố tĩnh ({staticVars.length})
                                </button>
                                <button type="button" onClick={() => setRelatedVarModalOpen(true)}
                                  style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:6,
                                    background:`${C.sky}18`, border:`1px solid ${C.sky}40`, color:C.skyL, fontSize:FONT.body, fontWeight:600, cursor:"pointer" }}>
                                  📋 Biến liên quan ({relatedVars.length})
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <EvidenceClauseModal
        open={!!evidenceModal}
        onClose={() => { setEvidenceModal(null); fetchAllEvidence(); }}
        onEvidenceChange={fetchAllEvidence}
        surveyId={surveyId}
        clauseId={evidenceModal?.clauseId}
        clauseTitle={evidenceModal?.clauseTitle}
        apiUrl={apiUrl}
        setToast={setToast}
        ensureSurveyId={ensureSurveyId}
      />

      <DocumentAssessmentModal 
        open={docModalOpen} 
        onClose={() => setDocModalOpen(false)} 
        survey={survey} 
        setSurvey={setSurvey} 
        checklist={GAP_CHECKLIST} 
      />

      {/* Frame Modal: Yếu tố tĩnh (static variables) — 6.3.4 */}
      <Modal open={staticVarModalOpen} onClose={() => setStaticVarModalOpen(false)} title="Yếu tố tĩnh (static variables) — §6.3.4" width={620}>
        <div style={{ border: `2px solid ${C.bd0}`, borderRadius: RADIUS.lg, overflow: "hidden", background: C.bg2 }}>
          <div style={{ padding: SPACE.lg, borderBottom: `1px solid ${C.bd0}`, background: `${C.amber}12` }}>
            <div style={{ fontSize: FONT.label, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>ISO 50001:2018 — §6.3 Rà soát năng lượng</div>
            <p style={{ color: C.t1, margin: 0, fontSize: FONT.body, lineHeight: 1.5 }}>Xác định các yếu tố tĩnh ảnh hưởng đến tiêu thụ năng lượng / SEU (vd: thời tiết, sản lượng, số ca làm việc).</p>
          </div>
          <div style={{ padding: SPACE.lg }}>
            {staticVars.map((v, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
                <input value={v.name || ""} onChange={e => setStaticVars(staticVars.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Tên yếu tố tĩnh" style={{ flex: 1, minHeight: 38, padding: "8px 10px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: 15 }} />
                <input value={v.description || ""} onChange={e => setStaticVars(staticVars.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Mô tả ảnh hưởng" style={{ flex: 1, minHeight: 38, padding: "8px 10px", background: C.bg3, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: 15 }} />
                <button type="button" onClick={() => setStaticVars(staticVars.filter((_, j) => j !== i))} style={{ padding: "6px 10px", background: C.red + "25", border: `1px solid ${C.red}`, color: C.redL, borderRadius: RADIUS.sm, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Xóa</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn v="primary" sz="sm" onClick={() => setStaticVars([...staticVars, { ...EMPTY_STATIC }])}>＋ Thêm yếu tố tĩnh</Btn>
              <Btn v="ghost" sz="sm" onClick={() => setStaticVarModalOpen(false)}>Đóng</Btn>
            </div>
          </div>
        </div>
      </Modal>

      {/* Frame Modal: Biến liên quan (related variables) — §6.3.4, ISO 50001:2018 — CRUD đầy đủ, sau Modal Yếu tố tĩnh */}
      <Modal open={relatedVarModalOpen} onClose={() => setRelatedVarModalOpen(false)} title="Biến liên quan (related variables) — §6.3.4" width={720}>
        <div style={{ border: `2px solid ${C.bd0}`, borderRadius: RADIUS.lg, overflow: "hidden", background: C.bg2 }}>
          <div style={{ padding: SPACE.lg, borderBottom: `1px solid ${C.bd0}`, background: `${C.sky}12` }}>
            <div style={{ fontSize: FONT.label, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>ISO 50001:2018 — §6.3 Rà soát năng lượng</div>
            <p style={{ color: C.t1, margin: 0, fontSize: FONT.body, lineHeight: 1.5 }}>
              Xác định các biến liên quan đến tiêu thụ năng lượng và EnPI của SEU (ISO 50001:2018, 6.3). Ghi nhận từng biến: tên, SEU/EnPI liên quan, mô tả mối liên quan — phục vụ phân tích và chuẩn hóa EnPI/EnB.
            </p>
          </div>
          <div style={{ padding: SPACE.lg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.md }}>
              <span style={{ fontSize: FONT.body, color: C.t1, fontWeight: 600 }}>Danh sách biến liên quan ({relatedVars.length})</span>
              <Btn v="blue" sz="sm" onClick={() => setRelatedVars([...relatedVars, { ...EMPTY_RELATED }])}>＋ Thêm biến liên quan</Btn>
            </div>
            {relatedVars.length === 0 ? (
              <div style={{ padding: SPACE.xl, textAlign: "center", color: C.t2, fontSize: FONT.body, border: `1px dashed ${C.bd1}`, borderRadius: RADIUS.md }}>
                Chưa có biến liên quan. Bấm «＋ Thêm biến liên quan» để tạo mới.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.bd0}` }}>
                      <th style={{ textAlign: "left", padding: "10px 8px", color: C.t2, width: 44 }}>STT</th>
                      <th style={{ textAlign: "left", padding: "10px 8px", color: C.t2, minWidth: 140 }}>Tên biến liên quan</th>
                      <th style={{ textAlign: "left", padding: "10px 8px", color: C.t2, width: 140 }}>SEU / EnPI liên quan</th>
                      <th style={{ textAlign: "left", padding: "10px 8px", color: C.t2 }}>Mô tả mối liên quan</th>
                      <th style={{ textAlign: "center", padding: "10px 8px", color: C.t2, width: 100 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedVars.map((v, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.bd1}` }}>
                        <td style={{ padding: "8px", color: C.t2, verticalAlign: "top" }}>{i + 1}</td>
                        <td style={{ padding: "8px", verticalAlign: "top" }}>
                          <input value={v.name || ""} onChange={e => setRelatedVars(relatedVars.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Tên biến" style={{ width: "100%", minHeight: 36, padding: "6px 8px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: 15 }} />
                        </td>
                        <td style={{ padding: "8px", verticalAlign: "top" }}>
                          <input value={v.seu_ref || ""} onChange={e => setRelatedVars(relatedVars.map((x, j) => j === i ? { ...x, seu_ref: e.target.value } : x))} placeholder="SEU/EnPI" style={{ width: "100%", minHeight: 36, padding: "6px 8px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: 15 }} />
                        </td>
                        <td style={{ padding: "8px", verticalAlign: "top" }}>
                          <input value={v.description || ""} onChange={e => setRelatedVars(relatedVars.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Mô tả mối liên quan với NL/EnPI" style={{ width: "100%", minHeight: 36, padding: "6px 8px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: 15 }} />
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", verticalAlign: "top" }}>
                          <button type="button" onClick={() => setRelatedVars(relatedVars.filter((_, j) => j !== i))} style={{ padding: "6px 10px", background: C.red + "25", border: `1px solid ${C.red}`, color: C.redL, borderRadius: RADIUS.sm, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ padding: SPACE.md, borderTop: `1px solid ${C.bd0}`, display: "flex", justifyContent: "flex-end", gap: SPACE.sm }}>
            <Btn v="ghost" sz="md" onClick={() => setRelatedVarModalOpen(false)}>Đóng</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal CRUD nhãn điều khoản (Thực hành, Quan trọng, TT 25/2020/TT-BCT §6, ...) */}
      <Modal
        open={!!editTagsItem}
        onClose={() => { setEditTagsItem(null); setEditTagsDraft([]); }}
        title={`Nhãn điều khoản — ${editTagsItem?.id ?? ""} ${editTagsItem ? `· ${editTagsItem.title?.slice(0, 40)}${(editTagsItem.title?.length || 0) > 40 ? "…" : ""}` : ""}`}
        width={520}
      >
        <div style={{ padding: "0 4px" }}>
          <p style={{ fontSize: FONT.body, color: C.t2, marginBottom: SPACE.lg }}>
            Thêm, sửa hoặc xóa nhãn phân loại (Thực hành, Lãnh đạo…), mức độ (Quan trọng, Cao…), pháp lý (TT 25/2020/TT-BCT…) hoặc tùy chỉnh. Lưu để áp dụng cho phiên đánh giá này.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm, marginBottom: SPACE.lg }}>
            {editTagsDraft.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: SPACE.sm, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={t.type}
                  onChange={e => setEditTagsDraft(prev => prev.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                  style={{ width: 120, minHeight: 36, padding: "6px 8px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: FONT.body }}
                >
                  <option value="cat">Phân loại</option>
                  <option value="weight">Mức độ</option>
                  <option value="legal">Pháp lý</option>
                  <option value="custom">Tùy chỉnh</option>
                </select>
                <input
                  value={t.label || ""}
                  onChange={e => updateDraftTag(i, e.target.value)}
                  placeholder={t.type === "cat" ? "vd: Thực hành, Tài liệu" : t.type === "weight" ? "vd: Quan trọng, Cao" : "Nhập nội dung"}
                  style={{ flex: 1, minWidth: 140, minHeight: 36, padding: "6px 10px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: FONT.body }}
                />
                <button type="button" onClick={() => removeDraftTag(i)} title="Xóa nhãn" style={{ padding: "6px 10px", background: C.red + "25", border: `1px solid ${C.red}`, color: C.redL, borderRadius: RADIUS.sm, cursor: "pointer", fontSize: FONT.label, fontWeight: 600 }}>Xóa</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: SPACE.sm, alignItems: "center", marginBottom: SPACE.xl }}>
            <select
              value={newTagType}
              onChange={e => setNewTagType(e.target.value)}
              style={{ width: 120, minHeight: 36, padding: "6px 8px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: FONT.body }}
            >
              <option value="cat">Phân loại</option>
              <option value="weight">Mức độ</option>
              <option value="legal">Pháp lý</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
            <input
              value={newTagLabel}
              onChange={e => setNewTagLabel(e.target.value)}
              placeholder="Nội dung nhãn mới"
              style={{ flex: 1, minHeight: 36, padding: "6px 10px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, color: C.t0, fontSize: FONT.body }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newTagLabel.trim()) { addDraftTag(newTagType, newTagLabel.trim()); setNewTagLabel(""); } } }}
            />
            <Btn v="blue" sz="sm" onClick={() => { if (newTagLabel.trim()) { addDraftTag(newTagType, newTagLabel.trim()); setNewTagLabel(""); } }}>+ Thêm tag</Btn>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: SPACE.sm }}>
            <Btn v="ghost" sz="md" onClick={() => { setEditTagsItem(null); setEditTagsDraft([]); }}>Hủy</Btn>
            <Btn v="primary" sz="md" onClick={saveTagsForItem}>Lưu</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
