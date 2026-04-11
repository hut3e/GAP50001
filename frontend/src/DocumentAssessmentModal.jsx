import React, { useState, useEffect } from "react";
import { C, GAP_CHECKLIST as DEFAULT_CHECKLIST, SCORE_CFG, RADIUS, FONT, SPACE } from "./gap.ui.constants.js";
import { Btn, Modal, QuickHints } from "./gap.atoms.jsx";

const COMMON_NOTES_HINTS = ["Đã có tài liệu", "Đang dự thảo", "Chưa ban hành", "Đã triển khai thực tế nhưng chưa có hồ sơ", "Có hồ sơ nhưng chưa đầy đủ", "Chưa thực hiện", "Không có bằng chứng"];
const COMMON_REC_HINTS = ["Hoàn thiện quy trình tài liệu", "Trình lãnh đạo phê duyệt", "Bổ sung kế hoạch đào tạo", "Triển khai lắp đặt đồng hồ đo", "Ban hành chính thức", "Phổ biến cho CBCNV", "Lập hồ sơ theo dõi định kỳ"];

export default function DocumentAssessmentModal({ survey, setSurvey, open, onClose, checklist = DEFAULT_CHECKLIST }) {
  const [localResp, setLocalResp] = useState({});

  useEffect(() => {
    if (open && survey.responses) {
      setLocalResp(JSON.parse(JSON.stringify(survey.responses || {})));
    }
  }, [open, survey.responses]);

  const appendHint = (id, field, hint) => {
    setLocalResp(prev => {
      const currentVal = prev[id]?.[field] || "";
      const newVal = currentVal ? `${currentVal}\n- ${hint}` : `- ${hint}`;
      return {
        ...prev,
        [id]: {
          ...(prev[id] || { score: 0 }),
          [field]: newVal
        }
      };
    });
  };

  const setRespField = (id, field, value) => {
    setLocalResp(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { score: 0 }),
        [field]: value
      }
    }));
  };

  const setExtraNote = (id, index, value) => {
    setLocalResp(prev => {
      const arr = [...(prev[id]?.extra_notes || [])];
      arr[index] = value;
      return { ...prev, [id]: { ...(prev[id] || {}), extra_notes: arr } };
    });
  };

  const addExtraNote = (id) => {
    setLocalResp(prev => {
      const arr = [...(prev[id]?.extra_notes || []), ""];
      return { ...prev, [id]: { ...(prev[id] || {}), extra_notes: arr } };
    });
  };

  const removeExtraNote = (id, index) => {
    setLocalResp(prev => {
      const arr = [...(prev[id]?.extra_notes || [])];
      arr.splice(index, 1);
      return { ...prev, [id]: { ...(prev[id] || {}), extra_notes: arr } };
    });
  };

  const handleSave = () => {
    setSurvey(prev => ({ ...prev, responses: localResp }));
    onClose();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Đánh giá nhanh Báo cáo Hồ sơ tài liệu (Nhập liệu hàng loạt)" width={"95%"}>
      <div style={{ background: C.bg2, borderRadius: RADIUS.lg, border: `2px solid ${C.bd0}`, display: "flex", flexDirection: "column", height: "80vh" }}>
        
        <div style={{ padding: SPACE.lg, borderBottom: `1px solid ${C.bd0}`, background: `${C.blue}10` }}>
          <div style={{ fontSize: FONT.label, color: C.t2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Biểu mẫu đánh giá Hồ sơ tài liệu theo ISO 50001:2018</div>
          <p style={{ color: C.t1, margin: 0, marginTop: 4, fontSize: FONT.body, lineHeight: 1.5 }}>
            Bảng nhập liệu nhanh với các trường: Mô tả hiện trạng, Yêu cầu khi áp dụng HTQLNL, và Ghi chú (được định dạng tương ứng với mẫu Báo cáo Hồ sơ tài liệu đánh giá GAP). Dữ liệu này sẽ tự động liên kết với từng điều khoản bên ngoài.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: SPACE.md }}>
          <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: C.bg2, zIndex: 10 }}>
              <tr style={{ background: C.bg3, borderBottom: `2px solid ${C.bd0}` }}>
                <th style={{ textAlign: "left", padding: "12px 10px", width: 300, borderRight: `1px solid ${C.bd1}` }}>Điều khoản ISO 50001:2018</th>
                <th style={{ textAlign: "left", padding: "12px 10px", width: 100, borderRight: `1px solid ${C.bd1}` }}>Điểm</th>
                <th style={{ textAlign: "left", padding: "12px 10px", width: "25%", borderRight: `1px solid ${C.bd1}` }}>Mô tả hiện trạng tại doanh nghiệp</th>
                <th style={{ textAlign: "left", padding: "12px 10px", width: "25%", borderRight: `1px solid ${C.bd1}` }}>Yêu cầu khi áp dụng HTQLNL</th>
                <th style={{ textAlign: "left", padding: "12px 10px", width: "25%" }}>Ghi chú bổ sung</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item, idx) => {
                const r = localResp[item.id] || {};
                const sc = r.score || 0;
                const scfg = SCORE_CFG[sc] || SCORE_CFG[0];
                const extras = Array.isArray(r.extra_notes) ? r.extra_notes : [];
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.bd1}`, background: idx % 2 === 0 ? C.bg2 : C.bg3 }}>
                    <td style={{ padding: "10px", borderRight: `1px solid ${C.bd1}`, verticalAlign: "top" }}>
                      <div style={{ fontWeight: "bold", color: C.blue, fontSize: FONT.subheading }}>{item.id}</div>
                      <div style={{ color: C.t0, fontSize: FONT.body, lineHeight: 1.4, marginTop: 4 }}>{item.title}</div>
                    </td>
                    <td style={{ padding: "10px", borderRight: `1px solid ${C.bd1}`, verticalAlign: "top" }}>
                      <select value={sc} onChange={e => setRespField(item.id, "score", parseInt(e.target.value))}
                        style={{ width: "100%", padding: "6px", borderRadius: RADIUS.sm, border: `1px solid ${scfg.col}90`, background: sc > 0 ? scfg.bg : C.bg4, color: sc > 0 ? scfg.col : C.t1, fontWeight: "bold" }}>
                        {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v === 0 ? "—" : v}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "10px", borderRight: `1px solid ${C.bd1}`, verticalAlign: "top" }}>
                      <textarea value={r.note || ""} onChange={e => setRespField(item.id, "note", e.target.value)} rows={4}
                        placeholder="Mô tả hiện trạng..."
                        style={{ width: "100%", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, padding: "8px", color: C.t0, fontSize: FONT.body, resize: "vertical" }} />
                      <QuickHints hints={COMMON_NOTES_HINTS} onSelect={h => appendHint(item.id, "note", h)} />
                    </td>
                    <td style={{ padding: "10px", borderRight: `1px solid ${C.bd1}`, verticalAlign: "top" }}>
                      <textarea value={r.recommendation || ""} onChange={e => setRespField(item.id, "recommendation", e.target.value)} rows={4}
                        placeholder="Yêu cầu cần áp dụng..."
                        style={{ width: "100%", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, padding: "8px", color: C.t0, fontSize: FONT.body, resize: "vertical" }} />
                      <QuickHints hints={COMMON_REC_HINTS} onSelect={h => appendHint(item.id, "recommendation", h)} />
                    </td>
                    <td style={{ padding: "10px", verticalAlign: "top" }}>
                      {extras.map((note, nIdx) => (
                        <div key={nIdx} style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                          <textarea value={note || ""} onChange={e => setExtraNote(item.id, nIdx, e.target.value)} rows={2}
                            placeholder="Ghi chú..."
                            style={{ flex: 1, background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: RADIUS.sm, padding: "6px", color: C.t0, fontSize: FONT.body, resize: "vertical" }} />
                          <button onClick={() => removeExtraNote(item.id, nIdx)} style={{ padding: "4px 8px", background: C.red+"30", color: C.redL, border: `1px solid ${C.red}`, borderRadius: RADIUS.sm, cursor: "pointer" }}>×</button>
                        </div>
                      ))}
                      <button onClick={() => addExtraNote(item.id)} style={{ padding: "6px 10px", background: C.blue+"20", color: C.blueL, border: `1px solid ${C.blue}50`, borderRadius: RADIUS.sm, cursor: "pointer", fontSize: FONT.body, width: "100%" }}>+ Thêm ghi chú</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: SPACE.md, borderTop: `1px solid ${C.bd0}`, display: "flex", justifyContent: "flex-end", gap: SPACE.sm, background: C.bg2 }}>
          <Btn v="ghost" sz="md" onClick={onClose}>Hủy bỏ</Btn>
          <Btn v="primary" sz="md" onClick={handleSave}>Lưu toàn bộ thay đổi</Btn>
        </div>
      </div>
    </Modal>
  );
}
