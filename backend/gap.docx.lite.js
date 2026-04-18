const { Document, Packer, Table, TableRow, TableCell, WidthType, TableLayoutType, Paragraph, TextRun, BorderStyle, ImageRun } = require("docx");
const fs = require("fs");
const path = require("path");
const { DOC_STYLES, DOC_NUMBERING, DOC_PAGE, mkHeader, mkFooter, C, cb, sh, CM, CMs, TW, P, H1, H2, SP, PBR, TH, scoreColor, scoreBg } = require("./gap.docx.helpers");

// ── ISO 50001:2018 clause groups (§4–§10 are the normative evaluation clauses) ──
const CLAUSE_KEYS  = ["4","5","6","7","8","9","10"];
const CLAUSE_NAMES = {
  "4": "Bối cảnh tổ chức",
  "5": "Lãnh đạo",
  "6": "Hoạch định",
  "7": "Hỗ trợ",
  "8": "Vận hành",
  "9": "Đánh giá kết quả hoạt động",
  "10": "Cải tiến",
};
const SC_LABEL = [
  "Chưa đánh giá",
  "Chưa triển khai",
  "Mới bắt đầu",
  "Đang phát triển",
  "Phần lớn đáp ứng",
  "Hoàn toàn đáp ứng",
];

// ── Helpers ───────────────────────────────────────────────────────
function applyDefaults(data) {
  const d = JSON.parse(JSON.stringify(data || {}));
  d.meta = d.meta || {};
  d.client = d.client || {};
  d.verifier = d.verifier || {};
  d.responses = d.responses || {};
  d.lite_site_assessments = Array.isArray(d.lite_site_assessments) ? d.lite_site_assessments : [];
  return d;
}

// ── Section 1-2: Basic Info ───────────────────────────────────────
function buildBasicInfo(d) {
  const items = [H1("1. THÔNG TIN CHUNG VỀ DOANH NGHIỆP PHÁT THẢI / SỬ DỤNG NĂNG LƯỢNG")];
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
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P((d.client.representative_name||"—")+" - "+(d.client.representative_position||"—"),{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Người liên hệ:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[
          ...(d.client.contact_persons||[]).map(c => P((c.full_name||"—")+" - "+(c.position||"—")+" - "+(c.phone||"—")+" - "+(c.email||"—"), {sz:24}))
        ] })
      ]})
    ]
  }));
  items.push(SP());

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

// ── Section 3: GAP Checklist Table ───────────────────────────────
function buildGapTable(d, checklist) {
  const items = [H1("3. ĐÁNH GIÁ KHOẢNG CÁCH HỒ SƠ TÀI LIỆU VỚI ISO 50001:2018")];
  const rows = [];
  rows.push(TH(["STT","Điều khoản","Yêu cầu/Phát hiện ISO 50001:2018","Nhận xét hiện tại","Điểm"],[400, 1200, 4000, 2500, 1260]));
  checklist.forEach((item, i) => {
    const resp = d.responses[item.id] || {};
    const sc   = resp.score || 0;
    const note = resp.note  || "";
    rows.push(new TableRow({ children:[
      new TableCell({ width:{size:400},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
      new TableCell({ width:{size:1200}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.id||("CUS-"+item.clause),{sz:24,bold:true,c:true,col:item.isCustom?C.violet:C.black})] }),
      new TableCell({ width:{size:4000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.title,{sz:24})] }),
      new TableCell({ width:{size:2500}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(note,{sz:24})] }),
      new TableCell({ width:{size:1260}, borders:cb(), shading:sh(scoreBg(sc)),        margins:CMs, children:[P(sc?(sc+"/5.0"):"—",{sz:24,c:true,bold:true,col:scoreColor(sc)})] }),
    ]}));
  });
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 1200, 4000, 2500, 1260], rows }));
  items.push(SP(), PBR());
  return items;
}

