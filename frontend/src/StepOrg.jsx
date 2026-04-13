/**
 * ISO50001Gap — frontend/StepOrg.jsx
 * Step 1: Thông tin tổ chức, cơ sở, đoàn khảo sát, mục tiêu + Phụ lục 14 CRUD
 */
import { useState, useRef, useEffect } from "react";
import { C, FONT, EXEC_SUMMARY_STANDARD_ITEMS, ENERGY_CONVERSION_FACTORS, VERIFIER_ORGS, VERIFIER_PROGRAMS } from "./gap.ui.constants.js";
import { Card, Field, Grid, Input, TA, Sel, Tag, Btn, Modal, DatePicker, Checkbox } from "./gap.atoms.jsx";
import RoadmapGantt from "./RoadmapGantt.jsx";

const LEGAL_STATUS_OPT = [
  ["pending", "○ Chưa xác định"],
  ["compliant", "✓ Tuân thủ"],
  ["partial", "⚠ Một phần"],
  ["non_compliant", "✗ Chưa tuân thủ"],
  ["not_applicable", "— Không áp dụng"],
];
const DOC_TYPES = ["Luật", "Nghị định", "Thông tư", "QĐ TTg", "QĐ BCT", "Khác"];

const INDUSTRIES = [
  "", "Sản xuất xi-măng / Khai thác khoáng sản", "Sản xuất thép / Luyện kim / Cơ khí chế tạo", "Sản xuất giấy / Bột giấy / Bao bì",
  "Sản xuất hóa chất / Phân bón / Hóa dầu", "Sản xuất nhựa / Cao su / Film", "Công nghiệp Dệt may / Kéo sợi / Nhuộm",
  "Thực phẩm & Đồ uống / Bia rượu / Nước giải khát", "Điện tử / Linh kiện bo mạch / Bán dẫn", "Sản xuất Gỗ / Nội thất / Ván ép",
  "Sản xuất gạch ngói / Cung cấp vật liệu XD", "Chế biến thủy hải sản / Kho lạnh", "Khách sạn / Tòa nhà thương mại / Siêu thị",
  "Bệnh viện / Các cơ sở y tế", "Cảng biển / Vận tải / Logistics", "Nông nghiệp công nghệ cao / Trang trại lớn",
  "Sản xuất lắp ráp Ô tô / Phụ tùng", "Năng lượng tái tạo (Điện gió, áp mái)", "Cấp thoát nước / Xử lý môi trường", "Khác",
];
const CERT_STATUSES = [
  ["Chưa có chứng nhận ISO 50001", "Chưa có chứng nhận ISO 50001"],
  ["Đang xây dựng EnMS", "Đang xây dựng EnMS (In Progress)"],
  ["Đã có chứng nhận, cần cải tiến", "Đã có — Cần cải tiến (Surveillance)"],
  ["Hết hạn chứng nhận", "Đã hết hạn — Cần tái chứng nhận"],
];
const PHASES = [
  ["Gap Analysis (Khảo sát khoảng cách)", "🔍 Gap Analysis (Khảo sát khoảng cách)"],
  ["Tư vấn xây dựng EnMS", "🏗️ Tư vấn xây dựng EnMS từ đầu"],
  ["Đánh giá nội bộ EnMS", "✔️ Đánh giá nội bộ EnMS"],
  ["Chuẩn bị chứng nhận", "🏅 Chuẩn bị chứng nhận ISO 50001"],
  ["Tái chứng nhận / Giám sát", "🔄 Tái chứng nhận / Surveillance"],
];

const TRANSPORT_MODES = [
  ["air", "✈ Đường không"],
  ["road", "🚗 Đường bộ"],
  ["water", "🚢 Đường thủy"],
];

const TRANSPORT_PROVIDERS_VN = [
  "Vietnam Airlines", "Vietjet Air", "Bamboo Airways", "Vietravel Airlines",
  "Đường sắt Việt Nam (SE, TN, tàu nhanh)", "FUTA Bus Lines (Phương Trang)", "Kumho Việt Thanh",
  "Mai Linh Bus", "Thanh Buoi", "Xe hợp đồng dịch vụ (Limousine 9–16 chỗ)",
  "Taxi Mai Linh", "Taxi Vinasun", "Taxi G7", "Taxi Sun", "GrabCar / GrabTaxi", "BeCar", "Gojek",
  "Ô tô công ty", "Khác",
];

const HOTEL_PROVIDERS_VN = [
  "Vinpearl / VinHolidays", "FLC / FLC Hotels & Resorts", "Mường Thanh",
  "Saigontourist Hotels", "Novotel / Accor", "Sheraton", "Hilton", "InterContinental",
  "Khách sạn địa phương 2–3★", "Khách sạn địa phương 4–5★", "Homestay / Resort", "Khác",
];

const REPRESENTATIVE_POSITIONS = [
  ["", "— Chọn chức vụ —"],
  ["Chủ tịch Hội đồng quản trị", "Chủ tịch Hội đồng quản trị"],
  ["Tổng Giám đốc", "Tổng Giám đốc"],
  ["Giám đốc", "Giám đốc cơ sở / Nhà máy"],
  ["Phó Tổng Giám đốc", "Phó Tổng Giám đốc"],
  ["Phó Giám đốc", "Phó Giám đốc Thường trực / Kỹ thuật"],
  ["Xưởng trưởng", "Xưởng trưởng / Giám đốc xưởng"],
  ["Trưởng Ban năng lượng (EMR)", "Trưởng Ban năng lượng (EMR)"],
  ["Trưởng Phòng Kỹ thuật", "Trưởng Phòng Kỹ thuật / Trưởng phòng Công nghệ"],
  ["Trưởng Cơ điện", "Trưởng Cơ điện / Trưởng phòng Bảo trì / Kỹ sư trưởng"],
  ["Trưởng Phòng Sản xuất", "Trưởng Phòng Sản xuất / Quản đốc"],
  ["Trưởng Phòng QHSE", "Trưởng Phòng An toàn mội trường (HSE) / QA / QC"],
  ["Đại diện Lãnh đạo", "Đại diện Lãnh đạo (Management Representative)"],
];

/** Cơ cấu tổ chức — danh sách phòng ban chức năng (dropdown + CRUD) */
const DEPARTMENT_OPTIONS = [
  "Ban Giám đốc (BOD)",
  "Phòng Hành chính – Nhân sự (HR/Admin)",
  "Phòng Kế toán – Tài chính",
  "Phòng Quản lý Kỹ thuật / Công nghệ",
  "Phòng Quản lý Sản xuất (Production)",
  "Phòng Quản lý chất lượng (QA/QC)",
  "Phòng Cơ điện / Bảo trì (Maintenance, Utility)",
  "Phòng Mua hàng – Cung ứng (Procurement)",
  "Phòng Kho vận / Logistics",
  "Phòng Kinh doanh / Bán hàng (Sales)",
  "Phòng R&D / Phát triển sản phẩm",
  "Ban An toàn – Môi trường (HSE)",
  "Ban Quản lý Năng lượng (Energy Team)",
  "Bộ phận Vận hành tiện ích (Boiler, Compressor, Chiller...)",
  "Phân xưởng Gia công cơ khí / Đúc / Hàn",
  "Phân xưởng Lắp ráp / Đóng gói",
  "Bộ phận Quy trình tĩnh (Silô, lò nung, lò sấy...)",
  "Bộ phận Thu mua vật tư nội bộ",
  "Khác",
];

