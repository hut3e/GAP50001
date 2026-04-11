/**
 * OnsiteAuditConstants — Data đầy đủ cho Onsite Audit GAP ISO 50001:2018
 * Bao gồm: GAP_CHECKLIST §4–§10, RISK_CATEGORIES, PROCESS_MAP, EQUIPMENT_TYPES
 */

// ── Design tokens (dark theme) ───────────────────────────────────
export const C = {
  bg0:"#020d17",bg1:"#031624",bg2:"#071e30",bg3:"#0c2840",
  t0:"#e8f4ff",t1:"#94b8d8",t2:"#4a7a9b",t3:"#1c3d57",
  bd:"rgba(46,95,163,.25)",
  blue:"#2E5FA3",blueL:"#4e8fd4",teal:"#0D7377",tealL:"#14b8a6",
  green:"#1A7A4A",greenL:"#22c55e",red:"#C0392B",redL:"#ef4444",
  orange:"#D35400",orangeL:"#f97316",amber:"#B7770D",amberL:"#f59e0b",
  violet:"#6C3483",sky:"#2471A3",skyL:"#38bdf8",
};

// ── Score config ──────────────────────────────────────────────────
export const SCORE_CFG = {
  0:{ label:"Không áp dụng",    short:"N/A",       col:"#718096" },
  1:{ label:"Chưa triển khai",  short:"Rất kém",   col:C.redL    },
  2:{ label:"Mới bắt đầu",      short:"Kém",       col:C.orangeL },
  3:{ label:"Đang phát triển",  short:"Trung bình",col:C.amberL  },
  4:{ label:"Phần lớn đáp ứng", short:"Tốt",       col:C.greenL  },
  5:{ label:"Hoàn toàn đáp ứng",short:"Xuất sắc",  col:C.tealL   },
};

// ── Category config ───────────────────────────────────────────────
export const CAT_CFG = {
  doc:         { icon:"📄", label:"Tài liệu",   col:C.blueL   },
  practice:    { icon:"⚙️", label:"Thực hành",  col:C.tealL   },
  measurement: { icon:"📊", label:"Đo lường",   col:C.skyL    },
  leadership:  { icon:"👥", label:"Lãnh đạo",   col:C.violet  },
  legal:       { icon:"⚖️", label:"Pháp lý VN", col:C.redL    },
};

