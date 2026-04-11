/**
 * ISO50001Gap — gap.docx.clauses.js
 * Builds §4–§10 detailed gap assessment sections with
 * per-item scoring, evidence, findings, legal refs, and action plan
 */
const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, HeadingLevel, TableLayoutType,
} = require("docx");
const {
  C, cb, sh, CMs, CM, TW,
  scoreColor, scoreBg, scoreLabel,
  P, H1, H2, H3, SP, PBR, LINE,
  TH, TR, KV, ScoreCell,
} = require("./gap.docx.helpers");
const { GAP_CHECKLIST: DEFAULT_CHECKLIST } = require("./gap.constants");

const CLAUSES = [
  { num:"§4", name:"Bối cảnh của tổ chức",         color:C.blue,   subs:["4.1","4.2","4.3","4.4"] },
  { num:"§5", name:"Sự lãnh đạo",                  color:C.violet, subs:["5.1","5.2","5.3"] },
  { num:"§6", name:"Hoạch định",                color:C.teal,   subs:["6.1","6.2","6.3","6.4","6.5","6.6"] },
  { num:"§7", name:"Hỗ trợ",                    color:C.green,  subs:["7.1","7.2","7.3","7.4","7.5"] },
  { num:"§8", name:"Thực hiện",                  color:C.orange, subs:["8.1","8.2","8.3"] },
  { num:"§9", name:"Đánh giá kết quả thực hiện",color:C.red,    subs:["9.1","9.2","9.3"] },
  { num:"§10",name:"Cải tiến",                  color:C.navy,   subs:["10.1","10.2"] },
];
const SUB_NAMES = {
  "4.1":"Hiểu tổ chức và bối cảnh của tổ chức","4.2":"Hiểu nhu cầu và mong đợi của các bên quan tâm","4.3":"Xác định phạm vi của hệ thống quản lý năng lượng","4.4":"Hệ thống quản lý năng lượng",
  "5.1":"Sự lãnh đạo và cam kết","5.2":"Chính sách năng lượng","5.3":"Vai trò, trách nhiệm và quyền hạn trong tổ chức",
  "6.1":"Hành động giải quyết rủi ro và cơ hội","6.2":"Mục tiêu, chỉ tiêu năng lượng và hoạch định để đạt được mục tiêu và chỉ tiêu","6.3":"Xem xét năng lượng",
  "6.4":"Chỉ số kết quả thực hiện năng lượng","6.5":"Đường cơ sở năng lượng","6.6":"Hoạch định việc thu thập dữ liệu năng lượng",
  "7.1":"Nguồn lực","7.2":"Năng lực","7.3":"Nhận thức","7.4":"Trao đổi thông tin","7.5":"Thông tin dạng văn bản",
  "8.1":"Hoạch định và kiểm soát việc thực hiện","8.2":"Thiết kế","8.3":"Mua sắm",
  "9.1":"Theo dõi, đo lường, phân tích và đánh giá kết quả thực hiện năng lượng và EnMS","9.2":"Đánh giá nội bộ","9.3":"Xem xét của lãnh đạo",
  "10.1":"Sự không phù hợp và hành động khắc phục","10.2":"Cải tiến liên tục",
};
const CAT_LABELS = { doc:"📄 Tài liệu", practice:"⚙️ Thực hành", measurement:"📊 Đo lường", leadership:"👥 Lãnh đạo", legal:"⚖️ Pháp lý" };

// ── Build one checklist row ────────────────────────────────────────
function buildItemRow(item, resp, idx) {
  const r    = resp[item.id] || {};
  const sc   = r.score ?? 0;
  const scol = scoreColor(sc);
  const sbg  = scoreBg(sc);
  const rec  = r.recommendation || deriveRec(item, sc);
  
  const scoreMsg = sc===0 ? "—" : `[Điểm sơ bộ: ${sc}/5 - ${scoreLabel(sc)}]`;
  const extraNotesArray = Array.isArray(r.extra_notes) ? r.extra_notes.filter(n => n.trim()) : [];
  let noteCol = r.note || "—";
  let ghiChuCol = scoreMsg;
  if (extraNotesArray.length > 0) {
    ghiChuCol += "\n\n• " + extraNotesArray.join("\n• ");
  }

  const multiLineP = (text, o={}) => {
    const parts = String(text||"").split('\n');
    return new Paragraph({
      alignment: o.c ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before:40, after:40, line:276 },
      children: parts.map((part, index) => new TextRun({
        text: part, font:"Times New Roman", size:o.sz||24,
        bold: !!o.bold, color:o.col||C.black, break: index > 0 ? 1 : 0
      }))
    });
  };

  return new TableRow({ children:[
    new TableCell({ width:{size:2760,type:WidthType.DXA}, borders:cb(), shading:sh(idx%2?C.white:C.ash), margins:CMs,
      children:[
        new Paragraph({ spacing:{before:40,after:40}, children:[
          new TextRun({ text:`${item.id}. `, font:"Times New Roman", size:24, bold:true, color:C.blue }),
          new TextRun({ text:item.title, font:"Times New Roman", size:24, color:C.black }),
          ...(item.legal ? [
            new TextRun({ text:`[Pháp lý: ${item.legal}]`, font:"Times New Roman", size:22, italic:true, color:C.red, break: 1 }),
          ] : []),
        ]})
      ]}),
    new TableCell({ width:{size:2400,type:WidthType.DXA}, borders:cb(), shading:sh(idx%2?C.white:C.ash), margins:CMs,
      children:[multiLineP(noteCol, {sz:24,col:C.black})]}),
    new TableCell({ width:{size:2600,type:WidthType.DXA}, borders:cb(), shading:sh(C.white), margins:CMs,
      children:[multiLineP(sc > 0 && sc <= 3 ? rec : (sc >= 4 ? "Đã đáp ứng yêu cầu. Tiếp tục duy trì." : "Chưa đánh giá"), {sz:24,col:C.black})]}),
    new TableCell({ width:{size:1600,type:WidthType.DXA}, borders:cb(), shading:sh(sbg), margins:CMs,
      children:[multiLineP(ghiChuCol, {sz:22,col:C.grey1})]}),
  ]});
}

