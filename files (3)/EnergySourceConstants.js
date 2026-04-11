/**
 * EnergySourceConstants — Danh mục Nguồn Năng lượng ISO 50001
 *
 * Hệ số chuyển đổi theo:
 *  - IPCC 2006 / IEA Statistics
 *  - Quyết định 1305/QĐ-BCT (hệ số chuyển đổi VN)
 *  - ISO 50006:2014 Annex A
 *  - TT 09/2012, TT 25/2020 (VN)
 */

// ── Catalog nguồn năng lượng đầy đủ ─────────────────────────────
export const ENERGY_TYPE_CATALOG = [
  // ── Điện ────────────────────────────────────────────────────────
  {
    id:         "electricity",
    label:      "Điện (Grid)",
    unit:       "kWh",
    category:   "primary",
    icon:       "⚡",
    color:      "#f59e0b",
    convToGJ:   0.003600,          // 1 kWh = 0.0036 GJ
    convToTOE:  0.0000860,         // 1 kWh = 0.000086 TOE (VN grid avg)
    co2Factor:  0.5160,            // kgCO₂/kWh (VN 2023 – EVN)
    defaultUnit:"kWh",
    secondaryUnits:["GJ","TOE","MWh","kVAh"],
    isRenewable: false,
    regulatoryRef:["Luật 50/2010 §3","TT 09/2012 §8","NĐ 21/2011"],
    description:"Điện lưới quốc gia EVN hoặc nguồn phát tự dùng",
    auditQuestions:[
      "Tổng tiêu thụ điện năm vừa qua là bao nhiêu kWh?",
      "Điện tiêu thụ đến từ nguồn nào (EVN, tự phát điện, mặt trời áp mái)?",
      "Có đồng hồ đo điện phụ tại từng khu vực SEU không?",
      "Hệ số công suất (cos φ) trung bình là bao nhiêu?",
      "Chi phí điện chiếm bao nhiêu % tổng chi phí NL?",
      "Có phân tích biểu đồ phụ tải (load profile) theo giờ không?",
      "Đỉnh phụ tải (peak demand) là bao nhiêu kW? Xảy ra lúc nào?",
      "Có hợp đồng mua điện TOU (giờ cao điểm/thấp điểm) không?",
    ],
  },
  // ── Khí tự nhiên / LNG ──────────────────────────────────────────
  {
    id:         "natural_gas",
    label:      "Khí tự nhiên (CNG/LNG/PNG)",
    unit:       "m³",
    category:   "primary",
    icon:       "🔥",
    color:      "#3b82f6",
    convToGJ:   0.03600,           // 1 Nm³ ≈ 0.036 GJ (LHV, VN natural gas)
    convToTOE:  0.000860,          // 1 Nm³ ≈ 0.000860 TOE
    co2Factor:  1.9595,            // kgCO₂/Nm³
    defaultUnit:"Nm³",
    secondaryUnits:["GJ","TOE","MMBTU","kg"],
    isRenewable: false,
    regulatoryRef:["TT 09/2012","ISO 50001 §6.3"],
    description:"Khí tự nhiên dạng ống, CNG hoặc LNG",
    auditQuestions:[
      "Khí tự nhiên được sử dụng cho thiết bị / lò nào?",
      "Tiêu thụ khí hàng tháng (Nm³) ghi nhận từ nguồn nào?",
      "Đồng hồ đo lưu lượng khí có được hiệu chuẩn không?",
      "Nhiệt trị (LHV/HHV) của khí được cung cấp là bao nhiêu?",
      "Áp suất và nhiệt độ hoạt động tại điểm tiếp nhận?",
      "Có phân tích thành phần khí (gas chromatography) không?",
    ],
  },
  // ── Dầu FO (Heavy Fuel Oil) ─────────────────────────────────────
  {
    id:         "fuel_oil_fo",
    label:      "Dầu mazut / FO (Heavy Fuel Oil)",
    unit:       "lít",
    category:   "primary",
    icon:       "🛢",
    color:      "#7c3aed",
    convToGJ:   0.0000384,         // 1 lít FO ≈ 0.0384 GJ/lít (HHV ~40.2 MJ/kg, ρ≈0.955)
    convToTOE:  0.000857,          // 1 kg FO ≈ 0.000957 TOE; ~0.857 TOE/1000 lít
    co2Factor:  2.7230,            // kgCO₂/lít
    defaultUnit:"lít",
    secondaryUnits:["GJ","TOE","tấn","thùng"],
    isRenewable: false,
    regulatoryRef:["TT 09/2012","ISO 50001 §6.3"],
    description:"Dầu nặng FO dùng cho lò hơi công nghiệp",
    auditQuestions:[
      "Lượng dầu FO nhập kho và tiêu thụ mỗi tháng là bao nhiêu lít?",
      "Nhiệt trị thực tế của lô dầu gần nhất?",
      "Hiệu suất lò hơi đốt dầu FO hiện tại là bao nhiêu %?",
      "Có phân tích khói thải lò hơi định kỳ không?",
      "Nhiệt độ khói thải là bao nhiêu °C?",
      "Tank lưu trữ dầu FO có hệ thống gia nhiệt không?",
    ],
  },
  // ── Dầu DO (Diesel) ─────────────────────────────────────────────
  {
    id:         "diesel_do",
    label:      "Dầu diesel / DO",
    unit:       "lít",
    category:   "primary",
    icon:       "⛽",
    color:      "#ef4444",
    convToGJ:   0.0000359,         // 1 lít DO ≈ 0.0359 GJ (LHV ~36.5 MJ/lít)
    convToTOE:  0.000857,
    co2Factor:  2.6840,            // kgCO₂/lít
    defaultUnit:"lít",
    secondaryUnits:["GJ","TOE","tấn"],
    isRenewable: false,
    regulatoryRef:["TT 09/2012"],
    description:"Dầu diesel dùng cho phát điện dự phòng, xe cộ, thiết bị",
    auditQuestions:[
      "Dầu DO được sử dụng cho mục đích nào (máy phát điện, xe nâng, thiết bị)?",
      "Tiêu thụ DO hàng tháng từ hóa đơn hoặc đo thực tế?",
      "Có thể phân tách tiêu thụ DO theo từng thiết bị không?",
    ],
  },
  // ── LPG ──────────────────────────────────────────────────────────
  {
    id:         "lpg",
    label:      "LPG (Propane/Butane)",
    unit:       "kg",
    category:   "primary",
    icon:       "💨",
    color:      "#f97316",
    convToGJ:   0.0461,            // 1 kg LPG ≈ 46.1 MJ
    convToTOE:  0.001100,
    co2Factor:  2.9830,            // kgCO₂/kg
    defaultUnit:"kg",
    secondaryUnits:["GJ","TOE","bình 12kg","lít"],
    isRenewable: false,
    regulatoryRef:["TT 09/2012"],
    description:"Khí dầu mỏ hóa lỏng (propane/butane)",
    auditQuestions:[
      "LPG được dùng cho mục đích nào (lò nướng, gia nhiệt cục bộ)?",
      "Tiêu thụ LPG theo kg/tháng ghi nhận từ hóa đơn mua?",
      "Có thể thay thế LPG bằng nguồn NL khác không?",
    ],
  },
  // ── Than đá ──────────────────────────────────────────────────────
  {
    id:         "coal",
    label:      "Than đá (bituminous/anthracite)",
    unit:       "tấn",
    category:   "primary",
    icon:       "⬛",
    color:      "#374151",
    convToGJ:   26.700,            // 1 tấn than = 26.7 GJ (LHV bituminous VN)
    convToTOE:  0.638,             // 1 tấn than ≈ 0.638 TOE
    co2Factor:  2420,              // kgCO₂/tấn
    defaultUnit:"tấn",
    secondaryUnits:["GJ","TOE","kg"],
    isRenewable: false,
    regulatoryRef:["TT 09/2012","NĐ 06/2022 (carbon)"],
    description:"Than đá dùng cho lò hơi, lò nung công nghiệp",
    auditQuestions:[
      "Loại than sử dụng (anthracite, bituminous, sub-bituminous)?",
      "Nhiệt trị thực tế của lô than gần nhất (kcal/kg)?",
      "Lượng than tiêu thụ hàng tháng (tấn) ghi nhận từ cân?",
      "Hiệu suất lò hơi đốt than hiện tại?",
      "Có hệ thống lọc bụi khói thải không?",
      "Chi phí than/tháng?",
    ],
  },
  // ── Hơi nước mua ────────────────────────────────────────────────
  {
    id:         "steam_purchased",
    label:      "Hơi nước mua từ bên ngoài",
    unit:       "tấn",
    category:   "secondary",
    icon:       "♨️",
    color:      "#06b6d4",
    convToGJ:   2.700,             // 1 tấn hơi bão hòa ~2.7 GJ (tùy áp suất)
    convToTOE:  0.0645,
    co2Factor:  240,               // kgCO₂/tấn (phụ thuộc nguồn tạo hơi)
    defaultUnit:"tấn",
    secondaryUnits:["GJ","TOE","kg","MMBtu"],
    isRenewable: false,
    regulatoryRef:["ISO 50001 §6.3"],
    description:"Hơi nước mua từ đơn vị cung cấp bên ngoài (khu công nghiệp, nhà máy điện)",
    auditQuestions:[
      "Hơi mua từ ai? Áp suất và nhiệt độ hơi tại điểm tiếp nhận?",
      "Lượng hơi tiêu thụ hàng tháng (tấn) đo bằng thiết bị nào?",
      "Hơi được dùng cho quy trình nào?",
      "Có thu hồi nước ngưng không? Tỷ lệ thu hồi?",
      "Enthalpy hơi tại điểm tiếp nhận là bao nhiêu kJ/kg?",
    ],
  },
  // ── Năng lượng mặt trời ──────────────────────────────────────────
  {
    id:         "solar_pv",
    label:      "Điện mặt trời (Solar PV)",
    unit:       "kWh",
    category:   "renewable",
    icon:       "☀️",
    color:      "#eab308",
    convToGJ:   0.003600,
    convToTOE:  0.0000860,
    co2Factor:  0.0,
    defaultUnit:"kWh",
    secondaryUnits:["GJ","TOE","MWh"],
    isRenewable: true,
    regulatoryRef:["TT 16/2017/TT-BCT (nối lưới)"],
    description:"Điện mặt trời áp mái hoặc trang trại năng lượng mặt trời",
    auditQuestions:[
      "Tổng công suất lắp đặt Solar PV (kWp)?",
      "Sản lượng điện PV tháng vừa qua (kWh)?",
      "Có kết nối net-metering không?",
      "Tỷ lệ tự dùng / phát ngược lưới?",
      "Hệ thống monitoring có cung cấp dữ liệu thực tế không?",
    ],
  },
  // ── Sinh khối ────────────────────────────────────────────────────
  {
    id:         "biomass",
    label:      "Sinh khối (trấu, mùn cưa, bã mía…)",
    unit:       "tấn",
    category:   "renewable",
    icon:       "🌿",
    color:      "#16a34a",
    convToGJ:   14.400,            // 1 tấn sinh khối ~14.4 GJ (LHV trung bình)
    convToTOE:  0.344,
    co2Factor:  0,                 // Carbon neutral per IPCC
    defaultUnit:"tấn",
    secondaryUnits:["GJ","TOE","kg"],
    isRenewable: true,
    regulatoryRef:["ISO 50001 §6.3"],
    description:"Sinh khối: trấu, mùn cưa, bã mía, rác thải nông nghiệp",
    auditQuestions:[
      "Loại sinh khối sử dụng? Nguồn cung cấp?",
      "Độ ẩm sinh khối trung bình (%)?",
      "Nhiệt trị thực tế đo được (kcal/kg)?",
      "Tiêu thụ sinh khối hàng tháng (tấn)?",
    ],
  },
  // ── Nhiệt thải thu hồi ───────────────────────────────────────────
  {
    id:         "waste_heat",
    label:      "Nhiệt thải thu hồi (Waste Heat Recovery)",
    unit:       "GJ",
    category:   "waste_heat",
    icon:       "♻️",
    color:      "#14b8a6",
    convToGJ:   1.0,
    convToTOE:  0.02390,
    co2Factor:  0,
    defaultUnit:"GJ",
    secondaryUnits:["TOE","MWh","kcal"],
    isRenewable: false,
    regulatoryRef:["ISO 50001 §6.3","ISO 50002:2014"],
    description:"Nhiệt thải từ lò hơi, lò nung, máy nén khí được thu hồi tái sử dụng",
    auditQuestions:[
      "Nhiệt thải thu hồi từ nguồn nào?",
      "Lượng nhiệt thu hồi hàng tháng (GJ hoặc kWh)?",
      "Thiết bị thu hồi (HRSG, economizer, heat exchanger)?",
      "Nhiệt thu hồi được sử dụng cho mục đích gì?",
    ],
  },
];

