/**
 * ISO 50001 GAP — Scheduler Service
 * Cron jobs tự động gửi thông báo Telegram theo lịch (multi-recipients)
 *
 * Yêu cầu: npm install node-cron
 */
let cron;
try {
  cron = require("node-cron");
} catch (_) {
  console.warn("[Scheduler] node-cron chưa được cài. Chạy: npm install node-cron");
  cron = null;
}

const tg       = require("./telegram");
const Settings = require("../models/Settings");
const Survey   = require("../models/Survey");
const mongoose = require("mongoose");

const activeTasks = new Map();

// ── Helpers ───────────────────────────────────────────────────────
async function getSettings() {
  try {
    const doc = await Settings.findOne({ key: "telegram" }).lean();
    return doc?.value || {};
  } catch (_) { return {}; }
}

async function getSurveys() {
  try {
    if (mongoose.connection.readyState !== 1) return [];
    return await Survey.find({}).sort({ createdAt: -1 }).limit(200).lean();
  } catch (_) { return []; }
}


function logResult(name, results) {
  const ok   = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok);
  console.log(`[Scheduler] ${name}: gửi OK=${ok}, FAIL=${fail.length}`);
  fail.forEach(f => console.warn(`  ✗ chatId=${f.chatId}: ${f.error}`));
}

// ── Jobs ──────────────────────────────────────────────────────────
async function runDailyDigest() {
  const cfg = await getSettings();
  if (!cfg.botToken || !cfg.dailyEnabled) return;
  const ifs = tg.normalizeChatIds(cfg.chatIds || cfg.chatId, "notify_kanban");
  if (!ifs.length) return;
  console.log("[Scheduler] Chạy daily digest →", ifs.join(", "));
  const surveys = await getSurveys();
  try {
    const results = await tg.sendDigest(cfg.botToken, ifs, surveys, { isWeekly: false });
    logResult("Daily digest", results);
  } catch (e) { console.error("[Scheduler] Lỗi daily digest:", e.message); }
}

async function runWeeklyDigest() {
  const cfg = await getSettings();
  if (!cfg.botToken || !cfg.weeklyEnabled) return;
  const ifs2 = tg.normalizeChatIds(cfg.chatIds || cfg.chatId, "notify_kanban");
  if (!ifs2.length) return;
  console.log("[Scheduler] Chạy weekly digest →", ifs2.join(", "));
  const surveys = await getSurveys();
  try {
    const results = await tg.sendDigest(cfg.botToken, ifs2, surveys, { isWeekly: true });
    logResult("Weekly digest", results);
  } catch (e) { console.error("[Scheduler] Lỗi weekly digest:", e.message); }
}

async function runDeadlineAlerts() {
  const cfg = await getSettings();
  if (!cfg.botToken || !cfg.alertsEnabled) return;
  const ifs3 = tg.normalizeChatIds(cfg.chatIds || cfg.chatId, "notify_kanban");
  if (!ifs3.length) return;
  const surveys   = await getSurveys();
  const thresholds = cfg.alertDays || [1, 3, 7];

  for (const survey of surveys) {
    const ap      = survey.audit_plan || {};
    const daysTo  = tg.daysUntil(ap.to_date);
    const daysFrom = tg.daysUntil(ap.from_date);
    if (thresholds.some(t => daysTo === t || daysFrom === t)) {
      try {
        const results = await tg.sendDeadlineAlert(cfg.botToken, ifs3, survey);
        logResult(`Alert [${survey.client?.name || survey._id}]`, results);
      } catch (e) { console.error("[Scheduler] Lỗi alert:", e.message); }
    }
  }
}

// ── Cron expression builder ───────────────────────────────────────
function buildDailyCron(timeStr) {
  // timeStr: "HH:MM" → "MM HH * * *"
  const [h, m] = (timeStr || "08:00").split(":").map(Number);
  const hh = isNaN(h) ? 8 : Math.max(0, Math.min(23, h));
  const mm = isNaN(m) ? 0 : Math.max(0, Math.min(59, m));
  return `${mm} ${hh} * * *`;
}

function buildWeeklyCron(timeStr, dayOfWeek) {
  const [h, m] = (timeStr || "08:30").split(":").map(Number);
  const hh = isNaN(h) ? 8 : Math.max(0, Math.min(23, h));
  const mm = isNaN(m) ? 30 : Math.max(0, Math.min(59, m));
  const dow = Number(dayOfWeek) || 1; // 0=CN, 1=T2, ...6=T7
  return `${mm} ${hh} * * ${dow}`;
}

// ── Lifecycle ─────────────────────────────────────────────────────
async function startScheduler() {
  if (!cron) {
    console.warn("[Scheduler] Không thể khởi động — node-cron chưa cài.");
    return;
  }
  stopScheduler();

  // Lấy settings để build cron expression đúng giờ
  const cfg = await getSettings().catch(() => ({}));
  const dailyExpr  = buildDailyCron(cfg.dailyTime || "08:00");
  const weeklyExpr = buildWeeklyCron(cfg.dailyTime || "08:30", cfg.weeklyDay || "1");

  activeTasks.set("daily",  cron.schedule(dailyExpr,  runDailyDigest,  { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }));
  activeTasks.set("weekly", cron.schedule(weeklyExpr, runWeeklyDigest, { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }));
  activeTasks.set("alerts", cron.schedule("0 * * * *", runDeadlineAlerts, { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }));

  console.log("[Scheduler] ✅ Cron jobs đã khởi động:");
  console.log(`  - Daily:   ${dailyExpr}   (GMT+7)`);
  console.log(`  - Weekly:  ${weeklyExpr}  (GMT+7)`);
  console.log(`  - Alerts:  0 * * * *     (mỗi giờ, GMT+7)`);
}

function stopScheduler() {
  for (const [, task] of activeTasks) {
    try { task.stop(); } catch (_) {}
  }
  activeTasks.clear();
}

async function restartScheduler() {
  await startScheduler();
  console.log("[Scheduler] 🔄 Đã khởi động lại cron jobs.");
}

module.exports = {
  startScheduler,
  stopScheduler,
  restartScheduler,
  runDailyDigest,
  runWeeklyDigest,
  runDeadlineAlerts,
};
