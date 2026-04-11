/**
 * ISO50001Gap — gap.constants.js
 * Full knowledge base: Gap checklist per clause, Risk matrix, Process map,
 * Equipment/Zone types, Legal requirements Vietnam + ISO 500xx family
 */

// ═══════════════════════════════════════════════════════════
// GAP CHECKLIST — §4 to §10, every requirement item
// Each item: id, clause, text, weight (1=minor,2=major,3=critical),
//            category (doc|practice|measurement|leadership|legal)
// ═══════════════════════════════════════════════════════════
const GAP_CHECKLIST = [
  // ── §4 Bối cảnh tổ chức ──────────────────────────────────
  { id:"4.1.1", clause:"4.1", title:"Xác định vấn đề bên trong ảnh hưởng đến EnMS",               weight:2, cat:"doc",         legal:"Luật 50/2010/QH12, Luật 77/2025/QH15" },
  { id:"4.1.2", clause:"4.1", title:"Xác định vấn đề bên ngoài ảnh hưởng đến EnMS",               weight:2, cat:"doc",         legal:"" },
  { id:"4.1.3", clause:"4.1", title:"Xem xét định kỳ bối cảnh (ít nhất mỗi xem xét lãnh đạo)",    weight:1, cat:"practice",    legal:"" },
  { id:"4.2.1", clause:"4.2", title:"Xác định danh sách các bên liên quan đến EnMS",               weight:2, cat:"doc",         legal:"TT 25/2020/TT-BCT §4" },
  { id:"4.2.2", clause:"4.2", title:"Xác định yêu cầu pháp lý áp dụng và cam kết khác",           weight:3, cat:"legal",       legal:"Luật 50/2010/QH12, Luật 77/2025/QH15; Nghị định 30/2026" },
  { id:"4.2.3", clause:"4.2", title:"Cập nhật danh sách yêu cầu pháp lý định kỳ",                 weight:2, cat:"practice",    legal:"TT 25/2020/TT-BCT §4" },
  { id:"4.2.5", clause:"4.2", title:"Xác định có thuộc hộ tiêu thụ NL trọng điểm Quốc gia (Nghị định 30/2026) hay không và nghĩa vụ pháp lý tương ứng", weight:3, cat:"legal", legal:"Nghị định 30/2026; Luật 50/2010/QH12, Luật 77/2025/QH15" },
  { id:"4.3.1", clause:"4.3", title:"Phạm vi EnMS được lập thành văn bản rõ ràng",                 weight:3, cat:"doc",         legal:"TT 25/2020/TT-BCT §5" },
  { id:"4.3.2", clause:"4.3", title:"Ranh giới vật lý và địa lý được xác định",                    weight:2, cat:"doc",         legal:"" },
  { id:"4.3.3", clause:"4.3", title:"Các loại năng lượng trong phạm vi được liệt kê",              weight:2, cat:"doc",         legal:"" },
  { id:"4.4.1", clause:"4.4", title:"EnMS được thiết lập theo yêu cầu ISO 50001:2018",             weight:3, cat:"practice",    legal:"TT 25/2020/TT-BCT §6" },
  { id:"4.4.2", clause:"4.4", title:"EnMS được tích hợp vào quá trình kinh doanh",                weight:2, cat:"practice",    legal:"" },
  // ── §5 Lãnh đạo ──────────────────────────────────────────
  { id:"5.1.1", clause:"5.1", title:"Lãnh đạo cao nhất cam kết bằng văn bản với EnMS",            weight:3, cat:"leadership",  legal:"TT 25/2020/TT-BCT §6" },
  { id:"5.1.2", clause:"5.1", title:"Ngân sách / nguồn lực tài chính cho EnMS được phê duyệt",    weight:3, cat:"leadership",  legal:"Nghị định 30/2026" },
  { id:"5.1.3", clause:"5.1", title:"Lãnh đạo hỗ trợ các vai trò quản lý năng lượng",            weight:2, cat:"leadership",  legal:"" },
  { id:"5.1.4", clause:"5.1", title:"Lãnh đạo thúc đẩy cải tiến liên tục hiệu quả năng lượng",  weight:2, cat:"leadership",  legal:"" },
  { id:"5.2.1", clause:"5.2", title:"Chính sách năng lượng được ban hành bởi lãnh đạo cao nhất", weight:3, cat:"doc",         legal:"TT 25/2020/TT-BCT §6" },
  { id:"5.2.2", clause:"5.2", title:"Chính sách cam kết cải tiến liên tục hiệu quả NL",          weight:2, cat:"doc",         legal:"" },
  { id:"5.2.3", clause:"5.2", title:"Chính sách cam kết đáp ứng yêu cầu pháp lý",               weight:3, cat:"doc",         legal:"Luật 50/2010/QH12, Luật 77/2025/QH15" },
  { id:"5.2.4", clause:"5.2", title:"Chính sách được truyền đạt đến toàn bộ nhân viên", weight:3, cat:"practice",  legal:"" },
  { id:"5.2.5", clause:"5.2", title:"Chính sách được phổ biến cho các nhà thầu liên quan",       weight:2, cat:"practice",    legal:"" },
  { id:"5.3.1", clause:"5.3", title:"EMR (Energy Management Representative) được bổ nhiệm bằng văn bản", weight:3, cat:"doc",  legal:"TT 25/2020/TT-BCT §7; TT 38/2014" },
  { id:"5.3.2", clause:"5.3", title:"Nhóm quản lý năng lượng được thành lập",                    weight:2, cat:"doc",         legal:"TT 25/2020/TT-BCT §7" },
  { id:"5.3.3", clause:"5.3", title:"Vai trò, trách nhiệm được lập thành tài liệu",              weight:2, cat:"doc",         legal:"" },
  { id:"5.3.5", clause:"5.3", title:"Có vị trí Người quản lý năng lượng (EMR) theo quy định Luật 50/2010/QH12, Luật 77/2025/QH15 và TT 38/2014", weight:3, cat:"legal", legal:"Luật 50/2010/QH12, Luật 77/2025/QH15; TT 38/2014" },
  // ── §6 Hoạch định ────────────────────────────────────────
  { id:"6.1.1", clause:"6.1", title:"Rủi ro và cơ hội của EnMS được xác định",                   weight:2, cat:"doc",         legal:"" },
  { id:"6.1.2", clause:"6.1", title:"Kế hoạch hành động giải quyết rủi ro được lập",             weight:2, cat:"doc",         legal:"" },
  { id:"6.2.1", clause:"6.2", title:"Mục tiêu năng lượng được thiết lập (đo lường được, có thời hạn)", weight:3, cat:"doc",  legal:"TT 25/2020/TT-BCT §9; QĐ 280/QĐ-TTg" },
  { id:"6.2.2", clause:"6.2", title:"Kế hoạch hành động chi tiết để đạt mục tiêu",               weight:2, cat:"doc",         legal:"" },
  { id:"6.2.3", clause:"6.2", title:"Nguồn lực, người chịu TN và thời hạn được xác định",       weight:2, cat:"doc",         legal:"" },
  { id:"6.3.1", clause:"6.3", title:"Rà soát năng lượng dựa trên dữ liệu đo thực tế",           weight:3, cat:"measurement", legal:"TT 25/2020 §5; TT 25/2020/TT-BCT §8" },
  { id:"6.3.2", clause:"6.3", title:"SEU (Significant Energy Uses) được xác định và lập thành tài liệu", weight:3, cat:"doc", legal:"TT 25/2020/TT-BCT §8" },
  { id:"6.3.3", clause:"6.3", title:"Cơ hội cải tiến hiệu quả NL được xác định",                weight:2, cat:"practice",    legal:"" },
  { id:"6.3.4", clause:"6.3", title:"Biến tĩnh (static variables) ảnh hưởng đến NL được phân tích", weight:2, cat:"measurement", legal:"" },
  { id:"6.3.5", clause:"6.3", title:"Rà soát năng lượng được cập nhật định kỳ hoặc khi có thay đổi", weight:2, cat:"practice", legal:"" },
  { id:"6.3.8", clause:"6.3", title:"Xác định biến liên quan ảnh hưởng đến tiêu thụ NL (sản lượng, thời tiết, giờ vận hành…) và lập thành văn bản", weight:2, cat:"measurement", legal:"ISO 50006:2014" },
  { id:"6.3.9", clause:"6.3", title:"Thứ tự ưu tiên các cơ hội cải tiến hiệu quả NL được xác định (tiêu chí, phương pháp ưu tiên hóa)", weight:2, cat:"doc", legal:"TT 25/2020" },
  { id:"6.4.1", clause:"6.4", title:"EnPI được thiết lập phù hợp để theo dõi EnPI",              weight:3, cat:"measurement", legal:"TT 25/2020/TT-BCT §10" },
  { id:"6.4.2", clause:"6.4", title:"Phương pháp xác định EnPI được lập thành tài liệu",         weight:2, cat:"doc",         legal:"ISO 50006:2014" },
  { id:"6.4.3", clause:"6.4", title:"EnPI được so sánh với EnB và phân tích xu hướng",           weight:2, cat:"measurement", legal:"" },
  { id:"6.5.1", clause:"6.5", title:"EnB được thiết lập với thời kỳ cơ sở đại diện",             weight:3, cat:"measurement", legal:"TT 25/2020 §9" },
  { id:"6.5.2", clause:"6.5", title:"Phương pháp điều chỉnh EnB khi biến tĩnh thay đổi >10%",   weight:2, cat:"measurement", legal:"ISO 50006:2014 §6" },
  { id:"6.5.4", clause:"6.5", title:"Chuẩn hóa dữ liệu NL theo biến ảnh hưởng (sản lượng, thời tiết) để thiết lập và so sánh EnPI/EnB", weight:3, cat:"measurement", legal:"ISO 50006:2014" },
  { id:"6.6.1", clause:"6.6", title:"Kế hoạch thu thập dữ liệu NL được lập thành văn bản",       weight:2, cat:"measurement", legal:"TT 25/2020/TT-BCT §11" },
  { id:"6.6.2", clause:"6.6", title:"Người chịu TN và tần suất đo lường được xác định",          weight:2, cat:"measurement", legal:"" },
  { id:"6.6.3", clause:"6.6", title:"Thiết bị đo lường được hiệu chuẩn theo lịch định kỳ",       weight:3, cat:"measurement", legal:"TT 25/2020/TT-BCT §11" },
  { id:"6.6.4", clause:"6.6", title:"Độ không đảm bảo đo và hồ sơ hiệu chuẩn được quản lý",    weight:2, cat:"measurement", legal:"" },
  { id:"6.6.5", clause:"6.6", title:"Hiện trạng đồng hồ đo NL (số lượng, vị trí, phủ SEU/hộ tiêu thụ) được rà soát và lập văn bản", weight:3, cat:"measurement", legal:"TT 25/2020/TT-BCT" },
  { id:"6.6.6", clause:"6.6", title:"Kế hoạch kiểm định/hiệu chuẩn thiết bị đo (nội bộ hoặc bên ngoài), chu kỳ và đơn vị thực hiện", weight:3, cat:"measurement", legal:"TT 25/2020/TT-BCT" },
  // ── §7 Hỗ trợ ────────────────────────────────────────────
  { id:"7.1.1", clause:"7.1", title:"Nguồn lực cho EnMS được xác định và cung cấp",               weight:2, cat:"leadership",  legal:"Nghị định 30/2026" },
  { id:"7.1.2", clause:"7.1", title:"Cơ sở hạ tầng đo lường (đồng hồ, phần mềm) và công cụ quản lý NL", weight:2, cat:"doc", legal:"" },
  { id:"7.1.3", clause:"7.1", title:"Công cụ và thiết bị phục vụ kiểm tra, bảo trì bảo dưỡng (dụng cụ đo, phần mềm PM, phụ tùng cơ bản) được xác định và sẵn có", weight:2, cat:"practice", legal:"" },
  { id:"7.2.1", clause:"7.2", title:"Năng lực yêu cầu cho các vị trí ảnh hưởng EnPI được xác định", weight:2, cat:"doc",     legal:"TT 38/2014 §5" },
  { id:"7.2.2", clause:"7.2", title:"Kế hoạch đào tạo nhân viên liên quan đến EnMS",              weight:2, cat:"practice",    legal:"TT 38/2014 §6" },
  { id:"7.2.3", clause:"7.2", title:"Hồ sơ năng lực và đào tạo được lưu trữ",                    weight:1, cat:"doc",         legal:"TT 38/2014 §8" },
  { id:"7.3.1", clause:"7.3", title:"Nhân viên nhận thức được chính sách năng lượng",             weight:2, cat:"practice",    legal:"" },
  { id:"7.3.2", clause:"7.3", title:"Nhân viên hiểu đóng góp cá nhân đến tiêu thụ NL",           weight:2, cat:"practice",    legal:"" },
  { id:"7.4.1", clause:"7.4", title:"Quy trình trao đổi thông tin nội bộ về EnMS",                weight:1, cat:"practice",    legal:"TT 25/2020/TT-BCT §14" },
  { id:"7.5.1", clause:"7.5", title:"Tài liệu bắt buộc theo ISO 50001 đầy đủ và được kiểm soát", weight:3, cat:"doc",         legal:"TT 25/2020/TT-BCT §15" },
  { id:"7.5.2", clause:"7.5", title:"Hồ sơ được lưu trữ và bảo mật theo quy định",               weight:2, cat:"doc",         legal:"" },
  // ── §8 Vận hành ──────────────────────────────────────────
  { id:"8.1.1", clause:"8.1", title:"Tiêu chí vận hành cho các SEU được thiết lập",               weight:3, cat:"practice",    legal:"TT 25/2020/TT-BCT §16" },
  { id:"8.1.2", clause:"8.1", title:"Kiểm soát vận hành được thực hiện (SOP, check-list)",        weight:2, cat:"practice",    legal:"" },
  { id:"8.1.3", clause:"8.1", title:"Yêu cầu NL được truyền đạt cho nhà thầu",                   weight:2, cat:"practice",    legal:"" },
  { id:"8.1.4", clause:"8.1", title:"Kế hoạch bảo trì và xử lý tình huống bất thường tại SEU", weight:2, cat:"practice", legal:"TT 25/2020/TT-BCT" },
  { id:"8.1.5", clause:"8.1", title:"Checklist kiểm tra vận hành/định kỳ cho SEU và thiết bị tiêu thụ NL được lập và sử dụng", weight:2, cat:"practice", legal:"" },
  { id:"8.1.6", clause:"8.1", title:"SOP hoặc tiêu chuẩn công đoạn có xác định các yếu tố ảnh hưởng đến NL (nhiệt độ, áp suất, thời gian chạy, tải…)", weight:3, cat:"doc", legal:"TT 25/2020/TT-BCT" },
  { id:"8.1.7", clause:"8.1", title:"Kế hoạch bảo trì bảo dưỡng định kỳ (PM) cho thiết bị tiêu thụ NL được lập và thực hiện", weight:3, cat:"practice", legal:"" },
  { id:"8.1.8", clause:"8.1", title:"Tình trạng kho vật tư dự phòng (phụ tùng, vật tư thay thế) cho thiết bị NL được quản lý, tránh dừng máy kéo dài", weight:2, cat:"practice", legal:"" },
  { id:"8.2.1", clause:"8.2", title:"Hiệu quả NL được xem xét trong thiết kế/sửa đổi thiết bị",  weight:2, cat:"practice",    legal:"Luật 50/2010/QH12, Luật 77/2025/QH15" },
  { id:"8.3.1", clause:"8.3", title:"Tiêu chí NL trong đánh giá nhà cung cấp thiết bị",          weight:2, cat:"practice",    legal:"TT 36/2016 Nhãn NL" },
  { id:"8.3.2", clause:"8.3", title:"Ưu tiên thiết bị có nhãn năng lượng 4-5 sao hoặc MEPS",     weight:2, cat:"practice",    legal:"TT 36/2016; QĐ 1725/QĐ-BCT" },
  // ── §9 Đánh giá ──────────────────────────────────────────
  { id:"9.1.1", clause:"9.1", title:"Theo dõi EnPI định kỳ và ghi nhận kết quả",                  weight:3, cat:"measurement", legal:"TT 25/2020/TT-BCT §18; TT 25/2020" },
  { id:"9.1.2", clause:"9.1", title:"So sánh EnPI với EnB và phân tích xu hướng cải tiến",        weight:3, cat:"measurement", legal:"ISO 50006:2014" },
  { id:"9.1.3", clause:"9.1", title:"Báo cáo sử dụng NL hàng năm nộp cho cơ quan quản lý",       weight:3, cat:"legal",       legal:"TT 25/2020/TT-BCT; Nghị định 30/2026" },
  { id:"9.1.4", clause:"9.1", title:"Thiết bị đo lường được hiệu chuẩn và ghi nhận sai số",       weight:2, cat:"measurement", legal:"" },
  { id:"9.1.5", clause:"9.1", title:"Phân tích và đánh giá kết quả theo dõi EnPI, mục tiêu và tuân thủ pháp lý", weight:3, cat:"measurement", legal:"" },
  { id:"9.1.6", clause:"9.1", title:"Theo dõi thời hạn nộp báo cáo NL, chu kỳ kiểm toán NL (3 năm) — pháp lý VN", weight:3, cat:"legal", legal:"TT 25/2020/TT-BCT; Nghị định 30/2026" },
  { id:"9.1.7", clause:"9.1", title:"Hồ sơ kiểm định/hiệu chuẩn (nội bộ hoặc bên ngoài) được lưu trữ và theo dõi chu kỳ", weight:2, cat:"measurement", legal:"TT 25/2020/TT-BCT" },
  { id:"9.1.8", clause:"9.1", title:"Kiểm toán năng lượng định kỳ (chu kỳ 3 năm) được thực hiện và lưu hồ sơ — pháp lý VN", weight:3, cat:"legal", legal:"TT 25/2020; Nghị định 30/2026" },
  { id:"9.2.1", clause:"9.2", title:"Chương trình đánh giá nội bộ EnMS hàng năm",                 weight:2, cat:"practice",    legal:"ISO 50003:2014" },
  { id:"9.2.2", clause:"9.2", title:"Đánh giá viên nội bộ có năng lực và độc lập",                weight:2, cat:"practice",    legal:"" },
  { id:"9.2.3", clause:"9.2", title:"Kết quả đánh giá nội bộ được báo cáo cho lãnh đạo",         weight:2, cat:"practice",    legal:"" },
  { id:"9.3.1", clause:"9.3", title:"Xem xét lãnh đạo được thực hiện định kỳ (ít nhất 1 lần/năm)", weight:3, cat:"leadership",legal:"TT 25/2020/TT-BCT §20" },
  { id:"9.3.2", clause:"9.3", title:"Đầu ra xem xét lãnh đạo được lập thành hồ sơ",              weight:2, cat:"doc",         legal:"" },
  // ── §10 Cải tiến ─────────────────────────────────────────
  { id:"10.1.1",clause:"10.1",title:"Quy trình xử lý sự không phù hợp và hành động khắc phục",   weight:2, cat:"practice",    legal:"" },
  { id:"10.1.2",clause:"10.1",title:"Hồ sơ NC và CAR được lưu trữ đầy đủ",                       weight:2, cat:"doc",         legal:"" },
  { id:"10.2.1",clause:"10.2",title:"Cải tiến liên tục EnMS và hiệu quả NL được chứng minh",     weight:3, cat:"measurement", legal:"QĐ 280/QĐ-TTg VNEEP3" },
  { id:"10.2.2",clause:"10.2",title:"Xu hướng cải tiến EnPI được ghi nhận qua ít nhất 2 kỳ",     weight:2, cat:"measurement", legal:"ISO 50021:2019" },
];

