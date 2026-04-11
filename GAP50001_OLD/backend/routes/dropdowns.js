/**
 * ISO 50001 GAP — Dropdowns CRUD API
 * Quản lý tất cả dropdown list trong hệ thống
 *
 * Routes:
 *   GET    /api/dropdowns              — Tất cả categories (built-in + custom)
 *   GET    /api/dropdowns/:category    — Một category cụ thể
 *   POST   /api/dropdowns/seed         — Seed built-in items vào DB
 *   POST   /api/dropdowns              — Thêm custom item
 *   PUT    /api/dropdowns/:id          — Cập nhật item
 *   DELETE /api/dropdowns/:id          — Xóa/ẩn item
 */
const express = require("express");
const mongoose = require("mongoose");
const DropdownItem = require("../models/DropdownItem");
const { VALID_CATEGORIES } = require("../models/DropdownItem");

const router = express.Router();
// Allow state 2 (connecting): mongoose buffers queries until connected
const mongoOk = () => [1, 2].includes(mongoose.connection.readyState);

// ══════════════════════════════════════════════════════════════
// BUILT-IN DATA — phản chiếu từ gap.ui.constants.js frontend
// ══════════════════════════════════════════════════════════════

const BUILTIN = {
  equipment_type: [
    { id:"EQ-MAC", name:"Động cơ điện xoay chiều",  icon:"⚙️",  ref_std:"TT 36/2016; IEC 60034-30-1" },
    { id:"EQ-MDC", name:"Động cơ điện một chiều",   icon:"🔋",  ref_std:"IEC 60034" },
    { id:"EQ-SRV", name:"Động cơ Servo",             icon:"🎯",  ref_std:"ISO 50001 §8.1" },
    { id:"EQ-PMP", name:"Hệ thống bơm",              icon:"💧",  ref_std:"ISO 50001 §8.1; HI 40.6" },
    { id:"EQ-VMC", name:"Hệ thống van cơ / điện",   icon:"🔧",  ref_std:"ISO 50001 §8.1" },
    { id:"EQ-CPS", name:"Máy nén khí Pittong",       icon:"🔄",  ref_std:"ISO 1217" },
    { id:"EQ-CSY", name:"Máy nén khí trục vít",      icon:"🌪️", ref_std:"ISO 1217" },
    { id:"EQ-CIV", name:"Máy nén khí biến tần",      icon:"🔁",  ref_std:"ISO 1217" },
    { id:"EQ-FAX", name:"Quạt hướng trục",           icon:"🌀",  ref_std:"ISO 50001 §8.1" },
    { id:"EQ-FCF", name:"Quạt ly tâm",               icon:"🌬️", ref_std:"ISO 50001 §8.1" },
    { id:"EQ-BGS", name:"Lò hơi / Lò nung Gas",     icon:"🔥",  ref_std:"TT 25/2020; ISO 50002" },
    { id:"EQ-BOL", name:"Lò đốt dầu",                icon:"🛢️", ref_std:"TT 25/2020; ISO 50002" },
    { id:"EQ-CHL", name:"Chiller / Làm lạnh",        icon:"❄️",  ref_std:"TT 36/2016; ISO 50001 §8.1" },
    { id:"EQ-ACU", name:"Điều hòa không khí",        icon:"🌡️", ref_std:"TT 36/2016 Nhãn NL" },
    { id:"EQ-CTW", name:"Tháp giải nhiệt",           icon:"🏗️", ref_std:"ISO 50001 §8.1" },
    { id:"EQ-LED", name:"Đèn LED",                   icon:"💡",  ref_std:"QĐ 1725/QĐ-BCT; TCVN 7114" },
    { id:"EQ-LMV", name:"Đèn cao áp thủy ngân",      icon:"🔆",  ref_std:"QĐ 1725/QĐ-BCT" },
    { id:"EQ-LFU", name:"Đèn huỳnh quang",           icon:"🕯️", ref_std:"QĐ 1725/QĐ-BCT" },
    { id:"EQ-VFD", name:"Biến tần (VFD/Inverter)",  icon:"📟",  ref_std:"IEC 61800-9; ISO 50001 §8.1" },
    { id:"EQ-TRF", name:"Máy biến áp",               icon:"🔌",  ref_std:"ISO 50001 §6.3; TCVN 6306" },
    { id:"EQ-CAP", name:"Tụ bù công suất",           icon:"🔋",  ref_std:"IEC 60831; ISO 50001 §6.3" },
    { id:"EQ-PNL", name:"Tủ điện phân phối",         icon:"🗄️", ref_std:"IEC 61439; ISO 50001 §6.6" },
    { id:"EQ-FLD", name:"Xe nâng dầu DO",            icon:"🚜",  ref_std:"ISO 50001 §8.1" },
    { id:"EQ-FLE", name:"Xe nâng điện",              icon:"🔋",  ref_std:"ISO 50001 §8.1" },
    { id:"EQ-CRN", name:"Cầu trục",                  icon:"🏗️", ref_std:"TCVN 4244; ISO 50001 §8.1" },
    { id:"EQ-OTH", name:"Thiết bị khác",             icon:"🔧",  ref_std:"ISO 50001 §8" },
  ],

  zone_type: [
    { id:"ZN-MFG", name:"Xưởng sản xuất chính",       icon:"🏭", desc:"Khu vực sản xuất trọng tâm" },
    { id:"ZN-KLN", name:"Khu vực lò nung",             icon:"🔥", desc:"Nung vật liệu, gốm, xi măng" },
    { id:"ZN-MLT", name:"Khu vực lò nấu kim loại",     icon:"⚗️",  desc:"Đúc, nấu chảy kim loại" },
    { id:"ZN-HT",  name:"Khu vực lò nhiệt luyện",      icon:"♨️",  desc:"Tôi, ram, ủ kim loại" },
    { id:"ZN-CPS", name:"Khu vực máy nén khí",         icon:"🌪️", desc:"Trạm khí nén trung tâm" },
    { id:"ZN-REF", name:"Khu vực lạnh / ĐHKK",        icon:"❄️",  desc:"Kho lạnh, phòng sạch" },
    { id:"ZN-LGT", name:"Chiếu sáng nhà xưởng",        icon:"💡", desc:"Hệ thống đèn sản xuất" },
    { id:"ZN-OFF", name:"Khu vực văn phòng",           icon:"🏢", desc:"Văn phòng, phòng họp" },
    { id:"ZN-STG", name:"Kho nguyên / thành phẩm",     icon:"📦", desc:"Kho chứa hàng" },
    { id:"ZN-PMP", name:"Trạm bơm",                   icon:"💧", desc:"Bơm nước, bơm hóa chất" },
    { id:"ZN-TRF", name:"Trạm biến áp",               icon:"⚡", desc:"Hệ thống điện trung/hạ áp" },
    { id:"ZN-UTL", name:"Khu tiện ích",               icon:"♻️", desc:"Xử lý nước thải, khí thải" },
    { id:"ZN-OTH", name:"Khu vực khác",               icon:"🏗️", desc:"Các khu vực khác" },
  ],

  department: [
    { id:"DEP-BOD",  name:"Ban Giám đốc",                        icon:"👔" },
    { id:"DEP-ADM",  name:"Phòng Hành chính – Nhân sự",          icon:"🏢" },
    { id:"DEP-ACC",  name:"Phòng Kế toán – Tài chính",           icon:"💰" },
    { id:"DEP-ENG",  name:"Phòng Kỹ thuật",                      icon:"🔧" },
    { id:"DEP-PRD",  name:"Phòng Sản xuất",                      icon:"🏭" },
    { id:"DEP-QA",   name:"Phòng QA/QC",                         icon:"✅" },
    { id:"DEP-MNT",  name:"Phòng Bảo trì",                       icon:"🔩" },
    { id:"DEP-SCM",  name:"Phòng Mua hàng – Cung ứng",           icon:"📦" },
    { id:"DEP-LOG",  name:"Phòng Kho vận",                       icon:"🚛" },
    { id:"DEP-MKT",  name:"Phòng Kinh doanh",                    icon:"📈" },
    { id:"DEP-RND",  name:"Phòng R&D",                           icon:"🔬" },
    { id:"DEP-HSE",  name:"Ban An toàn – Môi trường",            icon:"🦺" },
    { id:"DEP-NRG",  name:"Ban Năng lượng (EMR)",                icon:"⚡" },
    { id:"DEP-XV",   name:"Bộ phận Xưởng vụ",                   icon:"🏗️" },
    { id:"DEP-TT",   name:"Bộ phận Tư Tài",                     icon:"💼" },
    { id:"DEP-VTTB", name:"Bộ phận Vật tư và Thiết bị",         icon:"🗄️" },
    { id:"DEP-ODH",  name:"Bộ phận Ống định hình",              icon:"🔩" },
    { id:"DEP-SX",   name:"Bộ phận Sườn xe",                    icon:"🚗" },
    { id:"DEP-SXM",  name:"Bộ phận Sơn / Xi mạ",               icon:"🎨" },
    { id:"DEP-NX",   name:"Bộ phận Niềng xe / Vành xe",        icon:"⭕" },
    { id:"DEP-LR",   name:"Bộ phận Lắp ráp xe hoàn thiện",     icon:"🔨" },
    { id:"DEP-SQ",   name:"Bộ phận Quản lý SX / Sinh Quản",    icon:"📊" },
    { id:"DEP-HC",   name:"Bộ phận Hành chính",                 icon:"🗂️" },
    { id:"DEP-KP",   name:"Bộ phận Kiểm phẩm",                 icon:"🔍" },
    { id:"DEP-KT",   name:"Bộ phận Khai thác",                  icon:"⛏️" },
    { id:"DEP-QL",   name:"Bộ phận Quản lý",                    icon:"📋" },
    { id:"DEP-TV",   name:"Bộ phận Tài vụ",                     icon:"💳" },
    { id:"DEP-XNK",  name:"Bộ phận Xuất nhập khẩu",             icon:"🌐" },
    { id:"DEP-TM",   name:"Bộ phận Thu mua",                    icon:"🛒" },
    { id:"DEP-OTH",  name:"Khác",                                icon:"🏗️" },
  ],

  energy_source: [
    { id:"ENR-ELG", name:"Điện năng từ lưới quốc gia",           icon:"⚡", ref_std:"TT 25/2020/TT-BCT" },
    { id:"ENR-PVR", name:"Điện năng từ hệ mặt trời áp mái",      icon:"☀️", ref_std:"TT 25/2020/TT-BCT" },
    { id:"ENR-LPG", name:"Gas LPG (hóa lỏng dầu mỏ)",           icon:"🔵", ref_std:"TCVN 6484" },
    { id:"ENR-CNG", name:"Gas CNG (nén thiên nhiên)",            icon:"🟢", ref_std:"TCVN" },
    { id:"ENR-LNG", name:"Gas LNG (hóa lỏng thiên nhiên)",       icon:"🔷", ref_std:"TCVN" },
    { id:"ENR-STM", name:"Hơi nước tự sản xuất",                icon:"💨", ref_std:"ISO 50001 §6.3" },
    { id:"ENR-STP", name:"Hơi nước mua ngoài",                  icon:"🌫️", ref_std:"ISO 50001 §6.3" },
    { id:"ENR-DO",  name:"Dầu diesel DO",                       icon:"🛢️", ref_std:"TCVN 5689" },
    { id:"ENR-PTR", name:"Xăng dầu",                            icon:"⛽", ref_std:"TCVN" },
    { id:"ENR-BMW", name:"Năng lượng sinh khối - Gỗ vụn/Dăm",   icon:"🪵", ref_std:"TT 25/2020" },
    { id:"ENR-BMS", name:"Năng lượng sinh khối - Mùn cưa ép",    icon:"🌾", ref_std:"TT 25/2020" },
    { id:"ENR-BMR", name:"Năng lượng sinh khối - Trấu ép",       icon:"🌿", ref_std:"TT 25/2020" },
    { id:"ENR-BMC", name:"Năng lượng sinh khối - Vỏ hạt điều",   icon:"🥜", ref_std:"TT 25/2020" },
    { id:"ENR-BMO", name:"Năng lượng sinh khối khác",            icon:"🍃", ref_std:"TT 25/2020" },
    { id:"ENR-CAA", name:"Than Antraxit",                        icon:"🪨", ref_std:"TT 25/2020" },
    { id:"ENR-CA2", name:"Than 2A",                             icon:"🪨", ref_std:"TT 25/2020" },
    { id:"ENR-CB2", name:"Than 2B",                             icon:"🪨", ref_std:"TT 25/2020" },
    { id:"ENR-CAI", name:"Than nhập khẩu Indonesia",            icon:"⛏️", ref_std:"TT 25/2020" },
    { id:"ENR-CAM", name:"Than nhập khẩu Malaysia",             icon:"⛏️", ref_std:"TT 25/2020" },
    { id:"ENR-AIR", name:"Khí nén (thứ cấp)",                   icon:"💨", ref_std:"ISO 50001 §6.3" },
    { id:"ENR-HYD", name:"Năng lượng thủy lực (thứ cấp)",       icon:"💧", ref_std:"ISO 50001 §6.3" },
  ],

  product_type: [
    // ── Vật liệu xây dựng & khoáng sản ──
    { id:"PRD-CEM",  name:"Sản xuất xi măng & clinker",                    icon:"🏗️" },
    { id:"PRD-BRK",  name:"Sản xuất gạch & ngói",                          icon:"🧱" },
    { id:"PRD-AST",  name:"Sản xuất đá nhân tạo & đá ốp lát",             icon:"🪨" },
    { id:"PRD-CRI",  name:"Sản xuất cristobalite & khoáng chất trắng",    icon:"⬜" },
    { id:"PRD-FLR",  name:"Sản xuất tấm sàn & ốp tường (vinyl, SPC...)",  icon:"🔲" },
    { id:"PRD-PTN",  name:"Sản xuất vách ngăn & tấm thạch cao",           icon:"🪟" },
    { id:"PRD-GLS",  name:"Sản xuất kính & gương",                         icon:"🪟" },
    { id:"PRD-CER",  name:"Sản xuất gốm sứ & gạch men",                   icon:"🏺" },
    { id:"PRD-INS",  name:"Sản xuất vật liệu cách nhiệt & chống cháy",    icon:"🧯" },
    { id:"PRD-MIN",  name:"Khai thác & chế biến khoáng sản",              icon:"⛏️" },
    { id:"PRD-CON",  name:"Sản xuất bê tông thương phẩm & cấu kiện",      icon:"🏚️" },
    // ── Kim loại & cơ khí ──
    { id:"PRD-STL",  name:"Sản xuất thép & cán thép",                     icon:"⚙️" },
    { id:"PRD-ALU",  name:"Sản xuất nhôm & hợp kim nhôm",                 icon:"🔩" },
    { id:"PRD-COP",  name:"Sản xuất đồng & hợp kim đồng",                 icon:"🔶" },
    { id:"PRD-ZNK",  name:"Sản xuất kẽm & mạ kẽm",                       icon:"🔘" },
    { id:"PRD-CAS",  name:"Đúc & gia công kim loại (casting)",            icon:"🏭" },
    { id:"PRD-BRG",  name:"Sản xuất ổ bi & bạc đạn",                     icon:"⚙️" },
    { id:"PRD-SPN",  name:"Sản xuất linh kiện dập ép & stamping",         icon:"🔨" },
    { id:"PRD-WLD",  name:"Sản xuất kết cấu thép & hàn kết cấu",         icon:"🔧" },
    { id:"PRD-WIR",  name:"Sản xuất dây điện & cáp điện",                icon:"🔌" },
    { id:"PRD-PMP",  name:"Sản xuất bơm & van công nghiệp",              icon:"💧" },
    { id:"PRD-MCH",  name:"Sản xuất máy móc & thiết bị công nghiệp",     icon:"🏗️" },
    { id:"PRD-AGR",  name:"Sản xuất máy nông nghiệp & thiết bị canh tác",icon:"🚜" },
    { id:"PRD-ENG",  name:"Sản xuất động cơ & máy phát điện",            icon:"⚡" },
    // ── Xe & phương tiện ──
    { id:"PRD-AUT",  name:"Sản xuất ô tô & phụ tùng ô tô",              icon:"🚗" },
    { id:"PRD-MCY",  name:"Sản xuất xe máy & phụ kiện xe máy",           icon:"🏍️" },
    { id:"PRD-BCY",  name:"Sản xuất xe đạp & phụ kiện xe đạp",          icon:"🚲" },
    { id:"PRD-SHP",  name:"Đóng tàu & sửa chữa tàu thuyền",             icon:"🚢" },
    // ── Điện & điện tử ──
    { id:"PRD-ELC",  name:"Sản xuất điện tử & linh kiện điện tử",       icon:"💻" },
    { id:"PRD-SEM",  name:"Sản xuất bán dẫn & vi mạch",                 icon:"🔬" },
    { id:"PRD-PCB",  name:"Sản xuất bản mạch in (PCB)",                 icon:"📟" },
    { id:"PRD-SOL",  name:"Sản xuất tấm pin mặt trời",                  icon:"☀️" },
    { id:"PRD-BAT",  name:"Sản xuất pin & ắc quy",                      icon:"🔋" },
    { id:"PRD-LED",  name:"Sản xuất đèn LED & thiết bị chiếu sáng",     icon:"💡" },
    { id:"PRD-SWT",  name:"Sản xuất thiết bị điện & tủ bảng điện",     icon:"🗄️" },
    // ── Hóa chất & vật liệu ──
    { id:"PRD-CHM",  name:"Sản xuất hóa chất cơ bản & chuyên dụng",    icon:"⚗️" },
    { id:"PRD-IGS",  name:"Sản xuất khí công nghiệp (O₂, N₂, CO₂...)", icon:"🫧" },
    { id:"PRD-FTL",  name:"Sản xuất phân bón (NPK, ure, DAP...)",       icon:"🌾" },
    { id:"PRD-PES",  name:"Sản xuất thuốc bảo vệ thực vật & diệt cỏ",  icon:"🌿" },
    { id:"PRD-PNT",  name:"Sản xuất sơn & chất phủ bề mặt",            icon:"🎨" },
    { id:"PRD-ADH",  name:"Sản xuất keo dán & chất kết dính",          icon:"🧴" },
    { id:"PRD-PLR",  name:"Sản xuất nhựa & sản phẩm nhựa",             icon:"🔵" },
    { id:"PRD-RBR",  name:"Sản xuất cao su & sản phẩm từ cao su",      icon:"⭕" },
    { id:"PRD-TIR",  name:"Sản xuất lốp xe & săm xe",                  icon:"🔄" },
    { id:"PRD-PLM",  name:"Sản xuất nhựa đường & bitumen",             icon:"🛣️" },
    { id:"PRD-DET",  name:"Sản xuất chất tẩy rửa & hóa chất gia dụng",icon:"🧹" },
    { id:"PRD-CSM",  name:"Sản xuất mỹ phẩm & chăm sóc cá nhân",      icon:"💄" },
    { id:"PRD-PHM",  name:"Sản xuất dược phẩm",                        icon:"💊" },
    { id:"PRD-MEQP", name:"Sản xuất thiết bị y tế",                    icon:"🏥" },
    // ── Gỗ & nội thất ──
    { id:"PRD-TIM",  name:"Sản xuất gỗ xẻ & gỗ nguyên liệu",          icon:"🌲" },
    { id:"PRD-PLY",  name:"Sản xuất ván ép, MDF & HDF",                icon:"📋" },
    { id:"PRD-WOD",  name:"Sản xuất đồ gỗ & nội thất gia đình",        icon:"🛋️" },
    { id:"PRD-HHD",  name:"Sản xuất đồ nhựa gia dụng & văn phòng",     icon:"🏠" },
    // ── Giấy & bao bì ──
    { id:"PRD-PPR",  name:"Sản xuất giấy & bột giấy",                  icon:"📄" },
    { id:"PRD-TIS",  name:"Sản xuất giấy vệ sinh & giấy tissue",       icon:"🧻" },
    { id:"PRD-CRD",  name:"Sản xuất bìa carton & hộp giấy",            icon:"📦" },
    { id:"PRD-PKG",  name:"In ấn & bao bì",                            icon:"🖨️" },
    // ── Dệt may & da giày ──
    { id:"PRD-TEX",  name:"Sản xuất sợi & vải dệt",                    icon:"🧵" },
    { id:"PRD-KNT",  name:"Sản xuất vải dệt kim & len",                icon:"🧶" },
    { id:"PRD-GRM",  name:"Sản xuất quần áo & may mặc",                icon:"👔" },
    { id:"PRD-SHO",  name:"Sản xuất giày dép & túi xách",              icon:"👟" },
    { id:"PRD-LTH",  name:"Thuộc da & sản phẩm da",                    icon:"🥋" },
    { id:"PRD-FIB",  name:"Sản xuất sợi thủy tinh & composite",        icon:"🧱" },
    // ── Thực phẩm & nông sản ──
    { id:"PRD-AFF",  name:"Sản xuất thức ăn chăn nuôi",                icon:"🐄" },
    { id:"PRD-SEA",  name:"Chế biến thủy hải sản",                     icon:"🐟" },
    { id:"PRD-MET",  name:"Chế biến thịt & gia súc gia cầm",           icon:"🥩" },
    { id:"PRD-DAI",  name:"Sản xuất sữa & sản phẩm từ sữa",           icon:"🥛" },
    { id:"PRD-FRZ",  name:"Chế biến & đông lạnh thực phẩm",           icon:"❄️" },
    { id:"PRD-CAN",  name:"Sản xuất đồ hộp & thực phẩm đóng gói",     icon:"🥫" },
    { id:"PRD-RIC",  name:"Xay xát lúa gạo & chế biến ngũ cốc",       icon:"🌾" },
    { id:"PRD-NDP",  name:"Sản xuất mì ăn liền & thực phẩm tiện lợi", icon:"🍜" },
    { id:"PRD-OIL",  name:"Sản xuất dầu ăn & chất béo thực phẩm",     icon:"🫙" },
    { id:"PRD-SUG",  name:"Sản xuất đường & mật mía",                  icon:"🍬" },
    { id:"PRD-COF",  name:"Sản xuất & chế biến cà phê",                icon:"☕" },
    { id:"PRD-TEA",  name:"Sản xuất & chế biến chè",                   icon:"🍵" },
    { id:"PRD-GAL",  name:"Chưng cất rượu, bia & nước giải khát",      icon:"🍺" },
    { id:"PRD-SPI",  name:"Sản xuất gia vị & phụ gia thực phẩm",       icon:"🧂" },
    { id:"PRD-TAB",  name:"Sản xuất thuốc lá",                         icon:"🚬" },
    { id:"PRD-FDB",  name:"Sản xuất thực phẩm dinh dưỡng & chức năng", icon:"🍽️" },
    // ── Năng lượng & tiện ích ──
    { id:"PRD-PWR",  name:"Sản xuất điện (nhiệt điện, thủy điện, khí)",icon:"⚡" },
    { id:"PRD-REN",  name:"Năng lượng tái tạo (mặt trời, gió, sinh khối)", icon:"☀️" },
    { id:"PRD-GAS",  name:"Phân phối gas & dầu mỏ",                    icon:"🛢️" },
    { id:"PRD-WTR",  name:"Xử lý & cấp thoát nước",                    icon:"💧" },
    { id:"PRD-WST",  name:"Xử lý chất thải & tái chế",                icon:"♻️" },
    // ── Dịch vụ & thương mại ──
    { id:"PRD-IZN",  name:"Khu công nghiệp & KCX",                     icon:"🏭" },
    { id:"PRD-COB",  name:"Xây dựng & thi công công trình",            icon:"🏗️" },
    { id:"PRD-LOG",  name:"Logistics & kho lạnh",                      icon:"🚛" },
    { id:"PRD-PORT", name:"Cảng biển & vận tải hàng hóa",              icon:"⚓" },
    { id:"PRD-HTL",  name:"Khách sạn & dịch vụ lưu trú",              icon:"🏨" },
    { id:"PRD-MED",  name:"Y tế & bệnh viện",                          icon:"🏥" },
    { id:"PRD-EDU",  name:"Giáo dục & nghiên cứu",                     icon:"🎓" },
    { id:"PRD-ICT",  name:"Công nghệ thông tin & phần mềm",            icon:"💻" },
    { id:"PRD-COM",  name:"Dịch vụ thương mại & văn phòng",            icon:"🏢" },
    { id:"PRD-SPT",  name:"Sản xuất dụng cụ thể thao & giải trí",     icon:"⚽" },
    { id:"PRD-TOY",  name:"Sản xuất đồ chơi & thủ công mỹ nghệ",      icon:"🎨" },
    { id:"PRD-PPE",  name:"Sản xuất thiết bị bảo hộ lao động",        icon:"🦺" },
    { id:"PRD-OTH",  name:"Sản phẩm / Dịch vụ khác",                  icon:"📋" },
  ],

  industry: [
    // ── Vật liệu xây dựng & khoáng sản ──
    { id:"IND-CEM",  name:"Xi măng & clinker",                          icon:"🏗️" },
    { id:"IND-BRK",  name:"Gạch & ngói",                               icon:"🧱" },
    { id:"IND-AST",  name:"Đá nhân tạo & đá ốp lát",                   icon:"🪨" },
    { id:"IND-CRI",  name:"Cristobalite & khoáng chất trắng",          icon:"⬜" },
    { id:"IND-FLR",  name:"Sàn & tấm ốp tường (vinyl, SPC, gỗ...)",   icon:"🔲" },
    { id:"IND-PTN",  name:"Vách ngăn & tấm thạch cao",                icon:"🪟" },
    { id:"IND-GLS",  name:"Kính & gương",                              icon:"🪟" },
    { id:"IND-CER",  name:"Gốm sứ & gạch men",                        icon:"🏺" },
    { id:"IND-INS",  name:"Vật liệu cách nhiệt & chống cháy",         icon:"🧯" },
    { id:"IND-MIN",  name:"Khai thác & chế biến khoáng sản",          icon:"⛏️" },
    { id:"IND-CON",  name:"Bê tông thương phẩm & cấu kiện bê tông",   icon:"🏚️" },
    // ── Kim loại & cơ khí ──
    { id:"IND-STL",  name:"Thép & cán thép",                           icon:"⚙️" },
    { id:"IND-ALU",  name:"Nhôm & hợp kim nhôm",                      icon:"🔩" },
    { id:"IND-COP",  name:"Đồng & hợp kim đồng",                      icon:"🔶" },
    { id:"IND-ZNK",  name:"Kẽm & mạ kẽm",                            icon:"🔘" },
    { id:"IND-CAS",  name:"Đúc & gia công kim loại",                  icon:"🏭" },
    { id:"IND-BRG",  name:"Ổ bi & bạc đạn",                          icon:"⚙️" },
    { id:"IND-SPN",  name:"Dập ép & gia công tấm kim loại",           icon:"🔨" },
    { id:"IND-WIR",  name:"Dây điện & cáp điện",                     icon:"🔌" },
    { id:"IND-PMP",  name:"Bơm & van công nghiệp",                   icon:"💧" },
    { id:"IND-MCH",  name:"Máy móc & thiết bị công nghiệp",          icon:"🏗️" },
    { id:"IND-AGR",  name:"Máy nông nghiệp",                         icon:"🚜" },
    { id:"IND-ENG",  name:"Động cơ & máy phát điện",                icon:"⚡" },
    // ── Xe & phương tiện ──
    { id:"IND-AUT",  name:"Ô tô & phụ tùng ô tô",                   icon:"🚗" },
    { id:"IND-MCY",  name:"Xe máy & phụ kiện xe máy",                icon:"🏍️" },
    { id:"IND-BCY",  name:"Xe đạp & phụ kiện xe đạp",               icon:"🚲" },
    { id:"IND-SHP",  name:"Đóng tàu & sửa chữa tàu thuyền",         icon:"🚢" },
    // ── Điện & điện tử ──
    { id:"IND-ELC",  name:"Điện tử & linh kiện điện tử",            icon:"💻" },
    { id:"IND-SEM",  name:"Bán dẫn & vi mạch",                      icon:"🔬" },
    { id:"IND-SOL",  name:"Pin mặt trời & năng lượng xanh",         icon:"☀️" },
    { id:"IND-BAT",  name:"Pin & ắc quy",                           icon:"🔋" },
    { id:"IND-LED",  name:"Đèn & thiết bị chiếu sáng",             icon:"💡" },
    { id:"IND-SWT",  name:"Thiết bị điện & tủ bảng điện",          icon:"🗄️" },
    // ── Hóa chất & vật liệu ──
    { id:"IND-CHM",  name:"Hóa chất cơ bản & chuyên dụng",         icon:"⚗️" },
    { id:"IND-IGS",  name:"Khí công nghiệp",                       icon:"🫧" },
    { id:"IND-FTL",  name:"Phân bón (NPK, ure, DAP...)",           icon:"🌾" },
    { id:"IND-PES",  name:"Thuốc bảo vệ thực vật & diệt cỏ",      icon:"🌿" },
    { id:"IND-PNT",  name:"Sơn & chất phủ bề mặt",                icon:"🎨" },
    { id:"IND-PLR",  name:"Nhựa & sản phẩm nhựa",                 icon:"🔵" },
    { id:"IND-RBR",  name:"Cao su & sản phẩm cao su",             icon:"⭕" },
    { id:"IND-TIR",  name:"Lốp xe & săm xe",                      icon:"🔄" },
    { id:"IND-PHM",  name:"Dược phẩm & y sinh",                   icon:"💊" },
    { id:"IND-CSM",  name:"Mỹ phẩm & chăm sóc cá nhân",          icon:"💄" },
    { id:"IND-DET",  name:"Chất tẩy rửa & hóa chất gia dụng",    icon:"🧹" },
    // ── Gỗ & nội thất ──
    { id:"IND-TIM",  name:"Gỗ xẻ & gỗ nguyên liệu",              icon:"🌲" },
    { id:"IND-PLY",  name:"Ván ép, MDF & HDF",                    icon:"📋" },
    { id:"IND-WOD",  name:"Đồ gỗ & nội thất gia đình",           icon:"🛋️" },
    // ── Giấy & bao bì ──
    { id:"IND-PPR",  name:"Giấy & bột giấy",                      icon:"📄" },
    { id:"IND-TIS",  name:"Giấy vệ sinh & giấy tissue",           icon:"🧻" },
    { id:"IND-PKG",  name:"In ấn & Bao bì",                       icon:"📦" },
    // ── Dệt may & da giày ──
    { id:"IND-TEX",  name:"Dệt nhuộm & sợi",                     icon:"🧵" },
    { id:"IND-GRM",  name:"Quần áo & may mặc",                   icon:"👔" },
    { id:"IND-SHO",  name:"Giày dép & túi xách",                 icon:"👟" },
    { id:"IND-LTH",  name:"Thuộc da & da giả",                   icon:"🥋" },
    { id:"IND-FIB",  name:"Sợi thủy tinh & composite",          icon:"🧱" },
    // ── Thực phẩm & nông sản ──
    { id:"IND-AFF",  name:"Thức ăn chăn nuôi",                   icon:"🐄" },
    { id:"IND-SEA",  name:"Chế biến thủy hải sản",               icon:"🐟" },
    { id:"IND-MET",  name:"Chế biến thịt & gia súc gia cầm",    icon:"🥩" },
    { id:"IND-DAI",  name:"Sữa & sản phẩm từ sữa",              icon:"🥛" },
    { id:"IND-FRZ",  name:"Đông lạnh & bảo quản thực phẩm",     icon:"❄️" },
    { id:"IND-CAN",  name:"Đồ hộp & thực phẩm đóng gói",        icon:"🥫" },
    { id:"IND-GRI",  name:"Xay xát lúa gạo & ngũ cốc",          icon:"🌾" },
    { id:"IND-NDP",  name:"Mì ăn liền & thực phẩm tiện lợi",    icon:"🍜" },
    { id:"IND-SUG",  name:"Đường & mật mía",                     icon:"🍬" },
    { id:"IND-COF",  name:"Cà phê & đồ uống nóng",              icon:"☕" },
    { id:"IND-TEA",  name:"Chè & thảo mộc",                     icon:"🍵" },
    { id:"IND-GAL",  name:"Rượu, bia & nước giải khát",          icon:"🍺" },
    { id:"IND-FDB",  name:"Thực phẩm & đồ uống (tổng hợp)",     icon:"🍽️" },
    { id:"IND-TAB",  name:"Thuốc lá",                            icon:"🚬" },
    // ── Năng lượng & tiện ích ──
    { id:"IND-PWR",  name:"Sản xuất điện (nhiệt điện, thủy điện)",icon:"⚡" },
    { id:"IND-REN",  name:"Năng lượng tái tạo (mặt trời, gió, sinh khối)",icon:"☀️" },
    { id:"IND-GAS",  name:"Phân phối gas & dầu mỏ",             icon:"🛢️" },
    { id:"IND-WTR",  name:"Cấp thoát nước & xử lý nước",        icon:"💧" },
    { id:"IND-WST",  name:"Xử lý chất thải & tái chế",          icon:"♻️" },
    // ── Dịch vụ & thương mại ──
    { id:"IND-IZN",  name:"Khu công nghiệp & KCX",              icon:"🏭" },
    { id:"IND-BLD",  name:"Xây dựng & bất động sản",            icon:"🏗️" },
    { id:"IND-LOG",  name:"Logistics & Kho lạnh",               icon:"🚛" },
    { id:"IND-PORT", name:"Cảng biển & vận tải hàng hóa",       icon:"⚓" },
    { id:"IND-HTL",  name:"Khách sạn & dịch vụ lưu trú",       icon:"🏨" },
    { id:"IND-HMED", name:"Y tế & bệnh viện",                   icon:"🏥" },
    { id:"IND-EDU",  name:"Giáo dục & nghiên cứu",              icon:"🎓" },
    { id:"IND-ICT",  name:"Công nghệ thông tin & truyền thông", icon:"📱" },
    { id:"IND-COM",  name:"Dịch vụ thương mại & văn phòng",     icon:"🏢" },
    { id:"IND-SPT",  name:"Dụng cụ thể thao & giải trí",       icon:"⚽" },
    { id:"IND-TOY",  name:"Đồ chơi & thủ công mỹ nghệ",        icon:"🎨" },
    { id:"IND-OTH",  name:"Ngành khác",                          icon:"📋" },
  ],
};

