const { Document, Packer, TableOfContents, Table, TableRow, TableCell, WidthType, TableLayoutType, Paragraph, TextRun, BorderStyle, ImageRun } = require("docx");
const fs = require("fs");
const path = require("path");
const { DOC_STYLES, DOC_NUMBERING, DOC_PAGE, mkHeader, mkFooter, C, cb, sh, CM, CMs, TW, P, H1, H2, SP, PBR, TH, scoreColor, scoreBg } = require("./gap.docx.helpers");

function applyDefaults(data) {
  const d = JSON.parse(JSON.stringify(data || {}));
  d.meta = d.meta || {};
  d.client = d.client || {};
  d.verifier = d.verifier || {};
  d.responses = d.responses || {};
  d.lite_site_assessments = Array.isArray(d.lite_site_assessments) ? d.lite_site_assessments : [];
  return d;
}

function buildBasicInfo(d) {
  const items = [H1("1. THÔNG TIN CHUNG VỀ DOANH NGHIỆP PHÁT THẢI / SỬ DỤNG NĂNG LƯỢNG")];
  
  // Thông tin công ty
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[3000, 6360],
    rows:[
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Tên công ty:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.client.name||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Cơ sở / Nhà máy:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.client.site||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Địa chỉ:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.client.address||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Ngành nghề:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.client.industry||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Năng lượng tiêu thụ (TOE/năm):",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.client.annual_energy||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Người đại diện pháp luật:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(`${d.client.representative_name||"—"} - ${d.client.representative_position||"—"}`,{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Người liên hệ:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[
          ...(d.client.contact_persons||[]).map(c => P(`${c.full_name||"—"} - ${c.position||"—"} - ${c.phone||"—"} - ${c.email||"—"}`, {sz:24}))
        ] })
      ]})
    ]
  }));
  items.push(SP());

  // Đơn vị thực hiện đánh giá
  items.push(H1("2. THÔNG TIN CHUNG VỀ TỔ CHỨC ĐÁNH GIÁ GAP ISO 50001 (LITE)"));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[3000, 6360],
    rows:[
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Tên tổ chức tư vấn/đánh giá:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.verifier.org||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Số chứng chỉ:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.verifier.cert_no||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Trưởng đoàn đánh giá:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.verifier.lead||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Thành viên / Chuyên gia:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.verifier.team||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Tiêu chuẩn áp dụng:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.verifier.std_applied||"ISO 50001:2018",{sz:24})] })
      ]}),
    ]
  }));
  items.push(SP(), PBR());
  return items;
}

function buildGapTable(d, checklist) {
  const items = [H1("3. ĐÁNH GIÁ KHOẢNG CÁCH HỒ SƠ TÀI LIỆU VỚI ISO 50001:2018")];
  
  const rows = [];
  rows.push(TH(["STT","Điều khoản","Yêu cầu/Phát hiện ISO 50001:2018","Nhận xét hiện tại","Điểm"],[400, 1200, 4000, 2500, 1260]));
  
  checklist.forEach((item, i) => {
    const resp = d.responses[item.id] || {};
    const sc = resp.score || 0;
    const note = resp.note || ""; // In Lite it saves as 'note'
    
    rows.push(new TableRow({ children:[
      new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
      new TableCell({ width:{size:1200}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.id||`CUS-${item.clause}`,{sz:24,bold:true,c:true,col:item.isCustom?C.violet:C.black})] }),
      new TableCell({ width:{size:4000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.title,{sz:24})] }),
      new TableCell({ width:{size:2500}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(note,{sz:24})] }),
      new TableCell({ width:{size:1260}, borders:cb(), shading:sh(scoreBg(sc)), margins:CMs, children:[P(sc?`${sc}/5.0`:"—",{sz:24,c:true,bold:true,col:scoreColor(sc)})] })
    ]}));
  });

  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 1200, 4000, 2500, 1260], rows }));
  items.push(SP(), PBR());
  return items;
}

