/**
 * Telegram Bot Service — gọi Bot API qua HTTPS (không cần thư viện ngoài)
 */
const https = require("https");
const AppSettings = require("./models/AppSettings");

async function getSettings() {
  const s = await AppSettings.findOne({ key: "default" }).lean();
  return s?.telegram || { bot_token: "", chat_id: "", enabled: false };
}

function httpsPost(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try { resolve(JSON.parse(raw)); } catch { resolve({ ok: false, raw }); }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/** Gửi một tin nhắn Markdown tới Telegram */
async function sendMessage(text, token, chatId) {
  if (!token || !chatId) return { ok: false, error: "Chưa cấu hình Bot Token hoặc Chat ID" };
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  return httpsPost(url, { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true });
}

/** Gửi message tự động dùng settings từ DB */
async function notify(text) {
  const cfg = await getSettings();
  if (!cfg.enabled || !cfg.bot_token || !cfg.chat_id) return null;
  return sendMessage(text, cfg.bot_token, cfg.chat_id);
}

/** Format 1 job thành tin nhắn */
function jobText(j, prefix = "") {
  const days = daysUntil(j.to_date);
  const daysStr = days === null ? "" : days < 0
    ? `🔴 Trễ ${Math.abs(days)} ngày`
    : days === 0 ? "⚠️ Hôm nay là deadline!"
    : days <= 3 ? `⚠️ Còn ${days} ngày`
    : `📅 Còn ${days} ngày`;
  const lead = j.lead || (j.auditors?.[0]?.name) || "—";
  return [
    prefix ? `${prefix}` : "",
    `📋 <b>${j.ref_no || "—"}</b> — ${j.customer}`,
    `🏭 Cơ sở: ${j.site || "—"}`,
    `🔬 Lead auditor: ${lead}`,
    `📆 Kế hoạch: ${j.from_date || "—"} → ${j.to_date || "—"} ${daysStr}`,
    j.stats?.scored > 0 ? `📊 GAP: ${j.stats.scored}/${j.stats.total_clauses} điều khoản | Điểm TB: ${j.stats.avg_score?.toFixed(1) || "—"} | ⚠️ Nghiêm trọng: ${j.stats.critical} | Lớn: ${j.stats.major}` : "",
  ].filter(Boolean).join("\n");
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  // support DD/MM/YYYY or YYYY-MM-DD
  let d;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [dd, mm, yy] = dateStr.split("/");
    d = new Date(`${yy}-${mm}-${dd}`);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d)) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}

/** Gửi daily digest */
async function sendDailyDigest(jobs) {
  const cfg = await getSettings();
  if (!cfg.enabled || !cfg.digest_enabled || !cfg.bot_token || !cfg.chat_id) return;

  const overdue = jobs.filter(j => j.status !== "completed" && daysUntil(j.to_date) !== null && daysUntil(j.to_date) < 0);
  const upcoming = jobs.filter(j => j.status !== "completed" && daysUntil(j.to_date) !== null && daysUntil(j.to_date) >= 0 && daysUntil(j.to_date) <= (cfg.notify_upcoming_days || 3));
  const inprog = jobs.filter(j => j.status === "in_progress");

  const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  let msg = `🌅 <b>BÁO CÁO HẰNG NGÀY — ISO 50001 GAP</b>\n⏰ ${now}\n\n`;
  msg += `📊 Tổng quan: ${jobs.length} kế hoạch | 🔄 Đang thực hiện: ${inprog.length} | 🔴 Trễ hạn: ${overdue.length} | ⚠️ Sắp đến hạn: ${upcoming.length}\n`;

  if (overdue.length > 0) {
    msg += `\n🔴 <b>TRỄ HẠN (${overdue.length})</b>\n${"─".repeat(30)}\n`;
    overdue.slice(0, 5).forEach(j => { msg += jobText(j) + "\n\n"; });
  }
  if (upcoming.length > 0) {
    msg += `\n⚠️ <b>SẮP ĐẾN HẠN (${upcoming.length})</b>\n${"─".repeat(30)}\n`;
    upcoming.slice(0, 5).forEach(j => { msg += jobText(j) + "\n\n"; });
  }
  if (overdue.length === 0 && upcoming.length === 0) {
    msg += "\n✅ Không có kế hoạch trễ hạn hoặc sắp đến hạn.";
  }

  return sendMessage(msg.slice(0, 4096), cfg.bot_token, cfg.chat_id);
}

/** Kiểm tra và gửi cảnh báo cho job sắp/đã quá hạn */
async function checkAndNotifyJob(job) {
  const cfg = await getSettings();
  if (!cfg.enabled || !cfg.bot_token || !cfg.chat_id) return;
  const days = daysUntil(job.to_date);
  if (days === null) return;
  const KanbanJob = require("./models/KanbanJob");

  if (days < 0 && !job.notified_overdue) {
    await sendMessage(`🚨 <b>CẢNH BÁO TRỄ HẠN</b>\n\n${jobText(job)}`, cfg.bot_token, cfg.chat_id);
    await KanbanJob.findByIdAndUpdate(job._id, { notified_overdue: true, last_notified_at: new Date() });
  } else if (days >= 0 && days <= (cfg.notify_upcoming_days || 3) && !job.notified_upcoming) {
    await sendMessage(`⏰ <b>SẮP ĐẾN HẠN</b>\n\n${jobText(job)}`, cfg.bot_token, cfg.chat_id);
    await KanbanJob.findByIdAndUpdate(job._id, { notified_upcoming: true, last_notified_at: new Date() });
  }
}

module.exports = { sendMessage, notify, sendDailyDigest, checkAndNotifyJob, daysUntil, jobText, getSettings };
