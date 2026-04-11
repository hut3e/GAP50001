/**
 * ISO50001Gap — frontend/gap.ui.constants.js
 * Design tokens: màu sắc, khoảng cách, typography
 */

export const C = {
  bg0:"#04121c", bg1:"#061d2b", bg2:"#0c2840", bg3:"#113352", bg4:"#163d62", bg5:"#1c4972",
  navy:"#1B3564", blue:"#2563eb", blueL:"#60a5fa", teal:"#0d9488", tealL:"#2dd4bf",
  green:"#059669", greenL:"#34d399", red:"#dc2626", redL:"#f87171",
  orange:"#ea580c", orangeL:"#fb923c", amber:"#d97706", amberL:"#fbbf24",
  violet:"#7c3aed", sky:"#0284c7", skyL:"#38bdf8", gold:"#ca8a04",
  t0:"#f8fcff", t1:"#c5e8fd", t2:"#7dd3fc", t3:"#0e4a6e",
  grey2:"#94a3b8",
  bd0:"rgba(56,189,248,.28)", bd1:"rgba(56,189,248,.18)", bd2:"rgba(56,189,248,.1)",
};

/** Khoảng cách (px) */
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
/** Border radius (px) */
export const RADIUS = { sm: 6, md: 8, lg: 10, xl: 12, full: 9999 };
/**
 * Typography scale — chuẩn phần mềm quốc tế (WCAG, Material/Apple HIG).
 * Chỉ dùng các token sau; tránh fontSize cứng để UI đồng nhất.
 *
 * | Token       | px | Dùng cho |
 * |-------------|----|----------|
 * | caption     | 11 | Phụ chú, tag nhỏ, metadata, hint |
 * | label       | 12 | Nhãn form, tiêu đề cột, nút nhỏ, section label (ĐIỂM ĐÁNH GIÁ:) |
 * | body        | 14 | Nội dung chính, input, paragraph, nút, list item |
 * | subheading  | 15 | Tiêu đề clause (4.1.1), sub-section |
 * | title       | 17 | Tiêu đề section (4.1 Bối cảnh), card title |
 * | headline    | 20 | Tiêu đề trang (§4 – Bối cảnh tổ chức) |
 * | display     | 24 | Logo, số lớn (ít dùng) |
 */
export const FONT = {
  caption: 11,
  label: 12,
  body: 14,
  subheading: 15,
  title: 17,
  headline: 20,
  display: 24,
  // Aliases tương thích cũ
  lead: 15,
};

export const SCORE_CFG = {
  0:{ label:"Không áp dụng",    short:"N/A",  col:"#718096", bg:"rgba(113,128,150,.12)" },
  1:{ label:"Chưa triển khai",  short:"Rất kém",col:C.red,   bg:"rgba(192,57,43,.15)" },
  2:{ label:"Mới bắt đầu",      short:"Kém",   col:C.orange, bg:"rgba(211,84,0,.15)"  },
  3:{ label:"Đang phát triển",  short:"TB",    col:C.amber,  bg:"rgba(183,119,13,.15)" },
  4:{ label:"Phần lớn đáp ứng", short:"Tốt",   col:C.green,  bg:"rgba(26,122,74,.15)" },
  5:{ label:"Hoàn toàn đáp ứng",short:"Xuất sắc",col:C.teal, bg:"rgba(13,115,119,.15)"},
};

export const CAT_CFG = {
  doc:        { icon:"📄", label:"Tài liệu",     col:C.blue   },
  practice:   { icon:"⚙️", label:"Thực hành",    col:C.teal   },
  measurement:{ icon:"📊", label:"Đo lường",      col:C.sky    },
  leadership: { icon:"👥", label:"Lãnh đạo",      col:C.violet },
  legal:      { icon:"⚖️", label:"Pháp lý VN",   col:C.red    },
};

export const WEIGHT_CFG = {
  1:{ label:"Cơ bản",    col:C.teal   },
  2:{ label:"Cao",       col:C.amberL },
  3:{ label:"Quan trọng",col:C.redL   },
};

export const RISK_LIKELIHOOD = [
  { v:1, l:"1 — Hiếm khi (<5%)"        },
  { v:2, l:"2 — Ít khả năng (5-20%)"   },
  { v:3, l:"3 — Có thể (20-50%)"        },
  { v:4, l:"4 — Có khả năng (50-80%)"  },
  { v:5, l:"5 — Gần như chắc (>80%)"   },
];
export const RISK_IMPACT = [
  { v:1, l:"1 — Không đáng kể"          },
  { v:2, l:"2 — Nhỏ"                    },
  { v:3, l:"3 — Trung bình"             },
  { v:4, l:"4 — Nghiêm trọng"           },
  { v:5, l:"5 — Thảm hoạ"               },
];

export const STEPS = [
  { id:"org",      icon:"🏭", label:"Tổ chức & Khảo sát" },
  { id:"clauses",  icon:"📖", label:"Đánh giá §4–§10"    },
  { id:"risk",     icon:"⚠️", label:"Ma trận rủi ro"      },
  { id:"process",  icon:"🔄", label:"Tiếp cận quá trình"  },
  { id:"site",     icon:"🏗️", label:"Nhà xưởng & Thiết bị"},
  { id:"actions",  icon:"🚀", label:"Action Plan"          },
  { id:"evidence", icon:"📷", label:"Bằng chứng (tài liệu & ảnh)" },
  { id:"export",   icon:"📄", label:"Xuất báo cáo GAP"    },
];

