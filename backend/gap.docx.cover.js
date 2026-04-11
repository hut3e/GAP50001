/**
 * ISO50001Gap — gap.docx.cover.js
 * Cover page + Executive Summary + Overall GAP Score Radar
 */
const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ImageRun
} = require("docx");
const {
  C, cb, sh, CM, CMs, TW,
  scoreColor, scoreBg, scoreLabel,
  P, H1, H2, SP, PBR, LINE,
  TH, TR, KV,
} = require("./gap.docx.helpers");
const { GAP_CHECKLIST: DEFAULT_CHECKLIST } = require("./gap.constants");

function clauseScore(clauseNum, responses, checklist) {
  const items = checklist.filter(i => i.clause.startsWith(clauseNum.replace("§","")));
  if (!items.length) return 0;
  const validItems = items.filter(i => (responses[i.id]?.score || 0) > 0);
  if (!validItems.length) return 0;
  const totalWeight = validItems.reduce((acc, i) => acc + (i.weight || 1), 0);
  const weightedSum = validItems.reduce((acc, i) => acc + (responses[i.id].score * (i.weight || 1)), 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

function overallScore(responses, checklist) {
  const validItems = checklist.filter(i => (responses[i.id]?.score || 0) > 0);
  if (!validItems.length) return 0;
  const totalWeight = validItems.reduce((acc, i) => acc + (i.weight || 1), 0);
  const weightedSum = validItems.reduce((acc, i) => acc + (responses[i.id].score * (i.weight || 1)), 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

function gapPercent(responses, checklist) {
  const ov = overallScore(responses, checklist);
  if (ov === 0) return 100;
  return Math.round(((5.0 - ov) / 5.0) * 100);
}

// ── COVER ─────────────────────────────────────────────────────────
function buildCover(d, checklist = DEFAULT_CHECKLIST) {
  const items = [];
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:200},
    shading:sh(C.red),
    children:[new TextRun({ text:d.meta.confidential||"CONFIDENTIAL", font:"Times New Roman", size:24, bold:true, color:C.white })],
  }));
  items.push(SP(), SP());
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:80},
    children:[new TextRun({ text:d.verifier?.org||"ĐƠN VỊ TƯ VẤN", font:"Times New Roman", size:28, bold:true, color:C.blue })],
  }));
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:60},
    children:[new TextRun({ text:d.verifier?.accred||"", font:"Times New Roman", size:24, italic:true, color:C.grey2 })],
  }));
  items.push(LINE(C.blue), SP(), SP());
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:80},
    children:[new TextRun({ text:"BÁO CÁO KHẢO SÁT", font:"Times New Roman", size:54, bold:true, color:C.navy })],
  }));
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:80},
    children:[new TextRun({ text:"PHÂN TÍCH KHOẢNG CÁCH (GAP ANALYSIS)", font:"Times New Roman", size:32, bold:true, color:C.blue })],
  }));
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:60,after:60},
    children:[new TextRun({ text:"Hệ thống Quản lý Năng lượng — ISO 50001:2018", font:"Times New Roman", size:24, italic:true, color:C.teal })],
  }));
  if (d.meta.cover_image) {
    try {
      const base64Data = d.meta.cover_image.replace(/^data:image\/\w+;base64,/, "");
      // Default to 450x260 if dimensions are missing
      const w = d.meta.cover_image_w || 450;
      const h = d.meta.cover_image_h || 260;
      items.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 20 },
        children: [
          new ImageRun({
            data: Buffer.from(base64Data, "base64"),
            transformation: { width: w, height: h },
            type: "jpeg"
          })
        ],
      }));
    } catch (err) {}
  }
  // Badge
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:140,after:0}, shading:sh(C.navy),
    children:[new TextRun({ text:"ISO 50001:2018 | ISO 50006:2014 | ISO 50015:2014 | ISO 50002:2014 | ISO 50047:2016", font:"Times New Roman", size:24, bold:true, color:C.white })],
  }));
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:140}, shading:sh(C.navy),
    children:[new TextRun({ text:"Luật 50/2010/QH12, Luật 77/2025/QH15 | Nghị định 30/2026 | TT 25/2020/TT-BCT | TT 25/2020 | TT 38/2014 | QĐ 280/QĐ-TTg (VNEEP3) | NĐ 06/2022", font:"Times New Roman", size:24, color:"A8C4E0" })],
  }));
  items.push(SP(), SP());
  // Client box
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:60,after:0},
    shading:sh(C.lBlue), border:{ left:{ style:BorderStyle.SINGLE, size:24, color:C.blue }, right:{ style:BorderStyle.SINGLE, size:24, color:C.blue }},
    children:[new TextRun({ text:"ĐƠN VỊ ĐƯỢC KHẢO SÁT:", font:"Times New Roman", size:24, bold:true, color:C.blue })],
  }));
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:60},
    shading:sh(C.lBlue), border:{ left:{ style:BorderStyle.SINGLE, size:24, color:C.blue }, right:{ style:BorderStyle.SINGLE, size:24, color:C.blue }},
    children:[new TextRun({ text:d.client?.name||"Tên tổ chức", font:"Times New Roman", size:28, bold:true, color:C.navy })],
  }));
  items.push(SP(), SP(), LINE(C.navy));
  const mk = (lb,v) => new Paragraph({ spacing:{before:55,after:55}, children:[
    new TextRun({ text:lb+": ", font:"Times New Roman", size:24, bold:true, color:C.navy }),
    new TextRun({ text:v||"—", font:"Times New Roman", size:24, color:C.black }),
  ]});
  const ov = overallScore(d.responses||{}, checklist);
  const gp = gapPercent(d.responses||{}, checklist);
  items.push(mk("Mã khảo sát",      d.meta?.ref_no));
  items.push(mk("Ngày khảo sát",    d.meta?.survey_date));
  items.push(mk("Phiên bản",        d.meta?.version||"v1.0"));
  items.push(mk("Cơ sở khảo sát",  d.client?.site||d.client?.name));
  items.push(mk("Tiếp cận khảo sát","Rủi ro | Quá trình | Nhà xưởng/Thiết bị | Điều khoản §4–§10"));
  items.push(mk("Điểm GAP tổng thể", `${ov}/5.0  |  Tỷ lệ khoảng cách hệ thống: ${gp}%`));
  items.push(mk("Mục tiêu tư vấn",  d.meta?.objective||"Xây dựng & đạt chứng nhận ISO 50001:2018"));
  items.push(LINE(C.navy), PBR());
  return items;
}

