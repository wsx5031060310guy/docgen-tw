// Server-side PDF rendering for fully-signed contracts.
// Uses @react-pdf/renderer to emit a styled A4 PDF that mirrors the on-screen
// "paper" preview: title, parties, numbered clauses, legal-basis chips,
// signature block (with embedded signature PNG when available), audit trail.

import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import React from "react";
import { fillTemplate, getTemplate, type Values } from "@/lib/templates";
import { todayMinguo } from "@/lib/numberToChinese";

const ZH = ["零","一","二","三","四","五","六","七","八","九","十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十"];
const num = (n: number) => ZH[n] || String(n);

// Register CJK font from a public CDN. Without this @react-pdf falls back to
// Helvetica and silently drops Chinese glyphs.
let fontsRegistered = false;
function ensureFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: "NotoSerifTC",
    src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-tc/files/noto-serif-tc-chinese-traditional-500-normal.woff",
  });
  Font.register({
    family: "NotoSansTC",
    src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-400-normal.woff",
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
  clauseBody:  { paddingLeft: 18, textAlign: "justify" },
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

  return (
    <Document title={`${tpl.name} - ${input.contractId}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.topMeta}>DOCGEN TW · 電子契約</Text>
        <Text style={s.title}>{tpl.name}</Text>
        <Text style={s.parties}>立契約書人　{partyA}（甲方）　·　{partyB}（乙方）</Text>
        <View style={s.rule} />

        {clauses.map((c) => (
          <View key={c.n} style={s.clauseBlock}>
            <Text style={s.clauseTitle}>第 {num(c.n)} 條　{c.title}</Text>
            <Text style={s.clauseBody}>{fillTemplate(c.body, v).replace(/__+/g, "　　　　")}</Text>
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

        <Text style={s.footer} fixed>
          DocGen TW · 編號 {input.contractId} · 本電子契約依電子簽章法 §4、§9 與紙本具同等效力。
        </Text>
      </Page>
    </Document>
  );
}

export async function renderContractPdf(input: PdfInput): Promise<Buffer> {
  ensureFonts();
  return await renderToBuffer(<ContractDoc input={input} />);
}
