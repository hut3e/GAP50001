/**
 * ISO50001Gap — gap.docx.clauses.js
 * Builds §4–§10 detailed gap assessment sections with
 * per-item scoring, evidence, findings, legal refs, and action plan
 */
const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType,
} = require("docx");
const {
  C, cb, sh, CMs, CM, TW,
  scoreColor, scoreBg, scoreLabel,
  P, H1, H2, H3, SP, PBR, LINE,
  TH, TR, KV, ScoreCell,
} = require("./gap.docx.helpers");
const { GAP_CHECKLIST } = require("./gap.constants");

const CLAUSES = [
  { num:"§4", name:"Bối cảnh tổ chức",         color:C.blue,   subs:["4.1","4.2","4.3","4.4"] },
  { num:"§5", name:"Lãnh đạo",                  color:C.violet, subs:["5.1","5.2","5.3"] },
  { num:"§6", name:"Hoạch định",                color:C.teal,   subs:["6.1","6.2","6.3","6.4","6.5","6.6"] },
  { num:"§7", name:"Hỗ trợ",                    color:C.green,  subs:["7.1","7.2","7.3","7.4","7.5"] },
  { num:"§8", name:"Vận hành",                  color:C.orange, subs:["8.1","8.2","8.3"] },
  { num:"§9", name:"Đánh giá kết quả thực hiện",color:C.red,    subs:["9.1","9.2","9.3"] },
  { num:"§10",name:"Cải tiến",                  color:C.navy,   subs:["10.1","10.2"] },
];
const SUB_NAMES = {
  "4.1":"Hiểu biết về tổ chức và bối cảnh","4.2":"Các bên liên quan","4.3":"Phạm vi EnMS","4.4":"Hệ thống EnMS",
  "5.1":"Lãnh đạo và cam kết","5.2":"Chính sách năng lượng","5.3":"Vai trò và trách nhiệm",
  "6.1":"Rủi ro và cơ hội","6.2":"Mục tiêu NL và kế hoạch","6.3":"Rà soát năng lượng",
  "6.4":"Chỉ số EnPI","6.5":"Đường cơ sở EnB","6.6":"Kế hoạch thu thập dữ liệu",
  "7.1":"Nguồn lực","7.2":"Năng lực","7.3":"Nhận thức","7.4":"Trao đổi thông tin","7.5":"Thông tin dạng văn bản",
  "8.1":"Kiểm soát vận hành","8.2":"Thiết kế","8.3":"Mua sắm",
  "9.1":"Theo dõi và đo lường","9.2":"Đánh giá nội bộ","9.3":"Xem xét lãnh đạo",
  "10.1":"Không phù hợp và CAR","10.2":"Cải tiến liên tục",
};
const CAT_LABELS = { doc:"📄 Tài liệu", practice:"⚙️ Thực hành", measurement:"📊 Đo lường", leadership:"👥 Lãnh đạo", legal:"⚖️ Pháp lý" };