// ── Full GAP_CHECKLIST §4–§10 (49 items) ─────────────────────────
export const GAP_CHECKLIST = [
  // §4 — Bối cảnh tổ chức
  { id:"4.1.1",clause:"4.1",title:"Xác định vấn đề bên trong ảnh hưởng đến EnMS",weight:2,cat:"doc",        legal:"Luật 50/2010 §5",
    auditQuestions:["Tổ chức đã xác định các yếu tố nội bộ nào tác động đến EnMS?","Kết quả xác định được lập thành văn bản không?","Khi nào được cập nhật lần cuối?"] },
  { id:"4.1.2",clause:"4.1",title:"Xác định vấn đề bên ngoài ảnh hưởng đến EnMS",weight:2,cat:"doc",        legal:"",
    auditQuestions:["Các yếu tố bên ngoài (thị trường, pháp luật, công nghệ) đã được phân tích chưa?","Tài liệu phân tích PESTLE/SWOT có không?"] },
  { id:"4.1.3",clause:"4.1",title:"Xem xét định kỳ bối cảnh tại xem xét lãnh đạo",weight:1,cat:"practice",  legal:"",
    auditQuestions:["Biên bản xem xét lãnh đạo gần nhất có đề cập đến bối cảnh không?","Tần suất cập nhật bối cảnh là bao nhiêu?"] },
  { id:"4.2.1",clause:"4.2",title:"Xác định danh sách các bên liên quan đến EnMS",weight:2,cat:"doc",        legal:"TT 09/2012 §4",
    auditQuestions:["Có tài liệu danh sách bên liên quan không?","Yêu cầu của từng bên liên quan được xác định ra sao?"] },
  { id:"4.2.2",clause:"4.2",title:"Xác định yêu cầu pháp lý áp dụng và cam kết khác",weight:3,cat:"legal",  legal:"Luật 50/2010; NĐ 21/2011",
    auditQuestions:["Đăng ký yêu cầu pháp lý có đầy đủ: Luật 50/2010, NĐ 21/2011, TT 09/2012, TT 25/2020?","Cơ sở có thuộc diện trọng điểm không?","Đã nộp báo cáo NL cho BCT chưa?"] },
  { id:"4.2.3",clause:"4.2",title:"Cập nhật đăng ký yêu cầu pháp lý định kỳ",weight:2,cat:"practice",      legal:"",
    auditQuestions:["Đăng ký pháp lý được cập nhật bao lâu một lần?","Ai chịu trách nhiệm theo dõi thay đổi pháp lý?"] },
  { id:"4.3.1",clause:"4.3",title:"Phạm vi EnMS được lập thành văn bản rõ ràng",weight:3,cat:"doc",         legal:"TT 09/2012 §5",
    auditQuestions:["Tài liệu phạm vi EnMS có chỉ rõ ranh giới vật lý và hoạt động?","Phạm vi có bao gồm tất cả SEU chính không?"] },
  { id:"4.3.2",clause:"4.3",title:"Ranh giới vật lý và địa lý được xác định",weight:2,cat:"doc",            legal:"",
    auditQuestions:["Sơ đồ mặt bằng nhà máy/cơ sở có xác định rõ ranh giới EnMS không?"] },
  { id:"4.4.1",clause:"4.4",title:"EnMS được thiết lập theo yêu cầu ISO 50001:2018",weight:3,cat:"practice", legal:"TT 09/2012 §6",
    auditQuestions:["Cấu trúc EnMS tổng thể có theo ISO 50001:2018?","Các tài liệu cốt lõi đã đủ chưa?"] },
  // §5 — Lãnh đạo
  { id:"5.1.1",clause:"5.1",title:"Lãnh đạo cao nhất cam kết bằng văn bản với EnMS",weight:3,cat:"leadership",legal:"TT 09/2012 §6",
    auditQuestions:["Có Quyết định ban hành chính sách năng lượng không?","Văn bản cam kết có chữ ký người đứng đầu không?","Cam kết có đề cập nguồn lực tài chính không?"] },
  { id:"5.1.2",clause:"5.1",title:"Ngân sách/nguồn lực tài chính cho EnMS được phê duyệt",weight:3,cat:"leadership",legal:"NĐ 21/2011 §14",
    auditQuestions:["Ngân sách tiết kiệm năng lượng năm hiện tại là bao nhiêu?","Dự án EIP nào đang được tài trợ?"] },
  { id:"5.1.3",clause:"5.1",title:"Lãnh đạo thúc đẩy cải tiến liên tục hiệu quả NL",weight:2,cat:"leadership",legal:"",
    auditQuestions:["Lãnh đạo có đặt mục tiêu TKNL trong KPI công ty không?","Có khen thưởng sáng kiến TKNL không?"] },
  { id:"5.2.1",clause:"5.2",title:"Chính sách NL được ban hành bởi lãnh đạo cao nhất",weight:3,cat:"doc",    legal:"TT 09/2012 §6",
    auditQuestions:["Chính sách NL có được phê duyệt và ký bởi TGĐ/GĐ không?","Phiên bản hiện hành là gì?","Có tích hợp cam kết pháp lý không?"] },
  { id:"5.2.2",clause:"5.2",title:"Chính sách cam kết đáp ứng yêu cầu pháp lý",weight:3,cat:"doc",          legal:"Luật 50/2010",
    auditQuestions:["Chính sách có nhắc đến Luật 50/2010 và các Thông tư liên quan không?"] },
  { id:"5.2.3",clause:"5.2",title:"Chính sách truyền đạt đến toàn bộ nhân viên (ca đêm)",weight:3,cat:"practice",legal:"",
    auditQuestions:["Cách thức truyền thông chính sách là gì (bảng, email, họp)?","Nhân viên ca đêm/thời vụ có biết chính sách không?","Minh chứng truyền thông là gì?"] },
  { id:"5.3.1",clause:"5.3",title:"EMR được bổ nhiệm bằng văn bản có thẩm quyền",weight:3,cat:"doc",         legal:"TT 38/2014 §5",
    auditQuestions:["Quyết định bổ nhiệm EMR có không? Ngày bổ nhiệm?","EMR có chứng chỉ quản lý năng lượng theo TT 38/2014 không?","Chức năng, quyền hạn EMR có được mô tả rõ không?"] },
  { id:"5.3.2",clause:"5.3",title:"Nhóm quản lý NL được thành lập",weight:2,cat:"doc",                       legal:"TT 09/2012 §7",
    auditQuestions:["Quyết định thành lập Ban QLNL/nhóm TKNL có không?","Các thành viên đến từ bộ phận nào?","Tần suất họp nhóm là bao nhiêu?"] },
  // §6 — Lập kế hoạch
  { id:"6.1.1",clause:"6.1",title:"Rủi ro và cơ hội của EnMS được xác định",weight:2,cat:"doc",               legal:"",
    auditQuestions:["Bảng đánh giá rủi ro/cơ hội EnMS có không?","Phương pháp đánh giá rủi ro là gì?","Tần suất cập nhật?"] },
  { id:"6.2.1",clause:"6.2",title:"Mục tiêu NL đo lường được, có thời hạn",weight:3,cat:"doc",               legal:"TT 09/2012 §9",
    auditQuestions:["Mục tiêu TKNL năm hiện tại là %? Đơn vị đo?","Có KPI cho từng khu vực/SEU không?","Tiến độ đạt mục tiêu hiện tại?"] },
  { id:"6.2.2",clause:"6.2",title:"Kế hoạch hành động chi tiết để đạt mục tiêu",weight:2,cat:"doc",           legal:"",
    auditQuestions:["Kế hoạch hành động có SMART không?","Ai chịu trách nhiệm từng hành động?","Nguồn lực phân bổ?"] },
  { id:"6.3.1",clause:"6.3",title:"Rà soát năng lượng dựa trên dữ liệu đo thực tế",weight:3,cat:"measurement",legal:"TT 25/2020 §5",
    auditQuestions:["Dữ liệu tiêu thụ NL thu thập từ đâu? Tần suất?","Energy Review có phân tích xu hướng không?","Báo cáo kiểm toán NL gần nhất?"] },
  { id:"6.3.2",clause:"6.3",title:"SEU được xác định và lập thành tài liệu",weight:3,cat:"doc",               legal:"TT 09/2012 §8",
    auditQuestions:["Danh sách SEU là gì? Tiêu chí xác định SEU?","Tổng tiêu thụ SEU chiếm bao nhiêu % tổng?","Ai kiểm soát từng SEU?"] },
  { id:"6.3.3",clause:"6.3",title:"Cơ hội cải tiến hiệu quả NL được xác định",weight:2,cat:"practice",       legal:"",
    auditQuestions:["Danh sách EIP (Energy Improvement Projects) hiện tại?","Tiêu chí ưu tiên EIP là gì?","ROI của dự án ưu tiên nhất?"] },
  { id:"6.3.4",clause:"6.3",title:"Biến tĩnh (static variables) được phân tích",weight:2,cat:"measurement",  legal:"",
    auditQuestions:["Biến tĩnh nào ảnh hưởng đến tiêu thụ NL?","Sản lượng sản xuất, thời tiết, ca sản xuất có được kiểm soát không?"] },
  { id:"6.4.1",clause:"6.4",title:"EnPI được thiết lập phù hợp",weight:3,cat:"measurement",                  legal:"ISO 50006:2014",
    auditQuestions:["EnPI là gì? (kWh/sản phẩm, kWh/m², TOE/doanh thu…)","EnPI được tính toán và báo cáo bao lâu một lần?","Ai phê duyệt EnPI?"] },
  { id:"6.4.2",clause:"6.4",title:"Phương pháp phân tích EnPI so với EnB và xu hướng",weight:2,cat:"measurement",     legal:"",
    auditQuestions:[
      "Phương pháp được sử dụng để so sánh EnPI với EnB là gì (mô hình thống kê, hồi quy, biểu đồ xu hướng…)?",
      "Tiêu chí nào được sử dụng để kết luận xu hướng EnPI là chấp nhận được hay không?",
      "Phương pháp có quy định cách điều chỉnh theo các biến tĩnh (sản lượng, thời tiết…) không?"
    ] },
  { id:"6.5.1",clause:"6.5",title:"EnB được thiết lập với thời kỳ cơ sở đại diện",weight:3,cat:"measurement",legal:"TT 25/2020 §9",
    auditQuestions:["EnB dựa trên dữ liệu bao nhiêu tháng?","Có đủ 12 tháng dữ liệu không?","EnB được phê duyệt bởi ai?"] },
  { id:"6.5.2",clause:"6.5",title:"Phương pháp điều chỉnh EnB khi biến tĩnh thay đổi",weight:2,cat:"measurement",legal:"ISO 50006:2014",
    auditQuestions:["Nếu quy mô sản xuất thay đổi >10%, EnB có được điều chỉnh không?","Phương pháp điều chỉnh được mô tả không?"] },
  { id:"6.6.1",clause:"6.6",title:"Kế hoạch thu thập dữ liệu NL được lập thành văn bản",weight:2,cat:"measurement",legal:"",
    auditQuestions:["Kế hoạch đo lường (MEP) có không?","Tần suất ghi số đồng hồ tại SEU?","Ai chịu trách nhiệm thu thập dữ liệu?"] },
  { id:"6.6.2",clause:"6.6",title:"Thiết bị đo lường được hiệu chuẩn định kỳ",weight:3,cat:"measurement",   legal:"TT 09/2012 §11",
    auditQuestions:["Danh sách đồng hồ điện/nhiệt/lưu lượng có không?","Chu kỳ hiệu chuẩn là bao nhiêu năm?","Giấy chứng nhận hiệu chuẩn gần nhất?"] },
  // §7 — Hỗ trợ
  { id:"7.1.1",clause:"7.1",title:"Nguồn lực cho EnMS được xác định và cung cấp",weight:2,cat:"leadership",  legal:"NĐ 21/2011 §17",
    auditQuestions:["Nhân sự EnMS team gồm bao nhiêu người?","Ngân sách TKNL năm hiện tại?","Thiết bị và phần mềm QLNL được cung cấp?"] },
  { id:"7.2.1",clause:"7.2",title:"Năng lực yêu cầu cho vị trí ảnh hưởng EnPI",weight:2,cat:"doc",          legal:"TT 38/2014 §5",
    auditQuestions:["Mô tả công việc các vị trí ảnh hưởng SEU có yêu cầu năng lực NL không?","EMR có đủ năng lực kỹ thuật và quản lý không?"] },
  { id:"7.2.2",clause:"7.2",title:"Kế hoạch đào tạo nhân viên liên quan EnMS",weight:2,cat:"practice",      legal:"TT 38/2014 §6",
    auditQuestions:["Kế hoạch đào tạo TKNL năm hiện tại?","Bao nhiêu nhân viên được đào tạo?","Hồ sơ đào tạo được lưu trữ ở đâu?"] },
  { id:"7.3.1",clause:"7.3",title:"Nhân viên nhận thức được chính sách NL",weight:2,cat:"practice",          legal:"",
    auditQuestions:["Phương pháp kiểm tra nhận thức nhân viên?","Kết quả khảo sát nhận thức gần nhất?","Nhân viên mới có được đào tạo induction về NL không?"] },
  { id:"7.5.1",clause:"7.5",title:"Tài liệu bắt buộc ISO 50001 đầy đủ và được kiểm soát",weight:3,cat:"doc",legal:"TT 09/2012 §15",
    auditQuestions:["Danh mục tài liệu EnMS đầy đủ chưa? (Chính sách, EnPI, EnB, SEU, mục tiêu, kế hoạch…)","Tài liệu được kiểm soát phiên bản không?","Thủ tục kiểm soát tài liệu có không?"] },
  // §8 — Vận hành
  { id:"8.1.1",clause:"8.1",title:"Tiêu chí vận hành cho SEU được thiết lập",weight:3,cat:"practice",       legal:"TT 09/2012 §16",
    auditQuestions:["SOP/tiêu chí vận hành tại từng SEU có không?","Các thông số tối ưu được xác định (tải, nhiệt độ, tốc độ…)?","Ca trưởng có biết tiêu chí vận hành không?"] },
  { id:"8.1.2",clause:"8.1",title:"Kiểm soát vận hành tại SEU (SOP, check-list)",weight:2,cat:"practice",   legal:"",
    auditQuestions:["Checklist vận hành ca có được sử dụng không?","Ghi chép vận hành SEU có đầy đủ không?","Sai lệch vận hành có được báo cáo không?"] },
  { id:"8.2.1",clause:"8.2",title:"Hiệu quả NL xem xét trong thiết kế/sửa đổi thiết bị",weight:2,cat:"practice",legal:"Luật 50/2010 §26",
    auditQuestions:["Quy trình mua sắm thiết bị có tiêu chí hiệu quả NL không?","Dự án lắp đặt mới gần nhất có tính toán hiệu quả NL không?"] },
  { id:"8.3.1",clause:"8.3",title:"Tiêu chí NL trong đánh giá nhà cung cấp thiết bị",weight:2,cat:"practice",legal:"TT 36/2016",
    auditQuestions:["Tiêu chí mua sắm thiết bị có yêu cầu nhãn NL/MEPS không?","Nhà cung cấp thiết bị có cung cấp thông tin hiệu suất NL không?"] },
  { id:"8.3.2",clause:"8.3",title:"Ưu tiên thiết bị nhãn NL 4–5 sao / MEPS",weight:2,cat:"practice",       legal:"TT 36/2016; QĐ 1725/QĐ-BCT",
    auditQuestions:["Thiết bị mua mới có đủ tiêu chuẩn nhãn NL theo quy định không?","Hợp đồng mua sắm có điều khoản hiệu suất NL không?"] },
  // §9 — Đánh giá kết quả
  { id:"9.1.1",clause:"9.1",title:"Theo dõi EnPI định kỳ và ghi nhận kết quả",weight:3,cat:"measurement",   legal:"TT 09/2012 §18",
    auditQuestions:["Báo cáo EnPI hàng tháng có không?","Số liệu EnPI 12 tháng gần nhất?","Sai lệch >5% có được điều tra không?"] },
  { id:"9.1.2",clause:"9.1",title:"Kết quả thực tế EnPI so với EnB và xu hướng cải thiện",weight:3,cat:"measurement",   legal:"ISO 50006:2014",
    auditQuestions:[
      "Biểu đồ EnPI vs EnB 12 tháng/năm gần nhất cho thấy xu hướng như thế nào (cải thiện, xấu đi, dao động)?",
      "Mức tiết kiệm năng lượng thực tế so với EnB là bao nhiêu (kWh, TOE, %)?",
      "Có trường hợp nào EnPI xấu đi đáng kể? Nguyên nhân chính và hành động khắc phục là gì?"
    ] },
  { id:"9.1.3",clause:"9.1",title:"Báo cáo sử dụng NL hàng năm nộp cho BCT",weight:3,cat:"legal",          legal:"TT 09/2012 §18",
    auditQuestions:["Báo cáo NL năm hiện tại đã nộp chưa?","Hạn nộp 31/3 có tuân thủ không?","Dữ liệu báo cáo có nhất quán với số liệu nội bộ không?"] },
  { id:"9.2.1",clause:"9.2",title:"Chương trình đánh giá nội bộ EnMS hàng năm",weight:2,cat:"practice",     legal:"ISO 50003:2014",
    auditQuestions:["Lịch đánh giá nội bộ năm hiện tại có không?","Kết quả đánh giá nội bộ gần nhất? Phát hiện chính?","Đánh giá viên nội bộ có đủ năng lực không?"] },
  { id:"9.3.1",clause:"9.3",title:"Xem xét lãnh đạo ít nhất 1 lần/năm",weight:3,cat:"leadership",          legal:"TT 09/2012 §20",
    auditQuestions:["Biên bản xem xét lãnh đạo năm hiện tại có không?","Ngày họp xem xét lãnh đạo gần nhất?","Các quyết định từ xem xét lãnh đạo được theo dõi thực hiện không?"] },
  // §10 — Cải tiến
  { id:"10.1.1",clause:"10.1",title:"Quy trình xử lý sự không phù hợp và CAR",weight:2,cat:"practice",     legal:"",
    auditQuestions:["Số NC phát sinh trong 12 tháng qua?","Thời gian xử lý CAR trung bình?","CAR có được xác minh hiệu quả không?"] },
  { id:"10.2.1",clause:"10.2",title:"Cải tiến liên tục EnMS được chứng minh",weight:3,cat:"measurement",    legal:"QĐ 280/QĐ-TTg",
    auditQuestions:["EnPI có xu hướng cải thiện qua 2+ năm không?","Số lượng dự án cải tiến hoàn thành?","Tiết kiệm NL tích lũy %?"] },
  { id:"10.2.2",clause:"10.2",title:"Xu hướng cải tiến EnPI qua ít nhất 2 kỳ",weight:2,cat:"measurement",  legal:"ISO 50021:2019",
    auditQuestions:["Biểu đồ EnPI 2 năm gần nhất?","Phương pháp đánh giá tiết kiệm (ISO 50021)?"] },
];