/** 3. Cơ cấu tổ chức của Doanh nghiệp — số lượng phòng ban chức năng (dropdown + CRUD, lưu/truy vấn DB) */
function OrgStructureSection({ client, setClient, C, Field, Btn, Sel }) {
  const items = Array.isArray(client.departments) ? client.departments : [];
  const setItems = (arr) => setClient("departments", arr);
  const [selectedDept, setSelectedDept] = useState("");
  const options = [["", "— Chọn phòng ban —"], ...DEPARTMENT_OPTIONS.map((label) => [label, label])];

  const addSelected = () => {
    if (!selectedDept?.trim()) return;
    if (items.includes(selectedDept.trim())) return;
    setItems([...items, selectedDept.trim()]);
    setSelectedDept("");
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bd1}` }}>
      <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.skyL, marginBottom: 10 }}>3. Cơ cấu tổ chức của Doanh nghiệp</div>
      <Field label="Số lượng phòng ban chức năng (liệt kê / chọn từ danh sách)">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 280 }}>
              <Sel value={selectedDept} onChange={setSelectedDept} options={options} />
            </div>
            <Btn v="outline" sz="sm" onClick={addSelected} disabled={!selectedDept?.trim()}>＋ Thêm</Btn>
          </div>
          <div style={{ border: `1px solid ${C.bd0}`, borderRadius: 8, overflow: "hidden", background: C.bg2 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, width: 36 }}>#</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Phòng ban chức năng</th>
                  <th style={{ padding: "8px 12px", width: 100, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 16, color: C.t3, textAlign: "center" }}>
                      Chưa có phòng ban. Chọn từ dropdown và nhấn &quot;＋ Thêm&quot;.
                    </td>
                  </tr>
                ) : (
                  items.map((label, i) => (
                    <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bd0}`, color: C.t2 }}>{i + 1}</td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bd0}`, color: C.t0 }}>{label}</td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bd0}` }}>
                        <Btn v="ghost" sz="sm" onClick={() => removeItem(i)}>Xóa</Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Field>
    </div>
  );
}

/** 5.2 Phạm vi nguồn năng lượng — danh mục dropdown (ISO 50001:2018) */
const SCOPE_ENERGY_OPTIONS = [
  "Điện năng từ lưới",
  "Điện năng từ hệ mặt trời áp mái",
  "Gas LPG",
  "Gas CNG",
  "Gas LNG",
  "Hơi tự sản xuất",
  "Hơi mua",
  "Dầu DO",
  "Xăng",
  "Năng lượng sinh khối - gỗ vụn, zăm bào",
  "Năng lượng sinh khối - mùn cưa ép",
  "Năng lượng sinh khối - trấu ép",
  "Năng lượng sinh khối - Vỏ hạt điều",
  "Năng lượng sinh khối khác",
  "Than Antraxit",
  "Than 2A",
  "Than 2B",
  "Than Indonesia",
  "Than Malaysia",
  "Năng lượng khí nén (thứ cấp)",
  "Năng lượng thuỷ lực (Thứ cấp)",
];

/** Chuẩn hóa scope_energy từ DB: có thể là string (cũ) hoặc array */
function normalizeScopeEnergy(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(/\s*;\s*/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Phạm vi nguồn năng lượng: dropdown + CRUD, lưu/ truy vấn MongoDB (client.scope_energy[]) */
function ScopeEnergySection({ client, setClient, C, Field, Btn, Sel }) {
  const items = normalizeScopeEnergy(client.scope_energy);
  const setItems = (arr) => setClient("scope_energy", arr);

  const [selectedOption, setSelectedOption] = useState("");
  const options = [["", "— Chọn nguồn năng lượng —"], ...SCOPE_ENERGY_OPTIONS.map((label) => [label, label])];

  const addSelected = () => {
    if (!selectedOption?.trim()) return;
    if (items.includes(selectedOption.trim())) return;
    setItems([...items, selectedOption.trim()]);
    setSelectedOption("");
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <Field label="6.2. Phạm vi nguồn năng lượng">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ minWidth: 320 }}>
            <Sel value={selectedOption} onChange={setSelectedOption} options={options} />
          </div>
          <Btn v="outline" sz="sm" onClick={addSelected} disabled={!selectedOption?.trim()}>
            ＋ Thêm
          </Btn>
        </div>
        <div style={{ border: `1px solid ${C.bd0}`, borderRadius: 8, overflow: "hidden", background: C.bg2 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, width: 36 }}>#</th>
                <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Nguồn năng lượng</th>
                <th style={{ padding: "8px 12px", width: 100, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 16, color: C.t3, textAlign: "center" }}>
                    Chưa chọn nguồn năng lượng. Chọn từ dropdown và nhấn &quot;＋ Thêm&quot;.
                  </td>
                </tr>
              ) : (
                items.map((label, i) => (
                  <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bd0}`, color: C.t2 }}>{i + 1}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bd0}`, color: C.t0 }}>{label}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bd0}` }}>
                      <Btn v="ghost" sz="sm" onClick={() => removeItem(i)}>Xóa</Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Field>
  );
}

/** Tóm tắt điều hành: dropdown chuẩn + "+ Thêm" + CRUD, lưu exec_summary_items & exec_summary */
function ExecSummarySection({ survey, setSurvey, C, Field, Input, Btn, Sel, Modal }) {
  const meta = survey.meta || {};
  const items = Array.isArray(meta.exec_summary_items) ? meta.exec_summary_items : [];
  const setItems = (arr) =>
    setSurvey((p) => ({
      ...p,
      meta: { ...p.meta, exec_summary_items: arr, exec_summary: arr.join("\n\n") },
    }));

  const [selectedStandard, setSelectedStandard] = useState("");
  const [addCustomOpen, setAddCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");

  const options = [["", "— Chọn mục chuẩn để thêm —"], ...EXEC_SUMMARY_STANDARD_ITEMS.map((t) => [t, t])];
  const addFromDropdown = () => {
    if (!selectedStandard?.trim()) return;
    if (items.includes(selectedStandard.trim())) return;
    setItems([...items, selectedStandard.trim()]);
    setSelectedStandard("");
  };
  const openAddCustom = () => { setCustomText(""); setAddCustomOpen(true); };
  const saveAddCustom = () => {
    const t = customText?.trim();
    if (!t) return;
    setItems([...items, t]);
    setCustomText("");
    setAddCustomOpen(false);
  };
  const openEdit = (i) => { setEditIndex(i); setEditText(items[i] || ""); setEditOpen(true); };
  const saveEdit = () => {
    const t = editText?.trim();
    if (editIndex == null || !t) return;
    const next = items.map((x, j) => (j === editIndex ? t : x));
    setItems(next);
    setEditOpen(false);
    setEditIndex(null);
  };
  const removeItem = (i) => { if (confirm("Xóa mục này khỏi tóm tắt điều hành?")) setItems(items.filter((_, j) => j !== i)); };

  return (
    <>
      <Field label="Tóm tắt điều hành (Executive Summary)" sx={{ gridColumn: "1/-1" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
            <div style={{ display: "flex", flex: 1, minWidth: 320, borderRadius: 8, border: `1px solid ${C.bd0}`, overflow: "hidden" }}>
              <select
                value={selectedStandard}
                onChange={e => setSelectedStandard(e.target.value)}
                style={{ flex: 1, border: "none", background: C.bg3, color: C.t0, padding: "0 12px", outline: "none", fontSize: 14 }}
              >
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button
                onClick={addFromDropdown}
                disabled={!selectedStandard?.trim()}
                style={{ border: "none", background: selectedStandard?.trim() ? C.blue : C.bg4, color: selectedStandard?.trim() ? "#fff" : C.t3, padding: "0 16px", cursor: selectedStandard?.trim() ? "pointer" : "not-allowed", fontWeight: 600, transition: "all 0.2s", fontSize: 14 }}
              >
                + Thêm
              </button>
            </div>
            <Btn v="outline" sz="md" onClick={openAddCustom} sx={{ height: 38 }}>＋ Gõ mục tùy chỉnh</Btn>
          </div>
          <div style={{ border: `1px solid ${C.bd0}`, borderRadius: 8, overflow: "hidden", background: C.bg2 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, width: 36 }}>#</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Nội dung</th>
                  <th style={{ padding: "8px 12px", width: 120, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 16, color: C.t3, textAlign: "center" }}>
                      Chưa có mục nào. Chọn mục chuẩn từ dropdown và nhấn &quot;Thêm mục đã chọn&quot; hoặc &quot;＋ Thêm (mục tùy chỉnh)&quot;.
                    </td>
                  </tr>
                ) : (
                  items.map((text, i) => (
                    <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bd2}`, color: C.t2 }}>{i + 1}</td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{text}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                        <Btn v="ghost" sz="sm" onClick={() => openEdit(i)} sx={{ marginRight: 4 }}>Sửa</Btn>
                        <Btn v="ghost" sz="sm" onClick={() => removeItem(i)} sx={{ color: C.red }}>Xóa</Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Field>

      <Modal open={addCustomOpen} onClose={() => setAddCustomOpen(false)} title="Thêm mục tùy chỉnh">
        <Field label="Nội dung">
          <Input value={customText} onChange={setCustomText} placeholder="Nhập nội dung mục tóm tắt điều hành..." />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn v="ghost" sz="md" onClick={() => setAddCustomOpen(false)}>Hủy</Btn>
          <Btn v="blue" sz="md" onClick={saveAddCustom}>Thêm</Btn>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Sửa mục tóm tắt điều hành">
        <Field label="Nội dung">
          <Input value={editText} onChange={setEditText} placeholder="Nội dung mục..." />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn v="ghost" sz="md" onClick={() => setEditOpen(false)}>Hủy</Btn>
          <Btn v="blue" sz="md" onClick={saveEdit}>Lưu</Btn>
        </div>
      </Modal>
    </>
  );
}

