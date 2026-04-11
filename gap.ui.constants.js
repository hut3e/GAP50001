/**
 * ISO50001Gap — frontend/gap.ui.constants.js
 * Design tokens, step config, default survey state
 */

export const C = {
  bg0:"#020d17",bg1:"#031624",bg2:"#071e30",bg3:"#0c2840",bg4:"#112f4a",bg5:"#163855",
  navy:"#1B3564",blue:"#2E5FA3",blueL:"#4e8fd4",teal:"#0D7377",tealL:"#14b8a6",
  green:"#1A7A4A",greenL:"#22c55e",red:"#C0392B",redL:"#ef4444",
  orange:"#D35400",orangeL:"#f97316",amber:"#B7770D",amberL:"#f59e0b",
  violet:"#6C3483",sky:"#2471A3",skyL:"#38bdf8",gold:"#B8860B",
  t0:"#e8f4ff",t1:"#94b8d8",t2:"#4a7a9b",t3:"#1c3d57",
  bd0:"rgba(46,95,163,.2)",bd1:"rgba(46,95,163,.1)",bd2:"rgba(46,95,163,.05)",
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
  { id:"export",   icon:"📄", label:"Xuất báo cáo GAP"    },
];

export const GAP_CHECKLIST = [
  // §4
  { id:"4.1.1",clause:"4.1",title:"Xác định vấn đề bên trong ảnh hưởng đến EnMS",           weight:2,cat:"doc",        legal:"Luật 50/2010 §5" },
  { id:"4.1.2",clause:"4.1",title:"Xác định vấn đề bên ngoài ảnh hưởng đến EnMS",           weight:2,cat:"doc",        legal:"" },
  { id:"4.1.3",clause:"4.1",title:"Xem xét định kỳ bối cảnh (tại xem xét lãnh đạo)",        weight:1,cat:"practice",   legal:"" },
  { id:"4.2.1",clause:"4.2",title:"Xác định danh sách các bên liên quan đến EnMS",           weight:2,cat:"doc",        legal:"TT 09/2012 §4" },
  { id:"4.2.2",clause:"4.2",title:"Xác định yêu cầu pháp lý áp dụng và cam kết khác",       weight:3,cat:"legal",      legal:"Luật 50/2010; NĐ 21/2011" },
  { id:"4.2.3",clause:"4.2",title:"Cập nhật danh sách yêu cầu pháp lý định kỳ",             weight:2,cat:"practice",   legal:"" },
  { id:"4.3.1",clause:"4.3",title:"Phạm vi EnMS được lập thành văn bản rõ ràng",             weight:3,cat:"doc",        legal:"TT 09/2012 §5" },
  { id:"4.3.2",clause:"4.3",title:"Ranh giới vật lý và địa lý được xác định",                weight:2,cat:"doc",        legal:"" },
  { id:"4.4.1",clause:"4.4",title:"EnMS được thiết lập theo yêu cầu ISO 50001:2018",         weight:3,cat:"practice",   legal:"TT 09/2012 §6" },
  // §5
  { id:"5.1.1",clause:"5.1",title:"Lãnh đạo cao nhất cam kết bằng văn bản với EnMS",        weight:3,cat:"leadership", legal:"TT 09/2012 §6" },
  { id:"5.1.2",clause:"5.1",title:"Ngân sách / nguồn lực tài chính cho EnMS được phê duyệt",weight:3,cat:"leadership", legal:"NĐ 21/2011 §14" },
  { id:"5.1.3",clause:"5.1",title:"Lãnh đạo thúc đẩy cải tiến liên tục hiệu quả NL",       weight:2,cat:"leadership", legal:"" },
  { id:"5.2.1",clause:"5.2",title:"Chính sách NL được ban hành bởi lãnh đạo cao nhất",      weight:3,cat:"doc",        legal:"TT 09/2012 §6" },
  { id:"5.2.2",clause:"5.2",title:"Chính sách cam kết đáp ứng yêu cầu pháp lý",            weight:3,cat:"doc",        legal:"Luật 50/2010" },
  { id:"5.2.3",clause:"5.2",title:"Chính sách truyền đạt đến toàn bộ nhân viên",  weight:3,cat:"practice",   legal:"" },
  { id:"5.3.1",clause:"5.3",title:"EMR được bổ nhiệm bằng văn bản có thẩm quyền",          weight:3,cat:"doc",        legal:"TT 38/2014 §5" },
  { id:"5.3.2",clause:"5.3",title:"Nhóm quản lý NL được thành lập",                         weight:2,cat:"doc",        legal:"TT 09/2012 §7" },
  // §6
  { id:"6.1.1",clause:"6.1",title:"Rủi ro và cơ hội của EnMS được xác định",                weight:2,cat:"doc",        legal:"" },
  { id:"6.2.1",clause:"6.2",title:"Mục tiêu NL đo lường được, có thời hạn",                 weight:3,cat:"doc",        legal:"TT 09/2012 §9" },
  { id:"6.2.2",clause:"6.2",title:"Kế hoạch hành động chi tiết để đạt mục tiêu",            weight:2,cat:"doc",        legal:"" },
  { id:"6.3.1",clause:"6.3",title:"Rà soát NL dựa trên dữ liệu đo thực tế",                weight:3,cat:"measurement",legal:"TT 25/2020 §5" },
  { id:"6.3.2",clause:"6.3",title:"SEU được xác định và lập thành tài liệu",                weight:3,cat:"doc",        legal:"TT 09/2012 §8" },
  { id:"6.3.3",clause:"6.3",title:"Cơ hội cải tiến hiệu quả NL được xác định",             weight:2,cat:"practice",   legal:"" },
  { id:"6.3.4",clause:"6.3",title:"Biến tĩnh (static variables) được phân tích",            weight:2,cat:"measurement",legal:"" },
  { id:"6.4.1",clause:"6.4",title:"EnPI được thiết lập phù hợp",                            weight:3,cat:"measurement",legal:"ISO 50006:2014" },
  { id:"6.4.2",clause:"6.4",title:"EnPI so sánh với EnB, phân tích xu hướng",               weight:2,cat:"measurement",legal:"" },
  { id:"6.5.1",clause:"6.5",title:"EnB được thiết lập với thời kỳ cơ sở đại diện",          weight:3,cat:"measurement",legal:"TT 25/2020 §9" },
  { id:"6.5.2",clause:"6.5",title:"Phương pháp điều chỉnh EnB khi biến tĩnh thay đổi",     weight:2,cat:"measurement",legal:"ISO 50006:2014" },
  { id:"6.6.1",clause:"6.6",title:"Kế hoạch thu thập dữ liệu NL được lập thành văn bản",   weight:2,cat:"measurement",legal:"" },
  { id:"6.6.2",clause:"6.6",title:"Thiết bị đo lường được hiệu chuẩn định kỳ",              weight:3,cat:"measurement",legal:"TT 09/2012 §11" },
  // §7
  { id:"7.1.1",clause:"7.1",title:"Nguồn lực cho EnMS được xác định và cung cấp",           weight:2,cat:"leadership", legal:"NĐ 21/2011 §17" },
  { id:"7.2.1",clause:"7.2",title:"Năng lực yêu cầu cho vị trí ảnh hưởng EnPI",            weight:2,cat:"doc",        legal:"TT 38/2014 §5" },
  { id:"7.2.2",clause:"7.2",title:"Kế hoạch đào tạo nhân viên liên quan EnMS",              weight:2,cat:"practice",   legal:"TT 38/2014 §6" },
  { id:"7.3.1",clause:"7.3",title:"Nhân viên nhận thức được chính sách NL",                 weight:2,cat:"practice",   legal:"" },
  { id:"7.5.1",clause:"7.5",title:"Tài liệu bắt buộc ISO 50001 đầy đủ và được kiểm soát",  weight:3,cat:"doc",        legal:"TT 09/2012 §15" },
  // §8
  { id:"8.1.1",clause:"8.1",title:"Tiêu chí vận hành cho SEU được thiết lập",               weight:3,cat:"practice",   legal:"TT 09/2012 §16" },
  { id:"8.1.2",clause:"8.1",title:"Kiểm soát vận hành tại SEU (SOP, check-list)",           weight:2,cat:"practice",   legal:"" },
  { id:"8.2.1",clause:"8.2",title:"Hiệu quả NL xem xét trong thiết kế/sửa đổi thiết bị",   weight:2,cat:"practice",   legal:"Luật 50/2010 §26" },
  { id:"8.3.1",clause:"8.3",title:"Tiêu chí NL trong đánh giá nhà cung cấp thiết bị",      weight:2,cat:"practice",   legal:"TT 36/2016" },
  { id:"8.3.2",clause:"8.3",title:"Ưu tiên thiết bị nhãn NL 4-5 sao / đáp ứng MEPS",      weight:2,cat:"practice",   legal:"TT 36/2016; QĐ 1725/QĐ-BCT" },
  // §9
  { id:"9.1.1",clause:"9.1",title:"Theo dõi EnPI định kỳ và ghi nhận kết quả",             weight:3,cat:"measurement",legal:"TT 09/2012 §18" },
  { id:"9.1.2",clause:"9.1",title:"So sánh EnPI với EnB và phân tích xu hướng",             weight:3,cat:"measurement",legal:"ISO 50006:2014" },
  { id:"9.1.3",clause:"9.1",title:"Báo cáo sử dụng NL hàng năm nộp cho cơ quan quản lý",  weight:3,cat:"legal",      legal:"TT 09/2012 §18" },
  { id:"9.2.1",clause:"9.2",title:"Chương trình đánh giá nội bộ EnMS hàng năm",             weight:2,cat:"practice",   legal:"ISO 50003:2014" },
  { id:"9.3.1",clause:"9.3",title:"Xem xét lãnh đạo ít nhất 1 lần/năm",                    weight:3,cat:"leadership", legal:"TT 09/2012 §20" },
  // §10
  { id:"10.1.1",clause:"10.1",title:"Quy trình xử lý sự không phù hợp và CAR",             weight:2,cat:"practice",   legal:"" },
  { id:"10.2.1",clause:"10.2",title:"Cải tiến liên tục EnMS được chứng minh",               weight:3,cat:"measurement",legal:"QĐ 280/QĐ-TTg" },
  { id:"10.2.2",clause:"10.2",title:"Xu hướng cải tiến EnPI qua ít nhất 2 kỳ",             weight:2,cat:"measurement",legal:"ISO 50021:2019" },
];