/** GAP Checklist — bao phủ ISO 50001:2018 (§4–§10) và pháp luật VN (Luật 50/77, Nghị định 30/2026, TT 25/2020/TT-BCT, TT 38/2014, TT 36/2016, QĐ 280, NĐ 06/2022) */
export const GAP_CHECKLIST = [
  // §4
  { id:"4.1.1",clause:"4.1",title:"Xác định vấn đề bên trong ảnh hưởng đến EnMS",           weight:2,cat:"doc",        legal:"Luật 50/2010/QH12, Luật 77/2025/QH15" },
  { id:"4.1.2",clause:"4.1",title:"Xác định vấn đề bên ngoài ảnh hưởng đến EnMS",           weight:2,cat:"doc",        legal:"" },
  { id:"4.1.3",clause:"4.1",title:"Xem xét định kỳ bối cảnh (tại xem xét lãnh đạo)",        weight:1,cat:"practice",   legal:"" },
  { id:"4.1.4",clause:"4.1",title:"Biến động giá NL, công nghệ mới và quy định pháp luật được xem xét",weight:2,cat:"doc",legal:"" },
  { id:"4.2.1",clause:"4.2",title:"Xác định danh sách các bên liên quan đến EnMS",           weight:2,cat:"doc",        legal:"TT 25/2020/TT-BCT" },
  { id:"4.2.2",clause:"4.2",title:"Xác định yêu cầu pháp lý áp dụng và cam kết khác",       weight:3,cat:"legal",      legal:"Luật 50/2010/QH12, Luật 77/2025/QH15; Nghị định 30/2026" },
  { id:"4.2.3",clause:"4.2",title:"Cập nhật danh sách yêu cầu pháp lý định kỳ",             weight:2,cat:"practice",   legal:"" },
  { id:"4.2.4",clause:"4.2",title:"Các bên liên quan bao gồm BCT, cơ quan quản lý NL, khách hàng (nếu có)",weight:2,cat:"doc",legal:"TT 25/2020/TT-BCT" },
  { id:"4.2.5",clause:"4.2",title:"Xác định có thuộc hộ tiêu thụ NL trọng điểm Quốc gia (Nghị định 30/2026) hay không và nghĩa vụ pháp lý tương ứng",weight:3,cat:"legal",legal:"Nghị định 30/2026; Luật 50/2010/QH12, Luật 77/2025/QH15" },
  { id:"4.3.1",clause:"4.3",title:"Phạm vi EnMS được lập thành văn bản rõ ràng",             weight:3,cat:"doc",        legal:"TT 25/2020/TT-BCT" },
  { id:"4.3.2",clause:"4.3",title:"Ranh giới vật lý và địa lý được xác định",                weight:2,cat:"doc",        legal:"" },
  { id:"4.3.3",clause:"4.3",title:"Các loại năng lượng trong phạm vi được liệt kê",          weight:2,cat:"doc",        legal:"" },
  { id:"4.3.4",clause:"4.3",title:"Phạm vi đa cơ sở (nếu có) được xác định rõ từng địa điểm", weight:2,cat:"doc",        legal:"" },
  { id:"4.4.1",clause:"4.4",title:"EnMS được thiết lập theo yêu cầu ISO 50001:2018",         weight:3,cat:"practice",   legal:"TT 25/2020/TT-BCT" },
  { id:"4.4.2",clause:"4.4",title:"EnMS được tích hợp vào quá trình kinh doanh",             weight:2,cat:"practice",   legal:"" },
  // §5
  { id:"5.1.1",clause:"5.1",title:"Lãnh đạo cao nhất cam kết bằng văn bản với EnMS",        weight:3,cat:"leadership", legal:"TT 25/2020/TT-BCT" },
  { id:"5.1.2",clause:"5.1",title:"Ngân sách / nguồn lực tài chính cho EnMS được phê duyệt",weight:3,cat:"leadership", legal:"Nghị định 30/2026" },
  { id:"5.1.3",clause:"5.1",title:"Lãnh đạo hỗ trợ vai trò và quyền hạn quản lý NL",        weight:2,cat:"leadership", legal:"" },
  { id:"5.1.4",clause:"5.1",title:"Lãnh đạo thúc đẩy cải tiến liên tục hiệu quả NL",       weight:2,cat:"leadership", legal:"" },
  { id:"5.1.5",clause:"5.1",title:"Bằng chứng lãnh đạo tham gia xem xét lãnh đạo và phê duyệt nguồn lực",weight:2,cat:"leadership",legal:"" },
  { id:"5.2.1",clause:"5.2",title:"Chính sách NL được ban hành bởi lãnh đạo cao nhất",      weight:3,cat:"doc",        legal:"TT 25/2020/TT-BCT" },
  { id:"5.2.2",clause:"5.2",title:"Chính sách cam kết đáp ứng yêu cầu pháp lý và cải tiến liên tục",weight:3,cat:"doc", legal:"Luật 50/2010/QH12, Luật 77/2025/QH15" },
  { id:"5.2.3",clause:"5.2",title:"Chính sách truyền đạt đến toàn bộ nhân viên",            weight:3,cat:"practice",   legal:"" },
  { id:"5.2.4",clause:"5.2",title:"Chính sách được phổ biến cho nhà thầu liên quan",        weight:2,cat:"practice",   legal:"" },
  { id:"5.2.5",clause:"5.2",title:"Chính sách NL có sẵn tại nơi làm việc và được cập nhật khi cần",weight:2,cat:"practice",legal:"" },
  { id:"5.3.1",clause:"5.3",title:"EMR được bổ nhiệm bằng văn bản có thẩm quyền",          weight:3,cat:"doc",        legal:"TT 38/2014; TT 25/2020/TT-BCT" },
  { id:"5.3.2",clause:"5.3",title:"Nhóm quản lý NL được thành lập",                         weight:2,cat:"doc",        legal:"TT 25/2020/TT-BCT" },
  { id:"5.3.3",clause:"5.3",title:"Vai trò, trách nhiệm và quyền hạn được lập thành văn bản",weight:2,cat:"doc",       legal:"" },
  { id:"5.3.4",clause:"5.3",title:"EMR có phân bổ thời gian và báo cáo lãnh đạo rõ ràng",weight:2,cat:"practice",legal:"TT 38/2014" },
  { id:"5.3.5",clause:"5.3",title:"Có vị trí Người quản lý năng lượng (EMR) theo quy định Luật 50/2010/QH12, Luật 77/2025/QH15 và TT 38/2014",weight:3,cat:"legal",legal:"Luật 50/2010/QH12, Luật 77/2025/QH15; TT 38/2014" },
  // §6
  { id:"6.1.1",clause:"6.1",title:"Rủi ro và cơ hội của EnMS được xác định",                weight:2,cat:"doc",        legal:"" },
  { id:"6.1.2",clause:"6.1",title:"Kế hoạch hành động ứng phó rủi ro và cơ hội được lập",   weight:2,cat:"doc",        legal:"" },
  { id:"6.1.3",clause:"6.1",title:"Hiệu lực hành động ứng phó rủi ro/cơ hội được đánh giá",  weight:2,cat:"practice",   legal:"" },
  { id:"6.2.1",clause:"6.2",title:"Mục tiêu NL đo lường được, có thời hạn, phù hợp SEU",     weight:3,cat:"doc",        legal:"TT 25/2020/TT-BCT; QĐ 280/QĐ-TTg" },
  { id:"6.2.2",clause:"6.2",title:"Kế hoạch hành động chi tiết để đạt mục tiêu NL",        weight:2,cat:"doc",        legal:"" },
  { id:"6.2.3",clause:"6.2",title:"Nguồn lực, người chịu trách nhiệm và thời hạn được xác định",weight:2,cat:"doc",    legal:"" },
  { id:"6.2.4",clause:"6.2",title:"Mục tiêu NL ở cấp cơ sở/SEU, gắn với kết quả rà soát NL",weight:3,cat:"doc",        legal:"TT 25/2020/TT-BCT; QĐ 280/QĐ-TTg" },
  { id:"6.3.1",clause:"6.3",title:"Rà soát NL dựa trên dữ liệu đo thực tế",                weight:3,cat:"measurement",legal:"TT 25/2020" },
  { id:"6.3.2",clause:"6.3",title:"SEU được xác định và lập thành tài liệu",                weight:3,cat:"doc",        legal:"TT 25/2020/TT-BCT" },
  { id:"6.3.3",clause:"6.3",title:"Cơ hội cải tiến hiệu quả NL được xác định",             weight:2,cat:"practice",   legal:"" },
  { id:"6.3.4",clause:"6.3",title:"Biến tĩnh (static variables) ảnh hưởng NL được phân tích",  weight:2,cat:"measurement",legal:"" },
  { id:"6.3.5",clause:"6.3",title:"Rà soát NL được cập nhật định kỳ hoặc khi có thay đổi",   weight:2,cat:"practice",   legal:"" },
  { id:"6.3.6",clause:"6.3",title:"Phương pháp rà soát NL được lập thành văn bản",           weight:2,cat:"doc",        legal:"TT 25/2020" },
  { id:"6.3.7",clause:"6.3",title:"Rà soát NL khi thay đổi quy trình, thiết bị hoặc sản phẩm",weight:2,cat:"practice", legal:"" },
  { id:"6.3.8",clause:"6.3",title:"Xác định biến liên quan ảnh hưởng đến tiêu thụ NL (sản lượng, thời tiết, giờ vận hành…) và lập thành văn bản",weight:2,cat:"measurement",legal:"ISO 50006:2014" },
  { id:"6.3.9",clause:"6.3",title:"Thứ tự ưu tiên các cơ hội cải tiến hiệu quả NL được xác định (tiêu chí, phương pháp ưu tiên hóa)",weight:2,cat:"doc",legal:"TT 25/2020" },
  { id:"6.4.1",clause:"6.4",title:"EnPI được thiết lập phù hợp với tổ chức và SEU",          weight:3,cat:"measurement",legal:"TT 25/2020/TT-BCT; ISO 50006:2014" },
  { id:"6.4.2",clause:"6.4",title:"Phương pháp xác định EnPI được lập thành văn bản",       weight:2,cat:"doc",        legal:"ISO 50006:2014" },
  { id:"6.4.3",clause:"6.4",title:"EnPI được theo dõi, so sánh với EnB và phân tích xu hướng",weight:2,cat:"measurement",legal:"" },
  { id:"6.4.4",clause:"6.4",title:"EnPI cấp SEU và yếu tố chuẩn hóa (sản lượng, thời tiết) được xác định",weight:2,cat:"measurement",legal:"ISO 50006:2014" },
  { id:"6.5.1",clause:"6.5",title:"EnB được thiết lập với thời kỳ cơ sở đại diện",          weight:3,cat:"measurement",legal:"TT 25/2020" },
  { id:"6.5.2",clause:"6.5",title:"Phương pháp điều chỉnh EnB khi biến tĩnh thay đổi",     weight:2,cat:"measurement",legal:"ISO 50006:2014" },
  { id:"6.5.3",clause:"6.5",title:"EnB được xem xét và cập nhật khi có thay đổi đáng kể",   weight:2,cat:"measurement",legal:"" },
  { id:"6.5.4",clause:"6.5",title:"Chuẩn hóa dữ liệu NL theo biến ảnh hưởng (sản lượng, thời tiết) để thiết lập và so sánh EnPI/EnB",weight:3,cat:"measurement",legal:"ISO 50006:2014" },
  { id:"6.6.1",clause:"6.6",title:"Kế hoạch thu thập dữ liệu NL được lập thành văn bản",   weight:2,cat:"measurement",legal:"TT 25/2020/TT-BCT" },
  { id:"6.6.2",clause:"6.6",title:"Người chịu trách nhiệm và tần suất thu thập dữ liệu được xác định",weight:2,cat:"measurement",legal:"" },
  { id:"6.6.3",clause:"6.6",title:"Thiết bị đo lường được hiệu chuẩn định kỳ",              weight:3,cat:"measurement",legal:"TT 25/2020/TT-BCT" },
  { id:"6.6.4",clause:"6.6",title:"Độ không đảm bảo đo và hồ sơ hiệu chuẩn được quản lý",    weight:2,cat:"measurement",legal:"" },
  { id:"6.6.5",clause:"6.6",title:"Hiện trạng đồng hồ đo NL (số lượng, vị trí, phủ SEU/hộ tiêu thụ) được rà soát và lập văn bản",weight:3,cat:"measurement",legal:"TT 25/2020/TT-BCT" },
  { id:"6.6.6",clause:"6.6",title:"Kế hoạch kiểm định/hiệu chuẩn thiết bị đo (nội bộ hoặc bên ngoài), chu kỳ và đơn vị thực hiện",weight:3,cat:"measurement",legal:"TT 25/2020/TT-BCT" },
  // §7
  { id:"7.1.1",clause:"7.1",title:"Nguồn lực cho EnMS được xác định và cung cấp",           weight:2,cat:"leadership", legal:"Nghị định 30/2026" },
  { id:"7.1.2",clause:"7.1",title:"Cơ sở hạ tầng đo lường (đồng hồ, phần mềm) và công cụ quản lý NL",weight:2,cat:"doc",legal:"" },
  { id:"7.1.3",clause:"7.1",title:"Công cụ và thiết bị phục vụ kiểm tra, bảo trì bảo dưỡng (dụng cụ đo, phần mềm PM, phụ tùng cơ bản) được xác định và sẵn có",weight:2,cat:"practice",legal:"" },
  { id:"7.2.1",clause:"7.2",title:"Năng lực yêu cầu cho vị trí ảnh hưởng EnPI được xác định",weight:2,cat:"doc",        legal:"TT 38/2014" },
  { id:"7.2.2",clause:"7.2",title:"Kế hoạch đào tạo nhân viên liên quan EnMS",              weight:2,cat:"practice",   legal:"TT 38/2014" },
  { id:"7.2.3",clause:"7.2",title:"Hồ sơ năng lực và đào tạo được lưu trữ",                weight:1,cat:"doc",        legal:"TT 38/2014" },
  { id:"7.3.1",clause:"7.3",title:"Nhân viên nhận thức được chính sách NL",                 weight:2,cat:"practice",   legal:"" },
  { id:"7.3.2",clause:"7.3",title:"Nhân viên hiểu đóng góp cá nhân đến hiệu quả NL",      weight:2,cat:"practice",   legal:"" },
  { id:"7.3.3",clause:"7.3",title:"Đào tạo nhận thức cho nhân viên mới và định kỳ",        weight:2,cat:"practice",   legal:"" },
  { id:"7.4.1",clause:"7.4",title:"Trao đổi thông tin nội bộ về EnMS (nội dung, thời điểm, đối tượng)",weight:2,cat:"practice",legal:"TT 25/2020/TT-BCT" },
  { id:"7.5.1",clause:"7.5",title:"Tài liệu bắt buộc ISO 50001 đầy đủ và được kiểm soát",  weight:3,cat:"doc",        legal:"TT 25/2020/TT-BCT" },
  { id:"7.5.2",clause:"7.5",title:"Hồ sơ EnMS được lưu trữ, bảo vệ và kiểm soát",           weight:2,cat:"doc",        legal:"" },
  { id:"7.5.3",clause:"7.5",title:"Danh mục tài liệu và hồ sơ bắt buộc được duy trì và kiểm soát",weight:2,cat:"doc",   legal:"" },
  // §8
  { id:"8.1.1",clause:"8.1",title:"Tiêu chí vận hành cho SEU được thiết lập",               weight:3,cat:"practice",   legal:"TT 25/2020/TT-BCT" },
  { id:"8.1.2",clause:"8.1",title:"Kiểm soát vận hành tại SEU (SOP, check-list) được thực hiện",weight:2,cat:"practice",legal:"" },
  { id:"8.1.3",clause:"8.1",title:"Yêu cầu NL được truyền đạt cho nhà thầu/người vận hành bên ngoài",weight:2,cat:"practice",legal:"" },
  { id:"8.1.4",clause:"8.1",title:"Kế hoạch bảo trì và xử lý tình huống bất thường tại SEU", weight:2,cat:"practice",   legal:"TT 25/2020/TT-BCT" },
  { id:"8.1.5",clause:"8.1",title:"Checklist kiểm tra vận hành/định kỳ cho SEU và thiết bị tiêu thụ NL được lập và sử dụng",weight:2,cat:"practice",legal:"" },
  { id:"8.1.6",clause:"8.1",title:"SOP hoặc tiêu chuẩn công đoạn có xác định các yếu tố ảnh hưởng đến NL (nhiệt độ, áp suất, thời gian chạy, tải…)",weight:3,cat:"doc",legal:"TT 25/2020/TT-BCT" },
  { id:"8.1.7",clause:"8.1",title:"Kế hoạch bảo trì bảo dưỡng định kỳ (PM) cho thiết bị tiêu thụ NL được lập và thực hiện",weight:3,cat:"practice",legal:"" },
  { id:"8.1.8",clause:"8.1",title:"Tình trạng kho vật tư dự phòng (phụ tùng, vật tư thay thế) cho thiết bị NL được quản lý, tránh dừng máy kéo dài",weight:2,cat:"practice",legal:"" },
  { id:"8.2.1",clause:"8.2",title:"Hiệu quả NL xem xét trong thiết kế/sửa đổi thiết bị, quy trình",weight:2,cat:"practice",legal:"Luật 50/2010/QH12, Luật 77/2025/QH15" },
  { id:"8.2.2",clause:"8.2",title:"Dự án cải tạo/sửa đổi có đánh giá tác động đến hiệu quả NL",weight:2,cat:"practice",  legal:"" },
  { id:"8.3.1",clause:"8.3",title:"Tiêu chí NL trong đánh giá và mua sắm thiết bị",        weight:2,cat:"practice",   legal:"TT 36/2016" },
  { id:"8.3.2",clause:"8.3",title:"Ưu tiên thiết bị nhãn NL 4-5 sao / đáp ứng MEPS",      weight:2,cat:"practice",   legal:"TT 36/2016; QĐ 1725/QĐ-BCT" },
  // §9
  { id:"9.1.1",clause:"9.1",title:"Theo dõi EnPI định kỳ và ghi nhận kết quả",             weight:3,cat:"measurement",legal:"TT 25/2020/TT-BCT" },
  { id:"9.1.2",clause:"9.1",title:"So sánh EnPI với EnB và phân tích xu hướng",             weight:3,cat:"measurement",legal:"ISO 50006:2014" },
  { id:"9.1.3",clause:"9.1",title:"Báo cáo sử dụng NL hàng năm nộp cho cơ quan quản lý",  weight:3,cat:"legal",      legal:"TT 25/2020/TT-BCT; Nghị định 30/2026" },
  { id:"9.1.4",clause:"9.1",title:"Thiết bị đo lường hiệu chuẩn và ghi nhận sai số được lưu",weight:2,cat:"measurement",legal:"" },
  { id:"9.1.5",clause:"9.1",title:"Phân tích và đánh giá kết quả theo dõi EnPI, mục tiêu và tuân thủ pháp lý",weight:3,cat:"measurement",legal:"" },
  { id:"9.1.6",clause:"9.1",title:"Theo dõi thời hạn nộp báo cáo NL, chu kỳ kiểm toán NL (3 năm) — pháp lý VN",weight:3,cat:"legal",legal:"TT 25/2020/TT-BCT; Nghị định 30/2026" },
  { id:"9.1.7",clause:"9.1",title:"Hồ sơ kiểm định/hiệu chuẩn (nội bộ hoặc bên ngoài) được lưu trữ và theo dõi chu kỳ",weight:2,cat:"measurement",legal:"TT 25/2020/TT-BCT" },
  { id:"9.1.8",clause:"9.1",title:"Kiểm toán năng lượng định kỳ (chu kỳ 3 năm) được thực hiện và lưu hồ sơ — pháp lý VN",weight:3,cat:"legal",legal:"TT 25/2020; Nghị định 30/2026" },
  { id:"9.2.1",clause:"9.2",title:"Chương trình đánh giá nội bộ EnMS được lập và thực hiện hàng năm",weight:2,cat:"practice",legal:"ISO 50003:2014" },
  { id:"9.2.2",clause:"9.2",title:"Đánh giá viên nội bộ có năng lực và độc lập",            weight:2,cat:"practice",   legal:"" },
  { id:"9.2.3",clause:"9.2",title:"Kết quả đánh giá nội bộ được báo cáo cho lãnh đạo",     weight:2,cat:"practice",   legal:"" },
  { id:"9.2.4",clause:"9.2",title:"Phạm vi, tiêu chí và tần suất đánh giá nội bộ được xác định trong chương trình",weight:2,cat:"doc",legal:"ISO 50003:2014" },
  { id:"9.3.1",clause:"9.3",title:"Xem xét lãnh đạo ít nhất 1 lần/năm",                    weight:3,cat:"leadership", legal:"TT 25/2020/TT-BCT" },
  { id:"9.3.2",clause:"9.3",title:"Đầu ra xem xét lãnh đạo được lập thành hồ sơ",          weight:2,cat:"doc",        legal:"" },
  { id:"9.3.3",clause:"9.3",title:"Đầu vào và đầu ra xem xét lãnh đạo theo ISO 50001 được đảm bảo",weight:2,cat:"doc",   legal:"" },
  // §10
  { id:"10.1.1",clause:"10.1",title:"Quy trình xử lý sự không phù hợp và hành động khắc phục (CAR)",weight:2,cat:"practice",legal:"" },
  { id:"10.1.2",clause:"10.1",title:"Hồ sơ NC và CAR được lưu trữ đầy đủ",                  weight:2,cat:"doc",        legal:"" },
  { id:"10.1.3",clause:"10.1",title:"Xác định nguyên nhân gốc rễ và xác minh hiệu lực hành động khắc phục",weight:3,cat:"practice",legal:"" },
  { id:"10.2.1",clause:"10.2",title:"Cải tiến liên tục EnMS và hiệu quả NL được chứng minh",weight:3,cat:"measurement",legal:"QĐ 280/QĐ-TTg" },
  { id:"10.2.2",clause:"10.2",title:"Xu hướng cải tiến EnPI được ghi nhận qua ít nhất 2 kỳ",weight:2,cat:"measurement",legal:"ISO 50021:2019" },
];

