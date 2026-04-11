const Settings = require("../models/Settings");
const tg = require("./telegram");

/**
 * Lấy danh sách auditor dưới dạng string
 */
function getAuditorsStr(plan) {
  if (!plan?.auditors) return "";
  return plan.auditors.map(a => a.name || a).filter(Boolean).join(", ");
}

/**
 * checkAndSendEvents
 * Đánh giá sự khác biệt giữa oldDoc và newDoc để gửi Realtime Event qua Telegram
 */
async function checkAndSendEvents(oldDoc, newDoc) {
  try {
    const setDoc = await Settings.findOne({ key: "telegram" }).lean();
    if (!setDoc || !setDoc.value || !setDoc.value.botToken) return;
    const botToken = setDoc.value.botToken;
    const chatIds = setDoc.value.chatIds || setDoc.value.chatId || [];

    const messages = [];
    const clientName = newDoc.client?.name || "Khách hàng";
    const refNo = newDoc.meta?.ref_no || "---";

    const oldPlan = oldDoc ? (oldDoc.audit_plan || {}) : {};
    const newPlan = newDoc ? (newDoc.audit_plan || {}) : {};

    // 1 & 2 & 3. Kế hoạch / Auditors / Thời gian
    let oldStr = getAuditorsStr(oldPlan);
    if (!oldStr && oldDoc?.verifier?.lead) {
      oldStr = oldDoc.verifier.lead;
    }
    
    let newStr = getAuditorsStr(newPlan);
    if (!newStr && newDoc?.verifier?.lead) {
      newStr = newDoc.verifier.lead;
    }

    let oldFrom = oldPlan.from_date || "";
    let oldTo = oldPlan.to_date || "";

    if (!oldFrom && oldDoc?.meta?.survey_date) {
      const parts = oldDoc.meta.survey_date.split(" to ");
      oldFrom = parts[0] || "";
      oldTo = parts[1] || "";
    }

    let newFrom = newPlan.from_date || "";
    let newTo = newPlan.to_date || "";

    if (!newFrom && newDoc?.meta?.survey_date) {
      const parts = newDoc.meta.survey_date.split(" to ");
      newFrom = parts[0] || "";
      newTo = parts[1] || "";
    }

    // A. Kiểm tra xem đã đủ thông tin cơ bản để chốt Kế hoạch chưa
    const hadBasicInfo = oldDoc && oldDoc.client?.name && oldFrom && oldStr;
    const hasBasicInfo = newDoc && newDoc.client?.name && newFrom && newStr;

    if (!hadBasicInfo && hasBasicInfo) {
      messages.push({ type: "notify_gap_plans", text: `📅 <b>KẾ HOẠCH ĐÁNH GIÁ ĐƯỢC LẬP</b>\n━━━━━━━━━━━━━━━━━━━━\n🏢 Khách hàng: <b>${tg.escHtml(clientName)}</b>\n📌 Mã khảo sát: <code>${tg.escHtml(refNo)}</code>\n⏳ Lịch trình: <b>${tg.fmtDate(newFrom)}</b> → <b>${tg.fmtDate(newTo || newFrom)}</b>\n📍 Địa điểm: <b>${tg.escHtml(newDoc.client?.site || "Chưa xác định")}</b>\n👥 Đội ngũ chuyên gia (Auditors): <b>${tg.escHtml(newStr || "Chưa gán")}</b>\n\n👉 <i>Kế hoạch đã được xác lập, đề nghị các thành viên nắm luồng công việc!</i>` });
    } else if (hadBasicInfo && hasBasicInfo) {
      // B. Cập nhật thời gian
      if ((oldFrom !== newFrom || oldTo !== newTo) && (newFrom || newTo)) {
        messages.push({ type: "notify_gap_plans", text: `🔄 <b>THAY ĐỔI LỊCH ĐÁNH GIÁ GAP</b>\n━━━━━━━━━━━━━━━━━━━━\n🏢 Khách hàng: <b>${tg.escHtml(clientName)}</b>\n📌 Mã khảo sát: <code>${tg.escHtml(refNo)}</code>\n⚠️ Lịch trình cập nhật:\n[ ${tg.fmtDate(oldFrom) || "Trống"} → ${tg.fmtDate(oldTo) || "Trống"} ] ➡️ \n[ <b>${tg.fmtDate(newFrom)}</b> → <b>${tg.fmtDate(newTo || newFrom)}</b> ]\n👥 Chuyên gia: <b>${tg.escHtml(newStr)}</b>\n\n👉 <i>Lịch trình vừa được Giám đốc điều chỉnh. Vui lòng rà soát tiến độ!</i>` });
      }
      
      // C. Gán Jobs / Chuyên gia
      if (oldStr !== newStr && newStr) {
        messages.push({ type: "notify_auditors", text: `👥 <b>PHÂN CÔNG NHIỆM VỤ (ASSIGN TARGET JOB)</b>\n━━━━━━━━━━━━━━━━━━━━\n🏢 Khách hàng: <b>${tg.escHtml(clientName)}</b>\n📌 Mã khảo sát: <code>${tg.escHtml(refNo)}</code>\n⏳ Thời gian: <b>${tg.fmtDate(newFrom)}</b> → <b>${tg.fmtDate(newTo || newFrom)}</b>\n\n👷 Chuyên gia cũ: ${tg.escHtml(oldStr || "Chưa có")}\n👷 Chuyên gia mới đảm nhiệm: <b>${tg.escHtml(newStr)}</b>\n\n👉 <i>Hệ thống vừa giao Job mới. Vui lòng chuẩn bị công tác theo kế hoạch hiện trường!</i>` });
      }
    }

    // 4. Các trạng thái Kanban
    const oldStatus = oldDoc?.kanban_status;
    const newStatus = newDoc?.kanban_status;

    if (oldStatus !== newStatus && newStatus) {
      const statusNames = {
        planning: "📌 Lên kế hoạch",
        in_progress: "⚡ Đang thực hiện",
        review: "🔍 Chờ duyệt",
        completed: "✅ Hoàn thành",
        overdue: "🔴 Quá hạn"
      };
      const oldName = statusNames[oldStatus] || "Khởi tạo";
      const newName = statusNames[newStatus] || "Không rõ";
      
      let msgType = "notify_kanban";
      let extra = "";
      if (newStatus === "completed") {
        msgType = "notify_gap_results";
        const r = newDoc.responses || {};
        const scored = Object.values(r).filter(v => v && (v.score || 0) > 0);
        const crit = scored.filter(v => (v.score || 0) === 1).length;
        const maj = scored.filter(v => (v.score || 0) === 2).length;
        const riskCount = Object.keys(newDoc.risk_assessments || {}).length;
        const actionCount = (newDoc.action_plan || []).length;
        const avg = tg.calcAvgScore(newDoc) || "0.0";
        extra = `\n━━━━━━━━━━━━━━━━━━━━\n<b>📊 BÁO CÁO THỐNG KÊ NHANH:</b>\n⭐ Điểm số trung bình: <b>${avg}/5</b>\n🔴 GAP Nghiêm trọng (Score 1): <b>${crit}</b> điểm\n🟠 Rủi ro hệ thống (Score 2): <b>${maj}</b> điểm\n⚡ Điểm nghẽn Rủi ro: <b>${riskCount}</b>\n📝 Kế hoạch khắc phục: <b>${actionCount}</b>\n━━━━━━━━━━━━━━━━━━━━\n🎉 <i>Đoàn đánh giá đã hoàn tất công việc. Giám đốc dự án có thể xuất báo cáo DOCX!</i>`;
      } else if (newStatus === "in_progress") {
        extra = `\n👉 <i>Đoàn chuyên gia đã bắt đầu làm việc tại hiện trường.</i>`;
      } else if (newStatus === "review") {
        extra = `\n👉 <i>Hồ sơ đang trong giai đoạn Review, vui lòng kiểm tra tính pháp lý.</i>`;
      } else if (newStatus === "overdue") {
        extra = `\n⚠️ <b>ĐỀ NGHỊ RÀ SOÁT NGAY LẬP TỨC! ĐÃ QUÁ HẠN!</b>`;
      }

      messages.push({ type: msgType, text: `🔔 <b>CẬP NHẬT TRẠNG THÁI KANBAN</b>\n━━━━━━━━━━━━━━━━━━━━\n🏢 Khách hàng: <b>${tg.escHtml(clientName)}</b>\n📌 Mã khảo sát: <code>${tg.escHtml(refNo)}</code>\n⏳ Lịch trình: <b>${tg.fmtDate(newFrom)}</b> → <b>${tg.fmtDate(newTo)}</b>\n👥 Chuyên gia: <b>${tg.escHtml(newStr || "Chưa phân công")}</b>\n\n🔄 Tiến độ:\n[ ${oldName} ] ➡️ [ <b>${newName}</b> ]${extra}` });
    }

    // Fire all accumulated messages
    for (const msg of messages) {
       const targetIds = tg.normalizeChatIds(chatIds, msg.type);
       if (targetIds.length > 0) {
         await tg.sendToMany(botToken, targetIds, msg.text);
         await new Promise(r => setTimeout(r, 400));
       }
    }

  } catch (err) {
    console.error("[surveyEvents] Lỗi khi check/send telegram:", err);
  }
}

module.exports = { checkAndSendEvents };
