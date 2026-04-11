/**
 * Seed script — ISO 50001 GAP Survey
 * Usage: node seed.js
 * Or inside container: docker exec iso50001-backend node seed.js
 */
const mongoose = require("mongoose");
const Survey = require("./models/Survey");

const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/iso50001gap";

const sampleSurvey = {
  meta: {
    ref_no: "GAP-2025-001",
    report_title: "Báo cáo Đánh giá GAP ISO 50001:2018 — Công ty TNHH Sản xuất ABC",
    survey_date: "2025-03-15",
    version: "v1.0",
    objective:
      "Đánh giá mức độ sẵn sàng của hệ thống quản lý năng lượng (EnMS) theo tiêu chuẩn ISO 50001:2018 và pháp luật hiện hành của Việt Nam.",
    exec_summary:
      "Kết quả khảo sát cho thấy tổ chức đạt khoảng 42% yêu cầu ISO 50001:2018. Các điểm yếu trọng yếu tập trung ở §6 (Hoạch định) và §9 (Đánh giá). Khuyến nghị ưu tiên thiết lập EnPI, EnB và triển khai kiểm toán năng lượng trong vòng 6 tháng tới.",
    exec_summary_items: [
      "Tổ chức chưa thiết lập EnPI và EnB theo yêu cầu §6.4 và §6.5",
      "Chưa có EMR được bổ nhiệm bằng văn bản theo TT 38/2014",
      "Chưa thực hiện kiểm toán năng lượng theo chu kỳ 3 năm (TT 25/2020)",
      "Khuyến nghị xây dựng lộ trình chứng nhận ISO 50001 trong 12 tháng",
    ],
    confidential: "Tài liệu mật — Chỉ lưu hành nội bộ",
  },
  client: {
    name: "Công ty TNHH Sản xuất ABC",
    site: "Nhà máy Bình Dương",
    address: "Lô C5, KCN Sóng Thần 2, Dĩ An, Bình Dương",
    industry: "Sản xuất linh kiện điện tử",
    employees: "850",
    annual_energy: "12,500 TOE/năm",
    is_large_user: true,
    cert_status: "Chưa chứng nhận",
    representative_name: "Nguyễn Văn Thành",
    representative_position: "Tổng Giám đốc",
    contact_persons: [
      {
        full_name: "Trần Thị Lan",
        position: "Trưởng phòng Kỹ thuật",
        department: "Phòng Kỹ thuật",
        phone: "0901234567",
        email: "lan.tran@abc-mfg.vn",
      },
      {
        full_name: "Lê Minh Hùng",
        position: "Quản lý năng lượng (EMR)",
        department: "Phòng Quản lý Năng lượng",
        phone: "0912345678",
        email: "hung.le@abc-mfg.vn",
      },
    ],
    departments: [
      "Ban Giám đốc",
      "Phòng Kỹ thuật",
      "Phòng Quản lý Năng lượng",
      "Phòng Sản xuất",
      "Phòng Mua hàng",
      "Phòng QA/QC",
      "Phòng Bảo trì",
    ],
    production_shifts: "3 ca/ngày (06:00–14:00, 14:00–22:00, 22:00–06:00)",
    products_services: "Linh kiện điện tử, bo mạch in (PCB), cụm lắp ráp SMT",
    scope_geographical: "Nhà máy Bình Dương — diện tích 45,000 m²",
    scope_energy: ["Điện năng", "Dầu FO", "Khí nén", "Hơi nước"],
    scope_product: "Toàn bộ dây chuyền sản xuất và tiện ích phụ trợ",
    scope_control_method: "Kiểm soát trực tiếp — tổ chức sở hữu và vận hành toàn bộ thiết bị",
  },
  verifier: {
    org: "VICAS — Trung tâm Chứng nhận Chất lượng và Kiểm định Việt Nam",
    accred: "VILAS 001",
    lead: "Phạm Quốc Bảo",
    team: "Nguyễn Thị Thu, Đỗ Văn Khoa",
    cert_no: "",
    survey_date: "2025-03-13 đến 2025-03-15",
    std_applied: "ISO 50001:2018",
  },
  audit_plan: {
    plan_code: "VICAS-2025-0315",
    visit_no: "Đợt 1/2025",
    from_date: "2025-03-13",
    to_date: "2025-03-15",
    from_city: "Hà Nội",
    to_city: "Bình Dương",
    customer_ref: "ABC-MFG-BD",
    auditors: [
      { name: "Phạm Quốc Bảo", role: "Trưởng đoàn", org: "VICAS", phone: "0987654321", email: "bao.pham@vicas.vn" },
      { name: "Nguyễn Thị Thu", role: "Chuyên gia kỹ thuật", org: "VICAS", phone: "0976543210", email: "thu.nguyen@vicas.vn" },
    ],
  },
  responses: {
    "4.1.1": { score: 1, note: "Chưa có tài liệu phân tích bối cảnh tổ chức. Mới ở giai đoạn nhận thức." },
    "4.1.2": { score: 1, note: "Chưa xác định các yếu tố bên ngoài (thị trường, pháp lý, công nghệ)." },
    "4.1.3": { score: 0, note: "Chưa có quy trình xem xét định kỳ." },
    "4.2.1": { score: 1, note: "Có danh sách sơ bộ các bên liên quan nhưng chưa đầy đủ." },
    "4.2.2": { score: 2, note: "Đã xác định một số yêu cầu pháp lý chính (Luật 50/2010, TT 25/2020)." },
    "4.2.3": { score: 1, note: "Chưa có lịch cập nhật định kỳ danh sách pháp lý." },
    "4.2.5": { score: 2, note: "Đã xác định thuộc diện trọng điểm quốc gia (>1000 TOE/năm)." },
    "4.3.1": { score: 1, note: "Phạm vi được mô tả sơ bộ trong hồ sơ dự thầu, chưa thành văn bản chính thức." },
    "4.3.2": { score: 2, note: "Ranh giới vật lý đã được xác định theo sơ đồ mặt bằng nhà máy." },
    "4.3.3": { score: 2, note: "Đã liệt kê 4 loại năng lượng: điện, dầu FO, khí nén, hơi nước." },
    "4.4.1": { score: 0, note: "EnMS chưa được thiết lập chính thức." },
    "4.4.2": { score: 0, note: "EnMS chưa tích hợp vào quy trình kinh doanh." },
    "5.1.1": { score: 1, note: "Cam kết bằng miệng của Tổng Giám đốc. Chưa có văn bản chính thức." },
    "5.1.2": { score: 1, note: "Ngân sách năng lượng nằm trong ngân sách vận hành chung, chưa tách riêng." },
    "5.1.3": { score: 1, note: "Có nhân viên phụ trách điện nhưng chưa có vai trò EMR chính thức." },
    "5.1.4": { score: 0, note: "Chưa có chương trình cải tiến liên tục hiệu quả năng lượng." },
    "5.2.1": { score: 0, note: "Chưa ban hành chính sách năng lượng." },
    "5.2.2": { score: 0, note: "Chưa có chính sách." },
    "5.2.3": { score: 0, note: "Chưa có chính sách." },
    "5.2.4": { score: 0, note: "Chưa truyền đạt chính sách." },
    "5.2.5": { score: 0, note: "Nhà thầu chưa được thông báo yêu cầu năng lượng." },
    "5.3.1": { score: 1, note: "Anh Hùng được giao phụ trách điện nhưng chưa có quyết định EMR chính thức." },
    "5.3.2": { score: 0, note: "Chưa thành lập Nhóm quản lý năng lượng." },
    "5.3.3": { score: 0, note: "Chưa có tài liệu mô tả vai trò, trách nhiệm EMR." },
    "5.3.5": { score: 1, note: "Có nhân sự phụ trách nhưng chưa có chứng chỉ TT 38/2014." },
    "6.1.1": { score: 0, note: "Chưa xác định rủi ro và cơ hội cho EnMS." },
    "6.1.2": { score: 0, note: "Chưa có kế hoạch hành động xử lý rủi ro." },
    "6.2.1": { score: 0, note: "Chưa thiết lập mục tiêu năng lượng đo lường được." },
    "6.2.2": { score: 0, note: "Chưa có kế hoạch hành động chi tiết." },
    "6.2.3": { score: 0, note: "Chưa phân công người chịu trách nhiệm và thời hạn." },
    "6.3.1": { score: 1, note: "Có dữ liệu hóa đơn điện hàng tháng. Chưa phân tích chuyên sâu." },
    "6.3.2": { score: 1, note: "Xác định sơ bộ: hệ thống HVAC, lò nung, máy nén khí là SEU. Chưa tính toán chính xác." },
    "6.3.3": { score: 1, note: "Nhận diện được một số cơ hội nhưng chưa có kế hoạch triển khai." },
    "6.3.4": { score: 0, note: "Chưa phân tích biến tĩnh." },
    "6.3.5": { score: 0, note: "Chưa có quy trình cập nhật định kỳ." },
    "6.3.8": { score: 0, note: "Chưa xác định biến liên quan ảnh hưởng đến tiêu thụ NL." },
    "6.3.9": { score: 0, note: "Chưa có phương pháp ưu tiên hóa cơ hội cải tiến." },
    "6.4.1": { score: 0, note: "Chưa thiết lập EnPI." },
    "6.4.2": { score: 0, note: "Chưa có phương pháp xác định EnPI." },
    "6.4.3": { score: 0, note: "Chưa có EnPI để so sánh." },
    "6.5.1": { score: 0, note: "Chưa thiết lập EnB." },
    "6.5.2": { score: 0, note: "Chưa có phương pháp điều chỉnh EnB." },
    "6.5.4": { score: 0, note: "Chưa chuẩn hóa dữ liệu NL theo biến ảnh hưởng." },
    "6.6.1": { score: 1, note: "Có kế hoạch đọc đồng hồ điện hàng tháng. Chưa có kế hoạch thu thập dữ liệu toàn diện." },
    "6.6.2": { score: 1, note: "Nhân viên kỹ thuật đọc đồng hồ hàng tháng nhưng chưa được tài liệu hóa." },
    "6.6.3": { score: 1, note: "Đồng hồ điện được kiểm định bởi điện lực. Các đồng hồ phụ chưa hiệu chuẩn." },
    "6.6.4": { score: 0, note: "Chưa quản lý độ không đảm bảo đo." },
    "6.6.5": { score: 1, note: "Có 12 đồng hồ đo điện chính. Chưa đủ phủ tất cả SEU." },
    "6.6.6": { score: 0, note: "Chưa có kế hoạch kiểm định/hiệu chuẩn thiết bị đo." },
    "7.1.1": { score: 1, note: "Ngân sách cho hoạt động năng lượng chưa được phê duyệt riêng." },
    "7.1.2": { score: 1, note: "Có phần mềm Excel theo dõi hóa đơn. Chưa có hệ thống EMS." },
    "7.1.3": { score: 2, note: "Có đồng hồ đo và dụng cụ cơ bản. Chưa có thiết bị phân tích NL chuyên dụng." },
    "7.2.1": { score: 1, note: "Chưa xác định năng lực yêu cầu cho vị trí ảnh hưởng EnPI." },
    "7.2.2": { score: 1, note: "Có kế hoạch đào tạo chung, chưa có kế hoạch đào tạo EnMS riêng." },
    "7.2.3": { score: 2, note: "Hồ sơ đào tạo được lưu trữ tại phòng nhân sự." },
    "7.3.1": { score: 0, note: "Nhân viên chưa được phổ biến về chính sách năng lượng (chưa có chính sách)." },
    "7.3.2": { score: 1, note: "Nhận thức còn hạn chế ở cấp vận hành." },
    "7.4.1": { score: 0, note: "Chưa có quy trình trao đổi thông tin nội bộ về EnMS." },
    "7.5.1": { score: 0, note: "Tài liệu bắt buộc ISO 50001 chưa được thiết lập." },
    "7.5.2": { score: 1, note: "Hồ sơ chung được lưu trữ nhưng chưa theo yêu cầu ISO 50001." },
    "8.1.1": { score: 1, note: "Có tiêu chí vận hành cơ bản cho thiết bị chính. Chưa liên kết với SEU." },
    "8.1.2": { score: 1, note: "Có checklist vận hành cơ bản cho một số thiết bị." },
    "8.1.3": { score: 0, note: "Nhà thầu chưa được thông báo yêu cầu năng lượng." },
    "8.1.4": { score: 1, note: "Có quy trình xử lý sự cố cơ bản. Chưa liên kết với SEU." },
    "8.1.5": { score: 1, note: "Checklist vận hành có nhưng chưa đầy đủ cho tất cả SEU." },
    "8.1.6": { score: 1, note: "SOP sản xuất có tồn tại nhưng chưa đề cập yếu tố NL." },
    "8.1.7": { score: 2, note: "Có lịch bảo trì định kỳ PM cho thiết bị chính. Chưa tối ưu theo NL." },
    "8.1.8": { score: 2, note: "Kho vật tư dự phòng được quản lý tốt." },
    "8.2.1": { score: 1, note: "Chưa có tiêu chí NL trong đánh giá dự án đầu tư mới." },
    "8.3.1": { score: 0, note: "Chưa có tiêu chí NL trong đánh giá nhà cung cấp." },
    "8.3.2": { score: 0, note: "Chưa ưu tiên thiết bị nhãn NL 4-5 sao." },
    "9.1.1": { score: 1, note: "Theo dõi hóa đơn điện hàng tháng. Chưa theo dõi EnPI chính thức." },
    "9.1.2": { score: 0, note: "Chưa có EnPI và EnB để so sánh." },
    "9.1.3": { score: 2, note: "Đã nộp báo cáo sử dụng NL hàng năm cho BCT theo TT 25/2020." },
    "9.1.4": { score: 1, note: "Đồng hồ điện chính được kiểm định. Chưa đầy đủ tất cả thiết bị đo." },
    "9.1.5": { score: 0, note: "Chưa phân tích EnPI và mục tiêu." },
    "9.1.6": { score: 2, note: "Biết rõ thời hạn nộp báo cáo NL hàng năm và chu kỳ kiểm toán 3 năm." },
    "9.1.7": { score: 1, note: "Hồ sơ kiểm định đồng hồ điện được lưu trữ. Chưa đầy đủ hệ thống." },
    "9.1.8": { score: 0, note: "Chưa thực hiện kiểm toán năng lượng định kỳ theo TT 25/2020." },
    "9.2.1": { score: 0, note: "Chưa có chương trình đánh giá nội bộ EnMS." },
    "9.2.2": { score: 0, note: "Chưa đào tạo đánh giá viên nội bộ EnMS." },
    "9.2.3": { score: 0, note: "Chưa có đánh giá nội bộ để báo cáo." },
    "9.3.1": { score: 0, note: "Chưa thực hiện xem xét lãnh đạo về EnMS." },
    "9.3.2": { score: 0, note: "Chưa có hồ sơ xem xét lãnh đạo." },
    "10.1.1": { score: 0, note: "Chưa có quy trình xử lý sự không phù hợp trong EnMS." },
    "10.1.2": { score: 0, note: "Chưa có hồ sơ NC và CAR liên quan EnMS." },
    "10.2.1": { score: 0, note: "Chưa có dữ liệu chứng minh cải tiến liên tục EnMS." },
    "10.2.2": { score: 0, note: "Chưa ghi nhận xu hướng cải tiến EnPI." },
  },
  action_plan: [
    {
      id: "AP-01",
      clause: "5.1 / 5.2",
      action: "Ban hành Chính sách Năng lượng và Cam kết lãnh đạo bằng văn bản",
      responsible: "Tổng Giám đốc + Phòng Kỹ thuật",
      deadline: "2025-04-30",
      priority: "Cao",
      status: "Chưa thực hiện",
    },
    {
      id: "AP-02",
      clause: "5.3",
      action: "Ra quyết định bổ nhiệm EMR và thành lập Nhóm quản lý năng lượng",
      responsible: "Ban Giám đốc",
      deadline: "2025-04-15",
      priority: "Cao",
      status: "Chưa thực hiện",
    },
    {
      id: "AP-03",
      clause: "6.3 / 6.4 / 6.5",
      action: "Thực hiện Rà soát năng lượng toàn diện; thiết lập EnPI và EnB",
      responsible: "EMR + Phòng Kỹ thuật",
      deadline: "2025-06-30",
      priority: "Cao",
      status: "Chưa thực hiện",
    },
    {
      id: "AP-04",
      clause: "9.1.8",
      action: "Lập kế hoạch và thực hiện Kiểm toán năng lượng theo TT 25/2020",
      responsible: "EMR + Đơn vị kiểm toán độc lập",
      deadline: "2025-09-30",
      priority: "Cao",
      status: "Chưa thực hiện",
    },
    {
      id: "AP-05",
      clause: "7.2",
      action: "Đăng ký và hoàn thành đào tạo chứng chỉ EMR theo TT 38/2014",
      responsible: "Anh Hùng (EMR dự kiến)",
      deadline: "2025-07-31",
      priority: "Trung bình",
      status: "Chưa thực hiện",
    },
  ],
};

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log("✅ MongoDB connected:", MONGODB_URI);

    const existing = await Survey.findOne({ "meta.ref_no": sampleSurvey.meta.ref_no });
    if (existing) {
      console.log("⚠️  Survey GAP-2025-001 already exists — skipping insert.");
      console.log("   _id:", existing._id);
    } else {
      const doc = await Survey.create(sampleSurvey);
      console.log("✅ Seed survey created successfully!");
      console.log("   _id:", doc._id);
      console.log("   ref_no:", doc.meta.ref_no);
      console.log("   client:", doc.client.name);
    }
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected.");
  }
}

seed();