/** Ghi chú giải thích thuật ngữ hiển thị khi hover/click lên từ khóa (vd: MEPS) */
export const TERM_NOTES = {
  MEPS: "MEPS (Minimum Energy Performance Standards): Tiêu chuẩn hiệu suất năng lượng tối thiểu — quy định mức hiệu suất năng lượng tối thiểu cho thiết bị sử dụng năng lượng. Tại Việt Nam áp dụng theo TT 36/2016/TT-BCT (Dán nhãn năng lượng) và QĐ 1725/QĐ-BCT (2024) — Danh mục mặt hàng kiểm tra hiệu suất NL và dán nhãn năng lượng (motor, bơm, quạt...). Thiết bị trong danh mục phải đáp ứng MEPS hoặc có nhãn năng lượng.",
};

export const RISK_CATEGORIES = [
  { id:"RISK-LEG",  name:"Pháp lý & Quy định",       col:"#C0392B",
    items:[
      { id:"RL-01",risk:"Chưa xác định cơ sở thuộc diện trọng điểm",                   ref:"TT 25/2020/TT-BCT"    },
      { id:"RL-02",risk:"Không nộp báo cáo NL hàng năm cho BCT",                        ref:"TT 25/2020/TT-BCT"   },
      { id:"RL-03",risk:"Không thực hiện kiểm toán NL theo chu kỳ 3 năm",              ref:"TT 25/2020 §5"    },
      { id:"RL-04",risk:"EMR chưa có chứng chỉ quản lý NL (TT 38/2014)",               ref:"TT 38/2014 §5"    },
      { id:"RL-05",risk:"Thiết bị không đáp ứng MEPS hoặc chưa có nhãn NL",            ref:"TT 36/2016; QĐ 1725/QĐ-BCT"},
      { id:"RL-06",risk:"Không lập kế hoạch sử dụng NL hàng năm",                      ref:"TT 25/2020/TT-BCT"    },
    ]},
  { id:"RISK-OPS",  name:"Vận hành & Kỹ thuật",      col:"#D35400",
    items:[
      { id:"RO-01",risk:"SEU vận hành ngoài dải tối ưu",                                ref:"ISO 50001 §8.1"   },
      { id:"RO-02",risk:"Thiết bị lớn tuổi hiệu suất thấp chưa lên kế hoạch thay thế", ref:"ISO 50001 §8.2"   },
      { id:"RO-03",risk:"Không kiểm soát rò rỉ hơi/khí nén/nước làm mát",             ref:"ISO 50001 §8.1"   },
      { id:"RO-04",risk:"Vận hành thiết bị không tải gây lãng phí NL",                 ref:"ISO 50001 §8.1"   },
      { id:"RO-05",risk:"Thiếu hệ thống giám sát NL real-time",                         ref:"ISO 50001 §9.1"   },
    ]},
  { id:"RISK-DATA", name:"Dữ liệu & Đo lường",       col:"#1A7A4A",
    items:[
      { id:"RD-01",risk:"Đồng hồ đo điện/nhiệt chưa hiệu chuẩn hoặc hư hỏng",         ref:"ISO 50001 §6.6"   },
      { id:"RD-02",risk:"Dữ liệu NL chỉ cấp nhà máy, không phân vùng SEU",             ref:"ISO 50001 §6.3"   },
      { id:"RD-03",risk:"EnPI chưa hiệu chỉnh theo biến sản xuất và thời tiết",        ref:"ISO 50006:2014 §5" },
      { id:"RD-04",risk:"Dữ liệu NL không đủ 12 tháng để xác lập EnB",                ref:"ISO 50001 §6.5"   },
    ]},
  { id:"RISK-ORG",  name:"Tổ chức & Con người",       col:"#6C3483",
    items:[
      { id:"ROG-01",risk:"Thiếu nhân sự chuyên trách quản lý NL",                       ref:"ISO 50001 §5.3"   },
      { id:"ROG-02",risk:"Nhân viên thiếu kiến thức TKNL tại SEU",                     ref:"ISO 50001 §7.2"   },
      { id:"ROG-03",risk:"Không có cơ chế khuyến khích TKNL",                           ref:"ISO 50001 §7.3"   },
      { id:"ROG-04",risk:"Nhà thầu không được truyền đạt yêu cầu EnMS",                ref:"ISO 50001 §8.1"   },
    ]},
  { id:"RISK-STRAT",name:"Chiến lược & Tài chính",    col:"#2471A3",
    items:[
      { id:"RS-01",risk:"Chi phí NL tăng đột biến ảnh hưởng lợi nhuận",                ref:"ISO 50001 §5.1"   },
      { id:"RS-02",risk:"Không có ngân sách cho EIP ưu tiên",                           ref:"ISO 50001 §7.1"   },
      { id:"RS-03",risk:"Áp lực CBAM/EU Green Deal ảnh hưởng xuất khẩu",              ref:"NĐ 06/2022"       },
      { id:"RS-04",risk:"Mục tiêu TKNL VNEEP3 không đạt",                               ref:"QĐ 280/QĐ-TTg"   },
    ]},
];