// ── Score helpers ────────────────────────────────────────────────
const CLAUSE_KEYS = ["4","5","6","7","8","9","10"];
const CLAUSE_NAMES = {
  "4":"Bối cảnh tổ chức","5":"Lãnh đạo","6":"Hoạch định",
  "7":"Hỗ trợ","8":"Vận hành","9":"Đánh giá kết quả","10":"Cải tiến"
};
const SC_LABEL = ["N/A","Chưa triển khai","Mới bắt đầu","Đang phát triển","Phần lớn đáp ứng","Hoàn toàn đáp ứng"];

function buildDashboard(d, checklist) {
  const items = [H1("3.1. TỔNG HỢP & PHÂN TÍCH KẾT QUẢ ĐÁNH GIÁ GAP")];
  const resp = d.responses || {};
  const allScored  = checklist.filter(i => (resp[i.id]?.score || 0) > 0);
  const totalScore = allScored.reduce((a, i) => a + (resp[i.id]?.score || 0), 0);
  const avgScore   = allScored.length ? totalScore / allScored.length : 0;
  const maxScore   = allScored.length ? Math.max(...allScored.map(i => resp[i.id]?.score || 0)) : 0;
  const minScore   = allScored.length ? Math.min(...allScored.map(i => resp[i.id]?.score || 0)) : 0;
  const pct        = checklist.length ? Math.round(allScored.length / checklist.length * 100) : 0;

  const kpiColor = avgScore >= 4 ? C.teal : avgScore >= 3 ? C.green : avgScore >= 2 ? C.orange : C.red;

  // ── KPI Summary table (2-col key/value pairs) ─────────────────
  items.push(H2("A. CHỈ SỐ TỔNG QUAN (KPI)"));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[4680, 4680],
    rows:[
      TH(["CHỈ SỐ","GIÁ TRỊ"],[4680,4680]),
      ...[
        ["📋 Tổng số điều khoản đánh giá", String(checklist.length)],
        ["✅ Số điều khoản đã đánh giá",    String(allScored.length)],
        ["⏳ Số điều khoản chưa đánh giá",  String(checklist.length - allScored.length)],
        ["📈 Tỷ lệ hoàn thành đánh giá",   `${pct}%`],
        ["⭐ Điểm trung bình tổng thể",     avgScore > 0 ? `${avgScore.toFixed(2)} / 5.0` : "—"],
        ["🔝 Điểm cao nhất",                maxScore > 0 ? `${maxScore} / 5.0` : "—"],
        ["🔻 Điểm thấp nhất",               minScore > 0 ? `${minScore} / 5.0` : "—"],
        ["🏆 Xếp loại tổng thể",
          avgScore >= 4.5 ? "XUẤT SẮC" : avgScore >= 3.5 ? "TỐT" :
          avgScore >= 2.5 ? "TRUNG BÌNH" : avgScore > 0 ? "YẾU" : "CHƯA ĐÁNH GIÁ"],
      ].map(([k, v], i) => new TableRow({ children:[
        new TableCell({ width:{size:4680}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CM, children:[P(k,{sz:24,bold:true})] }),
        new TableCell({ width:{size:4680}, borders:cb(), shading:sh(i%2?C.white:scoreBg(Math.round(avgScore))), margins:CM, children:[P(v,{sz:24,bold:true,c:true,col:kpiColor})] }),
      ]}))
    ]
  }));
  items.push(SP());

  // ── Per-clause score table ─────────────────────────────────────
  items.push(H2("B. ĐIỂM ĐÁNH GIÁ THEO ĐIỀU KHOẢN ISO 50001:2018"));
  const clauseWidths = [400, 1600, 1360, 800, 800, 1600, 2800];
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths: clauseWidths,
    rows:[
      TH(["§","Tên nhóm","Đánh giá","Điểm TB","Tỷ lệ","Xếp loại","Thanh điểm"], clauseWidths),
      ...CLAUSE_KEYS.flatMap(clause => {
        const cItems = checklist.filter(i => String(i.clause||"").split(".")[0] === clause);
        if (cItems.length === 0) return [];
        const cScored = cItems.filter(i => (resp[i.id]?.score||0) > 0);
        const cAvg = cScored.length ? cScored.reduce((a,i) => a+(resp[i.id]?.score||0),0)/cScored.length : 0;
        const cPct = cItems.length ? Math.round(cScored.length/cItems.length*100) : 0;
        const cCol = scoreColor(Math.round(cAvg));
        const cBg  = scoreBg(Math.round(cAvg));
        const barLen = Math.round(cAvg/5*20);
        const bar = "█".repeat(barLen) + "░".repeat(20-barLen);
        return [new TableRow({ children:[
          new TableCell({ width:{size:400}, borders:cb(), shading:sh(C.navy), margins:CMs, children:[P(`§${clause}`,{sz:22,bold:true,c:true,col:C.white})] }),
          new TableCell({ width:{size:1600}, borders:cb(), shading:sh(C.ash), margins:CMs, children:[P(CLAUSE_NAMES[clause]||clause,{sz:22})] }),
          new TableCell({ width:{size:1360}, borders:cb(), shading:sh(C.ash), margins:CMs, children:[P(`${cScored.length}/${cItems.length}`,{sz:22,c:true})] }),
          new TableCell({ width:{size:800}, borders:cb(), shading:sh(cBg), margins:CMs, children:[P(cAvg>0?cAvg.toFixed(2):"—",{sz:22,bold:true,c:true,col:cCol})] }),
          new TableCell({ width:{size:800}, borders:cb(), shading:sh(cBg), margins:CMs, children:[P(`${cPct}%`,{sz:22,c:true,col:cCol})] }),
          new TableCell({ width:{size:1600}, borders:cb(), shading:sh(cBg), margins:CMs, children:[P(SC_LABEL[Math.round(cAvg)]||"—",{sz:20,bold:true,col:cCol})] }),
          new TableCell({ width:{size:2800}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(bar,{sz:18,col:cCol})] }),
        ]})];
      }),
      // Total row
      new TableRow({ children:[
        new TableCell({ width:{size:400+1600}, borders:cb(), shading:sh(C.navy), margins:CMs,
          children:[P("TỔNG / TRUNG BÌNH",{sz:22,bold:true,col:C.white,c:true})], columnSpan:2 }),
        new TableCell({ width:{size:1360}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs, children:[P(`${allScored.length}/${checklist.length}`,{sz:22,bold:true,c:true})] }),
        new TableCell({ width:{size:800}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs, children:[P(avgScore>0?avgScore.toFixed(2):"—",{sz:24,bold:true,c:true,col:kpiColor})] }),
        new TableCell({ width:{size:800}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs, children:[P(`${pct}%`,{sz:22,bold:true,c:true,col:kpiColor})] }),
        new TableCell({ width:{size:1600+2800}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs,
          children:[P(avgScore>=4.5?"XUẤT SẮC":avgScore>=3.5?"TỐT":avgScore>=2.5?"TRUNG BÌNH":avgScore>0?"YẾU":"CHƯA ĐÁNH GIÁ",{sz:24,bold:true,col:kpiColor,c:true})], columnSpan:2 }),
      ]}
    ]
  }));
  items.push(SP());

  // ── Score distribution table ────────────────────────────────────
  items.push(H2("C. PHÂN BỐ ĐIỂM ĐÁNH GIÁ"));
  const distCols = [800, 2400, 1200, 4960];
  const distData = [1,2,3,4,5].map(s => {
    const cnt = checklist.filter(i => (resp[i.id]?.score||0) === s).length;
    const pct2 = checklist.length ? Math.round(cnt/checklist.length*100) : 0;
    const bar = "█".repeat(Math.round(pct2/5)) + "░".repeat(20-Math.round(pct2/5));
    return { s, cnt, pct: pct2, col: scoreColor(s), bg: scoreBg(s), label: SC_LABEL[s], bar };
  });
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths: distCols,
    rows:[
      TH(["Điểm","Ý nghĩa","Số lượng","Phân bố"], distCols),
      ...distData.map(d => new TableRow({ children:[
        new TableCell({ width:{size:800}, borders:cb(), shading:sh(d.bg), margins:CMs, children:[P(`${d.s}/5`,{sz:24,bold:true,c:true,col:d.col})] }),
        new TableCell({ width:{size:2400}, borders:cb(), shading:sh(d.bg), margins:CMs, children:[P(d.label,{sz:22,col:d.col,bold:true})] }),
        new TableCell({ width:{size:1200}, borders:cb(), shading:sh(d.bg), margins:CMs, children:[P(`${d.cnt} (${d.pct}%)`,{sz:22,c:true,col:d.col})] }),
        new TableCell({ width:{size:4960}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(d.bar,{sz:18,col:d.col})] }),
      ]}))
    ]
  }));
  items.push(SP(), PBR());
  return items;
}

