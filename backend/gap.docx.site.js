/**
 * ISO50001Gap — gap.docx.site.js
 * Site/Zone/Equipment approach + Master Action Plan + Legal Compliance + Roadmap
 */
const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, TableLayoutType,
} = require("docx");
const { C, cb, sh, CM, CMs, TW, scoreColor, scoreBg, scoreLabel, P, H1, H2, H3, SP, PBR, LINE, TH } = require("./gap.docx.helpers");
const { EQUIPMENT_TYPES } = require("./gap.constants");

// ═══════════════════════════════════════════════════════════
// SITE / ZONE / EQUIPMENT SECTION
// ═══════════════════════════════════════════════════════════
function buildSiteSection(d, secNum) {
  const sites = d.site_assessments || [];
  const items = [H1(`${secNum}. KHẢO SÁT HIỆN TRƯỜNG — NHÀ XƯỞNG, KHU VỰC VÀ THIẾT BỊ`)];
  items.push(P("Khảo sát thực địa tại từng khu vực/thiết bị nhằm xác định SEU (Khu vực sử dụng NL đáng kể), hiệu suất thực tế và cơ hội cải tiến theo ISO 50001:2018 §6.3 & §8.1.",{sz:24,b:60,a:120,l:296}));

  if (!sites.length) {
    items.push(P("Chưa có dữ liệu khảo sát hiện trường.",{sz:24,it:true,col:C.grey2}));
    items.push(PBR());
    return items;
  }

  // Zone overview table
  items.push(H2(`${secNum}.1. Tổng quan các khu vực / nhà xưởng được khảo sát`));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400,2600,1800,1200,1000,1000,1360],
    rows:[
      TH(["STT","Tên khu vực / Nhà xưởng","Loại NL chính","NL tiêu thụ","% Tổng","Điểm SEU","Điểm GAP"],[400,2600,1800,1200,1000,1000,1360]),
      ...sites.map((z, i) => {
        const sc  = z.gap_score || 0;
        const sci = Math.round(sc);
        return new TableRow({ children:[
          new TableCell({ width:{size:400},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true,col:C.grey2})]}),
          new TableCell({ width:{size:2600}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[new Paragraph({ children:[
            new TextRun({ text:z.icon||"🏭", font:"Times New Roman", size:24 }),
            new TextRun({ text:" "+z.name, font:"Times New Roman", size:24, bold:true, color:C.navy }),
          ]})]}),
          new TableCell({ width:{size:2400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(z.energy_types||"—",{sz:24})]}),
          new TableCell({ width:{size:1200}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(z.consumption||"—",{sz:24,c:true})]}),
          new TableCell({ width:{size:1000}, borders:cb(), shading:sh(parseFloat(z.percentage||0)>=20?`${C.red}18`:C.ash), margins:CMs,
            children:[P(z.percentage?z.percentage+"%":"—",{sz:24,c:true,bold:parseFloat(z.percentage||0)>=20,col:parseFloat(z.percentage||0)>=20?C.red:C.black})]}),
          new TableCell({ width:{size:1000}, borders:cb(), shading:sh(z.is_seu?`${C.orange}18`:C.ash), margins:CMs,
            children:[P(z.is_seu?"⚡ SEU":"—",{sz:24,bold:z.is_seu,c:true,col:z.is_seu?C.orange:C.grey3})]}),
          new TableCell({ width:{size:1360}, borders:cb(), shading:sh(scoreBg(sci)), margins:CMs, children:[P(sc?`${sc}/5.0`:"—",{sz:24,bold:true,c:true,col:scoreColor(sci)})]}),
        ]});
      }),
    ],
  }));
  items.push(SP());

  // Each zone detail
  items.push(H2(`${secNum}.2. Chi tiết khảo sát từng khu vực`));
  sites.forEach((zone, zi) => {
    const zsc  = zone.gap_score || 0;
    const zsci = Math.round(zsc);
    const zcol = scoreColor(zsci);

    items.push(new Paragraph({ spacing:{before:130,after:0}, shading:sh(zsci?`${zcol}12`:C.ash),
      border:{ left:{ style:BorderStyle.SINGLE, size:24, color:zsci?zcol:C.grey3, space:3 }},
      children:[
        new TextRun({ text:`  ${zone.icon||"🏭"}  `, font:"Times New Roman", size:24 }),
        new TextRun({ text:zone.name, font:"Times New Roman", size:24, bold:true, color:C.navy }),
        ...(zone.is_seu ? [new TextRun({ text:"  ⚡ SEU", font:"Times New Roman", size:24, bold:true, color:C.orange })] : []),
        new TextRun({ text:`   Điểm GAP: ${zsc||"—"}/5.0`, font:"Times New Roman", size:24, color:zcol }),
      ],
    }));
    // Zone info table
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[2340,2340,2340,2340],
      rows:[new TableRow({ children:[
        new TableCell({ width:{size:2340,type:WidthType.DXA}, borders:cb(), shading:sh(C.lBlue), margins:CM,
          children:[P("Loại năng lượng:",{sz:24,bold:true,col:C.navy,a:25}), P(zone.energy_types||"—",{sz:24})]}),
        new TableCell({ width:{size:2340,type:WidthType.DXA}, borders:cb(), shading:sh(C.lBlue), margins:CM,
          children:[P("NL tiêu thụ / năm:",{sz:24,bold:true,col:C.navy,a:25}), P(zone.consumption||"—",{sz:24,bold:true,col:C.skyL})]}),
        new TableCell({ width:{size:2340,type:WidthType.DXA}, borders:cb(), shading:sh(C.lBlue), margins:CM,
          children:[P("Người vận hành:",{sz:24,bold:true,col:C.navy,a:25}), P(zone.operator||"—",{sz:24})]}),
        new TableCell({ width:{size:2340,type:WidthType.DXA}, borders:cb(), shading:sh(C.lBlue), margins:CM,
          children:[P("Tiềm năng TKNL:",{sz:24,bold:true,col:C.teal,a:25}), P(zone.potential||"—",{sz:24,col:C.teal,bold:true})]}),
      ]})]
    }));

    // Equipment list
    const equips = zone.equipment || [];
    if (equips.length > 0) {
      items.push(P("Danh sách thiết bị khảo sát:",{sz:24,bold:true,col:C.navy,b:80,a:30}));
      items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[300,2000,1500,1200,1200,1000,2160],
        rows:[
          TH(["STT","Tên thiết bị","Loại thiết bị","CS (kW)","Trạng thái","Điểm","Phát hiện chính"],[300,2000,1500,1200,1200,1000,2160]),
          ...equips.map((eq, ei) => {
            const eqsc  = eq.gap_score || 0;
            const eqsci = Math.round(eqsc);
            const eqcol = scoreColor(eqsci);
            return new TableRow({ children:[
              new TableCell({ width:{size:300},  borders:cb(), shading:sh(ei%2?C.white:C.ash), margins:CMs, children:[P(String(ei+1),{sz:24,c:true,col:C.grey2})]}),
              new TableCell({ width:{size:2000}, borders:cb(), shading:sh(ei%2?C.white:C.ash), margins:CMs, children:[P(eq.name||"—",{sz:24,bold:true})]}),
              new TableCell({ width:{size:2400}, borders:cb(), shading:sh(ei%2?C.white:C.ash), margins:CMs, children:[P(eq.type||"—",{sz:24,it:true,col:C.blue})]}),
              new TableCell({ width:{size:1200}, borders:cb(), shading:sh(ei%2?C.white:C.ash), margins:CMs, children:[P(eq.capacity||"—",{sz:24,c:true})]}),
              new TableCell({ width:{size:1200}, borders:cb(), shading:sh(eq.status==="poor"?`${C.red}18`:eq.status==="fair"?`${C.amber}18`:`${C.teal}18`), margins:CMs,
                children:[P(eq.status==="poor"?"⚠ Kém":eq.status==="fair"?"~ Trung bình":"✓ Tốt",{sz:24,bold:true,c:true,col:eq.status==="poor"?C.red:eq.status==="fair"?C.amber:C.teal})]}),
              new TableCell({ width:{size:1000}, borders:cb(), shading:sh(scoreBg(eqsci)), margins:CMs, children:[P(eqsc?`${eqsc}/5`:"—",{sz:24,bold:true,c:true,col:eqcol})]}),
              new TableCell({ width:{size:2160}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(eq.finding||"—",{sz:24,col:C.grey1})]}),
            ]});
          }),
        ],
      }));
    }
    if (zone.notes) items.push(new Paragraph({ spacing:{before:60,after:80}, shading:sh(C.lBlue),
      border:{ left:{ style:BorderStyle.SINGLE, size:14, color:C.blue, space:3 }},
      children:[
        new TextRun({ text:"  📝 Nhận xét hiện trường: ", font:"Times New Roman", size:24, bold:true, color:C.navy }),
        new TextRun({ text:zone.notes, font:"Times New Roman", size:24, color:C.black }),
      ],
    }));
    items.push(SP());
  });
  items.push(PBR());
  return items;
}

