/**
 * ISO50001Gap — frontend/StepActions.jsx
 * Step 6: Master Action Plan — gợi ý từ GAP + Modal nhập/sửa đầy đủ
 */
import { useMemo, useState, useCallback } from "react";
import { C, ACTION_PHASES, GAP_CHECKLIST as DEFAULT_CHECKLIST, SCORE_CFG } from "./gap.ui.constants.js";
import { Btn, Field, Input, TA, Sel, Tag, KPIBar, Modal, DatePicker } from "./gap.atoms.jsx";

const CLAUSES_OPT = ["","§4.1","§4.2","§4.3","§4.4","§5.1","§5.2","§5.3",
  "§6.1","§6.2","§6.3","§6.4","§6.5","§6.6","§7.1","§7.2","§7.3","§7.5",
  "§8.1","§8.2","§8.3","§9.1","§9.2","§9.3","§10.1","§10.2","Pháp lý","Rủi ro","Quá trình","Hiện trường"];

const newAction = (phase = "P1") => ({
  id: `AP${Date.now()}`, code: "", action: "", clause: "", phase,
  responsible: "", deadline: "", resources: "", status: "open",
});

export default function StepActions({ survey, setSurvey, checklist: checklistProp }) {
  const GAP_CHECKLIST = checklistProp || DEFAULT_CHECKLIST;
  const actions = survey.action_plan || [];
  const responses = survey.responses || {};

  const update = acts => setSurvey(p => ({ ...p, action_plan: acts }));
  const setResp = (id, field, val) =>
    setSurvey(p => ({
      ...p,
      responses: {
        ...p.responses,
        [id]: { ...(p.responses[id] || {}), [field]: val },
      },
    }));
  const addAction = phase => update([...actions, newAction(phase)]);
  const remove = id => update(actions.filter(a => a.id !== id));
  const setAct = (id, field, val) => update(actions.map(a => a.id === id ? { ...a, [field]: val } : a));
  const updateActFields = (id, obj) => update(actions.map(a => a.id === id ? { ...a, ...obj } : a));

  const calcPhase = (val) => {
    if (!val) return null;
    const strVal = String(val).toLowerCase();
    
    // Parse ngày: <=30 ngày, 30 ngày, 30
    if (strVal.includes("ngày") || (!isNaN(parseInt(val)) && val.length < 5)) {
      const match = strVal.match(/\d+/);
      if (match) {
        const d = parseInt(match[0], 10);
        if (d <= 30) return "P1";
        if (d <= 90) return "P2";
        if (d <= 180) return "P3";
        return "P4";
      }
    }
    
    // Date string
    const d = new Date(val);
    if (!isNaN(d)) {
      const base = survey?.date ? new Date(survey.date) : new Date();
      if (!isNaN(base)) {
        if (d < base) return "P1"; // Overdue -> P1
        const diffDays = (d - base) / (1000 * 3600 * 24);
        if (diffDays <= 30) return "P1";
        if (diffDays <= 90) return "P2";
        if (diffDays <= 180) return "P3";
        return "P4";
      }
    }
    return null;
  };

  const calcDateFromDays = (val) => {
    if (!val) return null;
    let days = null;
    if (typeof val === 'number') days = val;
    else {
      const match = String(val).match(/\d+/);
      if (match) days = parseInt(match[0], 10);
    }
    if (days !== null && !isNaN(days)) {
      const base = survey.date ? new Date(survey.date) : new Date();
      if (isNaN(base)) return null;
      const d = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      return d.toISOString().split("T")[0]; // YYYY-MM-DD
    }
    return null;
  };

  // Modal: item từ gợi ý GAP, action (null = thêm mới)
  const [modalItem, setModalItem] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [form, setForm] = useState({});

  const openModalAdd = useCallback(item => {
    const r = responses[item.id] || {};
    const sc = r.score || 1;
    const defaultDays = sc === 1 ? 30 : sc === 2 ? 90 : 180;
    
    let phase = sc === 1 ? "P1" : sc === 2 ? "P2" : "P3";
    if (r.deadline) {
      const explicitPhase = calcPhase(r.deadline);
      if (explicitPhase) phase = explicitPhase;
    }
    
    const responseDeadline = r.deadline || `<=${defaultDays} ngày`;
    const defaultDeadlineDate = calcDateFromDays(r.deadline) || calcDateFromDays(defaultDays);
    
    setModalItem(item);
    setModalAction(null);
    setForm({
      note: r.note || "",
      recommendation: r.recommendation || "",
      responseDeadline,
      code: `AP-${item.id}`,
      action: r.recommendation || `Khắc phục: "${item.title}"`,
      clause: `§${item.clause}`,
      phase,
      responsible: "",
      deadline: defaultDeadlineDate || "",
      resources: "",
      status: "open",
    });
  }, [responses, survey.date]);

  const openModalEdit = useCallback(item => {
    const act = actions.find(a => a.code === `AP-${item.id}`);
    if (!act) return;
    const r = responses[item.id] || {};
    const existingDeadlineFromGAP = r.deadline || "";
    
    setModalItem(item);
    setModalAction(act);
    setForm({
      note: r.note || "",
      recommendation: r.recommendation || "",
      responseDeadline: existingDeadlineFromGAP || act.deadline || `<=30 ngày`,
      code: act.code,
      action: act.action || "",
      clause: act.clause || "",
      phase: act.phase || "P1",
      responsible: act.responsible || "",
      deadline: act.deadline || calcDateFromDays(existingDeadlineFromGAP) || "",
      resources: act.resources || "",
      status: act.status || "open",
    });
  }, [actions, responses, survey.date]);

  const closeModal = useCallback(() => {
    setModalItem(null);
    setModalAction(null);
  }, []);

  const setFormField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const saveModal = useCallback(() => {
    if (!modalItem) return;
    const { note, recommendation, responseDeadline, code, action, clause, phase, responsible, deadline, resources, status } = form;

    setResp(modalItem.id, "note", note);
    setResp(modalItem.id, "recommendation", recommendation);
    setResp(modalItem.id, "deadline", responseDeadline);

    if (modalAction) {
      updateActFields(modalAction.id, {
        code, action, clause, phase, responsible, deadline, resources, status
      });
    } else {
      const newAct = {
        ...newAction(phase),
        code,
        action,
        clause,
        phase,
        responsible,
        deadline,
        resources,
        status,
      };
      update([...actions, newAct]);
    }
    closeModal();
  }, [modalItem, modalAction, form, actions, setResp, setAct, update, closeModal]);

  // Auto-suggest from gap (score 1–3)
  const autoSuggest = useMemo(() => {
    return GAP_CHECKLIST
      .filter(i => {
        const s = responses[i.id]?.score ?? 0;
        return s > 0 && s <= 3;
      })
      .sort((a, b) => (responses[a.id]?.score ?? 0) - (responses[b.id]?.score ?? 0))
      .slice(0, 12);
  }, [responses]);

  const byPhase = id => actions.filter(a => a.phase === id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KPIBar items={[
        { label: "Tổng actions", value: actions.length, col: C.blue, icon: "📋" },
        { label: "Giai đoạn 1", value: byPhase("P1").length, col: C.red, icon: "🔴" },
        { label: "Giai đoạn 2", value: byPhase("P2").length, col: C.orange, icon: "🟠" },
        { label: "Giai đoạn 3-4", value: byPhase("P3").length + byPhase("P4").length, col: C.teal, icon: "🟢" },
      ]}/>

      {/* Gợi ý từ GAP — mỗi dòng mở Modal tương tác */}
      {autoSuggest.length > 0 && (
        <div style={{ background: C.bg2, borderRadius: 12, padding: 16, border: `1px solid ${C.orange}35` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.orangeL, marginBottom: 12 }}>
            💡 Gợi ý từ kết quả đánh giá GAP ({autoSuggest.length} yêu cầu cần hành động)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {autoSuggest.map(item => {
              const sc = responses[item.id]?.score || 0;
              const col = sc === 1 ? C.red : sc === 2 ? C.orange : C.amber;
              const alreadyAdded = actions.some(a => a.code === `AP-${item.id}`);
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: C.bg3,
                    borderRadius: 8,
                    border: `1px solid ${col}25`,
                  }}
                >
                  <Tag c={col}>{item.id}</Tag>
                  <span style={{ flex: 1, fontSize: 15, color: C.t0 }}>{item.title}</span>
                  <Tag c={col}>Score {sc}</Tag>
                  <Btn
                    v={alreadyAdded ? "ghost" : "outline"}
                    sz="sm"
                    onClick={() => alreadyAdded ? openModalEdit(item) : openModalAdd(item)}
                    sx={alreadyAdded ? { color: C.tealL, borderColor: `${C.teal}60` } : {}}
                  >
                    {alreadyAdded ? "✓ Đã thêm (Sửa)" : "＋ Thêm vào Plan"}
                  </Btn>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Thông tin đánh giá GAP + Hành động */}
      <Modal
        open={!!modalItem}
        onClose={closeModal}
        title={modalItem ? `Khảo sát & Hành động — ${modalItem.id} ${modalItem.title?.slice(0, 40)}${modalItem.title?.length > 40 ? "…" : ""}` : ""}
        width={620}
      >
        {modalItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Phần 1: Thông tin đánh giá GAP */}
            <div style={{ padding: 14, background: C.bg3, borderRadius: 10, border: `1px solid ${C.bd0}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t2, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                📋 Thông tin từ đánh giá GAP (điều khoản)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Tag c={C.blue}>{modalItem.id}</Tag>
                <span style={{ fontSize: 13, color: C.t2 }}>Điểm:</span>
                <Tag c={SCORE_CFG[responses[modalItem.id]?.score]?.col || C.grey2}>
                  {responses[modalItem.id]?.score ?? 0} — {SCORE_CFG[responses[modalItem.id]?.score]?.short || "—"}
                </Tag>
              </div>
              <div style={{ fontSize: 15, color: C.t1, marginBottom: 12 }}>{modalItem.title}</div>
              <Field label="Mô tả hiện trạng doanh nghiệp">
                <TA value={form.note} onChange={v => setFormField("note", v)} placeholder="Ghi chú khi khảo sát..." rows={2}/>
              </Field>
              <Field label="Yêu cầu khi áp dụng HTQLNL theo tiêu chuẩn ISO 50001:2018" sx={{ marginTop: 10 }}>
                <TA value={form.recommendation} onChange={v => setFormField("recommendation", v)} placeholder="Hành động đề xuất từ đánh giá GAP..." rows={2}/>
              </Field>
              <Field label="Hạn hoàn thành (Deadline)" sx={{ marginTop: 10 }}>
                <Input value={form.responseDeadline} onChange={v => {
                  setFormField("responseDeadline", v);
                  const p = calcPhase(v);
                  if (p) setFormField("phase", p);
                  const d = calcDateFromDays(v);
                  if (d) setFormField("deadline", d);
                }} placeholder="VD: <=30 ngày / 90 ngày"/>
              </Field>
            </div>

            {/* Phần 2: Hành động trong Kế hoạch */}
            <div style={{ padding: 14, background: C.bg3, borderRadius: 10, border: `1px solid ${C.teal}30` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t2, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                🚀 Hành động trong Kế hoạch (Action Plan)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Mã hành động">
                  <Input value={form.code} onChange={v => setFormField("code", v)} placeholder="AP-4.1.1"/>
                </Field>
                <Field label="Giai đoạn">
                  <Sel value={form.phase} onChange={v => {
                    setFormField("phase", v);
                    const days = v === "P1" ? 30 : v === "P2" ? 90 : v === "P3" ? 180 : 365;
                    setFormField("responseDeadline", `<=${days} ngày`);
                    const defaultDate = calcDateFromDays(days);
                    if (defaultDate) setFormField("deadline", defaultDate);
                  }} options={ACTION_PHASES.map(p => [p.id, p.label.split("—")[0].trim()])}/>
                </Field>
              </div>
              <Field label="Hành động / Dự án cần thực hiện" sx={{ marginTop: 10 }}>
                <TA value={form.action} onChange={v => setFormField("action", v)} placeholder="Mô tả cụ thể hành động..." rows={3}/>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                <Field label="Điều khoản liên quan">
                  <Sel value={form.clause} onChange={v => setFormField("clause", v)} options={CLAUSES_OPT.map(c => [c, c || "— Chọn —"])}/>
                </Field>
                <Field label="Trạng thái">
                  <Sel value={form.status} onChange={v => setFormField("status", v)} options={[
                    ["open", "⬜ Chưa bắt đầu"],
                    ["in_progress", "🔄 Đang thực hiện"],
                    ["done", "✅ Hoàn thành"],
                    ["deferred", "⏸ Tạm hoãn"],
                  ]}/>
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                <Field label="Người chịu trách nhiệm">
                  <Input value={form.responsible} onChange={v => setFormField("responsible", v)} placeholder="EMR / Phòng..."/>
                </Field>
                <Field label="Deadline">
                  <DatePicker value={form.deadline || ""} onChange={v => {
                    setFormField("deadline", v);
                    const p = calcPhase(v);
                    if (p) {
                      setFormField("phase", p);
                      const days = p === "P1" ? 30 : p === "P2" ? 90 : p === "P3" ? 180 : 365;
                      setFormField("responseDeadline", `<=${days} ngày`);
                    }
                  }} placeholder="YYYY-MM-DD"/>
                </Field>
              </div>
              <Field label="Nguồn lực (ngân sách, nhân lực)" sx={{ marginTop: 10 }}>
                <Input value={form.resources} onChange={v => setFormField("resources", v)} placeholder="Ngân sách / Nhân lực..."/>
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8 }}>
              <Btn v="ghost" sz="md" onClick={closeModal}>Hủy</Btn>
              <Btn v="blue" sz="md" onClick={saveModal}>
                {modalAction ? "Cập nhật" : "Thêm vào Plan"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Phase-based sections */}
      {ACTION_PHASES.map(ph => (
        <div key={ph.id} style={{ background: C.bg2, borderRadius: 12, overflow: "hidden", border: `1px solid ${ph.col}30` }}>
          <div style={{ padding: "12px 16px", background: `${ph.col}15`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700, color: C.t0, flex: 1 }}>{ph.label}</div>
            <Tag c={ph.col}>{byPhase(ph.id).length} actions</Tag>
            <Btn v="outline" sz="sm" onClick={() => addAction(ph.id)} sx={{ borderColor: `${ph.col}60`, color: ph.col }}>＋ Thêm</Btn>
          </div>
          <div style={{ padding: byPhase(ph.id).length ? 12 : 0 }}>
            {byPhase(ph.id).map((act, i) => (
              <div key={act.id} style={{ background: C.bg3, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${C.bd2}` }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                  <div style={{ width: 110 }}>
                    <div style={{ fontSize: 13, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Mã</div>
                    <Input value={act.code} onChange={v => setAct(act.id, "code", v)} placeholder={`AP-${i + 1}`}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Hành động / Dự án</div>
                    <Input value={act.action} onChange={v => setAct(act.id, "action", v)} placeholder="Mô tả hành động..."/>
                  </div>
                  <div style={{ width: 130 }}>
                    <div style={{ fontSize: 13, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Điều khoản</div>
                    <Sel value={act.clause || ""} onChange={v => setAct(act.id, "clause", v)} options={CLAUSES_OPT.map(c => [c, c || "— Chọn —"])}/>
                  </div>
                  <Btn v="ghost" sz="sm" onClick={() => remove(act.id)} sx={{ color: C.red, borderColor: C.red + "40" }}>✕</Btn>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Người chịu TN</div>
                    <Input value={act.responsible} onChange={v => setAct(act.id, "responsible", v)} placeholder="EMR / Phòng..."/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Deadline</div>
                    <DatePicker value={act.deadline || ""} onChange={v => {
                      const p = calcPhase(v);
                      if (p) updateActFields(act.id, { deadline: v, phase: p });
                      else setAct(act.id, "deadline", v);
                    }} placeholder="YYYY-MM-DD"/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Nguồn lực</div>
                    <Input value={act.resources} onChange={v => setAct(act.id, "resources", v)} placeholder="Ngân sách..."/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: C.t2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Trạng thái</div>
                    <Sel value={act.status || "open"} onChange={v => setAct(act.id, "status", v)} options={[
                      ["open", "⬜ Chưa bắt đầu"],
                      ["in_progress", "🔄 Đang thực hiện"],
                      ["done", "✅ Hoàn thành"],
                      ["deferred", "⏸ Tạm hoãn"],
                    ]}/>
                  </div>
                </div>
              </div>
            ))}
            {byPhase(ph.id).length === 0 && (
              <div style={{ textAlign: "center", padding: 16, color: C.t3, fontSize: 15 }}>Không có action trong giai đoạn này — nhấn "＋ Thêm"</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
