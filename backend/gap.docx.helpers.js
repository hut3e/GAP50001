/**
 * ISO50001Gap — gap.docx.helpers.js
 * Shared DOCX primitives: colour palette, Paragraph/Table/Header/Footer builders
 */
const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  HeadingLevel, LineRuleType, UnderlineType,
  Header, Footer, PageBreak, SimpleField,
} = require("docx");

// ── Colour palette ─────────────────────────────────────────────────
const C = {
  navy:"1B3564", blue:"2E5FA3", blueL:"4472C4", teal:"0D7377", tealL:"0FA08A",
  green:"1A7A4A", greenL:"27AE60",
  red:"C0392B",  redL:"E74C3C",
  orange:"D35400", orangeL:"E67E22",
  violet:"6C3483", amber:"B7770D",
  sky:"2471A3",  gold:"B8860B",
  ash:"F4F6F8", white:"FFFFFF", black:"1A1A1A",
  grey1:"4A4A4A", grey2:"6C757D", grey3:"ADB5BD", border:"D0D3D4",
  lBlue:"EAF2FA", lGreen:"E9F7EF", lRed:"FDEDEC", lYellow:"FEF9E7",
  lViolet:"F4ECF7", lTeal:"E8F5F5", lAmber:"FEF3C7",
};

// ── Borders / Shading ──────────────────────────────────────────────
const bdr = (c = C.border, sz = 6) => ({ style: BorderStyle.SINGLE, size: sz, color: c });
const cb  = (c = C.border) => ({ top:bdr(c), bottom:bdr(c), left:bdr(c), right:bdr(c) });
const nb  = { style:BorderStyle.NONE, size:0, color:C.white };
const nob = { top:nb, bottom:nb, left:nb, right:nb };
const sh  = (fill="FFFFFF", type=ShadingType.CLEAR) => ({ fill: String(fill).replace(/^#/,"").slice(0,6), type });
const CM  = { top:80, bottom:80, left:120, right:80 };
const CMs = { top:55, bottom:55, left:90, right:60 };
const TW  = 9360; // content width DXA

// ── Score → colour mapping ─────────────────────────────────────────
const scoreColor = s => [C.grey3, C.red, C.orange, C.amber, C.green, C.teal][s] || C.grey3;
const scoreBg    = s => [C.ash, C.lRed, C.lYellow, C.lAmber, C.lGreen, C.lTeal][s] || C.ash;
const scoreLabel = s => ["N/A","Chưa triển khai","Mới bắt đầu","Đang phát triển","Phần lớn đáp ứng","Hoàn toàn đáp ứng"][s] || "—";
const riskLevel  = (l,i) => {
  const v = l * i;
  if (v >= 16) return { label:"NGHIÊM TRỌNG", color:C.red,    bg:C.lRed };
  if (v >= 9)  return { label:"CAO",           color:C.orange, bg:C.lYellow };
  if (v >= 4)  return { label:"TRUNG BÌNH",    color:C.amber,  bg:C.lAmber };
  return               { label:"THẤP",          color:C.green,  bg:C.lGreen };
};

// ── Paragraph builders ─────────────────────────────────────────────
const P = (text, o={}) => new Paragraph({
  alignment: o.c ? AlignmentType.CENTER : o.r ? AlignmentType.RIGHT : AlignmentType.LEFT,
  spacing:{ before:o.b||0, after:o.a||90, line:o.l||276, lineRule:LineRuleType.AUTO },
  shading: o.bg ? sh(o.bg) : undefined,
  border:  o.bl ? { left:{ style:BorderStyle.SINGLE, size:o.bl, color:o.bc||C.blue, space:4 }} : undefined,
  children:[new TextRun({
    text:String(text||""), font:"Times New Roman", size:o.sz||26, // 13pt for normal body
    bold:!!o.bold, italic:!!o.it, color:o.col||C.black,
    underline:o.u?{type:UnderlineType.SINGLE}:undefined,
  })],
});
const H1 = t => new Paragraph({ heading:HeadingLevel.HEADING_1,
  spacing:{before:360,after:180},
  border:{ bottom:{ style:BorderStyle.SINGLE, size:10, color:C.blue, space:2 }},
  children:[new TextRun({ text:t, font:"Times New Roman", size:32, bold:true, color:C.navy })], // 16pt
});
const H2 = t => new Paragraph({ heading:HeadingLevel.HEADING_2, spacing:{before:220,after:110},
  children:[new TextRun({ text:t, font:"Times New Roman", size:28, bold:true, color:C.blue })], // 14pt
});
const H3 = t => new Paragraph({ heading:HeadingLevel.HEADING_3, spacing:{before:160,after:80},
  children:[new TextRun({ text:t, font:"Times New Roman", size:26, bold:true, color:C.teal })], // 13pt
});
const SP  = () => P("", {a:80});
const PBR = () => new Paragraph({ children:[new PageBreak()] });
const LINE= (c=C.border) => new Paragraph({ spacing:{before:60,after:60},
  border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:c, space:1 }}, children:[new TextRun("")] });

// ── Table helpers ──────────────────────────────────────────────────
const TH = (headers, widths, hc=C.navy) => new TableRow({ tableHeader:true,
  children:[...headers.map((h,i) => new TableCell({
    width:{size:widths[i],type:WidthType.DXA}, borders:cb(hc), shading:sh(hc), margins:CMs,
    children:[P(h,{sz:24,bold:true,col:C.white,c:true})], // 12pt for headers
  }))],
});
const TR = (cells, widths, ri=0) => new TableRow({ children:cells.map((cell,i) => new TableCell({
  width:{size:widths[i],type:WidthType.DXA}, borders:cb(), shading:sh(ri%2===0?C.ash:C.white), margins:CMs,
  children: Array.isArray(cell)?cell:[P(String(cell||""),{sz:24})], // 12pt for body data
})) });
const KV = (key, val, bg=C.ash) => new TableRow({ children:[
  new TableCell({ width:{size:2800,type:WidthType.DXA}, borders:cb(), shading:sh(bg), margins:CM,
    children:[P(key,{sz:24,bold:true,col:C.navy})]}),
  new TableCell({ width:{size:6560,type:WidthType.DXA}, borders:cb(), shading:sh(C.white), margins:CM,
    children:[P(val,{sz:24})]}),
]});

// ── Score bar cell ─────────────────────────────────────────────────
const ScoreCell = (score, w=1200) => new TableCell({ width:{size:w,type:WidthType.DXA},
  borders:cb(), shading:sh(scoreBg(score)), margins:CMs,
  children:[P(scoreLabel(score),{sz:24,bold:true,c:true,col:scoreColor(score)})], // 11pt
});

// ── Header / Footer ────────────────────────────────────────────────
const mkHeader = d => new Header({ children:[new Paragraph({
  spacing:{before:0,after:0},
  border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:C.blue, space:1 }},
  children:[
    new TextRun({ text:`${d.verifier?.org||"ISO 50001 GAP Survey"}  |  `, font:"Times New Roman", size:24, color:C.blue, bold:true }), // 10pt
    new TextRun({ text:`BÁO CÁO KHẢO SÁT GAP ISO 50001:2018  |  ${d.meta?.ref_no||"—"}  |  `, font:"Times New Roman", size:24, color:C.grey2 }),
    new TextRun({ text:d.meta?.confidential||"CONFIDENTIAL", font:"Times New Roman", size:24, color:C.red, bold:true }),
  ],
})]});
const mkFooter = d => new Footer({ children:[new Paragraph({
  spacing:{before:0,after:0},
  border:{ top:{ style:BorderStyle.SINGLE, size:6, color:C.border, space:1 }},
  children:[
    new TextRun({ text:`${d.client?.name||"—"}  |  Ngày khảo sát: ${d.meta?.survey_date||"—"}  |  Trang `, font:"Times New Roman", size:24, color:C.grey2 }),
    new SimpleField("PAGE",{size:24}), // 10pt
  ],
})]});