// ═══════════════════════════════════════════════════════════
// METERS SECTION
// ═══════════════════════════════════════════════════════════
function buildMetersSection(d, secNum) {
  const meters = d.meters || [];
  const items = [H1(`${secNum}. THIẾT BỊ ĐO LƯỜNG`)];
  items.push(P("Khảo sát hệ thống đo lường năng lượng để đáp ứng yêu cầu giám sát, thiết lập đường cơ sở (EnB) và chỉ số hiệu quả năng lượng (EnPI).",{sz:24,b:60,a:120,l:296}));

  if (!meters.length) {
    items.push(P("Chưa có thông tin đồng hồ / thiết bị đo lường nào được ghi nhận.",{sz:24,it:true,col:C.grey2}));
    items.push(PBR());
    return items;
  }

  items.push(H2(`${secNum}.1. Cấu trúc thiết bị đo lường`));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400,2000,1600,1600,2200,1560],
    rows:[
      TH(["STT","Tên đồng hồ","Phụ tải","Loại / Hãng","Thu thập / Tần suất","Kiểm định"],[400,2000,1600,1600,2200,1560]),
      ...meters.map((m, i) => {
        return new TableRow({ children:[
          new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true,col:C.grey2})]}),
          new TableCell({ width:{size:2000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[
            P(m.name||"—",{sz:24,bold:true,col:C.navy}),
            P(m.notes||"",{sz:20,it:true,col:C.grey1}),
          ]}),
          new TableCell({ width:{size:1600}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(m.load_type||"—",{sz:24})]}),
          new TableCell({ width:{size:1600}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[
            P(m.type||"—",{sz:24,col:C.blue}),
            P(m.brand||"—",{sz:20,col:C.grey2}),
          ]}),
          new TableCell({ width:{size:2200}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[
            P(m.collect_method||"—",{sz:24}),
            P(m.frequency||"—",{sz:20,col:C.grey2}),
          ]}),
          new TableCell({ width:{size:1560}, borders:cb(), shading:sh(m.calib_status&&m.calib_status.includes("Chưa")?`${C.orange}18`:C.ash), margins:CMs, children:[
            P(m.calib_status||"—",{sz:24,c:true,col:m.calib_status&&m.calib_status.includes("Chưa")?C.orange:C.black}),
          ]}),
        ]});
      }),
    ],
  }));
  items.push(SP(), PBR());
  return items;
}

