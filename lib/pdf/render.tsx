// Server-side PDF rendering for fully-signed contracts.
// Uses @react-pdf/renderer to emit a styled A4 PDF that mirrors the on-screen
// "paper" preview: title, parties, numbered clauses, legal-basis chips,
// signature block (with embedded signature PNG when available), audit trail.

import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import path from "node:path";
import React from "react";
import { contractTitle, fillTemplate, getTemplate, type Values } from "@/lib/templates";
import { todayMinguo } from "@/lib/numberToChinese";
import { wrapLines } from "@/lib/pdf/wrap";

const ZH = ["零","一","二","三","四","五","六","七","八","九","十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十"];
const num = (n: number) => ZH[n] || String(n);

// Use local TrueType (glyf) CJK fonts. The previous CDN woff files used CFF,
// whose fontkit subsetting took 60–94s locally and 136–206s in production for
// a 3,800-character custom contract; these TTF files render the same input in 0.1s.
let fontsRegistered = false;
function ensureFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: "NotoSerifTC",
    src: path.join(process.cwd(), "lib/pdf/fonts/NotoSerifTC.ttf"),
  });
  Font.register({
    family: "NotoSansTC",
    src: path.join(process.cwd(), "lib/pdf/fonts/NotoSansTC.ttf"),
  });
  fontsRegistered = true;
}

const s = StyleSheet.create({
  page: { padding: 60, fontFamily: "NotoSerifTC", fontSize: 11, lineHeight: 1.7, color: "#1a1612" },
  topMeta: { fontFamily: "NotoSansTC", fontSize: 8, letterSpacing: 4, color: "#856b4a", textAlign: "center", marginBottom: 6 },
  title:    { fontSize: 22, textAlign: "center", letterSpacing: 8, marginBottom: 8 },
  parties:  { fontSize: 10, color: "#6b5c45", textAlign: "center", marginBottom: 4 },
  rule:     { borderBottomWidth: 0.5, borderBottomColor: "#bdb29c", marginVertical: 14 },

  clauseBlock: { marginBottom: 12 },
  clauseTitle: { fontSize: 12, fontWeight: 700, marginBottom: 3, letterSpacing: 1 },
  clauseBody:  { paddingLeft: 18, textAlign: "left" },
  refRow:      { fontFamily: "NotoSansTC", fontSize: 8, color: "#9a8868", paddingLeft: 18, marginTop: 3 },

  sigRow:    { flexDirection: "row", marginTop: 24, gap: 30 },
  sigCell:   { flex: 1 },
  sigLabel:  { fontFamily: "NotoSansTC", fontSize: 8, color: "#9a8868", marginBottom: 4 },
  sigBox:    { height: 50, borderBottomWidth: 0.5, borderBottomColor: "#444", marginBottom: 4 },
  sigImg:    { height: 50, objectFit: "contain" },
  sigName:   { fontSize: 10 },
  sigAudit:  { fontFamily: "NotoSansTC", fontSize: 7, color: "#9a8868", marginTop: 2 },

  date: { fontSize: 10, color: "#6b5c45", textAlign: "center", marginTop: 18 },
  footer: {
    position: "absolute", bottom: 30, left: 60, right: 60,
    fontFamily: "NotoSansTC", fontSize: 7, color: "#9a8868", textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#e5dfd0", paddingTop: 6,
  },
  footerLine1: { fontWeight: 700, marginBottom: 1, color: "#7a6943" },
  footerLine2: { color: "#9a8868" },
  pageNum: {
    position: "absolute", bottom: 14, right: 60,
    fontFamily: "NotoSansTC", fontSize: 7, color: "#bfaf82",
  },
  watermark: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "NotoSansTC",
    fontSize: 48,
    color: "#e8dfca",
    opacity: 0.55,
    letterSpacing: 18,
  },
  disclaimerBlock: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#e5dfd0",
    fontFamily: "NotoSansTC",
    fontSize: 8,
    color: "#7a6943",
    lineHeight: 1.55,
  },
});

export type PdfInput = {
  contractId: string;
  templateId: string;
  values: Values;
  senderSignatureUrl?: string | null;
  recipientSignatureUrl?: string | null;
  senderAudit?: string | null;
  recipientAudit?: string | null;
};