// ── Section 3.1: Analytics Dashboard ─────────────────────────────
// Ghi chú: ISO 50001:2018 có các điều khoản đánh giá từ §4 đến §10
// Tổng số tiêu chí = số dòng trong checklist (gồm tiêu chí chuẩn + tùy chỉnh)
// Điểm trung bình = tổng điểm / số tiêu chí ĐÃ đánh giá (điểm > 0)
function buildDashboard(d, checklist) {
  const items = [H1("3.1. TỔNG HỢP & PHÂN TÍCH KẾT QUẢ ĐÁNH GIÁ GAP")];
  const resp = d.responses || {};

  // --- Core statistics ---
  const allScored  = checklist.filter(i => (resp[i.id]?.score || 0) > 0);
  const notScored  = checklist.filter(i => (resp[i.id]?.score || 0) === 0);
  const totalScore = allScored.reduce((a, i) => a + (resp[i.id]?.score || 0), 0);
  const avgScore   = allScored.length ? totalScore / allScored.length : 0;
  const maxScore   = allScored.length ? Math.max(...allScored.map(i => resp[i.id]?.score || 0)) : 0;
  const minScore   = allScored.length ? Math.min(...allScored.map(i => resp[i.id]?.score || 0)) : 0;
  const pct        = checklist.length  ? Math.round(allScored.length / checklist.length * 100) : 0;
  const kpiColor   = avgScore >= 4 ? C.teal : avgScore >= 3 ? C.green : avgScore >= 2 ? C.orange : C.red;
  const kpiLabel   = avgScore >= 4.5 ? "XUẤT SẮC" : avgScore >= 3.5 ? "TỐT" :
                     avgScore >= 2.5 ? "TRUNG BÌNH" : avgScore > 0 ? "YẾU" : "CHƯA ĐÁNH GIÁ";

  // ── A. KPI Summary ────────────────────────────────────────────────
  items.push(H2("A. CHỈ SỐ TỔNG QUAN (KPI)"));
  // cW summing to TW=9360
  const kW = [5600, 3760];
  items.push(new Table({ width:{size:TW, type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths: kW,
    rows:[
      TH(["CHỈ SỐ ĐÁNH GIÁ", "GIÁ TRỊ"], kW),
      new TableRow({ children:[
        new TableCell({ width:{size:kW[0]}, borders:cb(), shading:sh(C.ash), margins:CM, children:[P("📋 Tổng số tiêu chí trong checklist",{sz:24,bold:true})] }),
        new TableCell({ width:{size:kW[1]}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P(String(checklist.length)+" tiêu chí",{sz:24,bold:true,c:true,col:C.blue})] }),
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:kW[0]}, borders:cb(), shading:sh(C.white), margins:CM, children:[P("✅ Số tiêu chí đã đánh giá (điểm 1–5)",{sz:24,bold:true})] }),
        new TableCell({ width:{size:kW[1]}, borders:cb(), shading:sh(C.lGreen), margins:CM, children:[P(String(allScored.length)+" tiêu chí",{sz:24,bold:true,c:true,col:C.green})] }),
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:kW[0]}, borders:cb(), shading:sh(C.ash), margins:CM, children:[P("⏳ Số tiêu chí chưa đánh giá (điểm = 0)",{sz:24,bold:true})] }),
        new TableCell({ width:{size:kW[1]}, borders:cb(), shading:sh(C.lYellow), margins:CM, children:[P(String(notScored.length)+" tiêu chí",{sz:24,bold:true,c:true,col:C.orange})] }),
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:kW[0]}, borders:cb(), shading:sh(C.white), margins:CM, children:[P("📈 Tỷ lệ hoàn thành đánh giá",{sz:24,bold:true})] }),
        new TableCell({ width:{size:kW[1]}, borders:cb(), shading:sh(C.lTeal), margins:CM, children:[P(pct+"%",{sz:24,bold:true,c:true,col:C.teal})] }),
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:kW[0]}, borders:cb(), shading:sh(C.ash), margins:CM, children:[P("⭐ Điểm trung bình tổng thể (chỉ tính tiêu chí đã đánh giá)",{sz:24,bold:true})] }),
        new TableCell({ width:{size:kW[1]}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CM, children:[P(avgScore>0?avgScore.toFixed(2)+" / 5.0":"—",{sz:24,bold:true,c:true,col:kpiColor})] }),
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:kW[0]}, borders:cb(), shading:sh(C.white), margins:CM, children:[P("🔝 Điểm cao nhất đạt được",{sz:24,bold:true})] }),
        new TableCell({ width:{size:kW[1]}, borders:cb(), shading:sh(scoreBg(maxScore)), margins:CM, children:[P(maxScore>0?maxScore+" / 5.0":"—",{sz:24,bold:true,c:true,col:scoreColor(maxScore)})] }),
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:kW[0]}, borders:cb(), shading:sh(C.ash), margins:CM, children:[P("🔻 Điểm thấp nhất ghi nhận (trong phạm vi đã đánh giá)",{sz:24,bold:true})] }),
        new TableCell({ width:{size:kW[1]}, borders:cb(), shading:sh(scoreBg(minScore)), margins:CM, children:[P(minScore>0?minScore+" / 5.0":"—",{sz:24,bold:true,c:true,col:scoreColor(minScore)})] }),
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:kW[0]}, borders:cb(), shading:sh(C.white), margins:CM, children:[P("🏆 Xếp loại tổng thể (ISO 50001:2018)",{sz:24,bold:true})] }),
        new TableCell({ width:{size:kW[1]}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CM, children:[P(kpiLabel,{sz:24,bold:true,c:true,col:kpiColor})] }),
      ]}),
    ]
  }));
  items.push(SP());

  // ── B. Per-Clause Table (§4-§10)  ─────────────────────────────────
  items.push(H2("B. ĐIỂM ĐÁNH GIÁ THEO NHÓM ĐIỀU KHOẢN ISO 50001:2018"));
  // 7 columns, sum = 9360
  const cW = [360, 1800, 1200, 760, 760, 1480, 3000];
  const clauseRows = CLAUSE_KEYS.flatMap(clause => {
    const cItems  = checklist.filter(i => String(i.clause || "").split(".")[0] === clause);
    if (!cItems.length) return [];
    const cScored = cItems.filter(i => (resp[i.id]?.score || 0) > 0);
    const cAvg    = cScored.length ? cScored.reduce((a, i) => a + (resp[i.id]?.score || 0), 0) / cScored.length : 0;
    const cPct    = cItems.length  ? Math.round(cScored.length / cItems.length * 100) : 0;
    const r       = Math.round(cAvg);
    const cCol    = scoreColor(r);
    const cBg     = scoreBg(r);
    const barLen  = Math.min(20, Math.round(cAvg / 5 * 20));
    const bar     = "█".repeat(barLen) + "░".repeat(20 - barLen);
    return [new TableRow({ children: [
      new TableCell({ width:{size:cW[0]}, borders:cb(), shading:sh(C.navy), margins:CMs, children:[P("§"+clause, {sz:22,bold:true,c:true,col:C.white})] }),
      new TableCell({ width:{size:cW[1]}, borders:cb(), shading:sh(C.ash),  margins:CMs, children:[P(CLAUSE_NAMES[clause]||clause, {sz:21})] }),
      new TableCell({ width:{size:cW[2]}, borders:cb(), shading:sh(C.ash),  margins:CMs, children:[P(cScored.length+"/"+cItems.length, {sz:22,c:true})] }),
      new TableCell({ width:{size:cW[3]}, borders:cb(), shading:sh(cBg),    margins:CMs, children:[P(cAvg>0?cAvg.toFixed(2):"—", {sz:22,bold:true,c:true,col:cCol})] }),
      new TableCell({ width:{size:cW[4]}, borders:cb(), shading:sh(cBg),    margins:CMs, children:[P(cPct+"%", {sz:22,c:true,col:cCol})] }),
      new TableCell({ width:{size:cW[5]}, borders:cb(), shading:sh(cBg),    margins:CMs, children:[P(SC_LABEL[r]||"—", {sz:20,bold:true,col:cCol})] }),
      new TableCell({ width:{size:cW[6]}, borders:cb(), shading:sh(C.white),margins:CMs, children:[P(bar, {sz:17,col:cCol})] }),
    ]})];
  });
  // Total row — 7 cells (no columnSpan to avoid docx.js issues)
  const avgBarLen = Math.min(20, Math.round(avgScore / 5 * 20));
  const avgBar    = "█".repeat(avgBarLen) + "░".repeat(20 - avgBarLen);
  const totalRow  = new TableRow({ children: [
    new TableCell({ width:{size:cW[0]}, borders:cb(), shading:sh(C.navy), margins:CMs, children:[P("TB", {sz:20,bold:true,col:C.white,c:true})] }),
    new TableCell({ width:{size:cW[1]}, borders:cb(), shading:sh(C.navy), margins:CMs, children:[P("TỔNG / TRUNG BÌNH", {sz:20,bold:true,col:C.white})] }),
    new TableCell({ width:{size:cW[2]}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs, children:[P(allScored.length+"/"+checklist.length, {sz:22,bold:true,c:true,col:kpiColor})] }),
    new TableCell({ width:{size:cW[3]}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs, children:[P(avgScore>0?avgScore.toFixed(2):"—", {sz:24,bold:true,c:true,col:kpiColor})] }),
    new TableCell({ width:{size:cW[4]}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs, children:[P(pct+"%", {sz:22,bold:true,c:true,col:kpiColor})] }),
    new TableCell({ width:{size:cW[5]}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs, children:[P(kpiLabel, {sz:20,bold:true,col:kpiColor})] }),
    new TableCell({ width:{size:cW[6]}, borders:cb(), shading:sh(scoreBg(Math.round(avgScore))), margins:CMs, children:[P(avgBar, {sz:17,col:kpiColor})] }),
  ]});

  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths: cW,
    rows:[
      TH(["§","Tên nhóm điều khoản","Đánh giá","Điểm TB","Tỷ lệ","Xếp loại","Thanh điểm (0–5)"], cW),
      ...clauseRows,
      totalRow,
    ]
  }));
  items.push(SP());

  // ── C. Score Distribution ─────────────────────────────────────────
  items.push(H2("C. PHÂN BỐ ĐIỂM ĐÁNH GIÁ (MỨC 0–5)"));
  const dW = [760, 2600, 1000, 1000, 4000]; // sum = 9360
  const distRows = [0, 1, 2, 3, 4, 5].map(s => {
    const cnt    = checklist.filter(i => (resp[i.id]?.score || 0) === s).length;
    const pct2   = checklist.length ? Math.round(cnt / checklist.length * 100) : 0;
    const bLen   = Math.min(20, Math.round(pct2 / 5));
    const bar2   = "█".repeat(bLen) + "░".repeat(20 - bLen);
    return new TableRow({ children: [
      new TableCell({ width:{size:dW[0]}, borders:cb(), shading:sh(scoreBg(s)), margins:CMs, children:[P(s+"/5", {sz:24,bold:true,c:true,col:scoreColor(s)})] }),
      new TableCell({ width:{size:dW[1]}, borders:cb(), shading:sh(scoreBg(s)), margins:CMs, children:[P(SC_LABEL[s], {sz:22,bold:true,col:scoreColor(s)})] }),
      new TableCell({ width:{size:dW[2]}, borders:cb(), shading:sh(scoreBg(s)), margins:CMs, children:[P(String(cnt), {sz:22,c:true,col:scoreColor(s)})] }),
      new TableCell({ width:{size:dW[3]}, borders:cb(), shading:sh(scoreBg(s)), margins:CMs, children:[P(pct2+"%", {sz:22,c:true,col:scoreColor(s)})] }),
      new TableCell({ width:{size:dW[4]}, borders:cb(), shading:sh(C.white),    margins:CMs, children:[P(bar2, {sz:17,col:scoreColor(s)})] }),
    ]});
  });
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths: dW,
    rows: [
      TH(["Điểm","Ý nghĩa","Số lượng","Tỷ lệ","Thanh phân bố"], dW),
      ...distRows,
    ]
  }));
  items.push(SP(), PBR());
  return items;
}