// ── Risk categories ───────────────────────────────────────────────
export const RISK_CATEGORIES = [
  { id:"RISK-LEG", name:"Pháp lý & Quy định", col:"#C0392B",
    items:[
      { id:"RL-01",risk:"Chưa xác định cơ sở thuộc diện trọng điểm",ref:"TT 09/2012 §4",
        questions:["Cơ sở có thuộc diện trọng điểm không (≥1000 TOE/năm)?","Đã đăng ký với BCT chưa?"] },
      { id:"RL-02",risk:"Không nộp báo cáo NL hàng năm cho BCT",ref:"TT 09/2012 §18",
        questions:["Báo cáo năm gần nhất đã nộp chưa?","Có bằng chứng nộp báo cáo không?"] },
      { id:"RL-03",risk:"Không thực hiện kiểm toán NL theo chu kỳ 3 năm",ref:"TT 25/2020 §5",
        questions:["Kiểm toán NL gần nhất được thực hiện năm nào?","Đơn vị kiểm toán là ai?"] },
      { id:"RL-04",risk:"EMR chưa có chứng chỉ quản lý NL",ref:"TT 38/2014 §5",
        questions:["EMR có chứng chỉ quản lý NL hợp lệ không?","Chứng chỉ còn hiệu lực không?"] },
      { id:"RL-05",risk:"Thiết bị không đáp ứng MEPS hoặc chưa có nhãn NL",ref:"TT 36/2016; QĐ 1725/QĐ-BCT",
        questions:["Thiết bị mới mua có nhãn NL không?","Thiết bị cũ có kế hoạch thay thế không?"] },
      { id:"RL-06",risk:"Không lập kế hoạch sử dụng NL hàng năm",ref:"TT 09/2012 §9",
        questions:["Kế hoạch SDNL năm hiện tại có không?","Kế hoạch được cấp thẩm quyền phê duyệt không?"] },
    ]},
  { id:"RISK-OPS", name:"Vận hành & Kỹ thuật", col:"#D35400",
    items:[
      { id:"RO-01",risk:"SEU vận hành ngoài dải tối ưu",ref:"ISO 50001 §8.1",
        questions:["Thông số vận hành SEU hiện tại?","Tiêu chí vận hành tối ưu có được xác định không?"] },
      { id:"RO-02",risk:"Thiết bị lớn tuổi hiệu suất thấp chưa lên kế hoạch thay thế",ref:"ISO 50001 §8.2",
        questions:["Tuổi thọ thiết bị SEU chính?","Kế hoạch thay thế thiết bị hết hạn sử dụng?"] },
      { id:"RO-03",risk:"Không kiểm soát rò rỉ hơi/khí nén/nước làm mát",ref:"ISO 50001 §8.1",
        questions:["Chương trình kiểm soát rò rỉ có không?","Tần suất kiểm tra rò rỉ?","Kết quả đo rò rỉ gần nhất?"] },
      { id:"RO-04",risk:"Vận hành thiết bị không tải gây lãng phí NL",ref:"ISO 50001 §8.1",
        questions:["Có quy định tắt thiết bị khi không tải không?","Thời gian không tải trung bình?"] },
      { id:"RO-05",risk:"Thiếu hệ thống giám sát NL real-time",ref:"ISO 50001 §9.1",
        questions:["Hệ thống SCADA/BMS/giám sát NL có không?","Dữ liệu NL được cập nhật thời gian thực không?"] },
    ]},
  { id:"RISK-DATA", name:"Dữ liệu & Đo lường", col:"#1A7A4A",
    items:[
      { id:"RD-01",risk:"Đồng hồ đo điện/nhiệt chưa hiệu chuẩn hoặc hư hỏng",ref:"ISO 50001 §6.6",
        questions:["Danh mục thiết bị đo có không?","Giấy hiệu chuẩn còn hiệu lực không?"] },
      { id:"RD-02",risk:"Dữ liệu NL chỉ cấp nhà máy, không phân vùng SEU",ref:"ISO 50001 §6.3",
        questions:["Có đồng hồ đo phụ tại SEU không?","Độ chính xác phân bổ dữ liệu NL theo khu vực?"] },
      { id:"RD-03",risk:"EnPI chưa hiệu chỉnh theo biến sản xuất và thời tiết",ref:"ISO 50006:2014 §5",
        questions:["EnPI có được normalize theo sản lượng không?","Yếu tố thời tiết có được xem xét không?"] },
      { id:"RD-04",risk:"Dữ liệu NL không đủ 12 tháng để xác lập EnB",ref:"ISO 50001 §6.5",
        questions:["Dữ liệu NL lịch sử có đủ không?","Chất lượng dữ liệu có được đánh giá không?"] },
    ]},
  { id:"RISK-ORG", name:"Tổ chức & Con người", col:"#6C3483",
    items:[
      { id:"ROG-01",risk:"Thiếu nhân sự chuyên trách quản lý NL",ref:"ISO 50001 §5.3",
        questions:["EMR có làm toàn thời gian hay kiêm nhiệm?","Nhóm QLNL gồm bao nhiêu người?"] },
      { id:"ROG-02",risk:"Nhân viên thiếu kiến thức TKNL tại SEU",ref:"ISO 50001 §7.2",
        questions:["Đào tạo TKNL gần nhất được thực hiện khi nào?","Bao nhiêu % nhân viên SEU được đào tạo?"] },
      { id:"ROG-03",risk:"Không có cơ chế khuyến khích TKNL",ref:"ISO 50001 §7.3",
        questions:["Có chương trình khen thưởng sáng kiến TKNL không?","Chỉ tiêu TKNL có trong KPI cá nhân không?"] },
      { id:"ROG-04",risk:"Nhà thầu không được truyền đạt yêu cầu EnMS",ref:"ISO 50001 §8.1",
        questions:["Hợp đồng nhà thầu có điều khoản NL không?","Nhà thầu có được phổ biến tiêu chí vận hành không?"] },
    ]},
  { id:"RISK-STRAT", name:"Chiến lược & Tài chính", col:"#2471A3",
    items:[
      { id:"RS-01",risk:"Chi phí NL tăng đột biến ảnh hưởng lợi nhuận",ref:"ISO 50001 §5.1",
        questions:["Tỷ lệ chi phí NL/doanh thu là bao nhiêu %?","Kịch bản ứng phó khi giá điện tăng?"] },
      { id:"RS-02",risk:"Không có ngân sách cho EIP ưu tiên",ref:"ISO 50001 §7.1",
        questions:["Ngân sách EIP năm nay là bao nhiêu?","Danh sách EIP được phê duyệt?"] },
      { id:"RS-03",risk:"Áp lực CBAM/EU Green Deal ảnh hưởng xuất khẩu",ref:"NĐ 06/2022",
        questions:["Doanh nghiệp có xuất khẩu sang EU không?","Đã chuẩn bị Carbon Footprint chưa?"] },
      { id:"RS-04",risk:"Mục tiêu TKNL VNEEP3 không đạt",ref:"QĐ 280/QĐ-TTg",
        questions:["Mục tiêu VNEEP3 của doanh nghiệp là bao nhiêu %?","Tiến độ đạt mục tiêu hiện tại?"] },
    ]},
];

