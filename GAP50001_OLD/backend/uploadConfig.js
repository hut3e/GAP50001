/**
 * Multer config — lưu file bằng chứng theo surveyId
 * Cho phép: doc, docx, pdf, xls, xlsx, csv, jpg, jpeg, png, gif, webp
 */
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "uploads");
const ALLOWED_MIMES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_EXT = [".doc", ".docx", ".pdf", ".xls", ".xlsx", ".csv", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const surveyId = req.params.surveyId || "unknown";
    const dir = path.join(UPLOAD_ROOT, String(surveyId));
    ensureDir(UPLOAD_ROOT);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype === "image/jpeg" ? ".jpg" : ".bin");
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    cb(null, base + ext);
  },
});

function fileFilter(req, file, cb) {
  const ext = (path.extname(file.originalname) || "").toLowerCase();
  const ok = ALLOWED_MIMES.includes(file.mimetype) || ALLOWED_EXT.includes(ext);
  if (ok) cb(null, true);
  else cb(new Error("Định dạng file không được phép. Chỉ: doc, docx, pdf, xls, xlsx, csv, jpg, png, gif, webp."), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

module.exports = { upload, UPLOAD_ROOT, ensureDir };