// ── EXECUTIVE SUMMARY ─────────────────────────────────────────────
function buildExecutiveSummary(d, checklist = DEFAULT_CHECKLIST) {
  const resp = d.responses || {};
  const clauses = ["§4","§5","§6","§7","§8","§9","§10"];
  const clauseNames = { "§4":"Bối cảnh","§5":"Lãnh đạo","§6":"Hoạch định","§7":"Hỗ trợ","§8":"Vận hành","§9":"Đánh giá","§10":"Cải tiến" };
  const items = [H1("1. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)")];

  // Overall score banner
  const ov = overallScore(resp, checklist);
  const ovCol = ov >= 4 ? C.teal : ov >= 3 ? C.green : ov >= 2 ? C.orange : C.red;
  const gp = gapPercent(resp, checklist);
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:80,after:0}, shading:sh(ovCol),
    children:[new TextRun({ text:"ĐIỂM GAP TỔNG THỂ", font:"Times New Roman", size:24, bold:true, color:C.white })],
  }));
  items.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0,after:100},
    shading:sh(scoreBg(Math.round(ov))),
    children:[
      new TextRun({ text:`${ov} / 5.0`, font:"Times New Roman", size:48, bold:true, color:ovCol }),
      new TextRun({ text:`   |   Tỷ lệ khoảng cách hệ thống: ${gp}%`, font:"Times New Roman", size:24, color:ovCol }),
    ],
  }));

  // Clause scores table
  items.push(H2("1.1. Điểm GAP theo điều khoản"));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[1000,3200,1300,1300,2560],
    rows:[
      TH(["Điều khoản","Tên","Điểm TB","Mức độ","Nhận xét ưu tiên"],[1000,3200,1300,1300,2560]),
      ...clauses.map((cl,idx) => {
        const sc    = clauseScore(cl, resp, checklist);
        const scInt = Math.round(sc);
        const scol  = scoreColor(scInt);
        const sbg   = scoreBg(scInt);
        const remark = scInt <= 1 ? "⚠ Khoảng cách nghiêm trọng — ưu tiên ngay"
                      : scInt <= 2 ? "! Cần hành động trong 3 tháng"
                      : scInt <= 3 ? "~ Cần cải thiện trong 6 tháng"
                      : "✓ Tốt — duy trì và cải tiến";
        return new TableRow({ children:[
          new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(idx%2?C.white:C.ash), margins:CMs,
            children:[P(cl,{sz:24,bold:true,col:C.blue,c:true})]}),
          new TableCell({ width:{size:3200,type:WidthType.DXA}, borders:cb(), shading:sh(idx%2?C.white:C.ash), margins:CMs,
            children:[P(clauseNames[cl]||"",{sz:24})]}),
          new TableCell({ width:{size:1300,type:WidthType.DXA}, borders:cb(), shading:sh(sbg), margins:CMs,
            children:[P(sc.toFixed(1),{sz:24,bold:true,c:true,col:scol})]}),
          new TableCell({ width:{size:1300,type:WidthType.DXA}, borders:cb(), shading:sh(sbg), margins:CMs,
            children:[P(scoreLabel(scInt),{sz:24,bold:true,c:true,col:scol})]}),
          new TableCell({ width:{size:2560,type:WidthType.DXA}, borders:cb(), shading:sh(C.white), margins:CMs,
            children:[P(remark,{sz:24,col:scol})]}),
        ]});
      }),
    ],
  }));

  items.push(SP(), H2("1.2. Thống kê tổng hợp khoảng cách"));
  const critCount = checklist.filter(i=>(resp[i.id]?.score||0)===1).length;
  const majCount  = checklist.filter(i=>(resp[i.id]?.score||0)===2).length;
  const minCount  = checklist.filter(i=>(resp[i.id]?.score||0)===3).length;
  const goodCount = checklist.filter(i=>(resp[i.id]?.score||0)>=4).length;
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[2400,1600,2800,2560],
    rows:[
      TH(["Hạng mục khoảng cách","Số lượng","Mô tả","Khuyến nghị"],[2400,1600,2800,2560]),
      ...([
        ["Nghiêm trọng (Score 1)", String(critCount), "Hoàn toàn chưa triển khai",       "Hành động ngay — Blocking certification", C.red],
        ["Lớn (Score 2)",          String(majCount),  "Mới bắt đầu/không đầy đủ",         "Kế hoạch hành động trong 30-90 ngày",     C.orange],
        ["Nhỏ (Score 3)",          String(minCount),  "Đang phát triển, chưa hoàn thiện", "Cải thiện trong 3-6 tháng",               C.amber],
        ["Phù hợp (Score 4-5)",    String(goodCount), "Đáp ứng yêu cầu cơ bản",           "Duy trì và cải tiến liên tục",            C.teal],
      ]).map(([h,n,desc,rec,col],i) => new TableRow({ children:[
        new TableCell({ width:{size:2400,type:WidthType.DXA}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(h,{sz:24,bold:true,col})]}),
        new TableCell({ width:{size:2400,type:WidthType.DXA}, borders:cb(), shading:sh(scoreBg(i===0?1:i===1?2:i===2?3:4)), margins:CMs, children:[P(n,{sz:24,bold:true,c:true,col})]}),
        new TableCell({ width:{size:2800,type:WidthType.DXA}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(desc,{sz:24})]}),
        new TableCell({ width:{size:2560,type:WidthType.DXA}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(rec,{sz:24,it:true,col:C.grey1})]}),
      ]})),
    ],
  }));

  const execSummaryText = (d.meta?.exec_summary_items?.length > 0)
    ? d.meta.exec_summary_items.join("\n\n")
    : d.meta?.exec_summary;
  if (execSummaryText) {
    items.push(SP(), H2("1.3. Nhận xét tổng quan của chuyên gia tư vấn"));
    execSummaryText.split("\n\n").filter(Boolean).forEach(para =>
      items.push(P(para.trim(),{sz:24,b:60,a:80,l:308}))); // 12pt
  }

  items.push(SP(), H2("1.4. Nguyên tắc đánh giá & Công thức tính điểm GAP"));
  items.push(P("Dựa trên thực tiễn tư vấn đánh giá Hệ thống Quản lý Năng lượng theo ISO 50001:2018 và mô hình CMM (Capability Maturity Model), tổ chức được đánh giá qua thang điểm 5 cấp độ (0-5). Thang điểm giúp định lượng mức độ trưởng thành, xác định ưu tiên hành động và theo dõi cải tiến liên tục:", {sz:24, b:40, a:60}));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[1000,8360],
    rows:[
      TH(["Điểm", "Mô tả nguyên tắc mức độ trưởng thành (Maturity Level)"],[1000,8360]),
      new TableRow({ children:[
        new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(scoreBg(1)), margins:CMs, children:[P("1", {sz:24, bold:true, col:C.red, c:true})]}) ,
        new TableCell({ width:{size:8360,type:WidthType.DXA}, borders:cb(), margins:CMs, children:[
          P("Chưa triển khai (Initial / Unstructured): Lỗi nghiêm trọng (Critical Gap), hoàn toàn không đáp ứng yêu cầu. Cần hành động ngay lập tức để giảm khả năng bị phạt tuân thủ thủ pháp lý hoặc không đạt chứng nhận.", {sz:24})
        ]}) 
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(scoreBg(2)), margins:CMs, children:[P("2", {sz:24, bold:true, col:C.orange, c:true})]}) ,
        new TableCell({ width:{size:8360,type:WidthType.DXA}, borders:cb(), margins:CMs, children:[
          P("Mới bắt đầu (Basic / Partial): Thực hiện có tính phân tán, thiếu quy trình chuẩn hóa, nguồn lực thiếu sót (Major Gap). Tổ chức cần xây dựng kế hoạch phân bổ quyền hạn và tài liệu tổng thể.", {sz:24})
        ]}) 
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(scoreBg(3)), margins:CMs, children:[P("3", {sz:24, bold:true, col:C.amber, c:true})]}) ,
        new TableCell({ width:{size:8360,type:WidthType.DXA}, borders:cb(), margins:CMs, children:[
          P("Đang phát triển (Defined / Developing): Đã có quy định bằng văn bản rõ ràng nhưng áp dụng qua thực tế chưa được đồng bộ (Minor Gap). Cần triển khai, đào tạo và thu thập thêm bằng chứng đo lường.", {sz:24})
        ]}) 
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(scoreBg(4)), margins:CMs, children:[P("4", {sz:24, bold:true, col:C.teal, c:true})]}) ,
        new TableCell({ width:{size:8360,type:WidthType.DXA}, borders:cb(), margins:CMs, children:[
          P("Phần lớn đáp ứng (Managed / Satisfactory): Hệ thống kiểm soát ổn định, lưu hồ sơ rõ ràng. Hầu hết các yêu cầu điều khoản được thoả mãn để cấp chứng chỉ.", {sz:24})
        ]}) 
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(scoreBg(5)), margins:CMs, children:[P("5", {sz:24, bold:true, col:C.navy, c:true})]}) ,
        new TableCell({ width:{size:8360,type:WidthType.DXA}, borders:cb(), margins:CMs, children:[
          P("Hoàn toàn đáp ứng (Optimizing / Best Practice): Vượt yêu cầu cơ bản, tối ưu hoá vận hành xuất sắc, liên tục cải tiến định lượng dựa trên thu thập giám sát số liệu tự động.", {sz:24})
        ]}) 
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(C.ash), margins:CMs, children:[P("0", {sz:24, bold:true, col:C.grey2, c:true})]}) ,
        new TableCell({ width:{size:8360,type:WidthType.DXA}, borders:cb(), shading:sh(C.ash), margins:CMs, children:[
          P("Không áp dụng (N/A): Yếu tố hoạt động kinh doanh của doanh nghiệp không thuộc phạm vi của điều khoản quy chiếu này do đó bị loại bỏ khỏi khảo sát.", {sz:24, col:C.grey2})
        ]}) 
      ]}),
    ]
  }));

  items.push(SP(), P("Công thức tính điểm GAP tổng thể (Weighted Scoring Method):", {sz:24, bold:true, col:C.navy, b:40, a:40}));
  items.push(P("Kết quả khảo sát không tính bằng trung bình đơn thuần mà sử dụng Phương pháp Chấm điểm có Trọng số phân tách. Nghĩa vụ tuân thủ được chỉ định Trọng Số từ 1 đến 3:", {sz:24, b:20, a:20}));
  items.push(P("• Trọng số 3 (Critical Area): Các quy định Cốt lõi của Tiêu chuẩn / Pháp luật buộc phải tuân thủ (ví dụ: Nghị định 30, Báo cáo Năng lượng).", {sz:24, b:0, a:0}));
  items.push(P("• Trọng số 2 (Major Area): Thực hành hệ thống cốt lõi và đo lường trực tiếp tác động.", {sz:24, b:0, a:0}));
  items.push(P("• Trọng số 1 (Minor Area): Quản lý tài liệu theo dõi lưu trữ thứ cấp.", {sz:24, b:0, a:20}));
  items.push(P("Tổ hợp điểm trung vị phân bổ theo điều kiện của quá trình (Điều khoản 4-10) sẽ được sử dụng phép tính Bình quân Gia quyền (Weighted Average):", {sz:24, b:20, a:20}));
  items.push(P("Điểm Điều Khoản / Điểm Tổng Thể = Tổng (Điểm đánh giá các mục × Trọng số) / Tổng (Trọng số)", {sz:24, bold:true, it:true, l:380, b:40, a:40, col:C.teal, c:true}));
  items.push(P("Phương thức khoa học này nhấn mạnh và đòi hỏi Doanh nghiệp ưu tiên nguồn lực phục vụ các khâu then chốt cấu thành sự hiện diện cốt lõi của Hệ Thống Năng Lượng thay vì dàn trải không hiệu quả.", {sz:24, it:true, col:C.grey1, l:300, b:20, a:40}));

  items.push(SP(), PBR());
  return items;
}

