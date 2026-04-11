const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Settings = require("../models/Settings");
const tg = require("../services/telegram");

async function sendJobNotification(job, action, explicitNotify = false) {
  try {
    const setDoc = await Settings.findOne({ key: "telegram" }).lean();
    if (!setDoc || !setDoc.value || !setDoc.value.botToken) return;
    const botToken = setDoc.value.botToken;
    
    let targetIds = [];
    if (job.telegram_targets && job.telegram_targets.length > 0) {
      targetIds = tg.normalizeChatIds(job.telegram_targets);
    } else {
      targetIds = tg.normalizeChatIds(setDoc.value.chatIds || setDoc.value.chatId || [], "notify_calendar");
    }
    
    if (targetIds.length === 0) return;

    // Build the Action Text based on Priority
    const icon = job.priority === "urgent" ? "🚨 KHẨN CẤP:" : job.priority === "high" ? "⚠️ QUAN TRỌNG:" : "📌";
    const actionText = action === "create" ? `${icon} CÔNG VIỆC MỚI` : 
                       action === "update" ? `🔄 CẬP NHẬT CÔNG VIỆC` : `❌ XÓA CÔNG VIỆC`;
                       
    const startStr = job.start_date ? tg.fmtDate(job.start_date) : "—";
    const endStr = job.end_date ? tg.fmtDate(job.end_date) : "—";

    let text = `📅 <b>${actionText}</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💼 Công việc: <b>${tg.escHtml(job.title)}</b>\n`;
    if (job.assignee) text += `👤 Phụ trách: <b>${tg.escHtml(job.assignee)}</b>\n`;
    text += `⏳ Thời gian: <b>${startStr}</b> → <b>${endStr}</b>\n`;
    
    // Status translation
    const statusMap = { pending: "Khởi tạo", in_progress: "Đang thực hiện", completed: "Hoàn thành", overdue: "🔴 Quá hạn" };
    const prioMap = { low: "Thấp", medium: "Trung bình", high: "Cao", urgent: "🚨 Khẩn cấp" };
    text += `🚦 Trạng thái: <b>${statusMap[job.status] || job.status}</b> | Mức độ: <b>${prioMap[job.priority] || job.priority}</b>\n`;
    
    if (job.attached_docs) text += `📄 Tài liệu: ${tg.escHtml(job.attached_docs)}\n`;
    if (job.tools_needed) text += `🛠 Trang bị: ${tg.escHtml(job.tools_needed)}\n`;

    tg.sendToMany(botToken, targetIds, text).catch(() => {});
  } catch (err) {
    console.error("Lỗi gửi Telegram (Job):", err);
  }
}

// GET /api/jobs -> get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ start_date: 1 }).lean();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const parseDateStr = (str) => {
  if (!str) return undefined;
  if (typeof str === "string") {
    // If DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(str)) {
      const parts = str.split(/[\/\-]/);
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00.000Z`);
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
};

// POST /api/jobs -> create a new job
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.start_date) data.start_date = parseDateStr(data.start_date);
    if (data.end_date) data.end_date = parseDateStr(data.end_date);
    
    const newJob = await Job.create(data);
    sendJobNotification(newJob, "create");
    res.json(newJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/jobs/:id -> update job
router.put("/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.start_date) data.start_date = parseDateStr(data.start_date);
    if (data.end_date) data.end_date = parseDateStr(data.end_date);

    const updated = await Job.findByIdAndUpdate(req.params.id, data, { new: true }).lean();
    if (updated) sendJobNotification(updated, "update");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id -> delete job
router.delete("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (job) sendJobNotification(job, "delete");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