// ── Process map ───────────────────────────────────────────────────
export const PROCESS_MAP = [
  { id:"PR-01",name:"Lập kế hoạch NL hàng năm",      owner:"EMR + Ban lãnh đạo",       freq:"Hàng năm",
    questions:["Có quy trình lập kế hoạch NL không?","Kế hoạch NL năm hiện tại được phê duyệt bởi ai, ngày bao giờ?","Mục tiêu tiết kiệm NL năm nay là bao nhiêu?"],
    docRequired:["Kế hoạch sử dụng NL","Biên bản phê duyệt"], clause:"6.2" },
  { id:"PR-02",name:"Rà soát năng lượng (Energy Review)",owner:"EMR + Nhóm kỹ thuật",  freq:"Hàng năm/khi thay đổi",
    questions:["Rà soát NL gần nhất được thực hiện khi nào?","Phương pháp rà soát NL?","Kết quả rà soát: SEU nào được nhận dạng?"],
    docRequired:["Báo cáo rà soát NL","Danh sách SEU","Phân tích xu hướng NL"], clause:"6.3" },
  { id:"PR-03",name:"Thiết lập và theo dõi EnPI / EnB", owner:"EMR",                    freq:"Hàng tháng",
    questions:["Báo cáo EnPI tháng gần nhất?","Sai lệch EnPI vs EnB là bao nhiêu %?","Điều chỉnh EnB khi nào?"],
    docRequired:["Bảng tính EnPI/EnB","Biểu đồ xu hướng","Phê duyệt EnB"], clause:"6.4,6.5" },
  { id:"PR-04",name:"Kiểm soát vận hành tại SEU",       owner:"Ca trưởng vận hành",     freq:"Hàng ca",
    questions:["SOP vận hành SEU có không?","Ghi chép nhật ký vận hành ca?","Ai giám sát tuân thủ SOP?"],
    docRequired:["SOP tại SEU","Nhật ký vận hành","Checklist ca"], clause:"8.1" },
  { id:"PR-05",name:"Mua sắm thiết bị & Dịch vụ NL",   owner:"Mua hàng + Kỹ thuật",   freq:"Theo nhu cầu",
    questions:["Tiêu chí NL trong đặc tính kỹ thuật thiết bị?","Gần nhất mua thiết bị gì? Nhãn NL cấp nào?"],
    docRequired:["Tiêu chí kỹ thuật mua sắm","Hợp đồng thiết bị","Thông số hiệu suất"], clause:"8.2,8.3" },
  { id:"PR-06",name:"Đào tạo và nâng cao nhận thức NL", owner:"Nhân sự + EMR",          freq:"Hàng năm",
    questions:["Kế hoạch đào tạo NL năm nay?","Số người được đào tạo?","Đánh giá hiệu quả đào tạo?"],
    docRequired:["Kế hoạch đào tạo","Danh sách tham dự","Hồ sơ đào tạo"], clause:"7.2,7.3" },
  { id:"PR-07",name:"Đánh giá nội bộ EnMS",             owner:"Đánh giá viên nội bộ",   freq:"≥1 lần/năm",
    questions:["Lịch đánh giá nội bộ năm nay?","Kết quả đánh giá nội bộ gần nhất?","NC nào được phát hiện?"],
    docRequired:["Lịch đánh giá","Chương trình đánh giá","Báo cáo đánh giá nội bộ"], clause:"9.2" },
  { id:"PR-08",name:"Xem xét lãnh đạo (Management Review)",owner:"Lãnh đạo cao nhất",  freq:"≥1 lần/năm",
    questions:["Biên bản xem xét lãnh đạo gần nhất?","Các quyết định từ xem xét lãnh đạo?","Tháng nào thực hiện?"],
    docRequired:["Chương trình họp","Biên bản xem xét lãnh đạo","Quyết định cải tiến"], clause:"9.3" },
  { id:"PR-09",name:"Xử lý NC và hành động khắc phục",  owner:"EMR + Bộ phận liên quan",freq:"Khi phát sinh",
    questions:["Quy trình xử lý NC có không?","Số NC phát sinh/đóng trong 12 tháng?","Thời gian xử lý trung bình?"],
    docRequired:["Quy trình NC/CAR","Sổ theo dõi NC","Biên bản xác nhận đóng NC"], clause:"10.1" },
];