// ── Build one checklist row ────────────────────────────────────────
function buildItemRow(item, resp, idx) {
  const r    = resp[item.id] || {};
  const sc   = r.score ?? 0;
  const scol = scoreColor(sc);
  const sbg  = scoreBg(sc);
  const wt   = item.weight === 3 ? "🔴 Quan trọng" : item.weight === 2 ? "🟡 Cao" : "🟢 Cơ bản";
  const wtcol= item.weight === 3 ? C.red : item.weight === 2 ? C.amber : C.teal;
  return new TableRow({ children:[
    new TableCell({ width:{size:700,type:WidthType.DXA}, borders:cb(), shading:sh(idx%2?C.white:C.ash), margins:CMs,
      children:[P(item.id,{sz:16,bold:true,col:C.blue})]}),
    new TableCell({ width:{size:3200,type:WidthType.DXA}, borders:cb(), shading:sh(idx%2?C.white:C.ash), margins:CMs,
      children:[new Paragraph({ spacing:{before:40,after:40}, children:[
        new TextRun({ text:item.title, font:"Arial", size:19, color:C.black }),
        ...(item.legal ? [
          new TextRun({ text:"  ", font:"Arial", size:16 }),
          new TextRun({ text:`[${item.legal}]`, font:"Arial", size:15, italic:true, color:C.red }),
        ] : []),
      ]})]}),
    new TableCell({ width:{size:900,type:WidthType.DXA}, borders:cb(), shading:sh(idx%2?C.white:C.ash), margins:CMs,
      children:[P(CAT_LABELS[item.cat]||item.cat,{sz:15,col:C.grey1})]}),
    new TableCell({ width:{size:800,type:WidthType.DXA}, borders:cb(), shading:sh(`${wtcol}15`), margins:CMs,
      children:[P(wt,{sz:15,bold:true,col:wtcol,c:true})]}),
    new TableCell({ width:{size:1200,type:WidthType.DXA}, borders:cb(), shading:sh(sbg), margins:CMs,
      children:[P(sc===0?"—":scoreLabel(sc),{sz:17,bold:true,c:true,col:scol})]}),
    new TableCell({ width:{size:2560,type:WidthType.DXA}, borders:cb(), shading:sh(C.white), margins:CMs,
      children:[P(r.note||"—",{sz:17,col:C.grey1})]}),
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
    const pr  = sc===1?"🔴 Ngay":sc===2?"🟡 3T":"🟢 6T";
    const pcol= sc===1?C.red:sc===2?C.orange:C.amber;
    rows.push(new TableRow({ children:[
      new TableCell({ width:{size:700},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.id,{sz:16,bold:true,col:C.blue})]}),
      new TableCell({ width:{size:3000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.title,{sz:17})]}),
      new TableCell({ width:{size:900},  borders:cb(), shading:sh(scoreBg(sc)), margins:CMs, children:[P(scoreLabel(sc),{sz:15,bold:true,c:true,col:scoreColor(sc)})]}),
      new TableCell({ width:{size:2800}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(rec,{sz:17})]}),
      new TableCell({ width:{size:1000}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(dl,{sz:16,col:C.orange})]}),
      new TableCell({ width:{size:960},  borders:cb(), shading:sh(`${pcol}15`), margins:CMs, children:[P(pr,{sz:15,bold:true,c:true,col:pcol})]}),
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
function buildClauseSection(cl, resp, secNum) {
  const items = [];
  const allClItems = GAP_CHECKLIST.filter(i => i.clause.startsWith(cl.num.replace("§","")));
  if (!allClItems.length) return items;

  const scores   = allClItems.map(i => resp[i.id]?.score||0).filter(s=>s>0);
  const avgScore = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
  const avgInt   = Math.round(avgScore);

  items.push(H1(`${secNum}. ĐÁNH GIÁ ${cl.num} — ${cl.name.toUpperCase()}`));
  // Score status bar
  items.push(new Paragraph({ spacing:{before:60,after:80}, shading:sh(scoreBg(avgInt)),
    children:[
      new TextRun({ text:"ĐIỂM TỔNG KHOẢN: ", font:"Arial", size:20, bold:true, color:C.grey1 }),
      new TextRun({ text:avgScore.toFixed(1), font:"Arial", size:26, bold:true, color:scoreColor(avgInt) }),
      new TextRun({ text:` / 5.0  |  ${scoreLabel(avgInt)}`, font:"Arial", size:20, color:scoreColor(avgInt) }),
      new TextRun({ text:`  |  ${allClItems.filter(i=>(resp[i.id]?.score||0)<=2).length} khoảng cách cần ưu tiên`, font:"Arial", size:18, color:C.grey2 }),
    ],
  }));
  items.push(SP());

  // Narrative overview
  const clResp = resp[`overview_${cl.num}`];
  if (clResp?.note) {
    items.push(H2(`${secNum}.1. Nhận xét tổng quan`));
    items.push(P(clResp.note,{sz:21,b:60,a:80,l:308}));
  }

  // Per sub-clause detail
  cl.subs.forEach((sub, si) => {
    const subItems = allClItems.filter(i => i.clause === sub);
    if (!subItems.length) return;
    const subScores = subItems.map(i=>resp[i.id]?.score||0).filter(s=>s>0);
    const subAvg    = subScores.length ? subScores.reduce((a,b)=>a+b,0)/subScores.length : 0;
    const subInt    = Math.round(subAvg);
    const subCol    = scoreColor(subInt);

    items.push(new Paragraph({ spacing:{before:120,after:0}, shading:sh(scoreBg(subInt)),
      border:{ left:{ style:BorderStyle.SINGLE, size:18, color:subCol, space:3 }},
      children:[
        new TextRun({ text:`  ${sub}  `, font:"Courier New", size:20, bold:true, color:subCol }),
        new TextRun({ text:SUB_NAMES[sub]||sub, font:"Arial", size:21, bold:true, color:C.navy }),
        new TextRun({ text:`   [Điểm: ${subAvg.toFixed(1)}/5.0 — ${scoreLabel(subInt)}]`, font:"Arial", size:17, bold:true, color:subCol }),
      ],
    }));
    // Checklist items table
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[700,3200,900,800,1200,2560],
      rows:[
        TH(["Mã","Yêu cầu tiêu chuẩn","Danh mục","Trọng số","Kết quả đánh giá","Ghi chú / Bằng chứng"],[700,3200,900,800,1200,2560]),
        ...subItems.map((it,idx) => buildItemRow(it, resp, idx)),
      ],
    }));
    items.push(SP());
  });

  // Action plan table
  const apRows = buildActionRows(allClItems, resp, secNum);
  if (apRows.length > 1) {
    items.push(H2(`${secNum}.${cl.subs.length+2}. Kế hoạch hành động khắc phục khoảng cách — ${cl.num}`));
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[700,3000,900,2800,1000,960], rows:apRows }));
  }
  items.push(SP(), PBR());
  return items;
}

// ── Build all clause sections ─────────────────────────────────────
function buildAllClauses(d, startSec=3) {
  return CLAUSES.flatMap((cl, i) => buildClauseSection(cl, d.responses||{}, i+startSec));
}

module.exports = { buildAllClauses, buildClauseSection };