export const RISK_CATEGORIES = [
  { id:"RISK-LEG",  name:"Pháp lý & Quy định",       col:"#C0392B",
    items:[
      { id:"RL-01",risk:"Chưa xác định cơ sở thuộc diện trọng điểm",                   ref:"TT 09/2012 §4"    },
      { id:"RL-02",risk:"Không nộp báo cáo NL hàng năm cho BCT",                        ref:"TT 09/2012 §18"   },
      { id:"RL-03",risk:"Không thực hiện kiểm toán NL theo chu kỳ 3 năm",              ref:"TT 25/2020 §5"    },
      { id:"RL-04",risk:"EMR chưa có chứng chỉ quản lý NL (TT 38/2014)",               ref:"TT 38/2014 §5"    },
      { id:"RL-05",risk:"Thiết bị không đáp ứng MEPS hoặc chưa có nhãn NL",            ref:"TT 36/2016; QĐ 1725/QĐ-BCT"},
      { id:"RL-06",risk:"Không lập kế hoạch sử dụng NL hàng năm",                      ref:"TT 09/2012 §9"    },
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
export const ZONE_TYPES = [
  "Xưởng sản xuất chính",
  "Khu vực lò nung",
  "Khu vực lò nấu kim loại",
  "Khu vực lò nhiệt luyện",
  "Khu vực Buồng phun sơn",
  "Khu vực lò sấy sơn lót",
  "Khu vực lò sấy sơn hoàn thiện",
  "Khu vực lò hơi",
  "Khu vực Chiller",
  "Khu vực Máy dập",
  "Khu vực Máy cắt",
  "Khu vực Máy cắt Laser",
  "Khu vực Máy uốn",
  "Khu vực Máy CNC",
  "Khu vực Hàn tay",
  "Khu vực Hàn Robot",
  "Khu vực máy nén khí",
  "Khu vực phun bi",
  "Khu vực phun cát",
  "Hệ thống làm lạnh / kho lạnh",
  "Khu vực chiếu sáng nhà xưởng",
  "Văn phòng / hành chính",
  "Kho nguyên liệu / thành phẩm",
  "Trạm bơm / xử lý nước",
  "Trạm biến áp / phòng điện",
  "Khu vực xử lý khí thải / môi trường",
  "Bãi đậu xe / chiếu sáng ngoài trời",
  "Khu vực khác"];

export const ACTION_PHASES = [
  { id:"P1", label:"Giai đoạn 1 — Ngay lập tức (0–30 ngày)",    col:"#C0392B" },
  { id:"P2", label:"Giai đoạn 2 — Ngắn hạn (1–3 tháng)",       col:"#D35400" },
  { id:"P3", label:"Giai đoạn 3 — Trung hạn (3–6 tháng)",      col:"#B7770D" },
  { id:"P4", label:"Giai đoạn 4 — Dài hạn (6–12 tháng)",       col:"#0D7377" },
];

export const INIT_SURVEY = {
  meta:{ ref_no:"GAP-2024-001", report_title:"BÁO CÁO KHẢO SÁT GAP ISO 50001:2018",
         survey_date:"", version:"v1.0", objective:"", exec_summary:"", confidential:"CONFIDENTIAL" },
  client:{ name:"", site:"", address:"", industry:"", employees:"", annual_energy:"", is_large_user:false, cert_status:"Chưa có chứng nhận ISO 50001" },
  verifier:{ org:"", accred:"", lead:"", team:"", cert_no:"", std_applied:"ISO 50001:2018; ISO 50006:2014; ISO 50002:2014" },
  responses:{},
  risk_assessments:{},
  process_gaps:{},
  site_assessments:[],
  action_plan:[],
  legal_status:{},
};
