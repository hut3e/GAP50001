import React, { useState } from "react";
import { C, SPACE, RADIUS, FONT, METER_LOAD_TYPES, METER_TYPES, METER_BRANDS, METER_COLLECT_METHODS, METER_FREQUENCIES, METER_CALIB_STATUSES } from "./gap.ui.constants.js";
import { Btn, Input, Sel, Field, Grid, Card, Tag, Modal, Rule } from "./gap.atoms.jsx";

const EMPTY_METER = {
  id: "",
  name: "",
  load_type: "",
  type: "",
  brand: "",
  collect_method: "",
  frequency: "",
  calib_status: "",
  notes: ""
};

export default function StepMeters({ survey, setSurvey }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const meters = Array.isArray(survey.meters) ? survey.meters : [];

  const handleOpen = (item = null) => {
    if (item) {
      setEditing({ ...item });
    } else {
      setEditing({ ...EMPTY_METER, id: "METER-" + Date.now().toString(36).toUpperCase() });
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!editing.name.trim()) {
      alert("Vui lòng nhập Tên đồng hồ.");
      return;
    }
    setSurvey(prev => {
      const arr = Array.isArray(prev.meters) ? [...prev.meters] : [];
      const idx = arr.findIndex(x => x.id === editing.id);
      if (idx >= 0) arr[idx] = editing;
      else arr.push(editing);
      return { ...prev, meters: arr };
    });
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Xóa đồng hồ này?")) return;
    setSurvey(prev => ({
      ...prev,
      meters: (prev.meters || []).filter(x => x.id !== id)
    }));
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: SPACE.lg }}>
        <div style={{ fontSize: FONT.title, color: C.t0, fontWeight: 600 }}>Cấu trúc thiết bị đo lường ({meters.length})</div>
        <Btn v="blue" sz="sm" onClick={() => handleOpen()} sx={{ boxShadow: `0 4px 12px ${C.blue}40` }}>
          + Thêm Đồng hồ
        </Btn>
      </div>

      <div style={{ background: C.bg2, borderRadius: RADIUS.lg, border: `1px solid ${C.bd0}`, padding: SPACE.md }}>
        <div style={{ color: C.t2, fontSize: FONT.body, marginBottom: SPACE.md, display: "flex", gap: SPACE.sm, alignItems: "center" }}>
          <span>💡</span> <i>Cập nhật danh sách đồng hồ để đưa vào báo cáo và theo dõi tình trạng thu thập dữ liệu năng lượng.</i>
        </div>

        {meters.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.t2, border: `1px dashed ${C.bd1}`, borderRadius: RADIUS.md }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎛️</div>
            Chưa có thông tin đồng hồ / thiết bị đo lường nào được ghi nhận.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 900, width: "100%", borderCollapse: "collapse", fontSize: FONT.body, color: C.t0 }}>
              <thead>
                <tr style={{ background: C.bg3, borderBottom: `2px solid ${C.bd0}`, textAlign: "left" }}>
                  <th style={{ padding: "12px", borderTopLeftRadius: RADIUS.sm }}>Tên đồng hồ</th>
                  <th style={{ padding: "12px" }}>Phụ tải</th>
                  <th style={{ padding: "12px" }}>Loại / Hãng</th>
                  <th style={{ padding: "12px" }}>Thu thập / Tần suất</th>
                  <th style={{ padding: "12px" }}>Kiểm định</th>
                  <th style={{ padding: "12px", textAlign: "right", borderTopRightRadius: RADIUS.sm }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {meters.map(m => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${C.bd1}`, transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = `${C.bd0}`} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px", fontWeight: 600, color: C.blueL }}>{m.name}</td>
                    <td style={{ padding: "12px", color: C.t1 }}>{m.load_type || "—"}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ color: C.t0 }}>{m.type || "—"}</div>
                      <div style={{ fontSize: FONT.caption, color: C.t2 }}>{m.brand || "—"}</div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ color: C.t0 }}>{m.collect_method || "—"}</div>
                      <div style={{ fontSize: FONT.caption, color: C.t2 }}>{m.frequency || "—"}</div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {m.calib_status ? (
                        <Tag sm c={m.calib_status.includes("Chưa") ? C.orange : C.teal}>{m.calib_status}</Tag>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <Btn v="ghost" sz="sm" onClick={() => handleOpen(m)} sx={{ padding: "4px 8px", marginRight: 4 }}>Sửa</Btn>
                      <Btn v="ghost" sz="sm" onClick={() => handleDelete(m.id)} sx={{ padding: "4px 8px", color: C.redL }}>Xóa</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Thông tin Kỹ thuật Đồng hồ" width={680}>
        {editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.lg }}>
            <Field label="Tên đồng hồ" required>
              <Input
                value={editing.name}
                onChange={v => setEditing({ ...editing, name: v })}
                placeholder="VD: Công tơ tổng TBA 1"
              />
            </Field>

            <Grid cols={2} gap={SPACE.xl}>
              <Field label="Phụ tải đo">
                <Sel
                  value={editing.load_type}
                  onChange={v => setEditing({ ...editing, load_type: v })}
                  options={METER_LOAD_TYPES}
                  placeholder="Chọn phân loại..."
                />
              </Field>
              <Field label="Loại đồng hồ đo">
                <Sel
                  value={editing.type}
                  onChange={v => setEditing({ ...editing, type: v })}
                  options={METER_TYPES}
                  placeholder="Chọn loại..."
                />
              </Field>
            </Grid>

            <Grid cols={2} gap={SPACE.xl}>
              <Field label="Hãng sản xuất">
                <Sel
                  value={editing.brand}
                  onChange={v => setEditing({ ...editing, brand: v })}
                  options={METER_BRANDS}
                  placeholder="Chọn hãng..."
                />
              </Field>
              <Field label="Tình trạng kiểm định/hiệu chuẩn">
                <Sel
                  value={editing.calib_status}
                  onChange={v => setEditing({ ...editing, calib_status: v })}
                  options={METER_CALIB_STATUSES}
                  placeholder="Chọn tình trạng..."
                />
              </Field>
            </Grid>

            <Rule label="Dữ liệu & Thu thập" />

            <Grid cols={2} gap={SPACE.xl}>
              <Field label="Phương thức thu thập">
                <Sel
                  value={editing.collect_method}
                  onChange={v => setEditing({ ...editing, collect_method: v })}
                  options={METER_COLLECT_METHODS}
                  placeholder="Chọn phương thức..."
                />
              </Field>
              <Field label="Tần suất chốt dữ liệu">
                <Sel
                  value={editing.frequency}
                  onChange={v => setEditing({ ...editing, frequency: v })}
                  options={METER_FREQUENCIES}
                  placeholder="Chọn tần suất..."
                />
              </Field>
            </Grid>
            
            <Field label="Ghi chú thêm (Vị trí, SN...)">
              <Input
                value={editing.notes}
                onChange={v => setEditing({ ...editing, notes: v })}
                placeholder="VD: Lắp tại tủ MSB, Serial Number..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: SPACE.md, marginTop: SPACE.lg, paddingTop: SPACE.lg, borderTop: `1px solid ${C.bd0}` }}>
              <Btn v="ghost" sz="md" onClick={() => setModalOpen(false)}>Hủy</Btn>
              <Btn v="blue" sz="md" onClick={handleSave}>Lưu thông tin</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