// ── Energy form (dạng NL) ──────────────────────────────────────────
export const ENERGY_FORMS = [
  "Sơ cấp (Primary) — từ nguồn thiên nhiên",
  "Thứ cấp (Secondary) — đã qua chuyển đổi",
  "Tái sinh (Renewable)",
  "Thu hồi nhiệt thải (Waste Heat Recovery)",
];

// ── Trend labels ───────────────────────────────────────────────────
export const TREND_CFG = {
  increasing: { label:"Tăng",   icon:"📈", col:"#ef4444" },
  stable:     { label:"Ổn định",icon:"➡️", col:"#f59e0b" },
  decreasing: { label:"Giảm",   icon:"📉", col:"#22c55e" },
  unknown:    { label:"Chưa rõ",icon:"❓",  col:"#718096" },
};

// ── Data quality ───────────────────────────────────────────────────
export const DATA_QUALITY_CFG = {
  good:    { label:"Tốt — Có đồng hồ đo riêng & dữ liệu ≥12 tháng", col:"#22c55e" },
  fair:    { label:"Trung bình — Ước tính từ hóa đơn",               col:"#f59e0b" },
  poor:    { label:"Kém — Ước tính sơ bộ, thiếu dữ liệu",            col:"#ef4444" },
  unknown: { label:"Chưa đánh giá",                                   col:"#718096" },
};

