/**
 * ISO50001Gap — gap.docx.risk.js
 * Risk matrix section + Process approach gap section
 */
const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType,
} = require("docx");
const {
  C, cb, sh, CM, CMs, TW,
  scoreColor, scoreBg, scoreLabel, riskLevel,
  P, H1, H2, H3, SP, PBR, LINE, TH,
} = require("./gap.docx.helpers");
const { RISK_CATEGORIES, PROCESS_MAP } = require("./gap.constants");

// ═══════════════════════════════════════════════════════════
// RISK MATRIX SECTION
// ═══════════════════════════════════════════════════════════
function buildRiskSection(d, secNum) {
  const riskData = d.risk_assessments || {};
  const items = [H1(`${secNum}. ĐÁNH GIÁ RỦI RO THEO CÁCH TIẾP CẬN RỦI RO (Risk-Based Approach)`)];
  items.push(P("Đánh giá rủi ro theo ISO 50001:2018 §6.1 — Xác định rủi ro và cơ hội ảnh hưởng đến EnMS và khả năng đạt chứng nhận. Mức độ rủi ro = Khả năng xảy ra × Mức độ ảnh hưởng (thang 1–5).",{sz:20,b:60,a:120,l:296}));

  // Risk level legend
  items.push(H2(`${secNum}.1. Thang đánh giá rủi ro`));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[1200,1200,2400,4560],
    rows:[
      TH(["Khả năng (L)","Ảnh hưởng (I)","L × I","Mức độ rủi ro"],[1200,1200,2400,4560]),
      ...[
        ["1–2","1–2","1–4","🟢 THẤP — Chấp nhận được, theo dõi định kỳ"],
        ["1–3","2–3","5–8","🟡 TRUNG BÌNH — Cần kiểm soát, lập kế hoạch"],
        ["2–4","3–4","9–15","🟠 CAO — Hành động trong 3 tháng, giao người phụ trách"],
        ["4–5","4–5","16–25","🔴 NGHIÊM TRỌNG — Hành động ngay, report lãnh đạo"],
      ].map(([l,i,lxi,ml],idx) => {
        const col = idx===0?C.green:idx===1?C.amber:idx===2?C.orange:C.red;
        return new TableRow({ children:[
          new TableCell({ width:{size:1200},borders:cb(),shading:sh(idx%2?C.white:C.ash),margins:CMs,children:[P(l,{sz:18,c:true,bold:true,col})]}),
          new TableCell({ width:{size:1200},borders:cb(),shading:sh(idx%2?C.white:C.ash),margins:CMs,children:[P(i,{sz:18,c:true,bold:true,col})]}),
          new TableCell({ width:{size:2400},borders:cb(),shading:sh(`${col}18`),margins:CMs,children:[P(lxi,{sz:20,c:true,bold:true,col})]}),
          new TableCell({ width:{size:4560},borders:cb(),shading:sh(C.white),margins:CMs,children:[P(ml,{sz:18,col})]}),
        ]});
      }),
    ],
  }));
  items.push(SP());

  const riskItemsByCat = d.risk_items || {};

  // Each risk category — use risk_items[cat.id] when present (CRUD), else cat.items
  RISK_CATEGORIES.forEach((cat, ci) => {
    const catColor = cat.color || C.blue;
    items.push(new Paragraph({ spacing:{before:120,after:0}, shading:sh(catColor),
      children:[new TextRun({ text:`  ${cat.id}  ${cat.name}  `, font:"Arial", size:22, bold:true, color:C.white })],
    }));
    items.push(P(cat.desc,{sz:19,b:40,a:60,it:true,col:C.grey1}));

    const catRiskList = (riskItemsByCat[cat.id] && riskItemsByCat[cat.id].length > 0)
      ? riskItemsByCat[cat.id]
      : cat.items.map(r => ({ ...r, ...riskData[r.id] }));
    const catRows = [TH(["Mã","Mô tả rủi ro","Tham chiếu","Khả năng (L)","Ảnh hưởng (I)","L×I","Mức độ","Biện pháp kiểm soát hiện tại","Đề xuất"],[500,2600,1100,600,600,500,900,1600,900])];
    catRiskList.forEach((risk, ri) => {
      const rd  = riskData[risk.id] || risk;
      const l   = rd.likelihood ?? risk.likelihood ?? 0;
      const imp = rd.impact ?? risk.impact ?? 0;
      const lxi = l && imp ? l * imp : 0;
      const rl  = riskLevel(l || 1, imp || 1);
      const lxiColor = lxi>=16?C.red:lxi>=9?C.orange:lxi>=4?C.amber:lxi>0?C.green:C.grey3;
      catRows.push(new TableRow({ children:[
        new TableCell({ width:{size:500},  borders:cb(), shading:sh(ri%2?C.white:C.ash), margins:CMs, children:[P(risk.id,{sz:15,bold:true,col:C.navy})]}),
        new TableCell({ width:{size:2600}, borders:cb(), shading:sh(ri%2?C.white:C.ash), margins:CMs, children:[P(risk.risk||"",{sz:17})]}),
        new TableCell({ width:{size:1100}, borders:cb(), shading:sh(ri%2?C.white:C.ash), margins:CMs, children:[P(risk.ref||"",{sz:14,it:true,col:C.red})]}),
        new TableCell({ width:{size:600},  borders:cb(), shading:sh(lxi>=9?`${lxiColor}18`:C.white), margins:CMs, children:[P(l||"—",{sz:18,c:true,bold:!!l,col:l?lxiColor:C.grey3})]}),
        new TableCell({ width:{size:600},  borders:cb(), shading:sh(lxi>=9?`${lxiColor}18`:C.white), margins:CMs, children:[P(imp||"—",{sz:18,c:true,bold:!!imp,col:imp?lxiColor:C.grey3})]}),
        new TableCell({ width:{size:500},  borders:cb(), shading:sh(lxi?`${lxiColor}28`:C.ash), margins:CMs, children:[P(lxi||"—",{sz:20,c:true,bold:true,col:lxi?lxiColor:C.grey3})]}),
        new TableCell({ width:{size:900},  borders:cb(), shading:sh(lxi?`${rl.color}18`:C.ash), margins:CMs, children:[P(lxi?rl.label:"—",{sz:15,bold:true,c:true,col:lxi?rl.color:C.grey3})]}),
        new TableCell({ width:{size:1600}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(rd.control||risk.control||"Chưa xác định",{sz:16,col:C.grey1})]}),
        new TableCell({ width:{size:900},  borders:cb(), shading:sh(C.white), margins:CMs, children:[P(rd.recommendation||risk.recommendation||"—",{sz:15,it:true,col:C.blue})]}),
      ]}));
    });
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[500,2600,1100,600,600,500,900,1600,900], rows:catRows }));
    items.push(SP());
  });

  // Top risks summary — from same risk list (risk_items or cat.items)
  const allRisks = RISK_CATEGORIES.flatMap(cat => {
    const list = (riskItemsByCat[cat.id] && riskItemsByCat[cat.id].length > 0) ? riskItemsByCat[cat.id] : cat.items.map(r => ({ ...r, ...riskData[r.id] }));
    return list.map(r => ({
      ...r,
      ...riskData[r.id],
      catName: cat.name,
      score: (r.likelihood ?? riskData[r.id]?.likelihood ?? 0) * (r.impact ?? riskData[r.id]?.impact ?? 0),
    }));
  }).filter(r => r.score >= 9).sort((a,b) => b.score-a.score).slice(0,8);
  if (allRisks.length) {
    items.push(H2(`${secNum}.2. Top rủi ro cần ưu tiên xử lý`));
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[500,2800,1200,800,1200,2860],
      rows:[
        TH(["Mã","Rủi ro","Nhóm","L×I","Mức độ","Biện pháp đề xuất"],[500,2800,1200,800,1200,2860]),
        ...allRisks.map((r,i) => {
          const rl = riskLevel(r.likelihood||1, r.impact||1);
          return new TableRow({ children:[
            new TableCell({ width:{size:500},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(r.id,{sz:15,bold:true,col:C.navy})]}),
            new TableCell({ width:{size:2800}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(r.risk,{sz:17})]}),
            new TableCell({ width:{size:1200}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(r.catName,{sz:15,it:true})]}),
            new TableCell({ width:{size:800},  borders:cb(), shading:sh(`${rl.color}22`), margins:CMs, children:[P(String(r.score),{sz:20,bold:true,c:true,col:rl.color})]}),
            new TableCell({ width:{size:1200}, borders:cb(), shading:sh(`${rl.color}18`), margins:CMs, children:[P(rl.label,{sz:15,bold:true,c:true,col:rl.color})]}),
            new TableCell({ width:{size:2860}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(r.recommendation||"Xem bảng rủi ro chi tiết",{sz:16,it:true,col:C.grey1})]}),
          ]});
        }),
      ],
    }));
  }
  items.push(SP(), PBR());
  return items;
}