// ═══════════════════════════════════════════════════════════
// MASTER ACTION PLAN
// ═══════════════════════════════════════════════════════════
function buildActionPlan(d, secNum) {
  const actions = d.action_plan || [];
  
  // Auto-correct phase mappings from deadline to avoid drifts
  const getPhase = (a) => {
     if (a.deadline && (a.deadline.toLowerCase().includes("ngày") || a.deadline.length <= 4)) {
         const m = a.deadline.match(/\d+/);
         if (m) {
             const v = parseInt(m[0], 10);
             if (v <= 30) return "P1";
             if (v <= 90) return "P2";
             if (v <= 180) return "P3";
             return "P4";
         }
     }
     if (a.deadline && a.deadline.includes("-")) {
         const dt = new Date(a.deadline);
         const base = d.date ? new Date(d.date) : new Date();
         if (!isNaN(dt) && !isNaN(base)) {
             const diff = (dt - base) / (1000 * 3600 * 24);
             if (dt < base || diff <= 30) return "P1";
             if (diff <= 90) return "P2";
             if (diff <= 180) return "P3";
             return "P4";
         }
     }
     return a.phase;
  };
  actions.forEach(a => a.phase = getPhase(a));

  const items   = [H1(`${secNum}. MASTER ACTION PLAN — LỘ TRÌNH KHẮC PHỤC KHOẢNG CÁCH`)];
  items.push(P("Kế hoạch hành động tổng thể để đóng khoảng cách, xây dựng EnMS đạt tiêu chuẩn ISO 50001:2018 và chuẩn bị chứng nhận.",{sz:24,b:60,a:120,l:296}));

  const phases = [
    { id:"P1", label:"Giai đoạn 1 — Ngay lập tức (0–30 ngày)",   items:actions.filter(a=>a.phase==="P1"), color:C.red },
    { id:"P2", label:"Giai đoạn 2 — Ngắn hạn (1–3 tháng)",       items:actions.filter(a=>a.phase==="P2"), color:C.orange },
    { id:"P3", label:"Giai đoạn 3 — Trung hạn (3–6 tháng)",      items:actions.filter(a=>a.phase==="P3"), color:C.amber },
    { id:"P4", label:"Giai đoạn 4 — Dài hạn (6–12 tháng)",       items:actions.filter(a=>a.phase==="P4"), color:C.teal },
  ];

  phases.forEach(ph => {
    if (!ph.items.length) return;
    items.push(new Paragraph({ spacing:{before:120,after:0}, shading:sh(ph.color),
      children:[new TextRun({ text:`  ${ph.label}  `, font:"Times New Roman", size:24, bold:true, color:C.white })],
    }));
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[380,400,2900,1400,1200,1200,1880],
      rows:[
        TH(["STT","Mã","Hành động / Dự án","Điều khoản","Người TN","Deadline","Nguồn lực"],[380,400,2900,1400,1200,1200,1880]),
        ...ph.items.map((act, i) => new TableRow({ children:[
          new TableCell({ width:{size:380},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})]}),
          new TableCell({ width:{size:400},  borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(act.code||"—",{sz:24,bold:true,col:C.blue})]}),
          new TableCell({ width:{size:2900}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(act.action||"—",{sz:24})]}),
          new TableCell({ width:{size:1400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(act.clause||"—",{sz:24,col:C.tealL})]}),
          new TableCell({ width:{size:1200}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(act.responsible||"—",{sz:24})]}),
          new TableCell({ width:{size:1200}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(act.deadline||"—",{sz:24,col:C.orange})]}),
          new TableCell({ width:{size:2480}, borders:cb(), shading:sh(C.white), margins:CMs, children:[P(act.resources||"—",{sz:24,it:true,col:C.grey1})]}),
        ]})),
      ],
    }));
    items.push(SP());
  });

  // Certification roadmap — title: LỘ TRÌNH TƯ VẤN CHỨNG NHẬN ISO 50001:2018
  items.push(H2(`${secNum}.1. LỘ TRÌNH TƯ VẤN CHỨNG NHẬN ISO 50001:2018`));
  if (d.meta?.roadmap_custom_start || d.meta?.roadmap_custom_end) {
    items.push(P(`Thời gian lộ trình: Từ tháng ${d.meta.roadmap_custom_start || "---"} đến tháng ${d.meta.roadmap_custom_end || "---"}`, {sz:24, it:true, col:C.grey2}));
  }
  
  const dString = (d) => {
    if (!d) return "—";
    const dd = new Date(d);
    if (isNaN(dd.getTime())) return d;
    return `${dd.getDate().toString().padStart(2,"0")}/${(dd.getMonth()+1).toString().padStart(2,"0")}/${dd.getFullYear()}`;
  };

  const roadmapRows = Array.isArray(d.certification_roadmap) && d.certification_roadmap.length > 0
    ? d.certification_roadmap
    : [];

  if (roadmapRows.length === 0) {
    items.push(P("Chưa có lộ trình cụ thể.",{sz:24,it:true,col:C.grey2}));
  } else {
    items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[460, 4100, 1500, 1300, 1000, 1000],
      rows:[
        TH(["TT","Hạng mục công việc / Giai đoạn","Trách nhiệm","Hỗ trợ","Bắt đầu","Kết thúc"],[460, 4100, 1500, 1300, 1000, 1000]),
        ...roadmapRows.map((r,i) => {
          if (r.type === "phase") {
            return new TableRow({ children:[
              new TableCell({ width:{size:460,type:WidthType.DXA}, borders:cb(), shading:sh(C.lBlue), margins:CMs, children:[P(r.no||"—",{sz:24,bold:true,col:C.navy,c:true})]}),
              new TableCell({ width:{size:8900,type:WidthType.DXA}, columnSpan: 5, borders:cb(), shading:sh(C.lBlue), margins:CMs, children:[P(r.phaseName||"—",{sz:24,bold:true,col:C.navy})]}),
            ]});
          }
          return new TableRow({ children:[
            new TableCell({ width:{size:460,type:WidthType.DXA}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(r.no||"—",{sz:24,c:true})]}),
            new TableCell({ width:{size:4100,type:WidthType.DXA}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(r.activity||"—",{sz:24})]}),
            new TableCell({ width:{size:1500,type:WidthType.DXA}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(r.resp||"—",{sz:24})]}),
            new TableCell({ width:{size:1300,type:WidthType.DXA}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(r.supp||"—",{sz:24})]}),
            new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(dString(r.startDate),{sz:24,c:true})]}),
            new TableCell({ width:{size:1000,type:WidthType.DXA}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(dString(r.endDate),{sz:24,c:true})]}),
          ]});
        }),
      ],
    }));
  }
  items.push(SP(), PBR());
  return items;
}