// ── Priority labels ────────────────────────────────────────────────
export const PRIORITY_CFG = {
  critical: { label:"Khẩn cấp",  col:"#ef4444" },
  high:     { label:"Cao",        col:"#f97316" },
  medium:   { label:"Trung bình", col:"#f59e0b" },
  low:      { label:"Thấp",       col:"#22c55e" },
  "":       { label:"Chưa xác định", col:"#718096" },
};

// ── Conformance (cho mỗi câu hỏi) ─────────────────────────────────
export const CONFORMANCE_CFG = [
  { v:"conform",     label:"✅ Phù hợp",            col:"#22c55e" },
  { v:"minor_nc",    label:"⚠️ NC nhỏ",             col:"#f59e0b" },
  { v:"major_nc",    label:"🚨 NC lớn",              col:"#ef4444" },
  { v:"observation", label:"👁 Quan sát",            col:"#60a5fa" },
  { v:"na",          label:"➖ N/A",                  col:"#718096" },
];

// ── VN regulatory thresholds ──────────────────────────────────────
export const VN_THRESHOLDS = {
  large_consumer_TOE:    1000,   // ≥1000 TOE/năm → Cơ sở sử dụng NL trọng điểm
  seu_percent_min:       10,     // SEU chiếm ≥10% tổng NL (ISO 50001 guidance)
  report_deadline:       "31/3", // Nộp báo cáo NL cho BCT
  audit_cycle_years:     3,      // Kiểm toán NL 3 năm/lần
};