// ═══════════════════════════════════════════════════════════
// PROCESS APPROACH SECTION
// ═══════════════════════════════════════════════════════════
function buildProcessSection(d, secNum) {
  const procData = d.process_gaps || {};
  const items = [H1(`${secNum}. ĐÁNH GIÁ THEO CÁCH TIẾP CẬN QUÁ TRÌNH (Process Approach)`)];
  items.push(P("Phân tích khoảng cách theo từng quá trình cốt lõi của EnMS dựa trên ISO 50001:2018 Phụ lục A và ISO 50004:2014, xác định đầu vào, đầu ra và tương tác giữa các quá trình.",{sz:20,b:60,a:120,l:296}));

  // Process overview table
  items.push(H2(`${secNum}.1. Tổng quan khoảng cách theo quá trình`));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[500,2600,1400,800,1200,2860],
    rows:[
      TH(["Mã","Tên quá trình","Người chủ sở hữu","Điểm","Mức độ","Nhận xét"],[500,2600,1400,800,1200,2860]),
      ...PROCESS_MAP.map((pr, i) => {
        const pd    = procData[pr.id] || {};
        const sc    = pd.score || 0;
        const scInt = Math.round(sc);
        return new TableRow({ children:[
          new TableCell({ width:{size:500},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(pr.id,{sz:15,bold:true,col:C.blue})]}),
          new TableCell({ width:{size:2600}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(pr.name,{sz:18,bold:true})]}),
          new TableCell({ width:{size:1400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(pr.owner,{sz:16,it:true,col:C.grey1})]}),
          new TableCell({ width:{size:800},  borders:cb(), shading:sh(scoreBg(scInt)), margins:CMs, children:[P(sc||"—",{sz:20,bold:true,c:true,col:scoreColor(scInt)})]}),
          new TableCell({ width:{size:1200}, borders:cb(), shading:sh(scoreBg(scInt)), margins:CMs, children:[P(sc?scoreLabel(scInt):"—",{sz:15,bold:true,c:true,col:scoreColor(scInt)})]}),
          new TableCell({ width:{size:2860}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(pd.notes||"Chưa đánh giá",{sz:16,it:true,col:C.grey1})]}),
        ]});
      }),
    ],
  }));
  items.push(SP());

  // Each process detail
  items.push(H2(`${secNum}.2. Chi tiết đánh giá từng quá trình`));
  PROCESS_MAP.forEach((pr, pi) => {
    const pd  = procData[pr.id] || {};
    const sc  = pd.score || 0;
    const sci = Math.round(sc);
    const scol = scoreColor(sci);
    items.push(new Paragraph({ spacing:{before:130,after:0},
      shading:sh(sci?`${scol}12`:C.ash),
      border:{ left:{ style:BorderStyle.SINGLE, size:20, color:sci?scol:C.grey3, space:3 }},
      children:[
        new TextRun({ text:`  ${pr.id}  `, font:"Courier New", size:20, bold:true, color:sci?scol:C.grey3 }),
        new TextRun({ text:pr.name, font:"Arial", size:22, bold:true, color:C.navy }),
        new TextRun({ text:`   Điểm: ${sc||"—"}/5.0`, font:"Arial", size:18, bold:true, color:sci?scol:C.grey3 }),
        new TextRun({ text:`  | ${pr.freq}`, font:"Arial", size:16, color:C.grey2 }),
      ],
    }));
    // I/O table
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[4680,4680],
      rows:[
        new TableRow({ children:[
          new TableCell({ width:{size:4680,type:WidthType.DXA}, borders:cb(C.teal), shading:sh(C.lTeal), margins:CM,
            children:[
              P("ĐẦU VÀO (Inputs):",{sz:18,bold:true,col:C.teal,a:40}),
              ...pr.inputs.map(inp => new Paragraph({ spacing:{before:30,after:30}, indent:{left:320},
                children:[new TextRun({ text:"▸ "+inp, font:"Arial", size:18, color:C.grey1 })]})),
            ]}),
          new TableCell({ width:{size:4680,type:WidthType.DXA}, borders:cb(C.green), shading:sh(C.lGreen), margins:CM,
            children:[
              P("ĐẦU RA (Outputs):",{sz:18,bold:true,col:C.green,a:40}),
              ...pr.outputs.map(out => new Paragraph({ spacing:{before:30,after:30}, indent:{left:320},
                children:[new TextRun({ text:"▸ "+out, font:"Arial", size:18, color:C.grey1 })]})),
            ]}),
        ]}),
      ],
    }));
    // Findings + actions
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[2340,2340,2340,2340],
      rows:[new TableRow({ children:[
        new TableCell({ width:{size:2340,type:WidthType.DXA}, borders:cb(), shading:sh(C.ash), margins:CM,
          children:[P("Tham chiếu tiêu chuẩn:",{sz:17,bold:true,col:C.navy,a:30}), P(pr.std_ref.join(" | "),{sz:16,col:C.blue})]}),
        new TableCell({ width:{size:2340,type:WidthType.DXA}, borders:cb(), shading:sh(C.ash), margins:CM,
          children:[P("Phát hiện khoảng cách:",{sz:17,bold:true,col:sci<=2?C.red:C.navy,a:30}), P(pd.finding||"—",{sz:16,col:C.grey1})]}),
        new TableCell({ width:{size:2340,type:WidthType.DXA}, borders:cb(), shading:sh(C.ash), margins:CM,
          children:[P("Bằng chứng thu thập:",{sz:17,bold:true,col:C.navy,a:30}), P(pd.evidence||"—",{sz:16,col:C.grey1})]}),
        new TableCell({ width:{size:2340,type:WidthType.DXA}, borders:cb(), shading:sh(`${sci?scol:C.grey3}12`), margins:CM,
          children:[P("Đề xuất hành động:",{sz:17,bold:true,col:C.navy,a:30}), P(pd.action||"—",{sz:16,it:true,col:sci<=2?C.red:C.grey1})]}),
      ]})]
    }));
    items.push(SP());
  });
  items.push(PBR());
  return items;
}

module.exports = { buildRiskSection, buildProcessSection };