export const PROCESS_MAP = [
  { id:"PR-01",name:"Lập kế hoạch NL hàng năm",             owner:"EMR + Ban lãnh đạo",      freq:"Hàng năm" },
  { id:"PR-02",name:"Rà soát năng lượng (Energy Review)",   owner:"EMR + Nhóm kỹ thuật",     freq:"Hàng năm / Khi thay đổi" },
  { id:"PR-03",name:"Thiết lập và theo dõi EnPI / EnB",     owner:"EMR",                      freq:"Hàng tháng / Hàng năm" },
  { id:"PR-04",name:"Kiểm soát vận hành tại SEU",           owner:"Ca trưởng vận hành",       freq:"Hàng ca" },
  { id:"PR-05",name:"Mua sắm thiết bị & Dịch vụ NL",        owner:"Phòng Mua hàng + Kỹ thuật",freq:"Theo nhu cầu" },
  { id:"PR-06",name:"Đào tạo và nâng cao nhận thức NL",     owner:"Phòng Nhân sự + EMR",      freq:"Hàng năm" },
  { id:"PR-07",name:"Đánh giá nội bộ EnMS",                 owner:"Đánh giá viên nội bộ",     freq:"≥1 lần/năm" },
  { id:"PR-08",name:"Xem xét lãnh đạo (Management Review)", owner:"Lãnh đạo cao nhất",         freq:"≥1 lần/năm" },
  { id:"PR-09",name:"Xử lý NC và hành động khắc phục",     owner:"EMR + Bộ phận liên quan",  freq:"Khi phát sinh" },
];

