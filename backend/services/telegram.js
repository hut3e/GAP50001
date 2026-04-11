/**
 * ISO 50001 GAP — Telegram Bot API Service
 * Giao tiếp với Telegram Bot API qua https built-in (không cần thư viện ngoài)
 */
const https = require("https");

// ── HTTP helper ───────────────────────────────────────────────────
function callTelegramAPI(botToken, method, payload = {}, httpMethod = "POST") {
  return new Promise((resolve, reject) => {
    const body = httpMethod === "POST" ? JSON.stringify(payload) : null;
    const qs   = httpMethod === "GET"
      ? "?" + Object.entries(payload).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&")
      : "";

    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${botToken}/${method}${qs}`,
      method: httpMethod,
      headers: body ? {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      } : {},
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ok) resolve(parsed.result);
          else {
            const err = new Error(parseTelegramError(parsed));
            err.code = parsed.error_code;
            err.description = parsed.description;
            reject(err);
          }
        } catch (_) {
          reject(new Error("Telegram API trả về dữ liệu không hợp lệ."));
        }
      });
    });

    req.on("error", e => reject(new Error("Lỗi kết nối Telegram: " + e.message)));
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Telegram API timeout (>15s). Kiểm tra kết nối mạng.")); });

    if (body) req.write(body);
    req.end();
  });
}

/** Dịch mã lỗi Telegram sang tiếng Việt dễ hiểu */
function parseTelegramError(parsed) {
  const desc = parsed.description || "";
  const code = parsed.error_code;
  if (code === 401 || desc.includes("Unauthorized")) return "Bot Token không hợp lệ. Kiểm tra lại token từ @BotFather.";
  if (code === 400 && desc.includes("chat not found")) return "Chat ID không tồn tại hoặc bot chưa được thêm vào nhóm/channel.";
  if (code === 403 && desc.includes("bot was blocked")) return "Bot bị người dùng block. Người dùng cần /start lại với bot.";
  if (code === 403 && desc.includes("not a member")) return "Bot chưa là thành viên của nhóm/channel này.";
  if (code === 429) return "Gửi quá nhanh (rate limit). Thử lại sau vài giây.";
  if (desc.includes("message is too long")) return "Tin nhắn quá dài (>4096 ký tự).";
  return desc || `Lỗi Telegram API (${code})`;
}

// ── Bot info ──────────────────────────────────────────────────────
/** Lấy thông tin bot: id, username, first_name */
async function getBotInfo(botToken) {
  const me = await callTelegramAPI(botToken, "getMe", {}, "GET");
  return {
    id:         me.id,
    username:   me.username,
    firstName:  me.first_name,
    canJoinGroups: me.can_join_groups,
    supportsInline: me.supports_inline_queries,
  };
}

// ── Discover chats ────────────────────────────────────────────────
/**
 * Lấy danh sách các chat đã từng nhắn bot (qua getUpdates).
 * Trả về mảng { chatId, title, type, username }.
 * Lưu ý: chỉ hoạt động nếu không đang dùng webhook.
 */
async function getAvailableChats(botToken) {
  const updates = await callTelegramAPI(botToken, "getUpdates", { limit: 100 }, "GET");
  const seen = new Map();

  for (const u of (updates || [])) {
    const chat = u.message?.chat || u.channel_post?.chat || u.my_chat_member?.chat;
    if (!chat) continue;
    const key = String(chat.id);
    if (!seen.has(key)) {
      seen.set(key, {
        chatId:   key,
        title:    chat.title || chat.first_name || chat.username || key,
        type:     chat.type,           // private | group | supergroup | channel
        username: chat.username || "",
      });
    }
  }

  return Array.from(seen.values());
}

// ── Send helpers ──────────────────────────────────────────────────
/** Gửi tin nhắn HTML tới một chat */
async function sendMessage(botToken, chatId, text, parseMode = "HTML") {
  // Cắt nếu vượt 4096 ký tự (giới hạn Telegram)
  const safe = text.length > 4000 ? text.slice(0, 3997) + "…" : text;
  return callTelegramAPI(botToken, "sendMessage", {
    chat_id:                  chatId,
    text:                     safe,
    parse_mode:               parseMode,
    disable_web_page_preview: true,
  });
}

/**
 * Gửi tới nhiều chatId cùng lúc, trả về kết quả từng cái.
 * Tự động delay 350ms giữa các tin để tránh rate-limit.
 */
async function sendToMany(botToken, chatIds, text, parseMode = "HTML") {
  const results = [];
  for (const chatId of chatIds) {
    try {
      const r = await sendMessage(botToken, String(chatId).trim(), text, parseMode);
      results.push({ chatId, ok: true, message_id: r.message_id });
    } catch (e) {
      results.push({ chatId, ok: false, error: e.message });
    }
    await delay(350);
  }
  return results;
}

// ── Formatters ────────────────────────────────────────────────────
function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch (_) { return String(d); }
}

function fmtDateTime() {
  const now = new Date();
  return now.toLocaleDateString("vi-VN") + " " + now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / 864e5);
  } catch (_) { return null; }
}

function calcAvgScore(survey) {
  const r = survey.responses || {};
  const entries = Object.values(r).filter(v => v && (v.score || 0) > 0);
  if (!entries.length) return null;
  return (entries.reduce((a, v) => a + (v.score || 0), 0) / entries.length).toFixed(1);
}

// ── Message builders ──────────────────────────────────────────────
const STATUS_LABELS = {
  planning:    "📌 Lên kế hoạch",
  in_progress: "⚡ Đang thực hiện",
  review:      "🔍 Chờ duyệt",
  completed:   "✅ Hoàn thành",
  overdue:     "🔴 Quá hạn",
};

function buildSurveyMessage(survey, opts = {}) {
  const client = survey.client || {};
  const meta   = survey.meta   || {};
  const ap     = survey.audit_plan || {};
  const r      = survey.responses  || {};

  const scored   = Object.values(r).filter(v => v && (v.score || 0) > 0);
  const crit     = scored.filter(v => (v.score || 0) === 1).length;
  const maj      = scored.filter(v => (v.score || 0) === 2).length;
  const good     = scored.filter(v => (v.score || 0) >= 4).length;
  const avgScore = calcAvgScore(survey);
  const auditors = (ap.auditors || []).map(a => a.name || a).filter(Boolean).join(", ") || "—";

  const daysTo = daysUntil(ap.to_date);

  let urgencyIcon = "📋";
  if (daysTo !== null && daysTo < 0)        urgencyIcon = "🔴";
  else if (daysTo !== null && daysTo <= 3)  urgencyIcon = "🚨";
  else if (daysTo !== null && daysTo <= 7)  urgencyIcon = "⚠️";
  else if (daysTo !== null && daysTo <= 14) urgencyIcon = "🔔";

  const deadlineStr = daysTo !== null
    ? (daysTo < 0 ? `🔴 QUÁ HẠN ${Math.abs(daysTo)} ngày` : `⏳ Còn ${daysTo} ngày`)
    : "";

  const lines = [
    `${urgencyIcon} <b>${escHtml(client.name || "—")}</b>`,
    meta.ref_no ? `📌 Mã: <code>${escHtml(meta.ref_no)}</code>` : "",
    client.industry ? `🏭 Ngành: ${escHtml(client.industry)}` : "",
    "",
    "<b>📅 Kế hoạch đánh giá GAP:</b>",
    `  Từ: <b>${fmtDate(ap.from_date)}</b>  →  Đến: <b>${fmtDate(ap.to_date)}</b>`,
    deadlineStr ? `  ${deadlineStr}` : "",
    `  👥 Auditors: ${escHtml(auditors)}`,
    (ap.from_city || ap.to_city) ? `  🗺️ ${escHtml(ap.from_city || "")} → ${escHtml(ap.to_city || "")}` : "",
    "",
    "<b>📊 Kết quả GAP ISO 50001:</b>",
    avgScore ? `  ⭐ Điểm TB: <b>${avgScore}/5</b>` : "  ⭐ Điểm TB: chưa đánh giá",
    crit > 0  ? `  🔴 Nghiêm trọng: <b>${crit}</b> ĐK` : "  ✅ Không có gap nghiêm trọng",
    maj  > 0  ? `  🟠 Gap lớn: <b>${maj}</b> ĐK`        : "",
    good > 0  ? `  🟢 Đáp ứng tốt: <b>${good}</b> ĐK`   : "",
    `  📝 Action plan: <b>${(survey.action_plan || []).length}</b> mục`,
    `  🏭 Hiện trường: <b>${(survey.site_assessments || []).length}</b> địa điểm`,
  ];

  if (opts.kanban_status) {
    lines.push("", `<b>Trạng thái:</b> ${STATUS_LABELS[opts.kanban_status] || opts.kanban_status}`);
  }

  return lines.filter(l => l !== "" || lines.indexOf(l) === 0).join("\n").replace(/\n{3,}/g, "\n\n");
}

function buildDigest(surveys, isWeekly = false) {
  const header = isWeekly
    ? `🗓️ <b>BÁO CÁO TUẦN — ISO 50001 GAP TRACKER</b>`
    : `☀️ <b>BÁO CÁO NGÀY — ISO 50001 GAP TRACKER</b>`;

  const overdue  = surveys.filter(s => { const d = daysUntil((s.audit_plan||{}).to_date); return d !== null && d < 0; });
  const urgent   = surveys.filter(s => { const d = daysUntil((s.audit_plan||{}).to_date); return d !== null && d >= 0 && d <= 3; });
  const upcoming = surveys.filter(s => { const d = daysUntil((s.audit_plan||{}).to_date); return d !== null && d > 3 && d <= 14; });

  const totalCrit  = surveys.reduce((a,s) => a + Object.values(s.responses||{}).filter(v=>(v?.score||0)===1).length, 0);
  const totalMaj   = surveys.reduce((a,s) => a + Object.values(s.responses||{}).filter(v=>(v?.score||0)===2).length, 0);
  const totalScored= surveys.reduce((a,s) => a + Object.values(s.responses||{}).filter(v=>(v?.score||0)>0).length, 0);

  const summary = [
    header,
    `📅 ${fmtDateTime()}`,
    "",
    "<b>📈 Tổng quan hệ thống:</b>",
    `  Tổng phiên GAP: <b>${surveys.length}</b>`,
    `  🔴 Quá hạn: <b>${overdue.length}</b>  |  🚨 Khẩn ≤3n: <b>${urgent.length}</b>  |  🔔 Sắp ≤14n: <b>${upcoming.length}</b>`,
    `  ⚠️ Gap NT toàn hệ thống: <b>${totalCrit}</b>  |  🟠 Gap lớn: <b>${totalMaj}</b>`,
    `  📋 Điều khoản đã đánh giá: <b>${totalScored}</b>`,
  ].join("\n");

  const sections = [summary];

  if (overdue.length) {
    sections.push(`\n🔴 <b>QUÁ HẠN (${overdue.length} phiên):</b>`);
    overdue.slice(0, 5).forEach(s => sections.push(buildSurveyMessage(s)));
    if (overdue.length > 5) sections.push(`<i>...và ${overdue.length - 5} phiên khác</i>`);
  }
  if (urgent.length) {
    sections.push(`\n🚨 <b>KHẨN CẤP — ≤3 ngày (${urgent.length} phiên):</b>`);
    urgent.slice(0, 5).forEach(s => sections.push(buildSurveyMessage(s)));
  }
  if (upcoming.length) {
    sections.push(`\n🔔 <b>SẮP ĐẾN — ≤14 ngày (${upcoming.length} phiên):</b>`);
    upcoming.slice(0, 3).forEach(s => sections.push(buildSurveyMessage(s)));
  }

  return sections;
}

// ── High-level senders ────────────────────────────────────────────
async function sendDigest(botToken, chatIds, surveys, opts = {}) {
  const ids = normalizeChatIds(chatIds);
  const sections = buildDigest(surveys, opts.isWeekly);
  const allResults = [];

  for (const section of sections) {
    if (!section.trim()) continue;
    const r = await sendToMany(botToken, ids, section);
    allResults.push(...r);
    await delay(400);
  }
  return allResults;
}

async function sendDeadlineAlert(botToken, chatIds, survey) {
  const ids = normalizeChatIds(chatIds);
  const msg = `🔔 <b>CẢNH BÁO DEADLINE GAP</b>\n\n${buildSurveyMessage(survey)}`;
  return sendToMany(botToken, ids, msg);
}

/** Chuẩn hoá chatIds: mảng object, string đơn, mảng string, hoặc chuỗi phân tách bởi dấu phẩy */
function normalizeChatIds(chatIds, filterType) {
  if (!chatIds) return [];
  let items = [];
  if (Array.isArray(chatIds)) items = chatIds;
  else if (typeof chatIds === "string") items = String(chatIds).split(",").map(s => s.trim()).filter(Boolean);

  return items.map(item => {
    if (typeof item === "object" && item !== null) {
      if (filterType && item[filterType] === false) return null;
      return item.chatId || null;
    }
    return String(item).trim();
  }).filter(Boolean);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Exports ───────────────────────────────────────────────────────
module.exports = {
  getBotInfo,
  getAvailableChats,
  sendMessage,
  sendToMany,
  sendDigest,
  sendDeadlineAlert,
  buildSurveyMessage,
  buildDigest,
  normalizeChatIds,
  daysUntil,
  calcAvgScore,
  escHtml,
  fmtDate,
  fmtDateTime,
  parseTelegramError: (d) => parseTelegramError({ description: d }),
};
