const { Document, Packer, TableOfContents, Table, TableRow, TableCell, WidthType, TableLayoutType, Paragraph, TextRun, BorderStyle, ImageRun } = require("docx");
const fs = require("fs");
const path = require("path");
const { DOC_STYLES, DOC_NUMBERING, DOC_PAGE, mkHeader, mkFooter, C, cb, sh, CM, CMs, TW, P, H1, H2, SP, PBR, TH, scoreColor } = require("./gap.docx.helpers");

function applyDefaults(data) {
  const d = JSON.parse(JSON.stringify(data || {}));
  d.meta = d.meta || {};
  d.client = d.client || {};
  d.verifier = d.verifier || {};
  d.responses = d.responses || {};
  d.site_assessments = Array.isArray(d.site_assessments) ? d.site_assessments : [];
  d.meters = Array.isArray(d.meters) ? d.meters : [];
  d.energy_details = Array.isArray(d.client.energy_details) ? d.client.energy_details : [];
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
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Địa chỉ:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.client.address||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Người đại diện pháp luật:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(`${d.client.representative_name||"—"} - ${d.client.representative_position||"—"}`,{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Người liên hệ:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[
          ...(d.client.contact_persons||[]).map(c => P(`${c.full_name||"—"} - ${c.phone||"—"} - ${c.email||"—"}`, {sz:24}))
        ] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Sản phẩm / Dịch vụ chính:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.client.products||"—",{sz:24})] })
      ]})
    ]
  }));
  items.push(SP());

  // Năng lượng sử dụng
  items.push(H2("1.1. Các loại năng lượng sử dụng và tiêu thụ"));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 3000, 2000, 1500, 2460],
    rows:[
      TH(["STT","Loại năng lượng","Sản lượng tiêu thụ","Đơn vị gốc","Năng lượng quy đổi (TOE)"],[400, 3000, 2000, 1500, 2460]),
      ...d.energy_details.map((e,i) => new TableRow({ children:[
        new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.type||"—",{sz:24,bold:true})] }),
        new TableCell({ width:{size:2000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.amount||"—",{sz:24,c:true})] }),
        new TableCell({ width:{size:1500}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.unit||"—",{sz:24,c:true})] }),
        new TableCell({ width:{size:2460}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.toe||"—",{sz:24,c:true})] })
      ]}))
    ]
  }));
  items.push(SP());

  // Đơn vị thực hiện đánh giá
  items.push(H1("2. THÔNG TIN CHUNG VỀ TỔ CHỨC ĐÁNH GIÁ GAP ISO 50001"));
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[3000, 6360],
    rows:[
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Tên đơn vị đánh giá:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.verifier.org||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Địa chỉ:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.verifier.address||"—",{sz:24})] })
      ]}),
      new TableRow({ children:[
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(C.lBlue), margins:CM, children:[P("Chương trình:",{sz:24,bold:true})] }),
        new TableCell({ width:{size:6360}, borders:cb(), shading:sh(C.white), margins:CM, children:[P(d.verifier.program||"—",{sz:24})] })
      ]}),
    ]
  }));
  items.push(SP());

  // Chuyên gia đánh giá
  items.push(H2("2.1. Đoàn chuyên gia thực hiện Khảo sát đánh giá Gap ISO 50001"));
  let auditors = Array.isArray(d.audit_plan?.auditors) && d.audit_plan.auditors.length > 0 
    ? d.audit_plan.auditors 
    : [];
  if (auditors.length === 0) {
    if (d.verifier?.lead) auditors.push({ name: d.verifier.lead, role: 'Trưởng đoàn', certificate: d.verifier?.cert_no || '' });
    if (d.verifier?.team) {
       d.verifier.team.split(';').map(s=>s.trim()).filter(Boolean).forEach(t => {
           auditors.push({ name: t, role: 'Thành viên', certificate: '' });
       });
    }
  }
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 3000, 2000, 3960],
    rows:[
      TH(["STT","Họ và tên","Vai trò","Chứng chỉ Năng lượng"],[400, 3000, 2000, 3960]),
      ...auditors.map((a,i) => new TableRow({ children:[
        new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(a.name||"—",{sz:24,bold:true})] }),
        new TableCell({ width:{size:2000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(a.role||"—",{sz:24})] }),
        new TableCell({ width:{size:3960}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(a.certificate||"—",{sz:24})] })
      ]}))
    ]
  }));
  items.push(SP(), PBR());
  return items;
}

function buildGapTable(d, checklist) {
  const items = [H1("3. ĐÁNH GIÁ KHOẢNG CÁCH HỒ SƠ TÀI LIỆU VỚI ISO 50001:2018")];
  
  const rows = [];
  rows.push(TH(["STT","Điều khoản","Yêu cầu ISO 50001:2018","Trạng thái hiện tại","Điểm"],[400, 1200, 4000, 2500, 1260]));
  
  checklist.forEach((item, i) => {
    const resp = d.responses[item.id] || {};
    const sc = resp.score || 0;
    const notes = resp.notes || "Chưa có thông tin";
    
    rows.push(new TableRow({ children:[
      new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
      new TableCell({ width:{size:1200}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.id,{sz:24,bold:true,c:true})] }),
      new TableCell({ width:{size:4000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.title,{sz:24})] }),
      new TableCell({ width:{size:2500}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(notes,{sz:24})] }),
      new TableCell({ width:{size:1260}, borders:cb(), shading:sh(sc===1?`${C.red}18`:sc===2?`${C.orange}18`:sc>=4?`${C.teal}18`:C.ash), margins:CMs, children:[P(sc?`${sc}/5.0`:"—",{sz:24,c:true,bold:true,col:scoreColor(sc)})] })
    ]}));
  });

  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 1200, 4000, 2500, 1260], rows }));
  items.push(SP(), PBR());
  return items;
}