export const EQUIPMENT_TYPES = [
  "Động cơ điện","Động cơ thuỷ lực","Động cơ Servo","Động cơ bước","Động cơ từ trở",
  "Bơm nước","Bơm thuỷ lực","Bơm hoá chất","Máy nén khí","Máy sấy khí",
  "Máy CNC","Máy hàn","Máy dập","Máy ép","Máy cắt","Máy cắt Laser","Máy uốn","Máy gấp","Máy cấp phôi",
  "Quạt hút bụi","Quạt hút khí thải","Quạt làm mát","Quạt cấp gió",
  "Lò hơi đốt than","Lò hơi đốt dầu DO","Lò hơi đốt gas LPG","Lò hơi đốt CNG","Lò hơi đốt sinh khối",
  "Lò khí hoá","Lò nung","Lò nhiệt luyện","Lò nấu kim loại","Lò giếng loại điện trở","Lò giếng loại dầu","Mỏ đốt",
  "Chiller","Dàn nóng","Dàn lạnh","Điều hoà","Bộ trao đổi nhiệt","Bộ hâm nước nóng","Bộ gia nhiệt không khí","Bộ làm mát",
  "Đèn chiếu sáng","Máy biến áp","Tụ điện","Tủ điện","Aptomat","Khởi động từ","Ro le nhiệt","PLC","Module Input","Module Output",
  "Máy ép bùn","Máy thổi khí","Máy khuấy","Máy ép phế",
  "Băng tải","Gầu tải","Cầu trục","Pa lăng",
  "Máy thổi nhựa","Máy đóng chai","Máy đùn nhựa","Máy tạo hạt nhựa","Máy ly tâm","Máy nghiền",
  "Máy phun bi","Máy phun cát","Máy đánh bóng","Máy trà nhám",
  "Máy Scan","Máy X-ray",
];
export const ZONE_TYPES = ["Xưởng sản xuất chính","Khu vực lò nung / lò hơi","Khu vực máy nén khí","Hệ thống lạnh","Chiếu sáng nhà xưởng","Văn phòng","Kho nguyên/thành phẩm","Trạm bơm","Trạm biến áp","Khu vực khác"];

