/**
 * ISO50001Gap — frontend/StepOrg.jsx
 * Step 1: Thông tin tổ chức, cơ sở, đoàn khảo sát, mục tiêu + Phụ lục 14 CRUD
 */
import { useState } from "react";
import { C, FONT, EXEC_SUMMARY_STANDARD_ITEMS } from "./gap.ui.constants.js";
import { Card, Field, Grid, Input, TA, Sel, Tag, Btn, Modal } from "./gap.atoms.jsx";

const LEGAL_STATUS_OPT = [
  ["pending", "○ Chưa xác định"],
  ["compliant", "✓ Tuân thủ"],
  ["partial", "⚠ Một phần"],
  ["non_compliant", "✗ Chưa tuân thủ"],
  ["not_applicable", "— Không áp dụng"],
];
const DOC_TYPES = ["Luật", "Nghị định", "Thông tư", "QĐ TTg", "QĐ BCT", "Khác"];

const INDUSTRIES = [
  "",
  // ── Vật liệu xây dựng & khoáng sản ──
  "Sản xuất xi măng & clinker", "Sản xuất gạch & ngói", "Sản xuất đá nhân tạo & đá ốp lát",
  "Sản xuất cristobalite & khoáng chất trắng", "Sản xuất tấm ốp sàn & sàn vinyl",
  "Sản xuất vách ngăn & tấm thạch cao", "Sản xuất kính & gương",
  "Sản xuất gốm sứ & gạch men", "Sản xuất vật liệu cách nhiệt & chống cháy",
  "Khai thác & chế biến khoáng sản", "Sản xuất bê tông thương phẩm & cấu kiện bê tông",
  // ── Kim loại & cơ khí ──
  "Sản xuất thép & cán thép", "Sản xuất nhôm & hợp kim nhôm",
  "Sản xuất đồng & hợp kim đồng", "Sản xuất kẽm & mạ kẽm",
  "Đúc & gia công kim loại", "Sản xuất ổ bi & bạc đạn",
  "Sản xuất linh kiện dập ép & stamping", "Sản xuất kết cấu thép & hàn",
  "Sản xuất dây điện & cáp điện", "Sản xuất bơm & van công nghiệp",
  "Sản xuất máy móc & thiết bị công nghiệp", "Sản xuất máy nông nghiệp",
  "Sản xuất động cơ & máy phát điện",
  // ── Xe & phương tiện ──
  "Sản xuất ô tô & phụ tùng ô tô", "Sản xuất xe máy & phụ kiện xe máy",
  "Sản xuất xe đạp & phụ kiện xe đạp", "Đóng tàu & sửa chữa tàu thuyền",
  // ── Điện & điện tử ──
  "Sản xuất điện tử & linh kiện", "Sản xuất bán dẫn & vi mạch",
  "Sản xuất bản mạch in (PCB)", "Sản xuất tấm pin mặt trời",
  "Sản xuất pin & ắc quy", "Sản xuất đèn LED & thiết bị chiếu sáng",
  "Sản xuất thiết bị điện & tủ bảng điện",
  // ── Hóa chất & vật liệu ──
  "Sản xuất hóa chất cơ bản", "Sản xuất khí công nghiệp",
  "Sản xuất phân bón", "Sản xuất thuốc bảo vệ thực vật",
  "Sản xuất sơn & chất phủ bề mặt", "Sản xuất keo dán & chất kết dính",
  "Sản xuất nhựa & sản phẩm nhựa", "Sản xuất cao su & sản phẩm cao su",
  "Sản xuất lốp xe & săm xe", "Sản xuất nhựa đường & bitumen",
  "Sản xuất chất tẩy rửa & hóa chất gia dụng", "Sản xuất mỹ phẩm & chăm sóc cá nhân",
  "Sản xuất dược phẩm", "Sản xuất thiết bị y tế",
  // ── Gỗ & nội thất ──
  "Sản xuất gỗ xẻ & gỗ nguyên liệu", "Sản xuất ván ép, MDF & HDF",
  "Sản xuất đồ gỗ & nội thất gia đình", "Sản xuất đồ nhựa gia dụng",
  // ── Giấy & bao bì ──
  "Sản xuất giấy & bột giấy", "Sản xuất giấy vệ sinh & giấy tissue",
  "Sản xuất bìa carton & hộp giấy", "In ấn & bao bì",
  // ── Dệt may & da giày ──
  "Sản xuất sợi & chỉ may", "Sản xuất vải dệt & len",
  "Sản xuất quần áo & may mặc", "Sản xuất giày dép & túi xách",
  "Thuộc da & sản phẩm da", "Sản xuất sợi thủy tinh & composite",
  // ── Thực phẩm & nông sản ──
  "Sản xuất thức ăn chăn nuôi", "Chế biến thủy hải sản",
  "Chế biến thịt & gia súc gia cầm", "Sản xuất sữa & sản phẩm từ sữa",
  "Chế biến & đông lạnh thực phẩm", "Sản xuất đồ hộp & thực phẩm đóng gói",
  "Xay xát lúa gạo & chế biến ngũ cốc", "Sản xuất mì ăn liền & thực phẩm tiện lợi",
  "Sản xuất dầu ăn & chất béo thực phẩm", "Sản xuất đường & mật mía",
  "Sản xuất & chế biến cà phê", "Sản xuất & chế biến chè",
  "Chưng cất rượu, bia & nước giải khát", "Sản xuất gia vị & phụ gia thực phẩm",
  "Sản xuất thuốc lá", "Sản xuất thực phẩm chay & dinh dưỡng",
  // ── Năng lượng & tiện ích ──
  "Sản xuất điện (nhiệt điện, thủy điện, khí)", "Năng lượng tái tạo (mặt trời, gió, sinh khối)",
  "Phân phối gas & dầu mỏ", "Xử lý & cấp thoát nước", "Xử lý chất thải & tái chế",
  // ── Dịch vụ & thương mại ──
  "Logistics & kho lạnh", "Cảng biển & vận tải hàng hóa",
  "Khách sạn & dịch vụ lưu trú", "Bệnh viện & y tế", "Giáo dục & nghiên cứu",
  "Công nghệ thông tin & phần mềm", "Dịch vụ thương mại & văn phòng",
  "Khu công nghiệp & KCX", "Xây dựng & thi công công trình",
  "Sản xuất đồ chơi & thủ công mỹ nghệ", "Sản xuất dụng cụ thể thao",
  "Sản xuất thiết bị bảo hộ lao động",
  "Ngành khác",
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

/** Chức vụ Người đại diện Công ty — dropdown */
const REPRESENTATIVE_POSITIONS = [
  ["", "— Chọn chức vụ —"],
  ["Chủ tịch Hội đồng quản trị", "Chủ tịch Hội đồng quản trị"],
  ["Tổng Giám đốc", "Tổng Giám đốc"],
  ["Giám đốc", "Giám đốc"],
  ["Phó Tổng Giám đốc", "Phó Tổng Giám đốc"],
  ["Phó Giám đốc", "Phó Giám đốc"],
  ["Xưởng trưởng", "Xưởng trưởng"],
  ["Trưởng Ban năng lượng", "Trưởng Ban năng lượng"],
  ["Trưởng Phòng QA", "Trưởng Phòng QA"],
  ["Trưởng Phòng QC", "Trưởng Phòng QC"],
  ["Trưởng Phòng QA/QC", "Trưởng Phòng QA/QC"],
  ["Trưởng Phòng Sản xuất", "Trưởng Phòng Sản xuất"],
  ["Trưởng Phòng Kỹ thuật", "Trưởng Phòng Kỹ thuật"],
  ["Trưởng Phòng Bảo trì", "Trưởng Phòng Bảo trì"],
  ["Trưởng Công vụ", "Trưởng Công vụ"],
];

/** Cơ cấu tổ chức — danh sách phòng ban chức năng (dropdown + CRUD) */
const DEPARTMENT_OPTIONS = [
  "Ban Giám đốc",
  "Phòng Hành chính – Nhân sự",
  "Phòng Kế toán – Tài chính",
  "Phòng Kỹ thuật",
  "Phòng Sản xuất",
  "Phòng QA/QC",
  "Phòng Bảo trì",
  "Phòng Mua hàng – Cung ứng",
  "Phòng Kho vận",
  "Phòng Kinh doanh",
  "Phòng R&D",
  "Ban An toàn – Môi trường",
  "Ban Năng lượng (EMR)",
  "Bộ phận Xưởng vụ",
  "Bộ phận Tư Tài",
  "Bộ phận Vật tư và Thiết bị",
  "Bộ phận Ống định hình",
  "Bộ phận Sườn xe",
  "Bộ phận Sơn / Xi mạ",
  "Bộ phận Niềng xe / Vành xe",
  "Bộ phận Lắp ráp xe hoàn thiện",
  "Bộ phận Quản lý SX / Sinh Quản",
  "Bộ phận Hành chính",
  "Bộ phận Kiểm phẩm",
  "Bộ phận Khai thác",
  "Bộ phận Quản lý",
  "Bộ phận Tài vụ",
  "Bộ phận Xuất nhập khẩu",
  "Bộ phận Thu mua",
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
    <Field label="5.2. Phạm vi nguồn năng lượng">
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

/** 5.3 Phạm vi sản phẩm / dịch vụ — danh mục dropdown (ISO 50001:2018) */
const SCOPE_PRODUCT_OPTIONS = [
  // ── Vật liệu xây dựng & khoáng sản ──
  "Sản xuất xi măng & clinker",
  "Sản xuất gạch & ngói",
  "Sản xuất đá nhân tạo & đá ốp lát",
  "Sản xuất cristobalite & khoáng chất trắng",
  "Sản xuất tấm sàn & ốp tường (vinyl, SPC...)",
  "Sản xuất vách ngăn & tấm thạch cao",
  "Sản xuất kính & gương",
  "Sản xuất gốm sứ & gạch men",
  "Sản xuất vật liệu cách nhiệt & chống cháy",
  "Khai thác & chế biến khoáng sản",
  "Sản xuất bê tông thương phẩm & cấu kiện",
  // ── Kim loại & cơ khí ──
  "Sản xuất thép & cán thép",
  "Sản xuất nhôm & hợp kim nhôm",
  "Sản xuất đồng & hợp kim đồng",
  "Sản xuất kẽm & mạ kẽm",
  "Đúc & gia công kim loại (casting)",
  "Sản xuất ổ bi & bạc đạn",
  "Sản xuất linh kiện dập ép & stamping",
  "Sản xuất kết cấu thép & hàn kết cấu",
  "Sản xuất dây điện & cáp điện",
  "Sản xuất bơm & van công nghiệp",
  "Sản xuất máy móc & thiết bị công nghiệp",
  "Sản xuất máy nông nghiệp & thiết bị canh tác",
  "Sản xuất động cơ & máy phát điện",
  // ── Xe & phương tiện ──
  "Sản xuất ô tô & phụ tùng ô tô",
  "Sản xuất xe máy & phụ kiện xe máy",
  "Sản xuất xe đạp & phụ kiện xe đạp",
  "Đóng tàu & sửa chữa tàu thuyền",
  // ── Điện & điện tử ──
  "Sản xuất điện tử & linh kiện điện tử",
  "Sản xuất bán dẫn & vi mạch",
  "Sản xuất bản mạch in (PCB)",
  "Sản xuất tấm pin mặt trời",
  "Sản xuất pin & ắc quy",
  "Sản xuất đèn LED & thiết bị chiếu sáng",
  "Sản xuất thiết bị điện & tủ bảng điện",
  // ── Hóa chất & vật liệu ──
  "Sản xuất hóa chất cơ bản & chuyên dụng",
  "Sản xuất khí công nghiệp (O₂, N₂, CO₂...)",
  "Sản xuất phân bón (NPK, ure, DAP...)",
  "Sản xuất thuốc bảo vệ thực vật & diệt cỏ",
  "Sản xuất sơn & chất phủ bề mặt",
  "Sản xuất keo dán & chất kết dính",
  "Sản xuất nhựa & sản phẩm nhựa",
  "Sản xuất cao su & sản phẩm từ cao su",
  "Sản xuất lốp xe & săm xe",
  "Sản xuất nhựa đường & bitumen",
  "Sản xuất chất tẩy rửa & hóa chất gia dụng",
  "Sản xuất mỹ phẩm & chăm sóc cá nhân",
  "Sản xuất dược phẩm",
  "Sản xuất thiết bị y tế",
  // ── Gỗ & nội thất ──
  "Sản xuất gỗ xẻ & gỗ nguyên liệu",
  "Sản xuất ván ép, MDF & HDF",
  "Sản xuất đồ gỗ & nội thất gia đình",
  "Sản xuất đồ nhựa gia dụng & văn phòng",
  // ── Giấy & bao bì ──
  "Sản xuất giấy & bột giấy",
  "Sản xuất giấy vệ sinh & giấy tissue",
  "Sản xuất bìa carton & hộp giấy",
  "In ấn & bao bì",
  // ── Dệt may & da giày ──
  "Sản xuất sợi & vải dệt",
  "Sản xuất vải dệt kim & len",
  "Sản xuất quần áo & may mặc",
  "Sản xuất giày dép & túi xách",
  "Thuộc da & sản phẩm da",
  "Sản xuất sợi thủy tinh & composite",
  // ── Thực phẩm & nông sản ──
  "Sản xuất thức ăn chăn nuôi",
  "Chế biến thủy hải sản",
  "Chế biến thịt & gia súc gia cầm",
  "Sản xuất sữa & sản phẩm từ sữa",
  "Chế biến & đông lạnh thực phẩm",
  "Sản xuất đồ hộp & thực phẩm đóng gói",
  "Xay xát lúa gạo & chế biến ngũ cốc",
  "Sản xuất mì ăn liền & thực phẩm tiện lợi",
  "Sản xuất dầu ăn & chất béo thực phẩm",
  "Sản xuất đường & mật mía",
  "Sản xuất & chế biến cà phê",
  "Sản xuất & chế biến chè",
  "Chưng cất rượu, bia & nước giải khát",
  "Sản xuất gia vị & phụ gia thực phẩm",
  "Sản xuất thuốc lá",
  "Sản xuất thực phẩm dinh dưỡng & chức năng",
  // ── Năng lượng & tiện ích ──
  "Sản xuất điện (nhiệt điện, thủy điện, khí)",
  "Năng lượng tái tạo (mặt trời, gió, sinh khối)",
  "Phân phối gas & dầu mỏ",
  "Xử lý & cấp thoát nước",
  "Xử lý chất thải & tái chế",
  // ── Dịch vụ & thương mại ──
  "Khu công nghiệp & KCX",
  "Xây dựng & thi công công trình",
  "Logistics & kho lạnh",
  "Cảng biển & vận tải hàng hóa",
  "Khách sạn & dịch vụ lưu trú",
  "Y tế & bệnh viện",
  "Giáo dục & nghiên cứu",
  "Công nghệ thông tin & phần mềm",
  "Dịch vụ thương mại & văn phòng",
  "Sản xuất dụng cụ thể thao & giải trí",
  "Sản xuất đồ chơi & thủ công mỹ nghệ",
  "Sản xuất thiết bị bảo hộ lao động",
  "Sản phẩm / Dịch vụ khác",
];

/** Chuẩn hóa scope_product từ DB: có thể là string (cũ) hoặc array */
function normalizeScopeProduct(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(/\s*;\s*/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Phạm vi sản phẩm / dịch vụ: dropdown + CRUD, lưu/truy vấn MongoDB (client.scope_product[]) */
function ScopeProductSection({ client, setClient, C, Field, Btn, Sel }) {
  const items = normalizeScopeProduct(client.scope_product);
  const setItems = (arr) => setClient("scope_product", arr);

  const [selectedOption, setSelectedOption] = useState("");
  const [customText, setCustomText] = useState("");
  const options = [["", "— Chọn sản phẩm / dịch vụ —"], ...SCOPE_PRODUCT_OPTIONS.map((label) => [label, label])];

  const addSelected = () => {
    if (!selectedOption?.trim()) return;
    if (items.includes(selectedOption.trim())) return;
    setItems([...items, selectedOption.trim()]);
    setSelectedOption("");
  };

  const addCustom = () => {
    if (!customText.trim()) return;
    if (items.includes(customText.trim())) return;
    setItems([...items, customText.trim()]);
    setCustomText("");
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <Field label="5.3. Phạm vi sản phẩm / dịch vụ">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Row 1: Dropdown + Thêm */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ minWidth: 320 }}>
            <Sel value={selectedOption} onChange={setSelectedOption} options={options} />
          </div>
          <Btn v="outline" sz="sm" onClick={addSelected} disabled={!selectedOption?.trim()}>
            ＋ Thêm
          </Btn>
        </div>
        {/* Row 2: Tự nhập tùy chỉnh */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Hoặc nhập tên sản phẩm / dịch vụ tùy chỉnh..."
            style={{
              flex: 1, minHeight: 38, padding: "6px 12px", background: C.bg3,
              border: `1px solid ${C.bd0}`, borderRadius: 8, color: C.t0, fontSize: 14, fontFamily: "inherit"
            }}
          />
          <Btn v="ghost" sz="sm" onClick={addCustom} disabled={!customText.trim()}>＋ Thêm tùy chỉnh</Btn>
        </div>
        {/* Table */}
        <div style={{ border: `1px solid ${C.bd0}`, borderRadius: 8, overflow: "hidden", background: C.bg2 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.bd0}`, width: 36 }}>#</th>
                <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Sản phẩm / Dịch vụ trong phạm vi</th>
                <th style={{ padding: "8px 12px", width: 100, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 16, color: C.t3, textAlign: "center" }}>
                    Chưa có sản phẩm / dịch vụ. Chọn từ dropdown hoặc nhập tùy chỉnh rồi nhấn &quot;＋ Thêm&quot;.
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 320 }}>
              <Sel value={selectedStandard} onChange={setSelectedStandard} options={options} />
            </div>
            <Btn v="outline" sz="sm" onClick={addFromDropdown} disabled={!selectedStandard?.trim()}>
              Thêm mục đã chọn
            </Btn>
            <Btn v="outline" sz="sm" onClick={openAddCustom}>＋ Thêm (mục tùy chỉnh)</Btn>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
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

export default function StepOrg({ survey, setSurvey }) {
  const setMeta = (k, v) => setSurvey(p => ({ ...p, meta: { ...p.meta, [k]: v } }));
  const setClient = (k, v) => setSurvey(p => ({ ...p, client: { ...p.client, [k]: v } }));
  const setVerifier = (k, v) => setSurvey(p => ({ ...p, verifier: { ...p.verifier, [k]: v } }));
  const setPlan = (k, v) => setSurvey(p => ({ ...p, audit_plan: { ...(p.audit_plan || {}), [k]: v } }));

  const legalRegistry = survey.legal_registry || [];
  const isoRegistry = survey.iso_standards_registry || [];
  const setLegalRegistry = arr => setSurvey(p => ({ ...p, legal_registry: arr }));
  const setIsoRegistry = arr => setSurvey(p => ({ ...p, iso_standards_registry: arr }));

  const [legalModal, setLegalModal] = useState({ open: false, index: null });
  const [legalForm, setLegalForm] = useState({ code: "", subject: "", doc_type: "Thông tư", articles: "", threshold: "", status: "pending" });
  const [isoModal, setIsoModal] = useState({ open: false, index: null });
  const [isoForm, setIsoForm] = useState({ standard_id: "", focus: "" });

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

  const [tripModal, setTripModal] = useState({ open: false, index: null });
  const [tripForm, setTripForm] = useState({
    mode: "air",
    provider: "",
    from_city: "",
    to_city: "",
    depart_date: "",
    return_date: "",
    people: 1,
    nights: 1,
    hotel: "",
    rooms: 1,
    note: "",
  });
  const logisticsTrips = Array.isArray(survey.logistics_trips) ? survey.logistics_trips : [];
  const setTrips = arr => setSurvey(p => ({ ...p, logistics_trips: arr }));

  const openTripAdd = () => {
    setTripForm({
      mode: "air",
      provider: "",
      from_city: survey.audit_plan?.from_city || "",
      to_city: survey.audit_plan?.to_city || survey.client?.site || "",
      depart_date: survey.audit_plan?.from_date || "",
      return_date: survey.audit_plan?.to_date || "",
      people: 1,
      nights: 1,
      hotel: "",
      rooms: 1,
      note: "",
    });
    setTripModal({ open: true, index: null });
  };
  const openTripEdit = i => {
    const t = logisticsTrips[i];
    if (!t) return;
    setTripForm({
      mode: t.mode || "air",
      provider: t.provider || "",
      from_city: t.from_city || "",
      to_city: t.to_city || "",
      depart_date: t.depart_date || "",
      return_date: t.return_date || "",
      people: t.people || 1,
      nights: t.nights || 1,
      hotel: t.hotel || "",
      rooms: t.rooms || 1,
      note: t.note || "",
    });
    setTripModal({ open: true, index: i });
  };
  const saveTrip = () => {
    const next = [...logisticsTrips];
    const row = { ...tripForm };
    if (tripModal.index === null) next.push(row); else next[tripModal.index] = row;
    setTrips(next);
    setTripModal({ open: false, index: null });
  };
  const removeTrip = i => setTrips(logisticsTrips.filter((_, idx) => idx !== i));

  const { meta, client, verifier, audit_plan } = survey;
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
            <Input value={meta.survey_date} onChange={v => setMeta("survey_date", v)} placeholder="DD/MM/YYYY – DD/MM/YYYY" />
          </Field>
          <Field label="Phiên bản"><Input value={meta.version} onChange={v => setMeta("version", v)} placeholder="v1.0" /></Field>
          <Field label="Giai đoạn tư vấn">
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
          <Field label="Tên tổ chức / Công ty" required sx={{ gridColumn: "1/-1" }}>
            <Input value={client.name} onChange={v => setClient("name", v)} placeholder="Công ty Cổ phần / TNHH..." />
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
          <input type="checkbox" id="large_user" checked={!!client.is_large_user}
            onChange={e => setClient("is_large_user", e.target.checked)}
            style={{ width: 16, height: 16, accentColor: C.orangeL, cursor: "pointer" }} />
          <label htmlFor="large_user" style={{ cursor: "pointer", fontSize: 14.5, color: C.t0, lineHeight: 1.5 }}>
            <strong style={{ color: C.orangeL }}>Cơ sở sử dụng NL trọng điểm</strong> (≥1.000 TOE/năm)
            — Bắt buộc: Kiểm toán NL định kỳ 3 năm, báo cáo hàng năm, kế hoạch 5 năm và khuyến khích áp dụng ISO 50001 theo Nghị định 30/2026, TT 25/2020/TT-BCT và TT 25/2020
          </label>
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
            <TA value={client.products_services || ""} onChange={v => setClient("products_services", v)} rows={3}
              placeholder="Mô tả ngắn sản phẩm chính, dịch vụ cung cấp..." />
          </Field>
        </div>

        {/* 6. Phạm vi & ranh giới xin cấp chứng nhận ISO 50001:2018 */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bd1}` }}>
          <div style={{ fontSize: FONT.body, fontWeight: 700, color: C.skyL, marginBottom: 10 }}>6. Phạm vi & ranh giới xin cấp chứng nhận ISO 50001:2018</div>
          <Grid cols={1} gap={12}>
            <Field label="5.1. Phạm vi địa lý">
              <Input value={client.scope_geographical || ""} onChange={v => setClient("scope_geographical", v)}
                placeholder="VD: Toàn bộ nhà máy tại KCN VSIP Bình Dương" />
            </Field>
            <ScopeEnergySection client={client} setClient={setClient} C={C} Field={Field} Btn={Btn} Sel={Sel} />
            <ScopeProductSection client={client} setClient={setClient} C={C} Field={Field} Btn={Btn} Sel={Sel} />
            <Field label="5.4. Phương thức kiểm soát hệ thống">
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
            <Input value={verifier.org} onChange={v => setVerifier("org", v)} placeholder="Trung tâm Tư vấn Năng lượng..." />
          </Field>
          <Field label="Giấy phép / Công nhận">
            <Input value={verifier.accred} onChange={v => setVerifier("accred", v)} placeholder="Giấy phép kiểm toán NL số .../BCT" />
          </Field>
          <Field label="Trưởng đoàn (Lead Auditor)">
            <Input value={verifier.lead} onChange={v => setVerifier("lead", v)} placeholder="Nguyễn Văn A — Energy Auditor Cấp II" />
          </Field>
          <Field label="Thành viên đoàn" sx={{ gridColumn: "1/-1" }}>
            <Input value={verifier.team} onChange={v => setVerifier("team", v)} placeholder="Trần B; Lê C; Phạm D" />
          </Field>
          <Field label="Số chứng chỉ EA">
            <Input value={verifier.cert_no} onChange={v => setVerifier("cert_no", v)} placeholder="EA-BCT-2021-0456" />
          </Field>
          <Field label="Tiêu chuẩn áp dụng">
            <Input value={verifier.std_applied} onChange={v => setVerifier("std_applied", v)}
              placeholder="ISO 50001:2018; ISO 50006:2014; ISO 50002:2014" />
          </Field>
        </Grid>
      </Card>

      {/* Kế hoạch đánh giá GAP (thông tin có thể xuất trong báo cáo) */}
      <Card title="Kế hoạch đánh giá GAP" icon="🧭" accent={C.green}>
        <Grid cols={3} gap={16}>
          <Field label="Mã kế hoạch / Hợp đồng">
            <Input value={audit_plan?.plan_code || ""} onChange={v => setPlan("plan_code", v)} placeholder="PLAN-2024-001 / HĐ TVNL-2024-01" />
          </Field>
          <Field label="Đợt khảo sát">
            <Input value={audit_plan?.visit_no || ""} onChange={v => setPlan("visit_no", v)} placeholder="Đợt 1/2024" />
          </Field>
          <Field label="Mã khách hàng nội bộ">
            <Input value={audit_plan?.customer_ref || ""} onChange={v => setPlan("customer_ref", v)} placeholder="KH-ENERGY-001" />
          </Field>
          <Field label="Đi từ (Thành phố / Sân bay)">
            <Input value={audit_plan?.from_city || ""} onChange={v => setPlan("from_city", v)} placeholder="Hà Nội (HAN)" />
          </Field>
          <Field label="Đến (Thành phố / Khu vực)">
            <Input value={audit_plan?.to_city || ""} onChange={v => setPlan("to_city", v)} placeholder="Nhà máy ABC – KCN VSIP Hải Phòng" />
          </Field>
          <Field label="Khoảng thời gian khảo sát">
            <Input
              value={audit_plan?.from_date || audit_plan?.to_date ? `${audit_plan.from_date || ""} – ${audit_plan.to_date || ""}` : ""}
              onChange={v => {
                const parts = String(v || "").split("–");
                const from = parts[0]?.trim() || "";
                const to = parts[1]?.trim() || "";
                setPlan("from_date", from);
                setPlan("to_date", to);
              }}
              placeholder="DD/MM/YYYY – DD/MM/YYYY"
            />
          </Field>
          <Field label="Danh sách auditors (tóm tắt)" sx={{ gridColumn: "1/-1" }}>
            <TA
              value={(audit_plan?.auditors || []).map(a => `${a.name || ""}${a.role ? ` (${a.role})` : ""}${a.org ? ` – ${a.org}` : ""}`).filter(Boolean).join("; ") || verifier.team || ""}
              onChange={v => {
                const list = String(v || "").split(";").map(s => s.trim()).filter(Boolean).map(name => ({ name }));
                setPlan("auditors", list);
              }}
              rows={2}
              placeholder="VD: Nguyễn Văn A (Lead); Trần Thị B (Auditor); ..."
            />
          </Field>
        </Grid>
      </Card>

      {/* Quản trị nội bộ – Logistics & Đặt phòng (KHÔNG xuất trong báo cáo GAP) */}
      <Card title="Quản trị nội bộ – Logistics & Đặt phòng (không xuất báo cáo GAP)" icon="🧳" accent={C.teal}>
        <div style={{ marginBottom: 8, fontSize: 14, color: C.t1 }}>
          Quản lý chi tiết các chuyến đi (di chuyển & lưu trú) cho đợt khảo sát này. Dữ liệu này chỉ phục vụ quản trị nội bộ
          (kế hoạch, chi phí, logistics) và <strong>không được xuất trong báo cáo GAP gửi khách hàng</strong>.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <Btn v="outline" sz="sm" onClick={openTripAdd}>＋ Thêm chuyến đi</Btn>
        </div>

        <div style={{ overflowX: "auto", border: `1px solid ${C.bd0}`, borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Loại</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Nhà cung cấp</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Tuyến đường</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Thời gian</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Số người / Phòng</th>
                <th style={{ padding: "8px 10px", width: 120, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {logisticsTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12, color: C.t3, textAlign: "center" }}>
                    Chưa có chuyến đi nào. Nhấn &quot;Thêm chuyến đi&quot; để khai báo kế hoạch logistics (vé máy bay, tàu, xe, khách sạn...).
                  </td>
                </tr>
              ) : logisticsTrips.map((t, i) => (
                <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, whiteSpace: "nowrap" }}>
                    <Tag c={t.mode === "air" ? C.sky : t.mode === "water" ? C.teal : C.orange}>
                      {t.mode === "air" ? "✈ Đường không" : t.mode === "water" ? "🚢 Đường thủy" : "🚗 Đường bộ"}
                    </Tag>
                  </td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{t.provider}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                    {t.from_city || "—"} → {t.to_city || "—"}
                  </td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                    {t.depart_date || "—"} {t.return_date ? `→ ${t.return_date}` : ""}
                  </td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1, fontSize: 13 }}>
                    {t.people || 0} người / {t.rooms || 0} phòng{t.hotel ? ` @ ${t.hotel}` : ""}
                  </td>
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                    <Btn v="ghost" sz="sm" onClick={() => openTripEdit(i)} sx={{ marginRight: 4 }}>Sửa</Btn>
                    <Btn v="ghost" sz="sm" onClick={() => removeTrip(i)} sx={{ color: C.red }}>Xóa</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legal applicability quick check */}
      <Card title="Xác định khung pháp lý áp dụng" icon="⚖️" accent={C.red}>
        <div style={{ fontSize: 14, color: C.t1, marginBottom: 10 }}>Chọn trạng thái tuân thủ hiện tại với các văn bản pháp lý Việt Nam</div>
        <Grid cols={2} gap={12} minCol="280px">
          {[
            ["Luật 50/2010/QH12, Luật 77/2025/QH15", "Luật Sử dụng NL tiết kiệm và HQ; Luật 77/2025/QH15"],
            ["TT 25/2020/TT-BCT", "Quản lý NL tại cơ sở CN trọng điểm"],
            ["TT 25/2020/TT-BCT", "Kiểm toán năng lượng (chu kỳ 3 năm)"],
            ["TT 38/2014/TT-BCT", "Đào tạo quản lý NL (chứng chỉ EMR)"],
            ["TT 36/2016/TT-BCT", "Dán nhãn năng lượng và MEPS (Thông tư 36/2016)"],
            ["NĐ 06/2022/NĐ-CP", "Giảm phát thải KNK (nếu ≥3.000 tCO₂e)"],
          ].map(([code, name], idx) => {
            const s = survey.legal_status?.[code] || "pending";
            const scol = s === "compliant" ? C.teal : s === "partial" ? C.amber : s === "non_compliant" ? C.red : C.grey2;
            return (
              <div key={`${code}-${idx}`} style={{
                background: C.bg3, borderRadius: 7, padding: "7px 10px",
                border: `1px solid ${scol}25`, display: "flex", flexDirection: "column", gap: 5
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Fira Code',monospace", fontSize: 12.5, color: C.blueL }}>{code}</span>
                  <Tag c={scol}>{s === "compliant" ? "✓ Tuân thủ" : s === "partial" ? "⚠ Một phần" : s === "non_compliant" ? "✗ Chưa TT" : "○ Chưa XĐ"}</Tag>
                </div>
                <div style={{ fontSize: 13, color: C.t1 }}>{name}</div>
                <select value={s}
                  onChange={e => setSurvey(p => ({ ...p, legal_status: { ...p.legal_status, [code]: e.target.value } }))}
                  style={{
                    background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: 5,
                    padding: "3px 6px", color: C.t0, fontSize: 13, cursor: "pointer"
                  }}>
                  <option value="pending">○ Chưa xác định</option>
                  <option value="compliant">✓ Tuân thủ</option>
                  <option value="partial">⚠ Một phần</option>
                  <option value="non_compliant">✗ Chưa tuân thủ</option>
                  <option value="not_applicable">— Không áp dụng</option>
                </select>
              </div>
            );
          })}
        </Grid>
      </Card>

      {/* 14. Phụ lục – Đăng ký tuân thủ pháp lý và tiêu chuẩn (CRUD) */}
      <Card title="14. Phụ lục – Đăng ký tuân thủ pháp lý và tiêu chuẩn" icon="📑" accent={C.teal}>
        <div style={{ marginBottom: 14, fontSize: FONT.body, color: C.t1 }}>Quản lý bảng A.1 (Pháp luật VN) và A.2 (ISO 500xx). Dữ liệu lưu vào phiên khảo sát và xuất ra báo cáo DOCX.</div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <strong style={{ color: C.t0, fontSize: FONT.body }}>A.1. Pháp luật Việt Nam – Mức độ tuân thủ</strong>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <strong style={{ color: C.t0, fontSize: FONT.body }}>A.2. Họ tiêu chuẩn ISO 500xx áp dụng</strong>
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
      <Card title="LỘ TRÌNH TƯ VẤN CHỨNG NHẬN ISO 50001:2018" icon="🗓️" accent={C.blue}>
        <div style={{ marginBottom: 12, fontSize: FONT.body, color: C.t1 }}>Quản lý các mốc thời gian, hoạt động và đầu ra kỳ vọng. Dữ liệu xuất ra báo cáo DOCX mục 13.2.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <Btn v="outline" sz="sm" onClick={openRoadmapAdd}>＋ Thêm mốc lộ trình</Btn>
        </div>
        <div style={{ overflowX: "auto", border: `1px solid ${C.bd0}`, borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FONT.body }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Mốc thời gian</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Hoạt động chính</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Đầu ra kỳ vọng</th>
                <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `1px solid ${C.bd0}` }}>Tiêu chí hoàn thành</th>
                <th style={{ padding: "8px 10px", width: 100, borderBottom: `1px solid ${C.bd0}` }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {roadmapRows.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 12, color: C.t3, textAlign: "center" }}>Chưa có mốc. Nhấn "Thêm mốc lộ trình" hoặc dùng danh sách mặc định khi tạo phiên mới.</td></tr>
              ) : roadmapRows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 ? C.bg2 : "transparent" }}>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, fontWeight: 600, color: C.blueL }}>{r.timeframe}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t0 }}>{r.activity}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t1 }}>{r.deliverable}</td>
                  <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.bd2}`, color: C.t2, fontSize: FONT.label }}>{r.criteria}</td>
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.bd2}` }}>
                    <Btn v="ghost" sz="sm" onClick={() => openRoadmapEdit(i)} sx={{ marginRight: 4 }}>Sửa</Btn>
                    <Btn v="ghost" sz="sm" onClick={() => removeRoadmap(i)} sx={{ color: C.red }}>Xóa</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal A.1 */}
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

      {/* Modal A.2 */}
      <Modal open={isoModal.open} onClose={() => setIsoModal({ open: false, index: null })} title={isoModal.index === null ? "Thêm tiêu chuẩn ISO 500xx" : "Sửa tiêu chuẩn ISO 500xx"} width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Mã tiêu chuẩn" required><Input value={isoForm.standard_id} onChange={v => setIsoForm(f => ({ ...f, standard_id: v }))} placeholder="ISO 50001:2018" /></Field>
          <Field label="Nội dung / Vai trò trong dự án"><TA value={isoForm.focus} onChange={v => setIsoForm(f => ({ ...f, focus: v }))} rows={2} placeholder="Tiêu chuẩn gốc — EnMS Requirements" /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Btn v="ghost" sz="md" onClick={() => setIsoModal({ open: false, index: null })}>Hủy</Btn><Btn v="blue" sz="md" onClick={saveIso}>Lưu</Btn></div>
        </div>
      </Modal>

      {/* Modal Lộ trình chứng nhận */}
      <Modal open={roadmapModal.open} onClose={() => setRoadmapModal({ open: false, index: null })} title={roadmapModal.index === null ? "Thêm mốc lộ trình" : "Sửa mốc lộ trình — LỘ TRÌNH TƯ VẤN CHỨNG NHẬN ISO 50001:2018"} width={560}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Mốc thời gian" required><Input value={roadmapForm.timeframe} onChange={v => setRoadmapForm(f => ({ ...f, timeframe: v }))} placeholder="VD: T+0 → T+1" /></Field>
          <Field label="Hoạt động chính"><Input value={roadmapForm.activity} onChange={v => setRoadmapForm(f => ({ ...f, activity: v }))} placeholder="Đóng khoảng cách nghiêm trọng (Score 1)" /></Field>
          <Field label="Đầu ra kỳ vọng"><Input value={roadmapForm.deliverable} onChange={v => setRoadmapForm(f => ({ ...f, deliverable: v }))} placeholder="Tài liệu EnMS cơ bản hoàn chỉnh" /></Field>
          <Field label="Tiêu chí hoàn thành"><Input value={roadmapForm.criteria} onChange={v => setRoadmapForm(f => ({ ...f, criteria: v }))} placeholder="Không còn NC Score 1" /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Btn v="ghost" sz="md" onClick={() => setRoadmapModal({ open: false, index: null })}>Hủy</Btn><Btn v="blue" sz="md" onClick={saveRoadmap}>Lưu</Btn></div>
        </div>
      </Modal>

      {/* Modal Logistics trip */}
      <Modal open={tripModal.open} onClose={() => setTripModal({ open: false, index: null })} title={tripModal.index === null ? "Thêm chuyến đi / lưu trú" : "Sửa chuyến đi / lưu trú"} width={620}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Grid cols={2} gap={12}>
            <Field label="Loại di chuyển">
              <select
                value={tripForm.mode}
                onChange={e => setTripForm(f => ({ ...f, mode: e.target.value }))}
                style={{ width: "100%", minHeight: 34, padding: "6px 8px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: 6, color: C.t0, fontSize: 13 }}
              >
                {TRANSPORT_MODES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Nhà cung cấp / Hãng vận tải">
              <select
                value={tripForm.provider}
                onChange={e => setTripForm(f => ({ ...f, provider: e.target.value }))}
                style={{ width: "100%", minHeight: 34, padding: "6px 8px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: 6, color: C.t0, fontSize: 13 }}
              >
                <option value="">— Chọn / nhập tay —</option>
                {TRANSPORT_PROVIDERS_VN.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          </Grid>
          <Grid cols={2} gap={12}>
            <Field label="Đi từ">
              <Input value={tripForm.from_city} onChange={v => setTripForm(f => ({ ...f, from_city: v }))} placeholder="Hà Nội / HCM / Đà Nẵng..." />
            </Field>
            <Field label="Tới">
              <Input value={tripForm.to_city} onChange={v => setTripForm(f => ({ ...f, to_city: v }))} placeholder="Địa điểm nhà máy / khách sạn..." />
            </Field>
          </Grid>
          <Grid cols={2} gap={12}>
            <Field label="Ngày đi">
              <Input value={tripForm.depart_date} onChange={v => setTripForm(f => ({ ...f, depart_date: v }))} placeholder="DD/MM/YYYY" />
            </Field>
            <Field label="Ngày về">
              <Input value={tripForm.return_date} onChange={v => setTripForm(f => ({ ...f, return_date: v }))} placeholder="DD/MM/YYYY" />
            </Field>
          </Grid>
          <Grid cols={3} gap={12}>
            <Field label="Số người">
              <Input value={tripForm.people} onChange={v => setTripForm(f => ({ ...f, people: Number(v) || 0 }))} placeholder="2" />
            </Field>
            <Field label="Số đêm">
              <Input value={tripForm.nights} onChange={v => setTripForm(f => ({ ...f, nights: Number(v) || 0 }))} placeholder="2" />
            </Field>
            <Field label="Số phòng">
              <Input value={tripForm.rooms} onChange={v => setTripForm(f => ({ ...f, rooms: Number(v) || 0 }))} placeholder="1" />
            </Field>
          </Grid>
          <Grid cols={2} gap={12}>
            <Field label="Khách sạn / Lưu trú">
              <select
                value={tripForm.hotel}
                onChange={e => setTripForm(f => ({ ...f, hotel: e.target.value }))}
                style={{ width: "100%", minHeight: 34, padding: "6px 8px", background: C.bg4, border: `1px solid ${C.bd0}`, borderRadius: 6, color: C.t0, fontSize: 13 }}
              >
                <option value="">— Chọn / nhập tay —</option>
                {HOTEL_PROVIDERS_VN.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </Field>
            <Field label="Ghi chú / Mã đặt chỗ">
              <Input value={tripForm.note} onChange={v => setTripForm(f => ({ ...f, note: v }))} placeholder="Mã booking, yêu cầu đặc biệt..." />
            </Field>
          </Grid>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn v="ghost" sz="md" onClick={() => setTripModal({ open: false, index: null })}>Hủy</Btn>
            <Btn v="blue" sz="md" onClick={saveTrip}>Lưu</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