function buildLiteSiteEvents(d) {
  const items = [H1("4. ĐÁNH GIÁ KHU VỰC SỬ DỤNG NĂNG LƯỢNG (HIỆN TRƯỜNG)")];
  
  const siteItems = d.lite_site_assessments || [];

  if (siteItems.length === 0) {
    items.push(P("Không có đánh giá hiện trường nào.", {sz:24, c:true, col:C.grey2}));
    items.push(SP(), PBR());
    return items;
  }

  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 1600, 1400, 3160, 2800],
    rows:[
      TH(["STT","Tên khu vực / Máy","Loại","Phát hiện (Hiện trạng, Rủi ro, Cơ hội)","Hình ảnh"],[400, 1600, 1400, 3160, 2800]),
      ...siteItems.map((e,i) => {
        const pRuns = [];
        const eqImages = e.images || [];
        if (eqImages.length > 0) {
          eqImages.forEach(imgBase64 => {
            try {
              if (imgBase64.startsWith("data:image/")) {
                const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
                const imgBuffer = Buffer.from(base64Data, 'base64');
                pRuns.push(new ImageRun({
                  data: imgBuffer,
                  transformation: { width: 140, height: 100 },
                }));
                pRuns.push(new TextRun({ text: "  " })); // spacer
              }
            } catch (err) {
               console.error("Error embedding docx img:", err);
            }
          });
        }

        const details = [];
        if (e.status) details.push(`- Hiện trạng: ${e.status}`);
        if (e.risk) details.push(`- Rủi ro: ${e.risk}`);
        if (e.opportunity) details.push(`- Cơ hội cải tiến: ${e.opportunity}`);
        
        return new TableRow({ children:[
          new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
          new TableCell({ width:{size:1600}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.area||"—",{sz:24,bold:true})] }),
          new TableCell({ width:{size:1400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.area_type||"—",{sz:24})] }),
          new TableCell({ width:{size:3160}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(details.join('\n')||"—",{sz:24})] }),
          new TableCell({ width:{size:2800}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[new Paragraph({ children: pRuns.length > 0 ? pRuns : [new TextRun({ text:"Không có ảnh", color:C.grey2 })], alignment:"center" })] }),
        ]});
      })
    ]
  }));
  items.push(SP());
  return items;
}

async function generateGapReportLite(data, checklist = []) {
  const d = applyDefaults(data);
  const children = [
    // Header/Title
    new Paragraph({
      alignment: "center",
      spacing: { before: 240, after: 240 },
      children: [
        new TextRun({ text: "BÁO CÁO NHANH KẾT QUẢ KHẢO SÁT GAP ISO 50001", size: 36, bold: true, color: C.navy }),
      ],
    }),
    ...buildBasicInfo(d),
    ...buildGapTable(d, checklist),
    ...buildDashboard(d, checklist),
    ...buildLiteSiteEvents(d),
  ];

  const doc = new Document({
    creator: "ISO 50001 GAP Survey Tool",
    title: `Lite Report — ${d.meta.ref_no || ""}`,
    styles: DOC_STYLES,
    numbering: DOC_NUMBERING,
    sections: [
      {
        properties: { page: { ...DOC_PAGE.size, margin: DOC_PAGE.margin } },
        headers: { default: mkHeader(d) },
        footers: { default: mkFooter(d) },
        children,
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

module.exports = { generateGapReportLite };