/** Lấy danh sách built-in items cho một category */
function getBuiltins(category) {
  const items = BUILTIN[category] || [];
  return items.map((t, i) => ({
    category,
    id: t.id,
    name: t.name,
    icon: t.icon || "📌",
    desc: t.desc || "",
    checks: t.checks || [],
    ref_std: t.ref_std || "",
    isCustom: false,
    order: i,
    active: true,
  }));
}

/** Merge built-in + custom từ DB (DB override built-in nếu cùng id) */
async function getMerged(category) {
  const builtins = getBuiltins(category);
  if (!mongoOk()) return builtins;

  const dbItems = await DropdownItem.find({ category }).sort({ order: 1, createdAt: 1 }).lean();
  const dbMap = {};
  for (const it of dbItems) dbMap[it.id] = it;

  const merged = builtins.map(b => {
    const db = dbMap[b.id];
    if (!db) return b;
    return { ...b, ...db, _id: db._id };
  });

  const customOnly = dbItems.filter(it => it.isCustom && !builtins.find(b => b.id === it.id));
  return [...merged.filter(it => it.active !== false), ...customOnly.filter(it => it.active !== false)];
}

// ── GET /api/dropdowns  — all categories ──────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = {};
    await Promise.all(VALID_CATEGORIES.map(async cat => {
      result[cat] = await getMerged(cat);
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/dropdowns/meta/categories — danh sách categories ─────────
// IMPORTANT: must be defined BEFORE /:category to avoid shadowing
router.get("/meta/categories", (_req, res) => {
  res.json(VALID_CATEGORIES.map(cat => ({
    id: cat,
    name: {
      equipment_type: "Loại thiết bị",
      zone_type: "Loại khu vực",
      department: "Phòng ban / Bộ phận",
      energy_source: "Nguồn năng lượng",
      product_type: "Phạm vi sản phẩm",
      industry: "Ngành / Lĩnh vực",
    }[cat] || cat,
    count: (BUILTIN[cat] || []).length,
  })));
});

// ── GET /api/dropdowns/:category — một category ───────────────────────
router.get("/:category", async (req, res) => {
  const { category } = req.params;
  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `category phải là một trong: ${VALID_CATEGORIES.join(", ")}` });
  try {
    res.json(await getMerged(category));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dropdowns/seed — seed tất cả built-in vào DB ────────────
router.post("/seed", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  const { category } = req.query; // optional: seed chỉ một category
  const cats = category ? [category] : VALID_CATEGORIES;
  let inserted = 0, skipped = 0;
  try {
    for (const cat of cats) {
      if (!VALID_CATEGORIES.includes(cat)) continue;
      for (const item of getBuiltins(cat)) {
        const exists = await DropdownItem.findOne({ category: cat, id: item.id }).lean();
        if (exists) { skipped++; continue; }
        await DropdownItem.create(item);
        inserted++;
      }
    }
    res.json({ ok: true, inserted, skipped, total: inserted + skipped });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dropdowns — thêm custom item ────────────────────────────
router.post("/", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  const { category, id, name, icon, desc, checks, ref_std, order } = req.body || {};

  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `category phải là một trong: ${VALID_CATEGORIES.join(", ")}` });
  if (!id?.trim() || !name?.trim())
    return res.status(400).json({ error: "id và name là bắt buộc." });

  const safeId = String(id).trim().toUpperCase();
  try {
    const existing = await DropdownItem.findOne({ category, id: safeId }).lean();
    if (existing) return res.status(409).json({ error: `ID "${safeId}" đã tồn tại trong "${category}".` });

    const item = await DropdownItem.create({
      category,
      id: safeId,
      name: String(name).trim(),
      icon: icon || "📌",
      desc: desc || "",
      checks: Array.isArray(checks) ? checks : [],
      ref_std: ref_std || "",
      order: order != null ? Number(order) : 9999,
      isCustom: true,
      active: true,
    });
    res.status(201).json(item);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: `ID "${safeId}" đã tồn tại.` });
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/dropdowns/:itemId — cập nhật item ────────────────────────
router.put("/:itemId", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  const { itemId } = req.params;
  const { category, name, icon, desc, checks, ref_std, order, active } = req.body || {};

  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `category phải là một trong: ${VALID_CATEGORIES.join(", ")}` });

  try {
    let doc = await DropdownItem.findOne({ category, id: itemId });
    if (!doc) {
      const builtin = getBuiltins(category).find(b => b.id === itemId);
      if (!builtin) return res.status(404).json({ error: `Không tìm thấy item "${itemId}".` });
      doc = new DropdownItem({ ...builtin });
    }
    if (name     !== undefined) doc.name    = String(name).trim();
    if (icon     !== undefined) doc.icon    = icon;
    if (desc     !== undefined) doc.desc    = desc;
    if (checks   !== undefined) doc.checks  = Array.isArray(checks) ? checks : [];
    if (ref_std  !== undefined) doc.ref_std = ref_std;
    if (order    !== undefined) doc.order   = Number(order);
    if (active   !== undefined) doc.active  = !!active;
    await doc.save();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/dropdowns/:itemId — xóa/ẩn item ──────────────────────
router.delete("/:itemId", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  const { itemId } = req.params;
  const { category } = req.query;

  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `Truyền ?category=<tên> (${VALID_CATEGORIES.join("|")})` });

  try {
    const doc = await DropdownItem.findOne({ category, id: itemId });
    if (!doc) {
      // Built-in không có trong DB → tạo bản ghi với active=false
      const builtin = getBuiltins(category).find(b => b.id === itemId);
      if (builtin) {
        await DropdownItem.create({ ...builtin, active: false });
        return res.json({ ok: true, hidden: true, message: "Built-in item đã được ẩn." });
      }
      return res.status(404).json({ error: `Không tìm thấy item "${itemId}".` });
    }
    if (!doc.isCustom) {
      doc.active = !doc.active; // Toggle ẩn/hiện
      await doc.save();
      return res.json({ ok: true, hidden: !doc.active, message: doc.active ? "Item đã hiện lại." : "Built-in item đã được ẩn." });
    }
    await doc.deleteOne();
    res.json({ ok: true, deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
module.exports.BUILTIN = BUILTIN;
module.exports.VALID_CATEGORIES = VALID_CATEGORIES;
