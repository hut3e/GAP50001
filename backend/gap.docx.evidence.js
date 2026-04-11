/**
 * Bằng chứng theo điều khoản — tích hợp vào DOCX
 * Ảnh: bố trí theo bảng 2 cột, số hàng tuỳ biến theo số ảnh (upload thư mục / Camera Laptop / Socket.IO điện thoại)
 * Auto-scale theo khổ A4 in ấn.
 */
const path = require("path");
const fs = require("fs");
const sizeOf = require("image-size");
const {
  Paragraph, Table, TableRow, TableCell, TextRun,
  WidthType, AlignmentType,
} = require("docx");
const { ImageRun } = require("docx");
const { C, cb, sh, CMs, P, H1, H2, H3, SP } = require("./gap.docx.helpers");
const { UPLOAD_ROOT } = require("./uploadConfig");

// Khổ A4: 2 ảnh/cột → mỗi ảnh max ~260px rộng để in đẹp
const MAX_IMAGE_WIDTH_PX = 260;
const MAX_IMAGE_HEIGHT_PX = 220;
const COLS_IMAGE_TABLE = 2;

function scaleDimensions(imgWidth, imgHeight) {
  if (!imgWidth || !imgHeight) return { width: MAX_IMAGE_WIDTH_PX, height: MAX_IMAGE_HEIGHT_PX };
  let w = imgWidth;
  let h = imgHeight;
  if (w > MAX_IMAGE_WIDTH_PX) {
    h = Math.round((h * MAX_IMAGE_WIDTH_PX) / w);
    w = MAX_IMAGE_WIDTH_PX;
  }
  if (h > MAX_IMAGE_HEIGHT_PX) {
    w = Math.round((w * MAX_IMAGE_HEIGHT_PX) / h);
    h = MAX_IMAGE_HEIGHT_PX;
  }
  return { width: w, height: h };
}

function isImageEvidence(ev) {
  return ev.type === "image" && /\.(jpg|jpeg|png|gif|webp)$/i.test(ev.filename || ev.originalName || "");
}

function getEvidenceFullPath(ev) {
  return path.join(UPLOAD_ROOT, ev.path || path.join(String(ev.surveyId), ev.filename));
}

/** Tạo 1 ô bảng chứa ảnh + chú thích (tên file / ghi chú) */
function buildImageCell(ev, fullPath) {
  try {
    const buf = fs.readFileSync(fullPath);
    const dimensions = sizeOf(buf);
    const { width: w, height: h } = scaleDimensions(dimensions.width, dimensions.height);
    const ext = (path.extname(ev.filename || "") || ".jpg").toLowerCase().replace(".", "") || "jpg";
    const imageType = ext === "png" ? "png" : ext === "gif" ? "gif" : ext === "bmp" ? "bmp" : "jpg";
    const caption = [ev.originalName || ev.filename || "—"].concat(ev.note ? [ev.note] : []).join(" — ");
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 40 },
        children: [
          new ImageRun({
            data: buf,
            transformation: { width: w, height: h },
            type: imageType,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({ text: caption, font: "Arial", size:24, color: C.grey1 }),
        ],
      }),
    ];
  } catch (err) {
    return [P("[Không đọc được ảnh: " + (ev.filename || "") + "]", { sz:24, col: C.red })];
  }
}

/** Chunk mảng thành các nhóm size n */
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function buildEvidenceSection(d, evidenceList, startSec) {
  const items = [];
  if (!evidenceList || evidenceList.length === 0) return items;

  const byClause = {};
  evidenceList.forEach((ev) => {
    const key = ev.clauseId || "Khác";
    if (!byClause[key]) byClause[key] = [];
    byClause[key].push(ev);
  });
  const clauses = Object.keys(byClause).sort();

  items.push(H1(`${startSec}. BẰNG CHỨNG THEO ĐIỀU KHOẢN ĐÁNH GIÁ`));
  items.push(P("Các tài liệu và ảnh bằng chứng thu thập tại hiện trường (chọn file / Camera Laptop / đồng bộ điện thoại qua Socket.IO), gắn với từng điều khoản. Ảnh bố trí theo bảng 2 cột.", { sz:24, col: C.grey1 }));
  items.push(SP());

  for (const clauseId of clauses) {
    const list = byClause[clauseId];
    if (!list.length) continue;

    const imageList = list.filter(isImageEvidence);
    const docList = list.filter((ev) => !isImageEvidence(ev));

    items.push(H3(`§${clauseId} — ${list.length} bằng chứng`));

    // ── Bảng 2 cột cho ảnh (số hàng tuỳ biến) ─────────────────────
    if (imageList.length > 0) {
      const rowPairs = chunk(imageList, COLS_IMAGE_TABLE);
      const colWidth = Math.floor(9360 / COLS_IMAGE_TABLE); // TW=9360, 2 cột
      const rows = [];

      for (const pair of rowPairs) {
        const cells = [];
        for (let i = 0; i < COLS_IMAGE_TABLE; i++) {
          const ev = pair[i];
          if (!ev) {
            cells.push(new TableCell({
              width: { size: colWidth, type: WidthType.DXA },
              borders: cb(),
              shading: sh(C.ash),
              margins: CMs,
              children: [P("—", { sz:24, col: C.grey3, c: true })],
            }));
            continue;
          }
          const fullPath = getEvidenceFullPath(ev);
          const cellContent = fs.existsSync(fullPath)
            ? buildImageCell(ev, fullPath)
            : [P("[File không tồn tại: " + (ev.filename || "") + "]", { sz:24, col: C.red })];
          cells.push(new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            borders: cb(),
            shading: sh(C.white),
            margins: CMs,
            children: cellContent,
          }));
        }
        rows.push(new TableRow({ children: cells }));
      }

      items.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: Array(COLS_IMAGE_TABLE).fill(colWidth),
        rows,
      }));
      items.push(SP());
    }

    // ── Tài liệu (không phải ảnh): bảng 1 hàng per doc ─────────────
    if (docList.length > 0) {
      const docRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ width: { size: 4680, type: WidthType.DXA }, borders: cb(), shading: sh(C.blue), margins: CMs, children: [P("Tài liệu đính kèm", { sz:24, bold: true, col: C.white, c: true })] }),
            new TableCell({ width: { size: 4680, type: WidthType.DXA }, borders: cb(), shading: sh(C.blue), margins: CMs, children: [P("Ghi chú", { sz:24, bold: true, col: C.white, c: true })] }),
          ],
        }),
      ];
      for (const ev of docList) {
        docRows.push(new TableRow({
          children: [
            new TableCell({ width: { size: 4680, type: WidthType.DXA }, borders: cb(), shading: sh(C.ash), margins: CMs, children: [P("📄 " + (ev.originalName || ev.filename || "—"), { sz:24 })] }),
            new TableCell({ width: { size: 4680, type: WidthType.DXA }, borders: cb(), shading: sh(C.white), margins: CMs, children: [P(ev.note || "—", { sz:24 })] }),
          ],
        }));
      }
      items.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: docRows,
      }));
      items.push(SP());
    }
  }

  return items;
}

module.exports = { buildEvidenceSection };