function buildSeusTable(d) {
  const items = [H1("4. DANH SÁCH KHU VỰC SỬ DỤNG NĂNG LƯỢNG ĐÁNG KỂ (SEU)")];
  const seus = d.site_assessments.filter(z => z.is_seu);

  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 3000, 2000, 2000, 1960],
    rows:[
      TH(["STT","Tên SEU / Khu vực","Loại Năng lượng","Lượng NL sử dụng","Tỷ lệ % năng lượng"],[400, 3000, 2000, 2000, 1960]),
      ...seus.map((s,i) => new TableRow({ children:[
        new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
        new TableCell({ width:{size:3000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(s.name||"—",{sz:24,bold:true})] }),
        new TableCell({ width:{size:2000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(s.energy_types||"—",{sz:24,c:true})] }),
        new TableCell({ width:{size:2000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(s.consumption||"—",{sz:24,c:true})] }),
        new TableCell({ width:{size:1960}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(s.percentage?`${s.percentage}%`:"—",{sz:24,c:true})] })
      ]}))
    ]
  }));
  items.push(SP());
  return items;
}

function buildMetersTableLite(d) {
  const items = [H1("5. THỐNG KÊ THIẾT BỊ ĐO LƯỜNG NĂNG LƯỢNG")];
  
  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 1600, 2000, 2000, 1600, 1760],
    rows:[
      TH(["STT","Tên ĐH","Phụ tải đo","Phương thức thu thập","Tần suất chốt","Kiểm định/HC"],[400, 1600, 2000, 2000, 1600, 1760]),
      ...d.meters.map((m,i) => new TableRow({ children:[
        new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
        new TableCell({ width:{size:1600}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(m.name||"—",{sz:24,bold:true})] }),
        new TableCell({ width:{size:2000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(m.load_type||"—",{sz:24})] }),
        new TableCell({ width:{size:2000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(m.collect_method||"—",{sz:24})] }),
        new TableCell({ width:{size:1600}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(m.frequency||"—",{sz:24})] }),
        new TableCell({ width:{size:1760}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(m.calib_status||"—",{sz:24})] }),
      ]}))
    ]
  }));
  items.push(SP(), PBR());
  return items;
}

function buildRisksTableWait(d, imagesByEqId) {
  const items = [H1("6. RỦI RO & CƠ HỘI CẢI TIẾN TẠI HIỆN TRƯỜNG")];
  
  const allEquipments = d.site_assessments.flatMap(z => z.equipment || []);
  const risksAndOpps = allEquipments.filter(e => (e.finding && e.finding.trim().length > 0) || (e.recommendation && e.recommendation.trim().length > 0) || (imagesByEqId[e.id] && imagesByEqId[e.id].length > 0));

  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 2000, 1800, 2800, 2360],
    rows:[
      TH(["STT","Tên thiết bị / Hệ thống","Loại","Phát hiện (Rủi ro & Cơ hội cải tiến)","Hình ảnh"],[400, 2000, 1800, 2800, 2360]),
      ...risksAndOpps.map((e,i) => {
        const pRuns = [];
        const eqImages = imagesByEqId[e.id] || [];
        if (eqImages.length > 0) {
          eqImages.forEach(img => {
            const imgPath = path.resolve(__dirname, "./uploads", img.path || `${img.surveyId}/${img.filename}`);
            if (fs.existsSync(imgPath)) {
              try {
                const imgData = fs.readFileSync(imgPath);
                pRuns.push(new ImageRun({
                  data: imgData,
                  transformation: { width: 140, height: 100 },
                }));
                pRuns.push(new TextRun({ text: "  " })); // spacer
              } catch (err) {
                 console.error("Error reading docx img:", err);
              }
            }
          });
        }
        
        return new TableRow({ children:[
          new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
          new TableCell({ width:{size:2000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.name||"—",{sz:24,bold:true})] }),
          new TableCell({ width:{size:1800}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.type||"—",{sz:24})] }),
          new TableCell({ width:{size:2800}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(e.finding||"—",{sz:24})] }),
          new TableCell({ width:{size:2360}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[new Paragraph({ children: pRuns.length > 0 ? pRuns : [new TextRun({ text:"Không có ảnh", color:C.grey2 })], alignment:"center" })] }),
        ]});
      })
    ]
  }));
  items.push(SP());
  return items;
}

async function generateGapReportLite(data, checklist = [], imagesByEqId = {}) {
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
    ...buildSeusTable(d),
    ...buildMetersTableLite(d),
    ...buildRisksTableWait(d, imagesByEqId),
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