// ── Equipment config ──────────────────────────────────────────────
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

export const EQUIPMENT_STATUS = [
  { v:"good",    label:"Tốt — Đạt hiệu suất thiết kế",   col:"#22c55e" },
  { v:"warning", label:"Trung bình — Cần theo dõi",       col:"#f59e0b" },
  { v:"critical",label:"Kém — Cần cải thiện/thay thế",    col:"#ef4444" },
  { v:"unknown", label:"Chưa đánh giá",                   col:"#718096" },
];

export const ZONE_TYPES = [
  "Xưởng sản xuất chính","Khu vực lò nung / lò hơi","Khu vực máy nén khí",
  "Hệ thống lạnh công nghiệp","Chiếu sáng nhà xưởng","Văn phòng & Hành chính",
  "Kho nguyên/thành phẩm","Trạm bơm","Trạm biến áp","Phân xưởng phụ trợ","Khu vực khác",
];

export const EQUIPMENT_AUDIT_QUESTIONS = [
  "Thông số vận hành hiện tại (tải, nhiệt độ, tốc độ, áp suất)?",
  "Hiệu suất thiết kế so với hiệu suất thực tế?",
  "Lần bảo trì/vệ sinh cuối cùng?",
  "Có sự cố/hiện tượng bất thường gần đây không?",
  "Đồng hồ đo phụ riêng cho thiết bị này không?",
  "SOP vận hành tiết kiệm NL có không?",
  "Tiêu thụ NL trung bình tháng?",
];

// ── Clause groups for navigation ─────────────────────────────────
export const CLAUSE_GROUPS = [
  { id:"§4", label:"§4 Bối cảnh", col:C.blueL,   clauses:["4.1","4.2","4.3","4.4"] },
  { id:"§5", label:"§5 Lãnh đạo", col:C.violet,  clauses:["5.1","5.2","5.3"] },
  { id:"§6", label:"§6 Lập kế hoạch", col:C.amberL, clauses:["6.1","6.2","6.3","6.4","6.5","6.6"] },
  { id:"§7", label:"§7 Hỗ trợ",   col:C.skyL,    clauses:["7.1","7.2","7.3","7.5"] },
  { id:"§8", label:"§8 Vận hành", col:C.orangeL, clauses:["8.1","8.2","8.3"] },
  { id:"§9", label:"§9 Đánh giá", col:C.tealL,   clauses:["9.1","9.2","9.3"] },
  { id:"§10",label:"§10 Cải tiến",col:C.greenL,  clauses:["10.1","10.2"] },
];