// ── Action plan rows for a clause ─────────────────────────────────
function buildActionRows(items, resp, clauseIdx) {
  const gaps = items.filter(i => (resp[i.id]?.score||0) > 0 && (resp[i.id]?.score||0) <= 3);
  if (!gaps.length) return [];
  const rows = [TH(["Mã","Yêu cầu","Score","Đề xuất hành động","Deadline","Ưu tiên"],[700,3000,900,2800,1000,960])];
  gaps.forEach((item, i) => {
    const sc  = resp[item.id]?.score||0;
    const rec = resp[item.id]?.recommendation || deriveRec(item, sc);
    const dl  = resp[item.id]?.deadline || (sc===1?"30 ngày":sc===2?"90 ngày":"180 ngày");
    
    let parsedDays = 180;
    const m = dl.match(/(\d+)/);
    if (m) parsedDays = parseInt(m[1], 10);
    
    let pr = "🟢 6T";
    let pcol= C.green;
    let pBg = C.lGreen;
    if (parsedDays <= 30) {
      pr = "🔴 1T";
      pcol = C.red;
      pBg = C.lRed;
    } else if (parsedDays <= 90) {
      pr = "🟡 3T";
      pcol = C.orange;
      pBg = C.lYellow;
    }

    rows.push(new TableRow({ children:[
      new TableCell({ width:{size:700},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.id,{sz:24,bold:true,col:C.blue})]}),
      new TableCell({ width:{size:3000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.title,{sz:24})]}),
      new TableCell({ width:{size:900},  borders:cb(), shading:sh(scoreBg(sc)), margins:CMs, children:[P(scoreLabel(sc),{sz:24,bold:true,c:true,col:scoreColor(sc)})]}),
      new TableCell({ width:{size:2800}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(rec,{sz:24})]}),
      new TableCell({ width:{size:1000}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(dl,{sz:24,col:C.orange})]}),
      new TableCell({ width:{size:960},  borders:cb(), shading:sh(pBg), margins:CMs, children:[P(pr,{sz:24,bold:true,c:true,col:pcol})]}),
    ]}));
  });
  return rows;
}

function deriveRec(item, sc) {
  if (sc <= 1) return `Xây dựng và ban hành ngay: "${item.title}". Giao EMR chịu trách nhiệm, hoàn thành trong 30 ngày.`;
  if (sc <= 2) return `Hoàn thiện và bổ sung: "${item.title}". Lên kế hoạch hành động cụ thể trong 90 ngày.`;
  return `Cải thiện và chuẩn hóa: "${item.title}". Xem xét trong chu kỳ cải tiến tiếp theo (6 tháng).`;
}