const EMPTY_CONTACT = { full_name: "", position: "", department: "", phone: "", email: "" };

function ContactPersonsSection({ client, setClient, C, Field, Input, Btn, Grid, Modal }) {
  const contacts = Array.isArray(client.contact_persons) ? client.contact_persons : [];
  const setContacts = (arr) => setClient("contact_persons", arr);
  const [modal, setModal] = useState({ open: false, index: null });
  const [form, setForm] = useState(EMPTY_CONTACT);

  const openAdd = () => { setForm(EMPTY_CONTACT); setModal({ open: true, index: null }); };
  const openEdit = (i) => {
    const c = contacts[i] || {};
    setForm({
      full_name: c.full_name || "",
      position: c.position || "",
      department: c.department || "",
      phone: c.phone || "",
      email: c.email || "",
    });
    setModal({ open: true, index: i });
  };
  const saveContact = () => {
    if (!form.full_name?.trim()) return;
    const row = { full_name: form.full_name.trim(), position: (form.position || "").trim(), department: (form.department || "").trim(), phone: (form.phone || "").trim(), email: (form.email || "").trim() };
    if (modal.index === null) setContacts([...contacts, row]);
    else setContacts(contacts.map((c, i) => (i === modal.index ? row : c)));
    setModal({ open: false, index: null });
  };
  const removeContact = (i) => { if (confirm("Xóa người liên hệ này?")) setContacts(contacts.filter((_, idx) => idx !== i)); };

  return (
    <>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bd1}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.skyL }}>2. Người liên hệ</div>
          <Btn v="outline" sz="sm" onClick={openAdd}>＋ Thêm</Btn>
        </div>
        <div style={{ overflowX: "auto", border: `1px solid ${C.bd0}`, borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Họ và tên</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Chức vụ</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Đơn vị</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Số ĐT</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Email</th>
                <th style={{ padding: "8px 10px", width: 100, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 12, color: C.t3, textAlign: "center" }}>Chưa có người liên hệ. Nhấn &quot;＋ Thêm&quot; để thêm.</td></tr>
              ) : contacts.map((c, i) => (
                <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{c.full_name}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{c.position}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{c.department}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{c.phone}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{c.email}</td>
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                    <Btn v="ghost" sz="sm" onClick={() => openEdit(i)} sx={{ marginRight: 4 }}>Sửa</Btn>
                    <Btn v="ghost" sz="sm" onClick={() => removeContact(i)} sx={{ color: C.red }}>Xóa</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, index: null })} title={modal.index === null ? "Thêm người liên hệ" : "Sửa người liên hệ"}>
        <Grid cols={1} gap={12}>
          <Field label="Họ và tên" required>
            <Input value={form.full_name} onChange={v => setForm(f => ({ ...f, full_name: v }))} placeholder="Nguyễn Văn B" />
          </Field>
          <Field label="Chức vụ">
            <Input value={form.position} onChange={v => setForm(f => ({ ...f, position: v }))} placeholder="Trưởng phòng Hành chính" />
          </Field>
          <Field label="Đơn vị">
            <Input value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} placeholder="Phòng Kỹ thuật" />
          </Field>
          <Field label="Số điện thoại">
            <Input value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="0901 234 567" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="email@company.com" />
          </Field>
        </Grid>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn v="ghost" sz="md" onClick={() => setModal({ open: false, index: null })}>Hủy</Btn>
          <Btn v="blue" sz="md" onClick={saveContact}>Lưu</Btn>
        </div>
      </Modal>
    </>
  );
}