// ── Section 4: Site Assessment ────────────────────────────────────
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
      ...siteItems.map((e, i) => {
        const pRuns = [];
        const eqImages = e.images || [];
        if (eqImages.length > 0) {
          eqImages.forEach(imgBase64 => {
            try {
              if (imgBase64.startsWith("data:image/")) {
                const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
                const imgBuffer  = Buffer.from(base64Data, "base64");
                pRuns.push(new ImageRun({ data: imgBuffer, transformation: { width: 140, height: 100 } }));
                pRuns.push(new TextRun({ text: "  " }));
              }
            } catch (err) { console.error("Error embedding docx img:", err); }
          });
        }
        const details = [];
        if (e.status)      details.push("- Hiện trạng: "+e.status);
        if (e.risk)        details.push("- Rủi ro: "+e.risk);
        if (e.opportunity) details.push("- Cơ hội cải tiến: "+e.opportunity);
        return new TableRow({ children:[
          new TableCell({ width:{size:400},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
          new TableCell({ width:{size:1600}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.area||"—",{sz:24,bold:true})] }),
          new TableCell({ width:{size:1400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.area_type||"—",{sz:24})] }),
          new TableCell({ width:{size:3160}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(details.join("\n")||"—",{sz:24})] }),
          new TableCell({ width:{size:2800}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[new Paragraph({ children: pRuns.length > 0 ? pRuns : [new TextRun({ text:"Không có ảnh", color:C.grey2 })], alignment:"center" })] }),
        ]});
      })
    ]
  }));
  items.push(SP());
  return items;
}

// ── Main generator ────────────────────────────────────────────────
async function generateGapReportLite(data, checklist = []) {
  const d = applyDefaults(data);
  const children = [
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
    title: "Lite Report — "+(d.meta.ref_no || ""),
    styles: DOC_STYLES,
    numbering: DOC_NUMBERING,
    sections: [{
      properties: { page: { ...DOC_PAGE.size, margin: DOC_PAGE.margin } },
      headers:    { default: mkHeader(d) },
      footers:    { default: mkFooter(d) },
      children,
    }],
  });
  return await Packer.toBuffer(doc);
}

module.exports = { generateGapReportLite };