export const ACTION_PHASES = [
  { id:"P1", label:"Giai đoạn 1 — Ngay lập tức (0–30 ngày)",    col:"#C0392B" },
  { id:"P2", label:"Giai đoạn 2 — Ngắn hạn (1–3 tháng)",       col:"#D35400" },
  { id:"P3", label:"Giai đoạn 3 — Trung hạn (3–6 tháng)",      col:"#B7770D" },
  { id:"P4", label:"Giai đoạn 4 — Dài hạn (6–12 tháng)",       col:"#0D7377" },
];

/** 19 mục chuẩn cho Tóm tắt điều hành (Executive Summary) — dropdown + CRUD */
export const EXEC_SUMMARY_STANDARD_ITEMS = [
  "Nhận diện hộ tiêu thụ năng lượng trọng điểm Quốc gia",
  "Nhận diện các nguồn năng lượng sử dụng",
  "Khảo sát các Trạm biến áp, Phòng điện, tủ điện phân phối chính",
  "Khảo sát các trạm cung cấp gas LPG",
  "Khảo sát các trạm cung cấp gas CNG",
  "Khảo sát các trạm cung cấp gas LNG",
  "Khảo sát Hệ thống Lò hơi và cung cấp hơi",
  "Khảo sát Hệ thống Máy nén khí, Máy sấy khí, Bình tích và cung cấp khí nén",
  "Khảo sát hệ thống xử lý nước thải",
  "Khảo sát hệ thống cung cấp nước sạch cho Nhà máy",
  "Khảo sát Hệ thống Chiller",
  "Khảo sát hệ thống Tháp giải nhiệt",
  "Khảo sát Hệ thống Quạt hút bụi",
  "Khảo sát hệ thống Quạt thông gió - làm mát",
  "Khảo sát hệ thống đèn chiếu sáng",
  "Khảo sát hệ thống bơm",
  "Khảo sát hệ thống thuỷ lực",
  "Khảo sát Hệ thống điện mặt trời áp mái",
  "Khảo sát hệ thống đồng hồ đo năng lượng",
];