// ── Document config ────────────────────────────────────────────────
const DOC_STYLES = {
  default:{ document:{ run:{ font:"Times New Roman", size:26, color:C.black }}}, // 13pt
  paragraphStyles:[
    { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
      run:{ font:"Times New Roman", size:32, bold:true, color:C.navy }, // 16pt
      paragraph:{ spacing:{before:360,after:180}, outlineLevel:0,
        border:{ bottom:{ style:BorderStyle.SINGLE, size:10, color:C.blue, space:2 }}}},
    { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
      run:{ font:"Times New Roman", size:28, bold:true, color:C.blue }, // 14pt
      paragraph:{ spacing:{before:220,after:110}, outlineLevel:1 }},
    { id:"Heading3", name:"Heading 3", basedOn:"Normal", next:"Normal", quickFormat:true,
      run:{ font:"Times New Roman", size:26, bold:true, color:C.teal },  // 13pt
      paragraph:{ spacing:{before:160,after:80}, outlineLevel:2 }},
  ],
};
const DOC_NUMBERING = { config:[{ reference:"bullets", levels:[
  { level:0, format:"bullet", text:"•", alignment:AlignmentType.LEFT,
    style:{ paragraph:{ indent:{ left:560, hanging:280 }}}},
  { level:1, format:"bullet", text:"–", alignment:AlignmentType.LEFT,
    style:{ paragraph:{ indent:{ left:900, hanging:280 }}}},
]}]};
const DOC_PAGE = {
  size:{ width:11906, height:16838 },
  // TW = 9360 -> (11906 - 9360) / 2 = 1273
  margin:{ top:1080, bottom:1080, left:1273, right:1273 },
};

module.exports = {
  C, bdr, cb, nb, nob, sh, CM, CMs, TW,
  scoreColor, scoreBg, scoreLabel, riskLevel,
  P, H1, H2, H3, SP, PBR, LINE,
  TH, TR, KV, ScoreCell,
  mkHeader, mkFooter,
  DOC_STYLES, DOC_NUMBERING, DOC_PAGE,
};