function ContractDoc({ input }: { input: PdfInput }) {
  const tpl = getTemplate(input.templateId);
  if (!tpl) return null;
  const v = input.values || {};
  const partyA = v.party_a_name || "___________";
  const partyB = v.party_b_name || "___________";
  const clauses = tpl.clauses(v);
  const fullySigned = Boolean(input.senderSignatureUrl && input.recipientSignatureUrl);
  const senderHashShort = (input.senderAudit?.match(/#([0-9a-f]+)/i)?.[1] ?? "").slice(0, 8);
  const recipientHashShort = (input.recipientAudit?.match(/#([0-9a-f]+)/i)?.[1] ?? "").slice(0, 8);
  const title = contractTitle(input.templateId, input.values);

  return (
    <Document title={`${title} - ${input.contractId}`}>
      <Page size="A4" style={s.page}>
        {/* Diagonal-ish text watermark for un-signed / draft renderings */}
        {!fullySigned && <Text style={s.watermark} fixed>D R A F T</Text>}
        <Text style={s.topMeta}>DOCGEN TW · 電子契約</Text>
        {/* Title style is sized for 5-char template names; shrink long custom titles so
            they stay on one line (a forced mid-word wrap inserts a hyphen). */}
        <Text style={title.length > 20 ? [s.title, { fontSize: 14, letterSpacing: 1 }] : title.length > 12 ? [s.title, { fontSize: 18, letterSpacing: 2 }] : s.title}>{title}</Text>
        <Text style={s.parties}>立契約書人　{partyA}（甲方）　·　{partyB}（乙方）</Text>
        <View style={s.rule} />

        {clauses.map((c) => (
          <View key={c.n} style={s.clauseBlock}>
            <Text style={s.clauseTitle}>第 {num(c.n)} 條　{c.title}</Text>
            <View style={s.clauseBody}>
              {wrapLines(fillTemplate(c.body, v).replace(/__+/g, "　　　　"), {
                font: "serif",
                fontSize: s.page.fontSize,
                // A4 595.28 − page padding 120 − paddingLeft 18 = 457.28; keep a few points of
                // slack so textkit's own measurement never re-breaks (and hyphenates) a line.
                maxWidth: 450,
              }).map((line, i) => <Text key={i}>{line || " "}</Text>)}
            </View>
            {c.ref.length > 0 && (
              <Text style={s.refRow}>依據　{c.ref.join("　·　")}</Text>
            )}
          </View>
        ))}

        <View style={s.sigRow}>
          {[
            { label: "甲方（委任 / 出資方）", name: partyA, sig: input.senderSignatureUrl, audit: input.senderAudit },
            { label: "乙方（受任 / 受聘方）", name: partyB, sig: input.recipientSignatureUrl, audit: input.recipientAudit },
          ].map((p, i) => (
            <View key={i} style={s.sigCell}>
              <Text style={s.sigLabel}>{p.label}</Text>
              <View style={s.sigBox}>
                {p.sig ? <Image src={p.sig} style={s.sigImg} /> : <Text> </Text>}
              </View>
              <Text style={s.sigName}>{p.name}</Text>
              {p.audit && <Text style={s.sigAudit}>{p.audit}</Text>}
            </View>
          ))}
        </View>

        <Text style={s.date}>立契約書日期： {v.sign_date || todayMinguo()}</Text>

        <View style={s.disclaimerBlock}>
          <Text>
            ※ 法律免責：本合約由 DocGen TW（文件自動化平台）依使用者填寫之資料及中華民國現行法律一般情形產出，
            僅供當事人交易參考。本平台非執業律師、不取代法律意見；如涉訴訟、重大金額或客製條款，
            建議委請執業律師審閱。因使用本合約所生之爭議，本平台不負法律責任。
          </Text>
          {senderHashShort && (
            <Text style={{ marginTop: 4 }}>
              存證雜湊（SHA-256 前 8 碼）：甲方 #{senderHashShort}
              {recipientHashShort ? `　·　乙方 #${recipientHashShort}` : ""}
            </Text>
          )}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerLine1}>
            DocGen TW · 編號 {input.contractId} · 依電子簽章法 §5 與紙本具同等效力
          </Text>
          <Text style={s.footerLine2}>
            本平台僅提供文件自動化與風險提示，非法律意見。詳見 docgen-tw.vercel.app/disclaimer
          </Text>
        </View>
        <Text
          style={s.pageNum}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export async function renderContractPdf(input: PdfInput): Promise<Buffer> {
  ensureFonts();
  return await renderToBuffer(<ContractDoc input={input} />);
}