export const INIT_SURVEY = {
  meta:{ ref_no:"GAP-2024-001", report_title:"BÁO CÁO KHẢO SÁT GAP ISO 50001:2018",
         survey_date:"", version:"v1.0", objective:"", exec_summary:"", exec_summary_items:[], confidential:"CONFIDENTIAL" },
  client:{ name:"", site:"", address:"", industry:"", employees:"", annual_energy:"", is_large_user:false, cert_status:"Chưa có chứng nhận ISO 50001", scope_product:[] },
  verifier:{ org:"", accred:"", lead:"", team:"", cert_no:"", std_applied:"ISO 50001:2018; ISO 50006:2014; ISO 50002:2014" },
  /** Kế hoạch đánh giá GAP & đoàn đánh giá */
  audit_plan:{
    plan_code:"",        // Mã kế hoạch / Proposal
    visit_no:"",         // Đợt khảo sát (VD: Đợt 1/2024)
    from_date:"",        // Từ ngày
    to_date:"",          // Đến ngày
    from_city:"",        // Đi từ đâu
    to_city:"",          // Tới đâu
    customer_ref:"",     // Mã khách hàng nội bộ (nếu có)
    auditors:[],         // [{ name, role, org, phone, email }]
  },
  responses:{},
  /** Điều khoản đánh giá tùy chỉnh do người dùng thêm (ngoài GAP_CHECKLIST chuẩn) */
  custom_clauses:[],
  risk_assessments:{},
  /** Danh sách rủi ro theo nhóm (CRUD): { [categoryId]: [ { id, risk, ref, likelihood, impact, control, recommendation, deadline } ] } */
  risk_items:{},
  process_gaps:{},
  site_assessments:[],
  action_plan:[],
  legal_status:{},
  legal_registry: [
    { code: "Luật 50/2010/QH12", subject: "Luật Sử dụng NL tiết kiệm và HQ; Luật 77/2025/QH15", doc_type: "Luật", articles: "Điều 4–7, 35–42", threshold: "Bắt buộc tất cả CSTN", status: "pending" },
    { code: "NĐ 30/2026/NĐ-CP", subject: "Nghị định 30/2026", doc_type: "Nghị định", articles: "Điều 10–30", threshold: "", status: "pending" },
    { code: "TT 25/2020/TT-BCT", subject: "Quản lý NL tại cơ sở CN trọng điểm", doc_type: "Thông tư", articles: "Điều 4–20", threshold: "≥1.000 TOE/năm", status: "pending" },
    { code: "TT 25/2020/TT-BCT", subject: "Kiểm toán năng lượng", doc_type: "Thông tư", articles: "Điều 5–15", threshold: "Mỗi 3 năm — CSTN", status: "pending" },
    { code: "TT 38/2014/TT-BCT", subject: "Đào tạo quản lý năng lượng (EMR)", doc_type: "Thông tư", articles: "Điều 4–9", threshold: "Bắt buộc EMR", status: "pending" },
    { code: "TT 36/2016/TT-BCT", subject: "Dán nhãn năng lượng và MEPS", doc_type: "Thông tư", articles: "Danh mục thiết bị", threshold: "Thiết bị trong danh mục", status: "pending" },
    { code: "QĐ 280/QĐ-TTg", subject: "VNEEP3 (2019–2030)", doc_type: "QĐ TTg", articles: "Mục tiêu 8–10% TKNL", threshold: "", status: "pending" },
    { code: "NĐ 06/2022/NĐ-CP", subject: "Giảm phát thải KNK", doc_type: "Nghị định", articles: "Điều 6, 15", threshold: "≥3.000 tCO₂e/năm", status: "pending" },
    { code: "QĐ 1725/QĐ-BCT (2024)", subject: "Danh mục mặt hàng kiểm tra hiệu suất NL và dán nhãn năng lượng", doc_type: "QĐ BCT", articles: "Danh mục thiết bị (motor, bơm, quạt...); thay thế danh mục trước", threshold: "Thiết bị trong danh mục", status: "pending" },
  ],
  iso_standards_registry: [
    { standard_id: "ISO 50001:2018", focus: "Tiêu chuẩn gốc — EnMS Requirements" },
    { standard_id: "ISO 50002:2014", focus: "Energy Audits — Kiểm toán năng lượng" },
    { standard_id: "ISO 50003:2014", focus: "Certification Bodies — Tổ chức chứng nhận" },
    { standard_id: "ISO 50004:2014", focus: "Implementation Guidance — Hướng dẫn triển khai" },
    { standard_id: "ISO 50006:2014", focus: "EnPI & EnB Measurement" },
    { standard_id: "ISO 50015:2014", focus: "M&V — Đo lường và xác minh NL" },
    { standard_id: "ISO 50021:2019", focus: "EnPI/EnB Selection Guidelines" },
    { standard_id: "ISO 50047:2016", focus: "Energy Savings Determination" },
  ],
  certification_roadmap: [
    { timeframe: "T+0 → T+1", activity: "Đóng khoảng cách nghiêm trọng (Score 1)", deliverable: "Tài liệu EnMS cơ bản hoàn chỉnh", criteria: "Không còn NC Score 1" },
    { timeframe: "T+1 → T+3", activity: "Xây dựng đầy đủ EnMS §4–§10", deliverable: "EnB, EnPI, SEU, Chính sách NL", criteria: "Score trung bình ≥ 3.5/5" },
    { timeframe: "T+3 → T+6", activity: "Vận hành EnMS và thu thập bằng chứng", deliverable: "Hồ sơ vận hành 3+ tháng", criteria: "Bằng chứng thực tế tại SEU" },
    { timeframe: "T+6 → T+9", activity: "Đánh giá nội bộ + Action khắc phục", deliverable: "Báo cáo đánh giá nội bộ, CAR", criteria: "Tất cả NC được đóng" },
    { timeframe: "T+9 → T+12", activity: "Đánh giá chứng nhận (Stage 1 + Stage 2)", deliverable: "Chứng nhận ISO 50001:2018", criteria: "Không có NC Major từ CBTT" },
  ],
  /** Logistics cho chuyến khảo sát — di chuyển & lưu trú */
  logistics_trips:[],
};