// ═══════════════════════════════════════════════════════════
// RISK MATRIX CATEGORIES
// ═══════════════════════════════════════════════════════════
const RISK_CATEGORIES = [
  {
    id:"RISK-LEG", name:"Tuân thủ pháp lý & Quy định",
    desc:"Rủi ro không đáp ứng yêu cầu Luật 50/2010/QH12, Luật 77/2025/QH15, Nghị định 30/2026, TT 25/2020/TT-BCT, TT 25/2020 và các văn bản liên quan",
    color:"C0392B",
    items:[
      { id:"RL-01", risk:"Chưa xác định cơ sở thuộc diện trọng điểm (≥1000 TOE/năm)",               ref:"TT 25/2020/TT-BCT Điều 4",    likelihood:0, impact:0, control:"" },
      { id:"RL-02", risk:"Không nộp báo cáo NL hàng năm cho BCT",                                    ref:"TT 25/2020/TT-BCT Điều 18",   likelihood:0, impact:0, control:"" },
      { id:"RL-03", risk:"Không thực hiện kiểm toán NL theo chu kỳ 3 năm",                           ref:"TT 25/2020 Điều 5",    likelihood:0, impact:0, control:"" },
      { id:"RL-04", risk:"EMR chưa có chứng chỉ quản lý NL theo TT 38/2014",                         ref:"TT 38/2014 Điều 5",    likelihood:0, impact:0, control:"" },
      { id:"RL-05", risk:"Thiết bị không đáp ứng MEPS / chưa có nhãn NL",                            ref:"TT 36/2016; QĐ 1725/QĐ-BCT",  likelihood:0, impact:0, control:"" },
      { id:"RL-06", risk:"Không lập kế hoạch sử dụng NL và TKNL hàng năm",                          ref:"TT 25/2020/TT-BCT Điều 9",    likelihood:0, impact:0, control:"" },
      { id:"RL-07", risk:"Chưa đăng ký phát thải KNK theo NĐ 06/2022 (nếu ≥3000 tCO₂e)",           ref:"NĐ 06/2022 Điều 6",    likelihood:0, impact:0, control:"" },
    ],
  },
  {
    id:"RISK-OPS", name:"Rủi ro vận hành & Kỹ thuật",
    desc:"Rủi ro từ hoạt động vận hành, thiết bị và kiểm soát quá trình tiêu thụ NL",
    color:"D35400",
    items:[
      { id:"RO-01", risk:"SEU vận hành ngoài dải tối ưu gây tiêu hao NL cao",                        ref:"ISO 50001 §8.1",       likelihood:0, impact:0, control:"" },
      { id:"RO-02", risk:"Thiết bị lớn tuổi, hiệu suất thấp không được lên kế hoạch thay thế",      ref:"ISO 50001 §8.2",       likelihood:0, impact:0, control:"" },
      { id:"RO-03", risk:"Không kiểm soát rò rỉ hơi, khí nén, nước làm mát",                        ref:"ISO 50001 §8.1",       likelihood:0, impact:0, control:"" },
      { id:"RO-04", risk:"Vận hành thiết bị không tải gây lãng phí NL đáng kể",                     ref:"ISO 50001 §8.1",       likelihood:0, impact:0, control:"" },
      { id:"RO-05", risk:"Không có bảo trì dự phòng làm giảm hiệu suất thiết bị",                   ref:"ISO 50001 §8.1",       likelihood:0, impact:0, control:"" },
      { id:"RO-06", risk:"Thiếu hệ thống giám sát NL real-time (SCADA/EMS)",                         ref:"ISO 50001 §9.1",       likelihood:0, impact:0, control:"" },
    ],
  },
  {
    id:"RISK-DATA", name:"Rủi ro dữ liệu & Đo lường",
    desc:"Rủi ro về độ tin cậy và tính đầy đủ của dữ liệu năng lượng",
    color:"1A7A4A",
    items:[
      { id:"RD-01", risk:"Đồng hồ đo điện/nhiệt chưa hiệu chuẩn hoặc hư hỏng",                    ref:"ISO 50001 §6.6; §9.1", likelihood:0, impact:0, control:"" },
      { id:"RD-02", risk:"Dữ liệu NL chỉ ở cấp nhà máy, không phân vùng SEU",                      ref:"ISO 50001 §6.3; §6.6", likelihood:0, impact:0, control:"" },
      { id:"RD-03", risk:"EnPI chưa được hiệu chỉnh theo biến sản xuất và thời tiết",               ref:"ISO 50006:2014 §5",     likelihood:0, impact:0, control:"" },
      { id:"RD-04", risk:"Dữ liệu NL không đủ 12 tháng để xác lập EnB tin cậy",                    ref:"ISO 50001 §6.5",       likelihood:0, impact:0, control:"" },
      { id:"RD-05", risk:"Sai số tích lũy trong tính toán tiết kiệm NL không được quản lý",         ref:"ISO 50047:2016",        likelihood:0, impact:0, control:"" },
    ],
  },
  {
    id:"RISK-ORG", name:"Rủi ro tổ chức & Con người",
    desc:"Rủi ro từ năng lực, nhận thức và văn hóa tiết kiệm năng lượng",
    color:"6C3483",
    items:[
      { id:"ROG-01",risk:"Thiếu nhân sự chuyên trách quản lý NL (full-time EMR)",                   ref:"ISO 50001 §5.3",       likelihood:0, impact:0, control:"" },
      { id:"ROG-02",risk:"Nhân viên vận hành thiếu kiến thức về TKNL tại SEU",                      ref:"ISO 50001 §7.2; §7.3", likelihood:0, impact:0, control:"" },
      { id:"ROG-03",risk:"Không có cơ chế khuyến khích TKNL cho nhân viên",                         ref:"ISO 50001 §7.3",       likelihood:0, impact:0, control:"" },
      { id:"ROG-04",risk:"Thay đổi nhân sự chủ chốt EnMS làm gián đoạn hệ thống",                  ref:"ISO 50001 §5.3",       likelihood:0, impact:0, control:"" },
      { id:"ROG-05",risk:"Nhà thầu vào làm không được truyền đạt yêu cầu EnMS",                     ref:"ISO 50001 §8.1",       likelihood:0, impact:0, control:"" },
    ],
  },
  {
    id:"RISK-STRAT", name:"Rủi ro chiến lược & Tài chính",
    desc:"Rủi ro về đầu tư, chi phí năng lượng và mục tiêu dài hạn",
    color:"2471A3",
    items:[
      { id:"RS-01", risk:"Chi phí NL tăng đột biến ảnh hưởng nghiêm trọng lợi nhuận",              ref:"ISO 50001 §5.1",       likelihood:0, impact:0, control:"" },
      { id:"RS-02", risk:"Không có ngân sách cho dự án EIP ưu tiên",                                 ref:"ISO 50001 §5.1; §7.1", likelihood:0, impact:0, control:"" },
      { id:"RS-03", risk:"Áp lực CBAM/EU Green Deal ảnh hưởng xuất khẩu (tương lai)",              ref:"NĐ 06/2022; CBAM EU",  likelihood:0, impact:0, control:"" },
      { id:"RS-04", risk:"Mục tiêu TKNL VNEEP3 không đạt dẫn đến xử phạt",                         ref:"QĐ 280/QĐ-TTg", likelihood:0, impact:0, control:"" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// PROCESS MAP — ISO 50001 core processes
// ═══════════════════════════════════════════════════════════
const PROCESS_MAP = [
  {
    id:"PR-01", name:"Lập kế hoạch NL hàng năm",
    owner:"EMR + Ban lãnh đạo", freq:"Hàng năm",
    inputs:["Dữ liệu tiêu thụ NL năm trước","Kế hoạch sản xuất","Biến động giá NL"],
    outputs:["Kế hoạch TKNL hàng năm","Ngân sách EnMS","Mục tiêu EnPI"],
    std_ref:["ISO 50001 §6.2","TT 25/2020/TT-BCT §9","QĐ 280/QĐ-TTg"],
    gap_items:["6.1.1","6.2.1","6.2.2","6.2.3"],
    status:"pending", gap_score:0, notes:"",
  },
  {
    id:"PR-02", name:"Rà soát năng lượng (Energy Review)",
    owner:"EMR + Nhóm kỹ thuật", freq:"Hàng năm hoặc khi thay đổi đáng kể",
    inputs:["Hóa đơn điện/nhiệt liệu","Dữ liệu đo lường phân vùng","Dữ liệu sản xuất"],
    outputs:["Báo cáo rà soát NL","Danh sách SEU","Cơ hội cải tiến NL"],
    std_ref:["ISO 50001 §6.3","ISO 50002:2014","TT 25/2020"],
    gap_items:["6.3.1","6.3.2","6.3.3","6.3.4","6.3.5"],
    status:"pending", gap_score:0, notes:"",
  },
  {
    id:"PR-03", name:"Thiết lập và theo dõi EnPI / EnB",
    owner:"EMR", freq:"Hàng tháng (đo) / Hàng năm (cập nhật EnB)",
    inputs:["Dữ liệu đo lường tại SEU","Dữ liệu sản xuất (biến tĩnh)","EnB kỳ trước"],
    outputs:["Dashboard EnPI hàng tháng","Báo cáo xu hướng","Cảnh báo lệch EnB"],
    std_ref:["ISO 50001 §6.4","ISO 50001 §6.5","ISO 50006:2014"],
    gap_items:["6.4.1","6.4.2","6.4.3","6.5.1","6.5.2"],
    status:"pending", gap_score:0, notes:"",
  },
  {
    id:"PR-04", name:"Kiểm soát vận hành tại SEU",
    owner:"Ca trưởng vận hành", freq:"Liên tục / Hàng ca",
    inputs:["SOP vận hành SEU","Tiêu chí NL tối ưu","Check-list ca làm việc"],
    outputs:["Nhật ký vận hành","Báo cáo sự cố NL","Dữ liệu thực tế SEU"],
    std_ref:["ISO 50001 §8.1","ISO 50001 §6.6"],
    gap_items:["8.1.1","8.1.2","8.1.3","6.6.1","6.6.2","6.6.3"],
    status:"pending", gap_score:0, notes:"",
  },
  {
    id:"PR-05", name:"Mua sắm thiết bị & Dịch vụ NL",
    owner:"Phòng Mua hàng + Kỹ thuật", freq:"Theo nhu cầu",
    inputs:["Tiêu chí NL cho thiết bị","Danh sách MEPS / Nhãn NL","Thông số kỹ thuật"],
    outputs:["Hợp đồng mua sắm có tiêu chí NL","Thiết bị đáp ứng MEPS","Hồ sơ đánh giá nhà cung cấp"],
    std_ref:["ISO 50001 §8.3","TT 36/2016","QĐ 1725/QĐ-BCT"],
    gap_items:["8.3.1","8.3.2","8.2.1"],
    status:"pending", gap_score:0, notes:"",
  },
  {
    id:"PR-06", name:"Đào tạo và nâng cao nhận thức NL",
    owner:"Phòng Nhân sự + EMR", freq:"Hàng năm + khi có yêu cầu",
    inputs:["Kế hoạch đào tạo","Danh sách vị trí ảnh hưởng EnPI","Nội dung EnMS"],
    outputs:["Hồ sơ đào tạo","Kết quả kiểm tra năng lực","Nhân viên nhận thức EnMS"],
    std_ref:["ISO 50001 §7.2","ISO 50001 §7.3","TT 38/2014"],
    gap_items:["7.2.1","7.2.2","7.2.3","7.3.1","7.3.2"],
    status:"pending", gap_score:0, notes:"",
  },
  {
    id:"PR-07", name:"Đánh giá nội bộ EnMS",
    owner:"Đánh giá viên nội bộ (độc lập)", freq:"Ít nhất 1 lần/năm",
    inputs:["Chương trình đánh giá","Hồ sơ EnMS","EnPI trends","Checklist §4-§10"],
    outputs:["Báo cáo đánh giá nội bộ","Danh sách NC/OFI","CAR (Corrective Action Report)"],
    std_ref:["ISO 50001 §9.2","ISO 50003:2014"],
    gap_items:["9.2.1","9.2.2","9.2.3"],
    status:"pending", gap_score:0, notes:"",
  },
  {
    id:"PR-08", name:"Xem xét lãnh đạo (Management Review)",
    owner:"Lãnh đạo cao nhất", freq:"Ít nhất 1 lần/năm",
    inputs:["Kết quả đánh giá nội bộ","EnPI trends","Tuân thủ pháp lý","Khiếu nại/phản hồi"],
    outputs:["Biên bản xem xét lãnh đạo","Quyết định về nguồn lực","Mục tiêu NL kỳ mới"],
    std_ref:["ISO 50001 §9.3","TT 25/2020/TT-BCT §20"],
    gap_items:["9.3.1","9.3.2","5.1.2"],
    status:"pending", gap_score:0, notes:"",
  },
  {
    id:"PR-09", name:"Xử lý NC và hành động khắc phục",
    owner:"EMR + Bộ phận liên quan", freq:"Khi phát sinh NC",
    inputs:["Phát hiện NC từ đánh giá","Khiếu nại","Sự cố vận hành NL"],
    outputs:["CAR đã đóng","Hồ sơ NC","Cập nhật quy trình / tài liệu"],
    std_ref:["ISO 50001 §10.1"],
    gap_items:["10.1.1","10.1.2"],
    status:"pending", gap_score:0, notes:"",
  },
];

// ═══════════════════════════════════════════════════════════
// EQUIPMENT / ZONE TEMPLATES
// ═══════════════════════════════════════════════════════════
const EQUIPMENT_TYPES = [
  { id:"EQ-MOT", name:"Motor điện",        icon:"⚙️",  checks:["Công suất định mức vs thực tế","Hệ số tải (Load Factor)","Mức độ IE (IE1/IE2/IE3/IE4)","Biến tần (VFD) đã lắp chưa","Thời gian chạy không tải","Bảo trì định kỳ"], ref_std:"TT 36/2016; QĐ 1725/QĐ-BCT" },
  { id:"EQ-PMP", name:"Hệ thống bơm",     icon:"💧",  checks:["Hiệu suất bơm tổng thể","Rò rỉ đầu nối/van","VFD điều chỉnh lưu lượng","Áp lực vận hành vs thiết kế","Kết cấu đường ống (tổn thất áp)","Bảo trì cơ học định kỳ"], ref_std:"ISO 50001 §8.1" },
  { id:"EQ-CMP", name:"Máy nén khí",      icon:"🌪️", checks:["Rò rỉ đường ống khí nén","Áp lực vận hành (kPa)","Nhiệt độ đầu vào","Máy sấy khí hoạt động","Điều khiển tải/giảm tải","Thu hồi nhiệt máy nén"], ref_std:"ISO 50001 §8.1; §6.3" },
  { id:"EQ-FAN", name:"Hệ thống quạt",    icon:"🌀",  checks:["Hệ số tải quạt","VFD đã lắp","Tắc nghẽn bộ lọc","Cân bằng cánh quạt","Dây đai / hộp số tổn thất","Kiểm soát áp lực tự động"], ref_std:"ISO 50001 §8.1" },
  { id:"EQ-BOI", name:"Lò hơi / Lò nung", icon:"🔥",  checks:["Hiệu suất nhiệt (%)","Tỷ lệ không khí dư (O₂ khói lò)","Cách nhiệt thân lò / đường ống hơi","Tổn thất bức xạ","Hệ thống thu hồi nhiệt khói","Chất lượng nước lò"], ref_std:"TT 25/2020; ISO 50002" },
  { id:"EQ-AC",  name:"Điều hòa / Lạnh",  icon:"❄️",  checks:["EER/COP thực tế","Làm sạch dàn lạnh/nóng định kỳ","Nhiệt độ đặt phù hợp (≥26°C)","Cách nhiệt tòa nhà","Rò rỉ gas lạnh","Hệ thống điều khiển tập trung (BMS)"], ref_std:"TT 36/2016 Nhãn NL" },
  { id:"EQ-LGT", name:"Hệ thống chiếu sáng",icon:"💡",checks:["Chuyển đổi sang LED hoàn toàn chưa","Cảm biến tự động tắt/bật","Mức chiếu sáng (lux) vs tiêu chuẩn TCVN 7114","Điều chỉnh theo ánh sáng tự nhiên","Lịch vận hành chiếu sáng","Công suất W/m² theo khu vực"], ref_std:"QĐ 1725/QĐ-BCT; TCVN 7114" },
  { id:"EQ-TRF", name:"Máy biến áp",       icon:"⚡",  checks:["Hệ số tải máy biến áp (%)","Vận hành ngoài giờ cao điểm","Dầu cách điện còn tốt không","Tổn thất lõi thép","Hệ số công suất (cosφ) tại điểm đầu","Bù công suất phản kháng (tụ bù)"], ref_std:"ISO 50001 §6.3" },
  { id:"EQ-OTH", name:"Thiết bị khác",     icon:"🔧",  checks:["Tên thiết bị","Công suất lắp đặt (kW)","Hiệu suất hiện tại","Tuổi thọ và kế hoạch thay thế","Tiêu chí vận hành tiết kiệm NL","Nhãn năng lượng (nếu có)"], ref_std:"ISO 50001 §8" },
];

const ZONE_TYPES = [
  "Xưởng sản xuất chính (Production Hall)",
  "Khu vực lò nung / lò hơi (Kiln / Boiler Area)",
  "Khu vực máy nén khí (Compressed Air Station)",
  "Hệ thống làm lạnh / kho lạnh (Refrigeration)",
  "Khu vực chiếu sáng nhà xưởng",
  "Văn phòng / hành chính",
  "Kho nguyên liệu / thành phẩm",
  "Trạm bơm / xử lý nước",
  "Trạm biến áp / phòng điện",
  "Khu vực xử lý khí thải / môi trường",
  "Bãi đậu xe / chiếu sáng ngoài trời",
  "Khu vực khác",
];

// ═══════════════════════════════════════════════════════════
// GAP SCORE MATRIX
// ═══════════════════════════════════════════════════════════
const GAP_LEVELS = [
  { score:0, label:"Không áp dụng",  color:"718096", bg:"F7FAFC" },
  { score:1, label:"Chưa triển khai", color:"C0392B", bg:"FDEDEC" }, // CRITICAL GAP
  { score:2, label:"Mới bắt đầu",    color:"D35400", bg:"FEF9E7" }, // MAJOR GAP
  { score:3, label:"Đang phát triển",color:"B7770D", bg:"FEF3C7" }, // MINOR GAP
  { score:4, label:"Phần lớn đáp ứng",color:"1A7A4A",bg:"E9F7EF" }, // GOOD
  { score:5, label:"Hoàn toàn đáp ứng",color:"0D7377",bg:"E8F5F5" },// EXCELLENT
];

module.exports = { GAP_CHECKLIST, RISK_CATEGORIES, PROCESS_MAP, EQUIPMENT_TYPES, ZONE_TYPES, GAP_LEVELS };