// ── ISO 50001 audit questions — general energy review ─────────────
export const GENERAL_ENERGY_QUESTIONS = [
  { id:"EQ-G01", q:"Đã thực hiện rà soát năng lượng (Energy Review) theo ISO 50001 §6.3 chưa?" },
  { id:"EQ-G02", q:"Dữ liệu tiêu thụ NL được thu thập từ đồng hồ đo hay ước tính từ hóa đơn?" },
  { id:"EQ-G03", q:"Cơ sở đã xác định và lập danh sách các SEU chưa?" },
  { id:"EQ-G04", q:"EnPI tổng thể và theo từng nguồn NL đã được thiết lập chưa?" },
  { id:"EQ-G05", q:"Đường cơ sở EnB có đủ dữ liệu ≥12 tháng không?" },
  { id:"EQ-G06", q:"Có tài liệu phân tích cơ cấu tiêu thụ theo từng loại NL không?" },
  { id:"EQ-G07", q:"Cơ sở thuộc diện trọng điểm theo Luật 50/2010 không (≥1000 TOE/năm)?" },
  { id:"EQ-G08", q:"Có hệ thống giám sát NL tổng thể (SCADA/BMS/đồng hồ phụ) không?" },
];

// ── Conversion factor lookup ──────────────────────────────────────
export const getConversionFactor = (energyTypeId) => {
  const t = ENERGY_TYPE_CATALOG.find(e => e.id === energyTypeId);
  return t ? { toGJ: t.convToGJ, toTOE: t.convToTOE, co2: t.co2Factor } : null;
};

// ── Generate empty months array for a given year ──────────────────
export const genMonthlyData = (year = new Date().getFullYear()) =>
  Array.from({ length: 12 }, (_, i) => ({
    year, month: i + 1, value: 0, valueGJ: 0, valueTOE: 0, cost: 0, unit_price: 0, note: "",
  }));

// ── TOE calculation helper ─────────────────────────────────────────
export const calcTOE = (value, energyTypeId) => {
  const f = getConversionFactor(energyTypeId);
  return f ? +(value * f.toTOE).toFixed(4) : 0;
};

export const calcGJ = (value, energyTypeId) => {
  const f = getConversionFactor(energyTypeId);
  return f ? +(value * f.toGJ).toFixed(4) : 0;
};

// ── Format helpers ────────────────────────────────────────────────
export const fmtNum  = (n, d = 1) => n ? Number(n).toLocaleString("vi-VN",{maximumFractionDigits:d}) : "—";
export const fmtCost = (n)        => n ? `${Number(n).toLocaleString("vi-VN")} đ` : "—";

export const MONTHS_VI = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