// ── GENERAL INFO ──────────────────────────────────────────────────
function buildGeneralInfo(d) {
  const items = [H1("2. THÔNG TIN CHUNG")];
  items.push(H2("2.1. Thông tin tổ chức được khảo sát"));
  const depts = Array.isArray(d.client?.departments) ? d.client.departments : [];
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[2800,6560], rows:[
    KV("Tên tổ chức",           d.client?.name,            C.lBlue),
    KV("Tên cơ sở / Nhà máy",  d.client?.site),
    KV("Địa chỉ",               d.client?.address,         C.lBlue),
    KV("Ngành",                  d.client?.industry),
    KV("Quy mô (CBCNV)",        d.client?.employees,       C.lBlue),
    KV("NL tiêu thụ/năm (TOE)", d.client?.annual_energy),
    KV("Cơ sở trọng điểm?",     d.client?.is_large_user?"✓ Có — bắt buộc EnMS theo Nghị định 30/2026":"✗ Không", C.lBlue),
    KV("Tình trạng chứng nhận", d.client?.cert_status||"Chưa có chứng nhận ISO 50001"),
    KV("Cơ cấu tổ chức (số phòng ban)", depts.length ? `${depts.length} phòng ban: ${depts.join("; ")}` : "—", C.lBlue),
  ]}));
  if (depts.length > 0) {
    items.push(SP(), P("Các phòng ban chức năng:", { sz:24, bold: true, col: C.navy }));
    const deptRows = depts.map((name, i) =>
      new TableRow({ children: [
        new TableCell({ width: { size: 800, type: WidthType.DXA }, borders: cb(), shading: sh(C.ash), margins: CMs, children: [P(String(i + 1), { sz:24, c: true })] }),
        new TableCell({ width: { size: 8560, type: WidthType.DXA }, borders: cb(), shading: sh(C.white), margins: CMs, children: [P(name, { sz:24 })] }),
      ]})
    );
    items.push(new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [800, 8560], rows: deptRows }));
    items.push(SP());
  }
  items.push(SP(), H2("2.2. Thông tin đoàn khảo sát"));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, columnWidths:[2800,6560], rows:[
    KV("Đơn vị tư vấn",      d.verifier?.org,          C.lBlue),
    KV("Trưởng đoàn",        d.verifier?.lead),
    KV("Thành viên",          d.verifier?.team,         C.lBlue),
    KV("Chứng chỉ EA",       d.verifier?.cert_no),
    KV("Ngày khảo sát",      d.meta?.survey_date,       C.lBlue),
    KV("Mục tiêu khảo sát",  d.meta?.objective),
    KV("Phương pháp",        "Phỏng vấn | Xem xét tài liệu | Quan sát thực địa | Đo lường tại SEU", C.lBlue),
    KV("Tiêu chuẩn áp dụng", d.verifier?.std_applied||"ISO 50001:2018; ISO 50006:2014; ISO 50002:2014"),
  ]}));
  items.push(SP(), PBR());
  return items;
}

module.exports = { buildCover, buildExecutiveSummary, buildGeneralInfo, clauseScore, overallScore };