// ── Build one clause section ──────────────────────────────────────
function buildClauseSection(cl, resp, secNum, checklist = DEFAULT_CHECKLIST) {
  const items = [];
  const allClItems = checklist.filter(i => i.clause.startsWith(cl.num.replace("§","")));
  if (!allClItems.length) return items;

  const validItems = allClItems.filter(i => (resp[i.id]?.score || 0) > 0);
  let avgScore = 0;
  if(validItems.length > 0) {
     const totalWeight = validItems.reduce((acc, i) => acc + (i.weight || 1), 0);
     const weightedSum = validItems.reduce((acc, i) => acc + (resp[i.id].score * (i.weight || 1)), 0);
     avgScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  }
  const avgInt   = Math.round(avgScore);
  const priorityGapsCount = validItems.filter(i => resp[i.id].score <= 2).length;

  items.push(H1(`${secNum}. ĐÁNH GIÁ ${cl.num} — ${cl.name.toUpperCase()}`));
  // Score status bar
  items.push(new Paragraph({ spacing:{before:60,after:80}, shading:sh(scoreBg(avgInt)),
    children:[
      new TextRun({ text:"ĐIỂM TỔNG KHOẢN: ", font:"Times New Roman", size:24, bold:true, color:C.grey1 }),
      new TextRun({ text:avgScore.toFixed(1), font:"Times New Roman", size:26, bold:true, color:scoreColor(avgInt) }),
      new TextRun({ text:` / 5.0  |  ${scoreLabel(avgInt)}`, font:"Times New Roman", size:24, color:scoreColor(avgInt) }),
      new TextRun({ text:`  |  ${priorityGapsCount} khoảng cách cần ưu tiên`, font:"Times New Roman", size:24, color:C.grey2 }),
    ],
  }));
  items.push(SP());

    let subCounter = 1;
  // Narrative overview
  const clResp = resp[`overview_${cl.num}`];
  if (clResp?.note) {
    items.push(H2(`${secNum}.${subCounter}. Nhận xét tổng quan`));
    items.push(P(clResp.note,{sz:24,b:60,a:80,l:308})); // 12pt
    subCounter++;
  }

  // Per sub-clause detail
  cl.subs.forEach((sub, si) => {
    const subItems = allClItems.filter(i => i.clause === sub);
    if (!subItems.length) return;
    const vSubItems = subItems.filter(i => (resp[i.id]?.score || 0) > 0);
    let subAvg = 0;
    if(vSubItems.length > 0) {
       const subWeight = vSubItems.reduce((acc, i) => acc + (i.weight || 1), 0);
       const subSum = vSubItems.reduce((acc, i) => acc + (resp[i.id].score * (i.weight || 1)), 0);
       subAvg = Math.round((subSum / subWeight) * 10) / 10;
    }
    const subInt    = Math.round(subAvg);
    const subCol    = scoreColor(subInt);

    items.push(new Paragraph({ spacing:{before:120,after:0}, shading:sh(scoreBg(subInt)),
      heading: HeadingLevel.HEADING_2,
      border:{ left:{ style:BorderStyle.SINGLE, size:24, color:subCol, space:3 }},
      children:[
        new TextRun({ text:`${secNum}.${subCounter}. Đánh giá `, font:"Times New Roman", size:26, bold:true, color:subCol }),
        new TextRun({ text:`${sub} `, font:"Times New Roman", size:26, bold:true, color:subCol }),
        new TextRun({ text:SUB_NAMES[sub]||sub, font:"Times New Roman", size:26, bold:true, color:C.navy }), // 13pt
        new TextRun({ text:`   [Điểm: ${subAvg.toFixed(1)}/5.0 — ${scoreLabel(subInt)}]`, font:"Times New Roman", size:24, bold:true, color:subCol }),
      ],
    }));
    subCounter++;
    // Checklist items table
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[2760, 2400, 2600, 1600],
      rows:[
        TH(["Các yêu cầu theo tiêu chuẩn ISO 50001:2018","Mô tả hiện trạng doanh nghiệp","Yêu cầu khi áp dụng HTQLNL","Ghi chú"],[2760, 2400, 2600, 1600]),
        ...subItems.map((it,idx) => buildItemRow(it, resp, idx)),
      ],
    }));
    items.push(SP());
  });

  // Action plan table
  const apRows = buildActionRows(allClItems, resp, secNum);
  if (apRows.length > 1) {
    items.push(H2(`${secNum}.${subCounter}. Kế hoạch hành động khắc phục khoảng cách — ${cl.num}`));
    items.push(P("Ghi chú phân loại mức độ ưu tiên áp dụng:", {sz:24, i:true, col:C.grey2}));
    items.push(P("• 🔴 1T: Khắc phục ngay lập tức trong vòng 1 tháng (Deadline <= 30 ngày).", {sz:22, i:true, col:C.grey2, l:308}));
    items.push(P("• 🟡 3T: Khắc phục trung hạn trong vòng 3 tháng (Deadline <= 90 ngày).", {sz:22, i:true, col:C.grey2, l:308}));
    items.push(P("• 🟢 6T: Khắc phục dài hạn trong vòng 6 tháng (Deadline > 90 ngày).", {sz:22, i:true, col:C.grey2, l:308}));
    items.push(SP());
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[700,3000,900,2800,1000,960], rows:apRows }));
    subCounter++;
  }
  items.push(SP(), PBR());
  return items;
}

// ── Build all clause sections ─────────────────────────────────────
function buildAllClauses(d, startSec=3, checklist = DEFAULT_CHECKLIST) {
  return CLAUSES.flatMap((cl, i) => buildClauseSection(cl, d.responses||{}, i+startSec, checklist));
}

module.exports = { buildAllClauses, buildClauseSection };
