/**
 * ISO 50001 GAP — Notifications API Routes
 * Telegram Bot: validate token, discover chats, multi-recipients, digest, alerts
 */
const express  = require("express");
const mongoose = require("mongoose");
const Settings = require("../models/Settings");
const Survey   = require("../models/Survey");
const tg       = require("../services/telegram");
const scheduler = require("../services/scheduler");

const router = express.Router();

const mongoOk = () => mongoose.connection.readyState === 1;

// ── GET /api/notifications/validate-token ─────────────────────────
// Xác thực Bot Token & lấy thông tin bot (không cần MongoDB)
router.get("/validate-token", async (req, res) => {
  const token = String(req.query.token || "").trim();
  if (!token) return res.status(400).json({ error: "Thiếu token." });
  if (!isValidTokenFormat(token))
    return res.status(400).json({ error: "Định dạng token không hợp lệ. Token có dạng: 123456789:ABCDefgh..." });
  try {
    const info = await tg.getBotInfo(token);
    res.json({ ok: true, bot: info });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ── GET /api/notifications/discover-chats ─────────────────────────
// Tự động tìm danh sách chat/group đã nhắn bot (getUpdates)
router.get("/discover-chats", async (req, res) => {
  const token = await resolveToken(req.query.token);
  if (!token) return res.status(400).json({ error: "Cần token. Truyền ?token=... hoặc lưu cài đặt trước." });
  try {
    const chats = await tg.getAvailableChats(token);
    res.json({ ok: true, chats });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ── GET /api/notifications/settings ──────────────────────────────
router.get("/settings", async (req, res) => {
  try {
    let cfg = {};
    if (mongoOk()) {
      const doc = await Settings.findOne({ key: "telegram" }).lean();
      cfg = doc?.value || {};
    }
    const masked = cfg.botToken
      ? cfg.botToken.slice(0, 10) + "••••" + cfg.botToken.slice(-4)
      : "";
      // Chuẩn hoá chatIds: hỗ trợ cả chatId (cũ) và chatIds (mới)
    const chatIds = normalizeChatIdsObjects(cfg.chatIds || cfg.chatId);
    res.json({
      hasBotToken:   !!cfg.botToken,
      botTokenMasked: masked,
      botInfo:       cfg.botInfo || null,
      chatIds,
      dailyEnabled:  !!cfg.dailyEnabled,
      weeklyEnabled: !!cfg.weeklyEnabled,
      alertsEnabled: cfg.alertsEnabled !== false,
      alertDays:     cfg.alertDays || [1, 3, 7],
      dailyTime:     cfg.dailyTime  || "08:00",
      weeklyDay:     cfg.weeklyDay  || "1",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/notifications/settings ─────────────────────────────
router.post("/settings", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  try {
    const {
      botToken, chatIds,
      dailyEnabled, weeklyEnabled, alertsEnabled,
      alertDays, dailyTime, weeklyDay,
    } = req.body || {};

    const existing = await Settings.findOne({ key: "telegram" }).lean();
    const old = existing?.value || {};

    // Resolve token (giữ cũ nếu không gửi mới)
    const newToken = botToken && String(botToken).trim()
      ? String(botToken).trim()
      : old.botToken;

    if (!newToken) return res.status(400).json({ error: "Bot Token là bắt buộc." });

    // Validate token khi thay đổi
    let botInfo = old.botInfo || null;
    if (botToken && String(botToken).trim() !== "" && botToken !== old.botToken) {
      try { botInfo = await tg.getBotInfo(newToken); } catch (_) {}
    }

    const newIds = chatIds !== undefined
      ? normalizeChatIdsObjects(chatIds)
      : normalizeChatIdsObjects(old.chatIds || old.chatId);

    const newCfg = {
      botToken:      newToken,
      botInfo,
      chatIds:       newIds,
      dailyEnabled:  dailyEnabled  !== undefined ? !!dailyEnabled  : !!old.dailyEnabled,
      weeklyEnabled: weeklyEnabled !== undefined ? !!weeklyEnabled : !!old.weeklyEnabled,
      alertsEnabled: alertsEnabled !== undefined ? !!alertsEnabled : old.alertsEnabled !== false,
      alertDays:     Array.isArray(alertDays) ? alertDays.map(Number) : (old.alertDays || [1, 3, 7]),
      dailyTime:     dailyTime  || old.dailyTime  || "08:00",
      weeklyDay:     weeklyDay  || old.weeklyDay  || "1",
    };

    await Settings.findOneAndUpdate(
      { key: "telegram" },
      { key: "telegram", value: newCfg },
      { upsert: true, new: true }
    );

    try { scheduler.restartScheduler(); } catch (_) {}

    res.json({ ok: true, botInfo, chatIds: newIds });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/notifications/test ─────────────────────────────────
// Gửi tin nhắn kiểm tra tới tất cả chatIds đã lưu (hoặc body override)
router.post("/test", async (req, res) => {
  const { customText } = req.body || {};
  try {
    const { token, ids } = await resolveTokenAndIds(req.body);
    if (!token || !ids.length)
      return res.status(400).json({ error: "Cần botToken và ít nhất 1 chatId." });

    const text = customText?.trim()
      ? String(customText).slice(0, 1000)
      : [
          `✅ <b>Kết nối thành công — ISO 50001 GAP Tracker</b>`,
          ``,
          `🤖 Bot đã kết nối với hệ thống giám sát GAP Assessment.`,
          `📅 Thời điểm: ${tg.fmtDateTime()}`,
          `📨 Recipients: <b>${ids.length}</b> chat(s)`,
          ``,
          `Bạn sẽ nhận được:`,
          `  • ☀️ Báo cáo tổng hợp hàng ngày/tuần`,
          `  • 🔔 Cảnh báo deadline đánh giá GAP`,
          `  • 📊 Thống kê gap ISO 50001:2018`,
        ].join("\n");

    const results = await tg.sendToMany(token, ids, text);
    const ok    = results.filter(r => r.ok).length;
    const fail  = results.filter(r => !r.ok);
    res.json({ ok: ok > 0, sent: ok, failed: fail.length, results });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ── POST /api/notifications/send-now ─────────────────────────────
// Gửi ngay digest tất cả phiên (hoặc 1 phiên nếu có surveyId)
router.post("/send-now", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  try {
    const { token, ids } = await resolveTokenAndIds(req.body);
    if (!token || !ids.length)
      return res.status(400).json({ error: "Cần botToken và ít nhất 1 chatId." });

    const { isWeekly = false, surveyId } = req.body || {};

    if (surveyId) {
      const survey = await Survey.findById(surveyId).lean();
      if (!survey) return res.status(404).json({ error: "Không tìm thấy phiên." });
      const msg = `📋 <b>CHI TIẾT PHIÊN GAP</b>\n\n` + tg.buildSurveyMessage(survey, { kanban_status: survey.kanban_status });
      const results = await tg.sendToMany(token, ids, msg);
      return res.json({ ok: true, results });
    }

    const surveys = await Survey.find({}).sort({ createdAt: -1 }).limit(100).lean();
    const results = await tg.sendDigest(token, ids, surveys, { isWeekly });
    const sent   = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    res.json({ ok: true, sent, failed, total: results.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/notifications/send-survey/:surveyId ────────────────
router.post("/send-survey/:surveyId", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  try {
    const { token, ids } = await resolveTokenAndIds(req.body);
    if (!token || !ids.length)
      return res.status(400).json({ error: "Cần botToken và ít nhất 1 chatId." });

    const survey = await Survey.findById(req.params.surveyId).lean();
    if (!survey) return res.status(404).json({ error: "Không tìm thấy phiên." });

    const prefix = req.body.prefix || `📋 <b>CẬP NHẬT PHIÊN GAP</b>`;
    let msg = `${prefix}\n\n` + tg.buildSurveyMessage(survey, { kanban_status: survey.kanban_status });
    if (req.body.note) {
      msg += `\n\n📝 <b>Ghi chú người gửi:</b>\n<i>${tg.escHtml(req.body.note)}</i>`;
    }
    const results = await tg.sendToMany(token, ids, msg);
    res.json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/notifications/send-job/:jobId ────────────────
router.post("/send-job/:jobId", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  const Job = require("../models/Job");
  try {
    const { token, ids } = await resolveTokenAndIds(req.body);
    if (!token || !ids.length)
      return res.status(400).json({ error: "Cần botToken và ít nhất 1 chatId." });

    const job = await Job.findById(req.params.jobId).lean();
    if (!job) return res.status(404).json({ error: "Không tìm thấy Job." });

    const startStr = job.start_date ? tg.fmtDate(job.start_date) : "—";
    const endStr = job.end_date ? tg.fmtDate(job.end_date) : "—";
    const prefix = req.body.prefix || `📅 <b>THÔNG BÁO CÔNG VIỆC</b>`;
    
    const statusMap = { pending: "Khởi tạo", in_progress: "Đang thực hiện", completed: "Hoàn thành", overdue: "🔴 Quá hạn" };
    const prioMap = { low: "Thấp", medium: "Trung bình", high: "Cao", urgent: "🚨 Khẩn cấp" };

    let text = `${prefix}\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💼 Công việc: <b>${tg.escHtml(job.title)}</b>\n`;
    if (job.assignee) text += `👤 Phụ trách: <b>${tg.escHtml(job.assignee)}</b>\n`;
    text += `⏳ Thời gian: <b>${startStr}</b> → <b>${endStr}</b>\n`;
    text += `🚦 Trạng thái: <b>${statusMap[job.status] || job.status}</b> | Mức độ: <b>${prioMap[job.priority] || job.priority}</b>\n`;
    if (job.attached_docs) text += `📄 Tài liệu: ${tg.escHtml(job.attached_docs)}\n`;
    if (job.tools_needed) text += `🛠 Công cụ: ${tg.escHtml(job.tools_needed)}\n`;
    
    if (req.body.note) {
      text += `\n📝 <b>Ghi chú người gửi:</b>\n<i>${tg.escHtml(req.body.note)}</i>`;
    }

    const results = await tg.sendToMany(token, ids, text);
    res.json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/notifications/stats ─────────────────────────────────
router.get("/stats", async (req, res) => {
  if (!mongoOk()) return res.status(503).json({ error: "MongoDB chưa kết nối." });
  try {
    const surveys = await Survey.find({}).sort({ createdAt: -1 }).limit(200).lean();
    let totalCrit = 0, totalMaj = 0, totalGood = 0, totalScored = 0;
    const overdue = [], urgent = [], upcoming = [];

    for (const s of surveys) {
      const scored = Object.values(s.responses || {}).filter(v => v && (v.score || 0) > 0);
      totalScored += scored.length;
      totalCrit   += scored.filter(v => (v.score || 0) === 1).length;
      totalMaj    += scored.filter(v => (v.score || 0) === 2).length;
      totalGood   += scored.filter(v => (v.score || 0) >= 4).length;
      const dTo   = tg.daysUntil((s.audit_plan || {}).to_date);
      if (dTo !== null && dTo < 0)       overdue.push(s._id);
      else if (dTo !== null && dTo <= 3) urgent.push(s._id);
      else if (dTo !== null && dTo <= 14) upcoming.push(s._id);
    }
    res.json({ total: surveys.length, totalScored, totalCrit, totalMaj, totalGood,
               overdueCount: overdue.length, urgentCount: urgent.length, upcomingCount: upcoming.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Helpers ───────────────────────────────────────────────────────
function normalizeChatIdsObjects(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(item => {
      if (typeof item === 'object' && item !== null) return item;
      const s = String(item).trim();
      if (!s) return null;
      return {
        chatId: s,
        title: s,
        notify_auditors: true,
        notify_gap_plans: true,
        notify_gap_results: true,
        notify_kanban: true,
        notify_calendar: true
      };
    }).filter(Boolean);
  }
  return String(raw).split(",").map(s => {
    const trimmed = s.trim();
    if(!trimmed) return null;
    return {
        chatId: trimmed,
        title: trimmed,
        notify_auditors: true,
        notify_gap_plans: true,
        notify_gap_results: true,
        notify_kanban: true,
        notify_calendar: true
    };
  }).filter(Boolean);
}

function isValidTokenFormat(token) {
  return /^\d{8,12}:[A-Za-z0-9_-]{35,}$/.test(token);
}

async function resolveToken(bodyOrQueryToken) {
  if (bodyOrQueryToken && String(bodyOrQueryToken).trim()) return String(bodyOrQueryToken).trim();
  try {
    if (!mongoOk()) return null;
    const doc = await Settings.findOne({ key: "telegram" }).lean();
    return doc?.value?.botToken || null;
  } catch (_) { return null; }
}

async function resolveTokenAndIds(body = {}) {
  const token = await resolveToken(body.botToken);
  let ids = tg.normalizeChatIds(body.chatIds || body.chatId);
  if (!ids.length && mongoOk()) {
    try {
      const doc = await Settings.findOne({ key: "telegram" }).lean();
      const cfg = doc?.value || {};
      ids = tg.normalizeChatIds(cfg.chatIds || cfg.chatId);
    } catch (_) {}
  }
  return { token, ids };
}

module.exports = router;