// ═══════════════════════════════════════════════════════════
// LEGAL COMPLIANCE APPENDIX
// ═══════════════════════════════════════════════════════════
function buildLegalAppendix(d, secNum) {
  const legalStatus = d.legal_status || {};
  const items = [H1(`PHỤ LỤC — ĐĂNG KÝ TUÂN THỦ PHÁP LÝ VÀ TIÊU CHUẨN`)];
  const VN_LEGAL_DEFAULT = [
    { code:"Luật 50/2010/QH12",   name:"Luật Sử dụng NL tiết kiệm và HQ; Luật 77/2025/QH15", type:"Luật",     key:"Điều 4–7, 35–42", threshold:"Bắt buộc tất cả CSTN" },
    { code:"NĐ 30/2026/NĐ-CP",    name:"Nghị định 30/2026",                     type:"Nghị định",key:"Điều 10–30",      threshold:"" },
    { code:"TT 25/2020/TT-BCT",   name:"Quản lý NL tại cơ sở CN trọng điểm",   type:"Thông tư", key:"Điều 4–20",       threshold:"≥1.000 TOE/năm" },
    { code:"TT 25/2020/TT-BCT",   name:"Kiểm toán năng lượng",                   type:"Thông tư", key:"Điều 5–15",       threshold:"Mỗi 3 năm — CSTN" },
    { code:"TT 38/2014/TT-BCT",   name:"Đào tạo quản lý năng lượng (EMR)",       type:"Thông tư", key:"Điều 4–9",        threshold:"Bắt buộc EMR" },
    { code:"TT 36/2016/TT-BCT",   name:"Dán nhãn năng lượng và MEPS",            type:"Thông tư", key:"Danh mục thiết bị",threshold:"Thiết bị trong danh mục" },
    { code:"QĐ 280/QĐ-TTg",       name:"VNEEP3 (2019–2030)",                     type:"QĐ TTg",   key:"Mục tiêu 8–10% TKNL",threshold:"" },
    { code:"NĐ 06/2022/NĐ-CP",    name:"Giảm phát thải KNK",                     type:"Nghị định",key:"Điều 6, 15",      threshold:"≥3.000 tCO₂e/năm" },
    { code:"QĐ 1725/QĐ-BCT (2024)", name:"Danh mục mặt hàng kiểm tra hiệu suất NL và dán nhãn năng lượng", type:"QĐ BCT", key:"Danh mục thiết bị (motor, bơm, quạt...)", threshold:"Thiết bị trong danh mục" },
  ];
  const ISO_FAM_DEFAULT = [
    { code:"ISO 50001:2018", role:"Tiêu chuẩn gốc — EnMS Requirements" },
    { code:"ISO 50002:2014", role:"Energy Audits — Kiểm toán năng lượng" },
    { code:"ISO 50003:2014", role:"Certification Bodies — Tổ chức chứng nhận" },
    { code:"ISO 50004:2014", role:"Implementation Guidance — Hướng dẫn triển khai" },
    { code:"ISO 50006:2014", role:"EnPI & EnB Measurement" },
    { code:"ISO 50015:2014", role:"M&V — Đo lường và xác minh NL" },
    { code:"ISO 50021:2019", role:"EnPI/EnB Selection Guidelines" },
    { code:"ISO 50047:2016", role:"Energy Savings Determination" },
  ];
  const VN_LEGAL = (d.legal_registry && d.legal_registry.length > 0)
    ? d.legal_registry.map(r => ({ code: r.code, name: r.subject || r.name, type: r.doc_type || r.type, key: r.articles || r.key, threshold: r.threshold || "" }))
    : VN_LEGAL_DEFAULT;
  const ISO_FAM = (d.iso_standards_registry && d.iso_standards_registry.length > 0)
    ? d.iso_standards_registry.map(r => ({ code: r.standard_id || r.code, role: r.focus || r.role }))
    : ISO_FAM_DEFAULT;
  const SCOL = { compliant:C.teal, partial:C.amber, non_compliant:C.red, not_applicable:C.grey2, pending:C.grey3 };
  const SLB  = { compliant:"✓ Tuân thủ", partial:"⚠ Một phần", non_compliant:"✗ Chưa tuân thủ", not_applicable:"— N/A", pending:"○ Đang XĐ" };

  items.push(H2("1. Pháp luật Việt Nam — Mức độ tuân thủ"));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[1600,2800,1000,1400,1000,1560],
    rows:[
      TH(["Văn bản","Tên","Loại","Điều khoản chính","Ngưỡng","Trạng thái"],[1600,2800,1000,1400,1000,1560]),
      ...VN_LEGAL.map((l,i) => {
        const s   = (d.legal_registry && d.legal_registry[i]) ? (d.legal_registry[i].status || legalStatus[l.code]) : (legalStatus[l.code]||"pending");
        const sc  = SCOL[s]||C.grey3;
        return new TableRow({ children:[
          new TableCell({ width:{size:2400},borders:cb(),shading:sh(i%2?C.white:C.ash),margins:CMs,children:[P(l.code,{sz:24,bold:true,col:C.navy})]}),
          new TableCell({ width:{size:2800},borders:cb(),shading:sh(i%2?C.white:C.ash),margins:CMs,children:[P(l.name,{sz:24})]}),
          new TableCell({ width:{size:1000},borders:cb(),shading:sh(`${C.blue}12`),margins:CMs,children:[P(l.type,{sz:24,col:C.blue,c:true})]}),
          new TableCell({ width:{size:1400},borders:cb(),shading:sh(i%2?C.white:C.ash),margins:CMs,children:[P(l.key,{sz:24,it:true})]}),
          new TableCell({ width:{size:1000},borders:cb(),shading:sh(l.threshold?`${C.orange}12`:C.ash),margins:CMs,children:[P(l.threshold||"Tất cả",{sz:20,it:true})]}),
          new TableCell({ width:{size:2460},borders:cb(),shading:sh(`${sc}18`),margins:CMs,children:[P(SLB[s]||"—",{sz:24,bold:true,c:true,col:sc})]}),
        ]});
      }),
    ],
  }));
  items.push(SP(), H2("2. Họ tiêu chuẩn ISO 500xx áp dụng"));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[1600,7760],
    rows:[
      TH(["Mã tiêu chuẩn","Vai trò trong dự án tư vấn GAP"],[1600,7760]),
      ...ISO_FAM.map((s,i) => new TableRow({ children:[
        new TableCell({ width:{size:2400},borders:cb(),shading:sh(i%2?C.white:C.lBlue),margins:CMs,children:[P(s.code,{sz:24,bold:true,col:C.navy})]}),
        new TableCell({ width:{size:7760},borders:cb(),shading:sh(i%2?C.white:C.ash),margins:CMs,children:[P(s.role,{sz:24})]}),
      ]})),
    ],
  }));
  return items;
}

module.exports = { buildSiteSection, buildMetersSection, buildActionPlan, buildLegalAppendix };
