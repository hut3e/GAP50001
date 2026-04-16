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
    const note = resp.note || "Chưa có thông tin"; // In Lite it saves as 'note'
    
    rows.push(new TableRow({ children:[
      new TableCell({ width:{size:400}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(String(i+1),{sz:24,c:true})] }),
      new TableCell({ width:{size:1200}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.id||`CUS-${item.clause}`,{sz:24,bold:true,c:true,col:item.isCustom?C.violet:C.black})] }),
      new TableCell({ width:{size:4000}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(item.title,{sz:24})] }),
      new TableCell({ width:{size:2500}, borders:cb(), shading:sh(i%2?C.white:C.ash), margins:CMs, children:[P(note,{sz:24})] }),
      new TableCell({ width:{size:1260}, borders:cb(), shading:sh(sc===1?`${C.red}18`:sc===2?`${C.orange}18`:sc>=4?`${C.teal}18`:C.ash), margins:CMs, children:[P(sc?`${sc}/5.0`:"—",{sz:24,c:true,bold:true,col:scoreColor(sc)})] })
    ]}));
  });

  items.push(new Table({ width:{size:TW,type:WidthType.DXA}, layout: TableLayoutType.FIXED, columnWidths:[400, 1200, 4000, 2500, 1260], rows }));
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

