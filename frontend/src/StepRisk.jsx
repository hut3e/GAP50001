/**
 * ISO50001Gap — frontend/StepRisk.jsx
 * Step 3: Risk Matrix Assessment (5×5) + CRUD modals
 */
import { useMemo, useState, useCallback, useEffect } from "react";
import { C, RISK_CATEGORIES, RISK_LIKELIHOOD, RISK_IMPACT, SPACE, RADIUS, FONT, TERM_NOTES } from "./gap.ui.constants.js";
import { Card, Tag, KPIBar, Field, TA, Input, Btn, Modal } from "./gap.atoms.jsx";

const riskLevel = (l, i) => {
  const v = l * i;
  if (v >= 16) return { label: "NGHIÊM TRỌNG", col: C.red, bg: `${C.red}15`, icon: "🔴" };
  if (v >= 9) return { label: "CAO", col: C.orange, bg: `${C.orange}12`, icon: "🟠" };
  if (v >= 4) return { label: "TRUNG BÌNH", col: C.amber, bg: `${C.amber}12`, icon: "🟡" };
  return { label: "THẤP", col: C.green, bg: `${C.green}12`, icon: "🟢" };
};

/** Tách văn bản và bọc từ khóa (vd: MEPS) trong span có title = ghi chú, hiển thị (...) để mở ghi chú */
function renderTextWithTermNote(text, termKey = "MEPS") {
  const note = TERM_NOTES[termKey];
  if (!text || !note) return text;
  const re = new RegExp(`(${termKey})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) => {
    if (part.toUpperCase() === termKey.toUpperCase()) {
      return (
        <span
          key={i}
          title={note}
          style={{
            borderBottom: "1px dotted currentColor",
            cursor: "help",
            textDecoration: "none",
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

const EMPTY_RISK = {
  id: "",
  risk: "",
  ref: "",
  likelihood: 0,
  impact: 0,
  control: "",
  recommendation: "",
  deadline: "",
};

export default function StepRisk({ survey, setSurvey }) {
  const [open, setOpen] = useState({ "RISK-LEG": true });
  const [riskModal, setRiskModal] = useState(null); // { mode: 'add'|'edit', categoryId, item?, index? }
  const rd = survey.risk_assessments || {};
  const riskItems = survey.risk_items || {};

  const setRisk = (id, field, val) =>
    setSurvey((p) => ({
      ...p,
      risk_assessments: { ...p.risk_assessments, [id]: { ...p.risk_assessments[id], [field]: val } },
    }));

  const getItems = useCallback(
    (cat) => {
      const custom = riskItems[cat.id];
      if (custom && custom.length > 0) return custom;
      return (cat.items || []).map((i) => ({
        ...i,
        likelihood: rd[i.id]?.likelihood ?? 0,
        impact: rd[i.id]?.impact ?? 0,
        control: rd[i.id]?.control ?? "",
        recommendation: rd[i.id]?.recommendation ?? "",
        deadline: rd[i.id]?.deadline ?? "",
      }));
    },
    [riskItems, rd]
  );

  const setRiskItems = useCallback(
    (catId, items) => {
      setSurvey((p) => {
        const next = { ...p, risk_items: { ...p.risk_items, [catId]: items } };
        const assessments = { ...next.risk_assessments };
        items.forEach((it) => {
          assessments[it.id] = {
            likelihood: it.likelihood ?? 0,
            impact: it.impact ?? 0,
            control: it.control ?? "",
            recommendation: it.recommendation ?? "",
            deadline: it.deadline ?? "",
          };
        });
        next.risk_assessments = assessments;
        return next;
      });
    },
    [setSurvey]
  );

  const addRisk = useCallback(
    (catId) => {
      const cat = RISK_CATEGORIES.find((c) => c.id === catId);
      const current = getItems(cat);
      const prefix = catId === "RISK-LEG" ? "RL" : catId === "RISK-OPS" ? "RO" : catId === "RISK-DATA" ? "RD" : catId === "RISK-ORG" ? "ROG" : "RS";
      const maxNum = current.reduce((m, r) => {
        const n = parseInt((r.id || "").replace(/\D/g, ""), 10);
        return isNaN(n) ? m : Math.max(m, n);
      }, 0);
      setRiskModal({
        mode: "add",
        categoryId: catId,
        item: { ...EMPTY_RISK, id: `${prefix}-${String(maxNum + 1).padStart(2, "0")}` },
      });
    },
    [getItems]
  );

  const editRisk = useCallback((catId, item, index) => {
    setRiskModal({ mode: "edit", categoryId: catId, item: { ...item }, index });
  }, []);

  const deleteRisk = useCallback(
    (catId, item) => {
      if (!confirm(`Xóa rủi ro "${(item.risk || "").slice(0, 50)}..."?`)) return;
      const cat = RISK_CATEGORIES.find((c) => c.id === catId);
      const current = getItems(cat);
      const next = current.filter((r) => r.id !== item.id);
      setRiskItems(catId, next);
    },
    [getItems, setRiskItems]
  );

  const saveRiskModal = useCallback(
    (form) => {
      if (!riskModal?.categoryId) return;
      const cat = RISK_CATEGORIES.find((c) => c.id === riskModal.categoryId);
      const current = getItems(cat);
      if (riskModal.mode === "add") {
        setRiskItems(riskModal.categoryId, [...current, { ...form }]);
      } else {
        const next = current.map((r, i) => (i === riskModal.index ? { ...form } : r));
        setRiskItems(riskModal.categoryId, next);
      }
      setRiskModal(null);
    },
    [riskModal, getItems, setRiskItems]
  );

  const stats = useMemo(() => {
    const all = RISK_CATEGORIES.flatMap((c) => getItems(c));
    const assessed = all.filter((r) => (r.likelihood || 0) > 0);
    const high = assessed.filter((r) => (r.likelihood || 0) * (r.impact || 0) >= 9).length;
    const crit = assessed.filter((r) => (r.likelihood || 0) * (r.impact || 0) >= 16).length;
    return { total: all.length, assessed: assessed.length, high, crit };
  }, [rd, riskItems, getItems]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <KPIBar
        items={[
          { label: "Tổng rủi ro", value: `${stats.assessed}/${stats.total}`, col: C.blue, icon: "📊" },
          { label: "Nghiêm trọng", value: stats.crit, col: C.red, icon: "🔴" },
          { label: "Cao", value: stats.high - stats.crit, col: C.orange, icon: "🟠" },
        ]}
      />

      <div style={{ background: C.bg2, borderRadius: 9, padding: 12, border: `1px solid ${C.bd0}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 8 }}>
          📐 Mức độ rủi ro = Khả năng xảy ra (L) × Ảnh hưởng (I) — thang 1–5
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            ["1–3", "🟢 THẤP — Chấp nhận, theo dõi định kỳ", C.green],
            ["4–8", "🟡 TRUNG BÌNH — Kiểm soát, lập kế hoạch", C.amber],
            ["9–15", "🟠 CAO — Hành động trong 3 tháng", C.orange],
            ["16–25", "🔴 NGHIÊM TRỌNG — Hành động ngay", C.red],
          ].map(([r, l, c]) => (
            <div
              key={r}
              style={{
                background: `${c}12`,
                border: `1px solid ${c}25`,
                borderRadius: 5,
                padding: "4px 9px",
                fontSize: 13,
                color: c,
                fontWeight: 700,
              }}
            >
              L×I = {r} → {l}
            </div>
          ))}
        </div>
      </div>

      {RISK_CATEGORIES.map((cat) => {
        const isOpen = !!open[cat.id];
        const catItems = getItems(cat);
        const assessed = catItems.filter((r) => (r.likelihood || 0) > 0);
        const topRisk = assessed.reduce((a, r) => {
          const v = (r.likelihood || 0) * (r.impact || 0);
          return v > a ? v : a;
        }, 0);
        const topRL = topRisk > 0 ? riskLevel(Math.min(topRisk, 5), 1) : null;

        return (
          <div
            key={cat.id}
            style={{
              background: C.bg2,
              borderRadius: 10,
              overflow: "hidden",
              border: `1px solid ${cat.col}30`,
            }}
          >
            <div
              onClick={() => setOpen((p) => ({ ...p, [cat.id]: !isOpen }))}
              style={{
                padding: "10px 14px",
                background: `${cat.col}15`,
                borderBottom: isOpen ? `1px solid ${cat.col}25` : "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani',sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: C.t0,
                  flex: 1,
                }}
              >
                {cat.name}
              </span>
              <span style={{ fontSize: 13, color: C.t2 }}>
                {assessed.length}/{catItems.length} đánh giá
              </span>
              {topRisk >= 9 && (
                <Tag c={topRisk >= 16 ? C.red : C.orange}>
                  {topRisk >= 16 ? "🔴 Có rủi ro nghiêm trọng" : "🟠 Có rủi ro cao"}
                </Tag>
              )}
              <span style={{ color: C.t2 }}>{isOpen ? "▼" : "▶"}</span>
            </div>

            {isOpen && (
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                  <Btn v="blue" sz="sm" onClick={() => addRisk(cat.id)}>
                    ＋ Thêm rủi ro
                  </Btn>
                </div>
                {catItems.map((risk, idx) => {
                  const r = risk;
                  const l = r.likelihood || 0;
                  const imp = r.impact || 0;
                  const lxi = l && imp ? l * imp : 0;
                  const rl = lxi ? riskLevel(l, imp) : null;

                  return (
                    <div
                      key={r.id}
                      style={{
                        background: lxi >= 9 ? `${rl?.col}08` : C.bg3,
                        border: `1px solid ${lxi >= 9 ? rl?.col : C.bd2}25`,
                        borderRadius: 8,
                        padding: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <span
                          style={{
                            fontFamily: "'Fira Code',monospace",
                            fontSize: 12.5,
                            color: C.blueL,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {risk.id}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, color: C.t0, fontWeight: 500, lineHeight: 1.5 }}>
                            {renderTextWithTermNote(risk.risk)}
                          </div>
                          <Tag c={C.red} sx={{ marginTop: 3 }}>
                            ⚖️ {risk.ref}
                          </Tag>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {lxi > 0 && (
                            <div style={{ textAlign: "center", flexShrink: 0 }}>
                              <div
                                style={{
                                  background: rl.bg,
                                  border: `1px solid ${rl.col}30`,
                                  borderRadius: 6,
                                  padding: "4px 10px",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: rl.col,
                                    fontFamily: "'Rajdhani',sans-serif",
                                  }}
                                >
                                  {lxi}
                                </div>
                                <div style={{ fontSize: 11.5, color: rl.col, fontWeight: 700 }}>
                                  {rl.label}
                                </div>
                              </div>
                            </div>
                          )}
                          <Btn v="ghost" sz="sm" onClick={() => editRisk(cat.id, r, idx)}>
                            Sửa
                          </Btn>
                          <Btn v="ghost" sz="sm" onClick={() => deleteRisk(cat.id, r)} sx={{ color: C.redL }}>
                            Xóa
                          </Btn>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.t2,
                              marginBottom: 4,
                              textTransform: "uppercase",
                            }}
                          >
                            Khả năng xảy ra (L)
                          </div>
                          <div style={{ display: "flex", gap: 3 }}>
                            {[1, 2, 3, 4, 5].map((v) => {
                              const c = v <= 2 ? C.tealL : v <= 3 ? C.amber : v <= 4 ? C.orange : C.red;
                              return (
                                <button
                                  key={v}
                                  onClick={() => {
                                    const items = getItems(cat);
                                    const out = items.map((it, i) =>
                                      i === idx ? { ...it, likelihood: v } : it
                                    );
                                    setRiskItems(cat.id, out);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "5px 0",
                                    borderRadius: 5,
                                    border: `1px solid ${c}40`,
                                    background: v === l ? c : `${c}10`,
                                    color: v === l ? "#fff" : c,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  {v}
                                </button>
                              );
                            })}
                          </div>
                          {l > 0 && (
                            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>
                              {RISK_LIKELIHOOD[l - 1]?.l}
                            </div>
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.t2,
                              marginBottom: 4,
                              textTransform: "uppercase",
                            }}
                          >
                            Mức độ ảnh hưởng (I)
                          </div>
                          <div style={{ display: "flex", gap: 3 }}>
                            {[1, 2, 3, 4, 5].map((v) => {
                              const c = v <= 2 ? C.tealL : v <= 3 ? C.amber : v <= 4 ? C.orange : C.red;
                              return (
                                <button
                                  key={v}
                                  onClick={() => {
                                    const items = getItems(cat);
                                    const out = items.map((it, i) =>
                                      i === idx ? { ...it, impact: v } : it
                                    );
                                    setRiskItems(cat.id, out);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "5px 0",
                                    borderRadius: 5,
                                    border: `1px solid ${c}40`,
                                    background: v === imp ? c : `${c}10`,
                                    color: v === imp ? "#fff" : c,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  {v}
                                </button>
                              );
                            })}
                          </div>
                          {imp > 0 && (
                            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>
                              {RISK_IMPACT[imp - 1]?.l}
                            </div>
                          )}
                        </div>
                      </div>

                      {lxi > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <div
                              style={{
                                fontSize: 11.5,
                                color: C.t2,
                                fontWeight: 700,
                                marginBottom: 3,
                                textTransform: "uppercase",
                              }}
                            >
                              Biện pháp kiểm soát hiện tại
                            </div>
                            <textarea
                              value={r.control || ""}
                              onChange={(e) => {
                                const items = getItems(cat);
                                const out = items.map((it, i) =>
                                  i === idx ? { ...it, control: e.target.value } : it
                                );
                                setRiskItems(cat.id, out);
                              }}
                              placeholder="Mô tả biện pháp kiểm soát đang áp dụng..."
                              rows={2}
                              style={{
                                width: "100%",
                                background: C.bg4,
                                border: `1px solid ${C.bd0}`,
                                borderRadius: 5,
                                padding: "5px 8px",
                                color: C.t0,
                                fontSize: 13.5,
                                resize: "vertical",
                                fontFamily: "inherit",
                              }}
                            />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 11.5,
                                color: C.t2,
                                fontWeight: 700,
                                marginBottom: 3,
                                textTransform: "uppercase",
                              }}
                            >
                              Đề xuất cải thiện
                            </div>
                            <textarea
                              value={r.recommendation || ""}
                              onChange={(e) => {
                                const items = getItems(cat);
                                const out = items.map((it, i) =>
                                  i === idx ? { ...it, recommendation: e.target.value } : it
                                );
                                setRiskItems(cat.id, out);
                              }}
                              placeholder={
                                lxi >= 9
                                  ? "Hành động ưu tiên cần thực hiện ngay..."
                                  : "Đề xuất cải thiện..."
                              }
                              rows={2}
                              style={{
                                width: "100%",
                                background: lxi >= 9 ? `${rl?.col}08` : C.bg4,
                                border: `1px solid ${lxi >= 9 ? rl?.col : C.bd0}30`,
                                borderRadius: 5,
                                padding: "5px 8px",
                                color: C.t0,
                                fontSize: 13.5,
                                resize: "vertical",
                                fontFamily: "inherit",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <RiskModal
        open={!!riskModal}
        mode={riskModal?.mode}
        categoryId={riskModal?.categoryId}
        initial={riskModal?.item}
        onSave={saveRiskModal}
        onClose={() => setRiskModal(null)}
      />
    </div>
  );
}

function RiskModal({ open, mode, categoryId, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_RISK);
  const cat = RISK_CATEGORIES.find((c) => c.id === categoryId);
  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY_RISK, ...initial } : { ...EMPTY_RISK });
  }, [open, initial]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id?.trim() || !form.risk?.trim()) return;
    onSave(form);
  };

  if (!open) return null;
  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Sửa rủi ro" : "Thêm rủi ro mới"}
      width={560}
    >
      {cat && (
        <p style={{ color: C.t2, fontSize: 14, marginBottom: SPACE.lg }}>
          Nhóm: <strong style={{ color: C.t0 }}>{cat.name}</strong>
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
        <Field label="Mã rủi ro (ID)">
          <Input
            value={form.id}
            onChange={(v) => handleChange("id", v)}
            placeholder="vd: RL-07, RO-10"
            disabled={isEdit}
          />
        </Field>
        <Field label="Nội dung rủi ro">
          <TA
            value={form.risk}
            onChange={(v) => handleChange("risk", v)}
            placeholder="Mô tả rủi ro ảnh hưởng đến EnMS..."
            rows={3}
          />
        </Field>
        <Field label="Cơ sở đánh giá / Tham chiếu (Luật, TT, ISO...)">
          <Input
            value={form.ref}
            onChange={(v) => handleChange("ref", v)}
            placeholder="vd: TT 25/2020/TT-BCT §18, ISO 50001 §8.1"
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE.md }}>
          <Field label="Khả năng xảy ra (L) 1–5">
            <select
              value={form.likelihood || 0}
              onChange={(e) => handleChange("likelihood", Number(e.target.value))}
              style={{
                minHeight: 42,
                padding: "10px 14px",
                background: C.bg3,
                border: `1px solid ${C.bd0}`,
                borderRadius: RADIUS.md,
                color: C.t0,
                fontSize: FONT.body,
                width: "100%",
              }}
            >
              <option value={0}>— Chọn —</option>
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v} — {RISK_LIKELIHOOD[v - 1]?.l?.slice(4) || ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mức độ ảnh hưởng (I) 1–5">
            <select
              value={form.impact || 0}
              onChange={(e) => handleChange("impact", Number(e.target.value))}
              style={{
                minHeight: 42,
                padding: "10px 14px",
                background: C.bg3,
                border: `1px solid ${C.bd0}`,
                borderRadius: RADIUS.md,
                color: C.t0,
                fontSize: FONT.body,
                width: "100%",
              }}
            >
              <option value={0}>— Chọn —</option>
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v} — {RISK_IMPACT[v - 1]?.l?.slice(4) || ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Hành động kiểm soát / Đối chứng">
          <TA
            value={form.control}
            onChange={(v) => handleChange("control", v)}
            placeholder="Biện pháp kiểm soát hiện tại..."
            rows={2}
          />
        </Field>
        <Field label="Đề xuất cải thiện">
          <TA
            value={form.recommendation}
            onChange={(v) => handleChange("recommendation", v)}
            placeholder="Đề xuất hành động..."
            rows={2}
          />
        </Field>
        <Field label="Thời hạn (tùy chọn)">
          <Input
            type="text"
            value={form.deadline || ""}
            onChange={(v) => handleChange("deadline", v)}
            placeholder="vd: 30/06/2025 hoặc Q2/2025"
          />
        </Field>
        <div style={{ display: "flex", gap: SPACE.md, justifyContent: "flex-end", marginTop: SPACE.lg }}>
          <Btn type="button" v="ghost" sz="md" onClick={onClose}>
            Hủy
          </Btn>
          <Btn type="submit" v="primary" sz="md" disabled={!form.id?.trim() || !form.risk?.trim()}>
            {isEdit ? "Lưu thay đổi" : "Thêm rủi ro"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