function EnergyDetailsSection({ client, setClient, C, Field, Input, Btn, Sel, Modal }) {
  const details = Array.isArray(client.energy_details) ? client.energy_details : [];
  const setDetails = (arr) => setClient("energy_details", arr);
  const [modal, setModal] = useState({ open: false, index: null });
  const [form, setForm] = useState({ type_id: "", type: "", unit: "", amount: "", toe: "" });

  const resetForm = () => setForm({ type_id: "", type: "", unit: "", amount: "", toe: "" });
  const openAdd = () => { resetForm(); setModal({ open: true, index: null }); };
  const openEdit = (i) => { setForm({ ...details[i] }); setModal({ open: true, index: i }); };
  
  const handleTypeChange = (id) => {
    const factorObj = ENERGY_CONVERSION_FACTORS.find(f => f.id === id);
    if (!factorObj) {
      setForm(f => ({ ...f, type_id: id, type: id, unit: "", factor: 0 }));
      return;
    }
    setForm(f => ({ ...f, type_id: id, type: factorObj.name, unit: factorObj.unit, factor: factorObj.factor }));
    calcToe(form.amount, factorObj.factor);
  };

  const calcToe = (amount, factor) => {
    const num = parseFloat(amount);
    if (isNaN(num)) {
      setForm(f => ({ ...f, amount, toe: "" }));
      return;
    }
    const computed = num * (factor || form.factor || 0);
    setForm(f => ({ ...f, amount, toe: computed > 0 ? computed.toFixed(4) : "" }));
  };

  const saveDetail = () => {
    if (!form.type) return;
    const next = [...details];
    const row = { ...form };
    if (modal.index === null) next.push(row); else next[modal.index] = row;
    setDetails(next);
    setModal({ open: false, index: null });
  };
  const removeDetail = (i) => { if (confirm("Xóa dòng năng lượng này?")) setDetails(details.filter((_, idx) => idx !== i)); };

  return (
    <>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bd1}`, gridColumn: "1/-1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.skyL }}>Các loại năng lượng sử dụng (Chi tiết - Quy đổi TOE)</div>
          <Btn v="outline" sz="sm" onClick={openAdd}>＋ Thêm nguồn NL</Btn>
        </div>
        <div style={{ overflowX: "auto", border: `1px solid ${C.bd0}`, borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Loại năng lượng</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Sản lượng tiêu thụ</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Đơn vị gốc</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Quy đổi TOE</th>
                <th style={{ padding: "8px 10px", width: 100, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 12, color: C.t3, textAlign: "center" }}>Chưa có khai báo tiêu thụ chi tiết.</td></tr>
              ) : details.map((c, i) => (
                <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0, fontWeight: 700 }}>{c.type}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.blue }}>{c.amount}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{c.unit}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.tealL }}>{c.toe}</td>
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                    <Btn v="ghost" sz="sm" onClick={() => openEdit(i)} sx={{ marginRight: 4 }}>Sửa</Btn>
                    <Btn v="ghost" sz="sm" onClick={() => removeDetail(i)} sx={{ color: C.red }}>Xóa</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, index: null })} title={modal.index === null ? "Thêm Nguồn Năng Lượng" : "Sửa Nguồn Năng Lượng"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Loại năng lượng (Chọn để tự điền đơn vị và hệ số TOE)">
            <Sel value={form.type_id} onChange={handleTypeChange}
                 options={[["", "— Loại năng lượng —"], ...ENERGY_CONVERSION_FACTORS.map(f => [f.id, f.name])]} />
          </Field>
          <Field label="Hoặc nhập loại năng lượng (nếu không có trong list)">
             <Input value={form.type} onChange={v => setForm(f => ({...f, type: v}))} placeholder="Loại năng lượng khác..." />
          </Field>
          <Field label="Đơn vị gốc">
             <Input value={form.unit} onChange={v => setForm(f => ({...f, unit: v}))} placeholder="VD: Tấn, 1000 kWh, 1000 lít" />
          </Field>
          <Field label="Sản lượng tiêu thụ (giá trị số)">
             <Input type="number" step="any" value={form.amount} onChange={v => calcToe(v, form.factor)} placeholder="2500" />
          </Field>
          <Field label={`Giá trị quy đổi TOE (Hệ số: ${form.factor || 0})`}>
             <Input type="number" step="any" value={form.toe} onChange={v => setForm(f => ({...f, toe: v}))} placeholder="Sẽ tự tính nếu có hệ số" />
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn v="ghost" sz="md" onClick={() => setModal({ open: false, index: null })}>Hủy</Btn>
          <Btn v="blue" sz="md" onClick={saveDetail}>Lưu</Btn>
        </div>
      </Modal>
    </>
  );
}

function ClientAutocomplete({ client, setClient, C }) {
  const [dbClients, setDbClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(d => { if (Array.isArray(d)) setDbClients(d); }).catch(() => { });
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = dbClients.filter(c => c.name?.toLowerCase().includes(q.toLowerCase()) || c.site?.toLowerCase().includes(q.toLowerCase()));

  const handleSelect = (c) => {
    setClient("name", c.name);
    setClient("site", c.site || "");
    setClient("address", c.address || "");
    setClient("industry", c.industry || "");
    setClient("annual_energy", c.annual_energy || "");
    setClient("employees", c.employees ? String(c.employees) : "");
    setClient("cert_status", c.cert_status || "");
    if (c.contact_person && (!client.contact_persons || client.contact_persons.length === 0)) {
      setClient("contact_persons", [{ full_name: c.contact_person, position: "Liên hệ chính" }]);
    }
    setOpen(false);
  };

  const handleManualType = (val) => {
    setQ(val);
    setClient("name", val);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <input
        value={client.name || ""}
        onChange={e => handleManualType(e.target.value)}
        onFocus={() => { setQ(client.name || ""); setOpen(true); }}
        placeholder="Gõ tên tổ chức để tìm trong Database hoặc nhập công ty mới..."
        style={{ width: "100%", padding: "8px 12px", border: `1px solid ${open ? C.skyL : C.bd0}`, borderRadius: 8, fontSize: 14, background: C.bg2, color: C.t0, outline: "none", transition: "all 0.2s", boxShadow: open ? `0 0 0 3px ${C.skyL}33` : "none" }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999, background: C.bg1, border: `1px solid ${C.skyL}66`, borderRadius: 8, marginTop: 4, padding: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", maxHeight: 320, overflowY: "auto" }}>
          <div style={{ fontSize: 12, color: C.skyL, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", padding: "0 8px" }}>Kho dữ liệu Quản trị Khách hàng</div>
          {filtered.length === 0 ? (
            <div style={{ padding: 8, color: C.t3, fontSize: 13, fontStyle: "italic" }}>Không tìm thấy khách hàng nào khớp.</div>
          ) : (
            filtered.map(c => (
              <div
                key={c._id}
                onClick={() => handleSelect(c)}
                style={{ padding: "10px 12px", borderRadius: 6, cursor: "pointer", transition: "all 0.2s", marginBottom: 4, border: `1px solid ${C.bd2}`, background: C.bg2 }}
                onMouseOver={e => e.currentTarget.style.background = C.skyL + "1A"}
                onMouseOut={e => e.currentTarget.style.background = C.bg2}
              >
                <div style={{ fontWeight: 700, color: C.t0, fontSize: 14 }}>{c.name}</div>
                <div style={{ color: C.t2, fontSize: 12, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  {c.site && <span><b style={{ color: C.t1 }}>🏭 CS:</b> {c.site}</span>}
                  {c.industry && <span><b style={{ color: C.t1 }}>🏷 Ngành:</b> {c.industry}</span>}
                  {c.address && <span style={{ flex: "1 1 100%" }}><b style={{ color: C.t1 }}>📍 Đ/C:</b> {c.address}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AuditorAutocomplete({ verifier, setVerifier, C }) {
  const [dbAuditors, setDbAuditors] = useState([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/auditors").then(r => r.json()).then(d => { if (Array.isArray(d)) setDbAuditors(d); }).catch(() => { });
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = dbAuditors.filter(a => a.name?.toLowerCase().includes(q.toLowerCase()));

  const handleSelect = (a) => {
    setVerifier("lead", a.name);
    if (a.org) setVerifier("org", a.org);
    setOpen(false);
  };

  const handleManualType = (val) => {
    setQ(val);
    setVerifier("lead", val);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <input
        value={verifier.lead || ""}
        onChange={e => handleManualType(e.target.value)}
        onFocus={() => { setQ(verifier.lead || ""); setOpen(true); }}
        placeholder="Gõ tên T.Đoàn để tìm hoặc nhập tên mới..."
        style={{ width: "100%", padding: "8px 12px", border: `1px solid ${open ? C.violet : C.bd0}`, borderRadius: 8, fontSize: 14, background: C.bg2, color: C.t0, outline: "none", transition: "all 0.2s", boxShadow: open ? `0 0 0 3px ${C.violet}33` : "none" }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999, background: C.bg1, border: `1px solid ${C.violet}66`, borderRadius: 8, marginTop: 4, padding: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", maxHeight: 300, overflowY: "auto" }}>
          <div style={{ fontSize: 12, color: C.violet, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", padding: "0 8px" }}>Kho dữ liệu Chuyên gia</div>
          {filtered.length === 0 ? (
            <div style={{ padding: 8, color: C.t3, fontSize: 13, fontStyle: "italic" }}>Không tìm thấy...</div>
          ) : (
            filtered.map(a => (
              <div
                key={a._id}
                onClick={() => handleSelect(a)}
                style={{ padding: "10px 12px", borderRadius: 6, cursor: "pointer", transition: "all 0.2s", marginBottom: 4, border: `1px solid ${C.bd2}`, background: C.bg2 }}
                onMouseOver={e => e.currentTarget.style.background = C.violet + "1A"}
                onMouseOut={e => e.currentTarget.style.background = C.bg2}
              >
                <div style={{ fontWeight: 700, color: C.t0, fontSize: 14 }}>{a.name}</div>
                <div style={{ color: C.t2, fontSize: 12, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  {a.role && <span>✓ {a.role}</span>}
                  {a.org && <span>🏢 {a.org}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function StepOrg({ survey, setSurvey }) {
  const setMeta = (k, v) => setSurvey(p => ({ ...p, meta: { ...p.meta, [k]: v } }));
  const setClient = (k, v) => setSurvey(p => ({ ...p, client: { ...p.client, [k]: v } }));
  const setVerifier = (k, v) => setSurvey(p => ({ ...p, verifier: { ...p.verifier, [k]: v } }));
  const legalRegistry = survey.legal_registry || [];
  const isoRegistry = survey.iso_standards_registry || [];
  const setLegalRegistry = arr => setSurvey(p => ({ ...p, legal_registry: arr }));
  const setIsoRegistry = arr => setSurvey(p => ({ ...p, iso_standards_registry: arr }));

  const [legalModal, setLegalModal] = useState({ open: false, index: null });
  const [legalForm, setLegalForm] = useState({ code: "", subject: "", doc_type: "Thông tư", articles: "", threshold: "", status: "pending" });
  const [isoModal, setIsoModal] = useState({ open: false, index: null });
  const [isoForm, setIsoForm] = useState({ standard_id: "", focus: "" });

  // Legal Framework CRUD (Card "Xác định khung pháp lý áp dụng")
  const [lfModal, setLfModal] = useState({ open: false, index: null });
  const [lfForm, setLfForm] = useState({ code: "", subject: "", doc_type: "Thông tư", articles: "", threshold: "", status: "pending", note: "" });
  const saveLf = () => {
    const { code, subject, doc_type, articles, threshold, status, note } = lfForm;
    if (!code?.trim()) return;
    const next = [...(survey.legal_framework || [])];
    const row = { code: code.trim(), subject: subject.trim(), doc_type, articles: articles.trim(), threshold: threshold.trim(), status, note: (note || "").trim() };
    if (lfModal.index === null) next.push(row); else next[lfModal.index] = row;
    setSurvey(p => ({ ...p, legal_framework: next, legal_status: { ...p.legal_status, [code.trim()]: status } }));
    setLfModal({ open: false, index: null });
  };

  const openLegalAdd = () => { setLegalForm({ code: "", subject: "", doc_type: "Thông tư", articles: "", threshold: "", status: "pending" }); setLegalModal({ open: true, index: null }); };
  const openLegalEdit = i => { const r = legalRegistry[i]; setLegalForm({ code: r.code || "", subject: r.subject || "", doc_type: r.doc_type || "Thông tư", articles: r.articles || "", threshold: r.threshold || "", status: r.status || "pending" }); setLegalModal({ open: true, index: i }); };
  const saveLegal = () => {
    const { code, subject, doc_type, articles, threshold, status } = legalForm;
    if (!code?.trim()) return;
    const next = [...legalRegistry];
    const row = { code: code.trim(), subject: subject.trim(), doc_type, articles: articles.trim(), threshold: threshold.trim(), status };
    if (legalModal.index === null) next.push(row); else next[legalModal.index] = row;
    setLegalRegistry(next);
    setSurvey(p => ({ ...p, legal_status: { ...p.legal_status, [code.trim()]: status } }));
    setLegalModal({ open: false, index: null });
  };
  const removeLegal = i => setLegalRegistry(legalRegistry.filter((_, idx) => idx !== i));

  const openIsoAdd = () => { setIsoForm({ standard_id: "", focus: "" }); setIsoModal({ open: true, index: null }); };
  const openIsoEdit = i => { const r = isoRegistry[i]; setIsoForm({ standard_id: r.standard_id || "", focus: r.focus || "" }); setIsoModal({ open: true, index: i }); };
  const saveIso = () => {
    const { standard_id, focus } = isoForm;
    if (!standard_id?.trim()) return;
    const next = [...isoRegistry];
    const row = { standard_id: standard_id.trim(), focus: focus.trim() };
    if (isoModal.index === null) next.push(row); else next[isoModal.index] = row;
    setIsoRegistry(next);
    setIsoModal({ open: false, index: null });
  };
  const removeIso = i => setIsoRegistry(isoRegistry.filter((_, idx) => idx !== i));

  const roadmapRows = Array.isArray(survey.certification_roadmap) ? survey.certification_roadmap : [];
  const setRoadmap = arr => setSurvey(p => ({ ...p, certification_roadmap: arr }));
  const [roadmapModal, setRoadmapModal] = useState({ open: false, index: null });
  const [roadmapForm, setRoadmapForm] = useState({ timeframe: "", activity: "", deliverable: "", criteria: "" });
  const openRoadmapAdd = () => { setRoadmapForm({ timeframe: "", activity: "", deliverable: "", criteria: "" }); setRoadmapModal({ open: true, index: null }); };
  const openRoadmapEdit = i => { const r = roadmapRows[i]; setRoadmapForm({ timeframe: r.timeframe || "", activity: r.activity || "", deliverable: r.deliverable || "", criteria: r.criteria || "" }); setRoadmapModal({ open: true, index: i }); };
  const saveRoadmap = () => {
    const { timeframe, activity, deliverable, criteria } = roadmapForm;
    if (!timeframe?.trim()) return;
    const next = [...roadmapRows];
    const row = { timeframe: timeframe.trim(), activity: activity.trim(), deliverable: deliverable.trim(), criteria: criteria.trim() };
    if (roadmapModal.index === null) next.push(row); else next[roadmapModal.index] = row;
    setRoadmap(next);
    setRoadmapModal({ open: false, index: null });
  };
  const removeRoadmap = i => setRoadmap(roadmapRows.filter((_, idx) => idx !== i));

  const { meta, client, verifier } = survey;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Survey meta */}
      <Card title="Thông tin khảo sát" icon="📋" accent={C.blue}>
        <Grid cols={3} gap={16}>
          <div style={{ gridColumn: "1/-1", marginBottom: 8 }}>
            <Field label="Tải ảnh bìa Báo cáo GAP">
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const dataUrl = ev.target.result;
                  const img = new Image();
                  img.onload = () => {
                    const ratio = img.width / img.height;
                    const w = 450;
                    const h = Math.round(w / ratio);
                    setSurvey(p => ({ ...p, meta: { ...p.meta, cover_image: dataUrl, cover_image_w: w, cover_image_h: h } }));
                  };
                  img.src = dataUrl;
                };
                reader.readAsDataURL(file);
              }} style={{ marginBottom: 8 }} />
              {meta.cover_image && (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={meta.cover_image} alt="Cover" style={{ height: 160, objectFit: "contain", borderRadius: 8, border: `1px solid ${C.bd0}` }} />
                  <Btn v="ghost" sz="sm" sx={{ position: "absolute", top: 4, right: 4, background: "rgba(255,255,255,0.8)", color: C.red }} onClick={() => setSurvey(p => ({ ...p, meta: { ...p.meta, cover_image: "", cover_image_w: 0, cover_image_h: 0 } }))}>Xóa ảnh</Btn>
                </div>
              )}
            </Field>
          </div>
          <Field label="Mã khảo sát" required>
            <Input value={meta.ref_no} onChange={v => setMeta("ref_no", v)} placeholder="GAP-2024-001" />
          </Field>
          <Field label="Ngày khảo sát">
            <DatePicker mode="range" value={meta.survey_date} onChange={v => setMeta("survey_date", v)} placeholder="Chọn khoảng ngày..." />
          </Field>
          <Field label="Phiên bản"><Input value={meta.version} onChange={v => setMeta("version", v)} placeholder="v1.0" /></Field>
          <Field label="Giai đoạn tư vấn" sx={{ gridColumn: "1/-1" }}>
            <Sel value={meta.phase || "Gap Analysis (Khảo sát khoảng cách)"} onChange={v => setMeta("phase", v)} options={PHASES} />
          </Field>
          <Field label="Tiêu đề báo cáo" sx={{ gridColumn: "1/-1" }}>
            <Input value={meta.report_title} onChange={v => setMeta("report_title", v)}
              placeholder="BÁO CÁO KHẢO SÁT GAP ISO 50001:2018 — TÊN TỔ CHỨC" />
          </Field>
          <Field label="Mục tiêu khảo sát" sx={{ gridColumn: "1/-1" }}>
            <TA value={meta.objective} onChange={v => setMeta("objective", v)} rows={2}
              placeholder="Phân tích khoảng cách giữa thực trạng EnMS và yêu cầu ISO 50001:2018 để lên kế hoạch xây dựng và đạt chứng nhận trong vòng 12 tháng..." />
          </Field>
          <ExecSummarySection survey={survey} setSurvey={setSurvey} C={C} Field={Field} Input={Input} Btn={Btn} Sel={Sel} Modal={Modal} />
        </Grid>
      </Card>

      {/* Client info */}
      <Card title="Tổ chức được khảo sát" icon="🏭" accent={C.skyL}>
        <Grid cols={3} gap={16}>
          <Field label="Tên tổ chức / Công ty (Nhập mới hoặc Chọn từ DB Khách hàng)" required sx={{ gridColumn: "1/-1" }}>
            <ClientAutocomplete client={client} setClient={setClient} C={C} />
          </Field>
          <Field label="Tên cơ sở / Nhà máy">
            <Input value={client.site} onChange={v => setClient("site", v)} placeholder="Nhà máy ABC — KCN..." />
          </Field>
          <Field label="Ngành / Lĩnh vực">
            <Sel value={client.industry || ""} onChange={v => setClient("industry", v)}
              options={INDUSTRIES.map(i => [i, i || "— Chọn ngành —"])} />
          </Field>
          <Field label="Địa chỉ" sx={{ gridColumn: "1/-1" }}>
            <TA value={client.address} onChange={v => setClient("address", v)} rows={2} placeholder="Địa chỉ đầy đủ cơ sở..." />
          </Field>
          <Field label="Số CBCNV">
            <Input value={client.employees} onChange={v => setClient("employees", v)} placeholder="500 người" />
          </Field>
          <Field label="NL tiêu thụ/năm (TOE)">
            <Input value={client.annual_energy} onChange={v => setClient("annual_energy", v)} placeholder="2.500 TOE/năm" />
          </Field>
          <Field label="Tình trạng chứng nhận ISO 50001" sx={{ gridColumn: "1/-1" }}>
            <Sel value={client.cert_status || ""} onChange={v => setClient("cert_status", v)} options={CERT_STATUSES} />
          </Field>
        </Grid>
        {/* Large energy user flag */}
        <div style={{
          marginTop: 10, padding: "9px 13px", background: `${C.orange}10`,
          borderRadius: 7, border: `1px solid ${C.orange}25`, display: "flex", alignItems: "center", gap: 10
        }}>
          <Checkbox 
            id="large_user" 
            checked={!!client.is_large_user} 
            onChange={v => setClient("is_large_user", v)} 
            label={
              <span style={{ fontSize: 14.5 }}>
                <strong style={{ color: C.orangeL }}>Cơ sở sử dụng NL trọng điểm</strong> (≥1.000 TOE/năm)
                — Bắt buộc: Kiểm toán NL định kỳ 3 năm, báo cáo hàng năm, kế hoạch 5 năm và khuyến khích áp dụng ISO 50001 theo Nghị định 30/2026, TT 25/2020/TT-BCT
              </span>
            } 
          />
        </div>

        {/* 1. Người đại diện Công ty */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bd1}` }}>
          <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.skyL, marginBottom: 10 }}>1. Người đại diện Công ty</div>
          <Grid cols={2} gap={16}>
            <Field label="Họ và tên">
              <Input value={client.representative_name || ""} onChange={v => setClient("representative_name", v)} placeholder="Nguyễn Văn A" />
            </Field>
            <Field label="Chức vụ">
              <Sel value={client.representative_position || ""} onChange={v => setClient("representative_position", v)} options={REPRESENTATIVE_POSITIONS} />
            </Field>
          </Grid>
        </div>

        {/* 2. Người liên hệ — CRUD + Modal */}
        <ContactPersonsSection client={client} setClient={setClient} C={C} Field={Field} Input={Input} Btn={Btn} Grid={Grid} Modal={Modal} />

        {/* 3. Cơ cấu tổ chức của Doanh nghiệp — CRUD + lưu DB */}
        <OrgStructureSection client={client} setClient={setClient} C={C} Field={Field} Btn={Btn} Sel={Sel} />

        {/* 4. Số ca sản xuất */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bd1}` }}>
          <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.skyL, marginBottom: 10 }}>4. Số ca sản xuất</div>
          <Field label="Số ca sản xuất">
            <Input value={client.production_shifts || ""} onChange={v => setClient("production_shifts", v)} placeholder="VD: 3 ca/ngày, 1 ca/ngày" />
          </Field>
        </div>

        {/* 5. Sản phẩm và dịch vụ cung cấp */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bd1}` }}>
          <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.skyL, marginBottom: 10 }}>5. Sản phẩm và dịch vụ cung cấp</div>
          <Field label="Mô tả sản phẩm / dịch vụ">
            <TA value={client.products || client.products_services || ""} onChange={v => setClient("products", v)} rows={3}
              placeholder="Mô tả ngắn sản phẩm chính, dịch vụ cung cấp..." />
          </Field>
        </div>

        {/* Bảng kê chi tiết năng lượng & TOE */}
        <EnergyDetailsSection client={client} setClient={setClient} C={C} Field={Field} Input={Input} Btn={Btn} Sel={Sel} Modal={Modal} />

        {/* 6. Phạm vi & ranh giới xin cấp chứng nhận ISO 50001:2018 */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bd1}` }}>
          <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.skyL, marginBottom: 10 }}>6. Phạm vi & ranh giới xin cấp chứng nhận ISO 50001:2018</div>
          <Grid cols={1} gap={12}>
            <Field label="6.1. Phạm vi địa lý">
              <Input value={client.scope_geographical || ""} onChange={v => setClient("scope_geographical", v)}
                placeholder="VD: Toàn bộ nhà máy tại KCN VSIP Bình Dương" />
            </Field>
            <ScopeEnergySection client={client} setClient={setClient} C={C} Field={Field} Btn={Btn} Sel={Sel} />
            <Field label="6.3. Phạm vi sản phẩm">
              <Input value={client.scope_product || ""} onChange={v => setClient("scope_product", v)}
                placeholder="VD: Sản xuất phụ tùng ô tô, lắp ráp..." />
            </Field>
            <Field label="6.4. Phương thức kiểm soát hệ thống">
              <TA value={client.scope_control_method || ""} onChange={v => setClient("scope_control_method", v)} rows={2}
                placeholder="VD: Kiểm soát trực tiếp toàn bộ hoạt động năng lượng tại cơ sở..." />
            </Field>
          </Grid>
        </div>
      </Card>

      {/* Verifier info */}
      <Card title="Đoàn khảo sát tư vấn" icon="🔬" accent={C.violet}>
        <Grid cols={3} gap={16}>
          <Field label="Tên đơn vị tư vấn" required sx={{ gridColumn: "1/-1" }}>
            <Sel value={verifier.org || ""} onChange={v => setVerifier("org", v)} options={VERIFIER_ORGS} placeholder="Chọn hoặc nhập tên đơn vị..." allowAdd={true} />
          </Field>
          <Field label="Chương trình / Dự án đánh giá" sx={{ gridColumn: "1/-1" }}>
            <Sel value={verifier.program || ""} onChange={v => setVerifier("program", v)} options={VERIFIER_PROGRAMS} placeholder="Chọn hoặc nhập chương trình..." allowAdd={true} />
          </Field>
          <Field label="Trưởng đoàn (Nhập mới hoặc Chọn từ DB Chuyên gia)" sx={{ gridColumn: "1/-1" }}>
            <AuditorAutocomplete verifier={verifier} setVerifier={setVerifier} C={C} />
          </Field>
          <Field label="Giấy phép / Công nhận">
            <Input value={verifier.accred} onChange={v => setVerifier("accred", v)} placeholder="Giấy phép kiểm toán NL số .../BCT" />
          </Field>
          <Field label="Thành viên đoàn">
            <Input value={verifier.team} onChange={v => setVerifier("team", v)} placeholder="Trần B; Lê C; Phạm D" />
          </Field>
          <Field label="Số chứng chỉ EA">
            <Input value={verifier.cert_no} onChange={v => setVerifier("cert_no", v)} placeholder="EA-BCT-2021-0456" />
          </Field>
          <Field label="Tiêu chuẩn áp dụng" sx={{ gridColumn: "1/-1" }}>
            <Input value={verifier.std_applied} onChange={v => setVerifier("std_applied", v)}
              placeholder="ISO 50001:2018; ISO 50006:2014; ISO 50002:2014" />
          </Field>
        </Grid>
      </Card>

      {/* Xác định khung pháp lý áp dụng — FULL CRUD */}
      <Card title="Xác định khung pháp lý áp dụng" icon="⚖️" accent={C.red}>
        <div style={{ fontSize: 14, color: C.t1, marginBottom: 12 }}>
          Quản lý các văn bản pháp lý Việt Nam áp dụng cho cơ sở. Thêm, sửa, xóa và cập nhật trạng thái tuân thủ.
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(() => {
              const items = survey.legal_framework || [];
              const total = items.length;
              const compliant = items.filter(x => x.status === "compliant").length;
              const partial = items.filter(x => x.status === "partial").length;
              const nonComp = items.filter(x => x.status === "non_compliant").length;
              return (
                <>
                  <Tag c={C.teal}>✓ {compliant}</Tag>
                  <Tag c={C.amber}>⚠ {partial}</Tag>
                  <Tag c={C.red}>✗ {nonComp}</Tag>
                  <span style={{ color: C.t2, fontSize: 13 }}>/ {total} văn bản</span>
                </>
              );
            })()}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(!survey.legal_framework || survey.legal_framework.length === 0) && (
              <Btn v="outline" sz="sm" onClick={() => {
                const defaults = [
                  { code: "Luật 50/2010/QH12", subject: "Luật Sử dụng NL tiết kiệm và hiệu quả", doc_type: "Luật", articles: "Toàn văn", threshold: "Mọi tổ chức", status: "pending", note: "" },
                  { code: "Luật 77/2025/QH15", subject: "Luật Sử dụng NL tiết kiệm và hiệu quả (sửa đổi)", doc_type: "Luật", articles: "Toàn văn", threshold: "Mọi tổ chức", status: "pending", note: "" },
                  { code: "NĐ 30/2026/NĐ-CP", subject: "Nghị định hướng dẫn Luật SDNLTK&HQ", doc_type: "Nghị định", articles: "Điều 4–38", threshold: "≥1.000 TOE/năm", status: "pending", note: "" },
                  { code: "TT 25/2020/TT-BCT", subject: "Quản lý NL tại cơ sở CN trọng điểm; Kiểm toán NL (3 năm)", doc_type: "Thông tư", articles: "Điều 4–20", threshold: "≥1.000 TOE/năm", status: "pending", note: "" },
                  { code: "TT 38/2014/TT-BCT", subject: "Đào tạo quản lý NL — Chứng chỉ EMR", doc_type: "Thông tư", articles: "Điều 3–12", threshold: "Cơ sở trọng điểm", status: "pending", note: "" },
                  { code: "TT 36/2016/TT-BCT", subject: "Dán nhãn năng lượng và MEPS", doc_type: "Thông tư", articles: "Phụ lục I–VI", threshold: "Thiết bị thuộc danh mục", status: "pending", note: "" },
                  { code: "NĐ 06/2022/NĐ-CP", subject: "Giảm phát thải KNK và bảo vệ tầng ô-dôn", doc_type: "Nghị định", articles: "Chương II–IV", threshold: "≥3.000 tCO₂e/năm", status: "pending", note: "" },
                ];
                setSurvey(p => ({ ...p, legal_framework: defaults }));
              }}>📋 Tạo danh sách mặc định</Btn>
            )}
            <Btn v="outline" sz="sm" onClick={() => {
              setLfForm({ code: "", subject: "", doc_type: "Thông tư", articles: "", threshold: "", status: "pending", note: "" });
              setLfModal({ open: true, index: null });
            }}>＋ Thêm văn bản</Btn>
          </div>
        </div>

        <div style={{ overflowX: "auto", border: `1px solid ${C.bd0}`, borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, width: 36 }}>#</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, minWidth: 160 }}>Mã văn bản</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Nội dung / Tên</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, minWidth: 90 }}>Loại</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, minWidth: 120 }}>Ngưỡng</th>
                <th style={{ padding: "8px 10px", textAlign: "center", borderBottom: `1px solid ${C.bd0}`, minWidth: 130 }}>Trạng thái</th>
                <th style={{ padding: "8px 10px", width: 110, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!survey.legal_framework || survey.legal_framework.length === 0) ? (
                <tr>
                  <td colSpan={7} style={{ padding: 20, color: C.t3, textAlign: "center" }}>
                    Chưa có văn bản pháp lý. Nhấn "📋 Tạo danh sách mặc định" hoặc "＋ Thêm văn bản" để bắt đầu.
                  </td>
                </tr>
              ) : (survey.legal_framework || []).map((r, i) => {
                const scol = r.status === "compliant" ? C.teal : r.status === "partial" ? C.amber : r.status === "non_compliant" ? C.red : C.grey2;
                return (
                  <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t2 }}>{i + 1}</td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", fontSize: 12.5, color: C.blueL, fontWeight: 600 }}>{r.code}</td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>
                      <div>{r.subject}</div>
                      {r.articles && <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>📎 {r.articles}</div>}
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{r.doc_type}</td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.amber, fontSize: 12.5 }}>{r.threshold}</td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${C.bd2}`, textAlign: "center" }}>
                      <select value={r.status || "pending"}
                        onChange={e => {
                          const next = [...(survey.legal_framework || [])];
                          next[i] = { ...next[i], status: e.target.value };
                          setSurvey(p => ({
                            ...p,
                            legal_framework: next,
                            legal_status: { ...p.legal_status, [r.code]: e.target.value }
                          }));
                        }}
                        style={{
                          background: `${scol}15`, border: `1px solid ${scol}40`, borderRadius: 5,
                          padding: "3px 6px", color: scol, fontSize: 12.5, cursor: "pointer", fontWeight: 600,
                          width: "100%", maxWidth: 140
                        }}>
                        <option value="pending">○ Chưa XĐ</option>
                        <option value="compliant">✓ Tuân thủ</option>
                        <option value="partial">⚠ Một phần</option>
                        <option value="non_compliant">✗ Chưa TT</option>
                        <option value="not_applicable">— Không ÁD</option>
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                      <Btn v="ghost" sz="sm" onClick={() => {
                        const r2 = (survey.legal_framework || [])[i];
                        setLfForm({
                          code: r2.code || "", subject: r2.subject || "", doc_type: r2.doc_type || "Thông tư",
                          articles: r2.articles || "", threshold: r2.threshold || "", status: r2.status || "pending",
                          note: r2.note || ""
                        });
                        setLfModal({ open: true, index: i });
                      }} sx={{ marginRight: 4 }}>Sửa</Btn>
                      <Btn v="ghost" sz="sm" onClick={() => {
                        if (confirm(`Xóa "${r.code}" khỏi danh sách?`)) {
                          const next = (survey.legal_framework || []).filter((_, idx) => idx !== i);
                          setSurvey(p => ({ ...p, legal_framework: next }));
                        }
                      }} sx={{ color: C.red }}>Xóa</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(survey.legal_framework || []).length > 0 && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <Btn v="ghost" sz="sm" onClick={() => {
              if (confirm("Xóa tất cả văn bản pháp lý?")) setSurvey(p => ({ ...p, legal_framework: [] }));
            }} sx={{ color: C.red, fontSize: 12 }}>🗑 Xóa tất cả</Btn>
          </div>
        )}
      </Card>

      {/* Phụ lục – Đăng ký tuân thủ pháp lý và tiêu chuẩn (CRUD) */}
      <Card title="Phụ lục – Đăng ký tuân thủ pháp lý và tiêu chuẩn" icon="📑" accent={C.teal}>
        <div style={{ marginBottom: 14, fontSize: FONT.body, color: C.t1 }}>Quản lý bảng A.1 (Pháp luật VN) và A.2 (ISO 500xx). Dữ liệu lưu vào phiên khảo sát và xuất ra báo cáo DOCX.</div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            <strong style={{ color: C.t0, fontSize: FONT.body }}>1. Pháp luật Việt Nam – Mức độ tuân thủ</strong>
            <Btn v="outline" sz="sm" onClick={openLegalAdd}>＋ Thêm văn bản</Btn>
          </div>
          <div style={{ overflowX: "auto", border: `1px solid ${C.bd0}`, borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Văn bản</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Nội dung</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Loại</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Điều khoản</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Trạng thái</th>
                  <th style={{ padding: "8px 10px", width: 100, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {legalRegistry.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 12, color: C.t3, textAlign: "center" }}>Chưa có mục. Nhấn "Thêm văn bản" hoặc dùng danh sách mặc định khi tạo phiên mới.</td></tr>
                ) : legalRegistry.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                    <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", color: C.blueL }}>{r.code}</td>
                    <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{r.subject}</td>
                    <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{r.doc_type}</td>
                    <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t2, fontSize: FONT.label }}>{r.articles}</td>
                    <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}` }}>
                      <Tag c={r.status === "compliant" ? C.teal : r.status === "partial" ? C.amber : r.status === "non_compliant" ? C.red : C.grey2}>
                        {LEGAL_STATUS_OPT.find(([v]) => v === r.status)?.[1] || "○"}
                      </Tag>
                    </td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                      <Btn v="ghost" sz="sm" onClick={() => openLegalEdit(i)} sx={{ marginRight: 4 }}>Sửa</Btn>
                      <Btn v="ghost" sz="sm" onClick={() => removeLegal(i)} sx={{ color: C.red }}>Xóa</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            <strong style={{ color: C.t0, fontSize: FONT.body }}>2. Họ tiêu chuẩn ISO 500xx áp dụng</strong>
            <Btn v="outline" sz="sm" onClick={openIsoAdd}>＋ Thêm tiêu chuẩn</Btn>
          </div>
          <div style={{ overflowX: "auto", border: `1px solid ${C.bd0}`, borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
              <thead>
                <tr style={{ background: C.bg3 }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mã tiêu chuẩn</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Nội dung / Vai trò</th>
                  <th style={{ padding: "8px 10px", width: 100, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isoRegistry.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 12, color: C.t3, textAlign: "center" }}>Chưa có mục. Nhấn "Thêm tiêu chuẩn".</td></tr>
                ) : isoRegistry.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                    <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontFamily: "'Fira Code',monospace", color: C.blueL }}>{r.standard_id}</td>
                    <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{r.focus}</td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                      <Btn v="ghost" sz="sm" onClick={() => openIsoEdit(i)} sx={{ marginRight: 4 }}>Sửa</Btn>
                      <Btn v="ghost" sz="sm" onClick={() => removeIso(i)} sx={{ color: C.red }}>Xóa</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Lộ trình tư vấn chứng nhận ISO 50001:2018 — CRUD */}
      <Card title="Lộ trình tư vấn chứng nhận ISO 50001:2018" icon="🗓️" accent={C.blue}>
        <RoadmapGantt roadmapRows={roadmapRows} setRoadmapRows={setRoadmap} meta={meta} setMeta={setMeta} apiUrl={window.location.hostname === "localhost" && window.location.port === "5173" ? "http://localhost:5002" : ""} />
      </Card>

      {/* Modal 1 */}
      <Modal open={legalModal.open} onClose={() => setLegalModal({ open: false, index: null })} title={legalModal.index === null ? "Thêm văn bản pháp luật" : "Sửa văn bản pháp luật"} width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Mã văn bản" required><Input value={legalForm.code} onChange={v => setLegalForm(f => ({ ...f, code: v }))} placeholder="VD: TT 25/2020/TT-BCT, Nghị định 30/2026" /></Field>
          <Field label="Nội dung / Tên"><Input value={legalForm.subject} onChange={v => setLegalForm(f => ({ ...f, subject: v }))} placeholder="Quản lý NL tại cơ sở CN trọng điểm" /></Field>
          <Field label="Loại văn bản"><Sel value={legalForm.doc_type} onChange={v => setLegalForm(f => ({ ...f, doc_type: v }))} options={DOC_TYPES.map(t => [t, t])} /></Field>
          <Field label="Điều khoản / Phạm vi áp dụng"><Input value={legalForm.articles} onChange={v => setLegalForm(f => ({ ...f, articles: v }))} placeholder="Điều 4–20" /></Field>
          <Field label="Ngưỡng áp dụng"><Input value={legalForm.threshold} onChange={v => setLegalForm(f => ({ ...f, threshold: v }))} placeholder="≥1.000 TOE/năm" /></Field>
          <Field label="Trạng thái tuân thủ"><Sel value={legalForm.status} onChange={v => setLegalForm(f => ({ ...f, status: v }))} options={LEGAL_STATUS_OPT} /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Btn v="ghost" sz="md" onClick={() => setLegalModal({ open: false, index: null })}>Hủy</Btn><Btn v="blue" sz="md" onClick={saveLegal}>Lưu</Btn></div>
        </div>
      </Modal>

      {/* Modal 2 */}
      <Modal open={isoModal.open} onClose={() => setIsoModal({ open: false, index: null })} title={isoModal.index === null ? "Thêm tiêu chuẩn ISO 500xx" : "Sửa tiêu chuẩn ISO 500xx"} width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Mã tiêu chuẩn" required><Input value={isoForm.standard_id} onChange={v => setIsoForm(f => ({ ...f, standard_id: v }))} placeholder="ISO 50001:2018" /></Field>
          <Field label="Nội dung / Vai trò trong dự án"><TA value={isoForm.focus} onChange={v => setIsoForm(f => ({ ...f, focus: v }))} rows={2} placeholder="Tiêu chuẩn gốc — EnMS Requirements" /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Btn v="ghost" sz="md" onClick={() => setIsoModal({ open: false, index: null })}>Hủy</Btn><Btn v="blue" sz="md" onClick={saveIso}>Lưu</Btn></div>
        </div>
      </Modal>

      {/* Modal Khung pháp lý CRUD */}
      <Modal open={lfModal.open} onClose={() => setLfModal({ open: false, index: null })} title={lfModal.index === null ? "Thêm văn bản pháp lý" : "Sửa văn bản pháp lý"} width={560}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Mã văn bản *" required><Input value={lfForm.code} onChange={v => setLfForm(f => ({ ...f, code: v }))} placeholder="VD: TT 25/2020/TT-BCT, NĐ 30/2026/NĐ-CP" /></Field>
          <Field label="Nội dung / Tên văn bản"><Input value={lfForm.subject} onChange={v => setLfForm(f => ({ ...f, subject: v }))} placeholder="Quản lý NL tại cơ sở CN trọng điểm" /></Field>
          <Grid cols={2} gap={12}>
            <Field label="Loại văn bản"><Sel value={lfForm.doc_type} onChange={v => setLfForm(f => ({ ...f, doc_type: v }))} options={DOC_TYPES.map(t => [t, t])} /></Field>
            <Field label="Trạng thái tuân thủ"><Sel value={lfForm.status} onChange={v => setLfForm(f => ({ ...f, status: v }))} options={LEGAL_STATUS_OPT} /></Field>
          </Grid>
          <Grid cols={2} gap={12}>
            <Field label="Điều khoản / Phạm vi"><Input value={lfForm.articles} onChange={v => setLfForm(f => ({ ...f, articles: v }))} placeholder="Điều 4–20" /></Field>
            <Field label="Ngưỡng áp dụng"><Input value={lfForm.threshold} onChange={v => setLfForm(f => ({ ...f, threshold: v }))} placeholder="≥1.000 TOE/năm" /></Field>
          </Grid>
          <Field label="Ghi chú"><TA value={lfForm.note} onChange={v => setLfForm(f => ({ ...f, note: v }))} rows={2} placeholder="Ghi chú thêm..." /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn v="ghost" sz="md" onClick={() => setLfModal({ open: false, index: null })}>Hủy</Btn>
            <Btn v="blue" sz="md" onClick={saveLf}>Lưu</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal Lộ trình chứng nhận */}


    </div>
  );
}
