// Server-side PDF rendering for fully-signed contracts.
// Uses @react-pdf/renderer to emit a formal A4 contract with local CJK fonts,
// pre-wrapped body text, signatures, and an electronic-signing audit record.

import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import path from "node:path";
import React from "react";
import { parseContractBody } from "@/lib/contract-body";
import { contractTitle, fillTemplate, getTemplate, type Values } from "@/lib/templates";
import { todayMinguo } from "@/lib/numberToChinese";
import { wrapLines } from "@/lib/pdf/wrap";

const ZH = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十"];
const num = (n: number) => ZH[n] || String(n);

const COLORS = {
  ink: "#1a1612",
  body: "#2d2924",
  secondary: "#6b5c45",
  muted: "#9a8868",
  rule: "#bdb29c",
  accentRule: "#c8b892",
  softRule: "#e5dfd0",
  watermark: "#e8dfca",
} as const;

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
  page: {
    paddingTop: 60,
    paddingRight: 56,
    paddingBottom: 72,
    paddingLeft: 56,
    fontFamily: "NotoSerifTC",
    fontSize: 10.5,
    lineHeight: 1.65,
    color: COLORS.body,
  },
  eyebrow: {
    fontFamily: "NotoSansTC",
    fontSize: 8,
    letterSpacing: 3,
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: 7,
  },
  title: {
    fontFamily: "NotoSerifTC",
    fontSize: 20,
    textAlign: "center",
    color: COLORS.ink,
    marginBottom: 8,
  },
  titleLong: { fontSize: 15 },
  titleVeryLong: { fontSize: 13 },
  parties: {
    fontSize: 10,
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: 5,
  },
  contractMeta: {
    fontFamily: "NotoSansTC",
    fontSize: 8,
    color: COLORS.secondary,
    textAlign: "center",
  },
  titleRule: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.rule,
    marginTop: 12,
    marginBottom: 12,
  },

  runningHeader: {
    position: "absolute",
    top: 28,
    left: 56,
    right: 56,
  },
  runningHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  runningHeaderText: {
    fontFamily: "NotoSansTC",
    fontSize: 7.5,
    color: COLORS.muted,
  },
  runningHeaderRule: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.rule,
  },

  clauseBlock: { marginBottom: 2 },
  clauseTitle: {
    fontFamily: "NotoSerifTC",
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.ink,
    marginTop: 14,
    marginBottom: 6,
  },
  clauseTitleRule: {
    width: 40,
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.accentRule,
    marginBottom: 6,
  },
  clauseBody: { paddingLeft: 18, textAlign: "left" },
  customHeading: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accentRule,
    paddingLeft: 6,
    marginTop: 10,
  },
  customHeadingText: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.ink,
  },
  customItemContinuation: { paddingLeft: 16 },
  customIndent: { paddingLeft: 16 },
  customBlank: { height: 6 },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    marginTop: 4,
  },
  refDot: {
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: COLORS.muted,
    marginRight: 5,
  },
  refText: {
    fontFamily: "NotoSansTC",
    fontSize: 7.5,
    color: COLORS.muted,
  },

  signatureSection: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.rule,
    marginTop: 32,
    paddingTop: 12,
  },
  signatureRow: { flexDirection: "row", gap: 30 },
  signatureCell: { flex: 1 },
  signatureLabel: {
    fontFamily: "NotoSansTC",
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 4,
  },
  signatureImage: { height: 56, objectFit: "contain", marginBottom: 4 },
  signatureEmptyLine: {
    height: 56,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.secondary,
    marginBottom: 4,
  },
  signatureName: { fontSize: 10, color: COLORS.ink },
  signatureId: {
    fontFamily: "NotoSansTC",
    fontSize: 8,
    color: COLORS.secondary,
    marginTop: 1,
  },
  signatureAudit: {
    fontFamily: "Courier",
    fontSize: 7,
    color: COLORS.muted,
    marginTop: 3,
  },
  contractDate: {
    fontSize: 10,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 18,
  },
  evidenceBox: {
    borderWidth: 0.5,
    borderColor: COLORS.rule,
    padding: 8,
    marginTop: 14,
    fontFamily: "NotoSansTC",
    fontSize: 7.5,
    color: COLORS.secondary,
    lineHeight: 1.5,
  },
  evidenceTitle: {
    fontWeight: 700,
    color: COLORS.ink,
    marginBottom: 3,
  },

  disclaimerBlock: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.softRule,
    fontFamily: "NotoSansTC",
    fontSize: 8,
    color: "#7a6943",
    lineHeight: 1.55,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 56,
    right: 56,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.softRule,
    paddingTop: 5,
    fontFamily: "NotoSansTC",
    fontSize: 7,
    color: COLORS.muted,
    lineHeight: 1.3,
  },
  footerLeft: { color: COLORS.muted, paddingRight: 105, marginBottom: 1 },
  footerPageNumber: {
    position: "absolute",
    bottom: 32,
    right: 56,
    width: 105,
    height: 10,
    textAlign: "right",
    fontFamily: "NotoSansTC",
    fontSize: 7,
    lineHeight: 1.3,
    color: COLORS.muted,
  },
  footerPageNumberText: {
    fontFamily: "NotoSansTC",
    fontSize: 7,
    lineHeight: 1.3,
    color: COLORS.muted,
    textAlign: "right",
  },
  footerDisclaimer: { textAlign: "center", color: COLORS.muted },
  watermark: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "NotoSansTC",
    fontSize: 48,
    color: COLORS.watermark,
    opacity: 0.55,
    letterSpacing: 18,
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

type AuditDetails = {
  time: string;
  ip: string;
  hash: string;
};

const pdfWrap = (text: string, maxWidth = 470) => wrapLines(text.replace(/__+/g, "　　　　"), {
  font: "serif",
  fontSize: 10.5,
  maxWidth,
});

function truncateTitle(title: string, maxLength = 24): string {
  const chars = Array.from(title);
  return chars.length > maxLength ? `${chars.slice(0, maxLength - 1).join("")}…` : title;
}

function parseAudit(audit?: string | null): AuditDetails | null {
  if (!audit) return null;
  const normalized = audit.replace(/　+/g, " ").replace(/\s*·\s*/g, " ").trim();
  const time = normalized.match(/^(.*?)(?=\s+IP\b)/i)?.[1]?.trim() || "—";
  const ip = normalized.match(/\bIP\s+(.+?)(?=\s+#|$)/i)?.[1]?.trim() || "—";
  const hash = normalized.match(/#([0-9a-f]+)/i)?.[1] || "";
  return { time, ip, hash };
}

function formatAudit(details: AuditDetails): string {
  return `${details.time} · IP ${details.ip} · #${details.hash.slice(0, 8) || "—"}`;
}

function evidenceAudit(details: AuditDetails | null): string {
  if (!details) return "—";
  return `${details.time} · IP ${details.ip} · SHA-256 #${details.hash.slice(0, 16) || "—"}`;
}

function generatedAt(): string {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")} (Asia/Taipei)`;
}

function customPartyId(body: string, party: "甲方" | "乙方"): string {
  const otherParty = party === "甲方" ? "乙方" : "甲方";
  const start = body.indexOf(party);
  if (start < 0) return "";
  const end = body.indexOf(otherParty, start + party.length);
  const section = body.slice(start, end < 0 ? undefined : end);
  return section.match(/(?:統一編號|統編|身分證(?:字號)?)(?:\s*[／/]\s*身分證(?:字號)?)?\s*[：:]\s*([A-Z0-9-]{6,20})/i)?.[1] || "";
}

function SignatureMark({ src }: { src?: string | null }) {
  if (!src) return <View style={s.signatureEmptyLine} />;
  // React PDF's Image primitive has no alt prop; this image is the signature itself.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image src={src} style={s.signatureImage} />;
}

function PageNumber({ pageNumber, totalPages }: { pageNumber: number; totalPages?: number }) {
  return (
    <Text style={s.footerPageNumberText}>
      第 {pageNumber} 頁／共 {totalPages ?? "—"} 頁
    </Text>
  );
}

function CustomContractBody({ body }: { body: string }) {
  return (
    <View>
      {parseContractBody(body).map((block, blockIndex) => {
        if (block.kind === "blank") return <View key={blockIndex} style={s.customBlank} />;

        if (block.kind === "heading") {
          return (
            <View key={blockIndex} style={s.customHeading} wrap={false}>
              {pdfWrap(block.text).map((line, lineIndex) => (
                <Text key={lineIndex} style={s.customHeadingText}>{line || " "}</Text>
              ))}
            </View>
          );
        }

        if (block.kind === "item") {
          const printable = block.text.replace(/__+/g, "　　　　");
          const [firstLine = "", ...initialContinuation] = pdfWrap(block.text);
          const continuation = initialContinuation.length > 0
            ? pdfWrap(printable.slice(firstLine.length), 454)
            : [];

          return (
            <React.Fragment key={blockIndex}>
              <Text>{firstLine || " "}</Text>
              {continuation.map((line, lineIndex) => (
                <Text key={lineIndex} style={s.customItemContinuation}>{line || " "}</Text>
              ))}
            </React.Fragment>
          );
        }

        const lines = pdfWrap(block.text, block.kind === "indent" ? 454 : 470);
        return lines.map((line, lineIndex) => (
          <Text
            key={`${blockIndex}-${lineIndex}`}
            style={block.kind === "indent" ? s.customIndent : undefined}
          >
            {line || " "}
          </Text>
        ));
      })}
    </View>
  );
}

function ContractDoc({ input }: { input: PdfInput }) {
  const tpl = getTemplate(input.templateId);
  if (!tpl) return null;
  const v = input.values || {};
  const partyA = v.party_a_name || "___________";
  const partyB = v.party_b_name || "___________";
  const clauses = tpl.clauses(v);
  const fullySigned = Boolean(input.senderSignatureUrl && input.recipientSignatureUrl);
  const title = contractTitle(input.templateId, input.values);
  const titleStyle = title.length > 20 ? s.titleVeryLong : title.length > 12 ? s.titleLong : undefined;
  const headerTitle = truncateTitle(title);
  const senderAudit = parseAudit(input.senderAudit);
  const recipientAudit = parseAudit(input.recipientAudit);
  const customBody = input.templateId === "custom" ? v.body || "" : "";
  const partyAId = v.party_a_id?.trim() || customPartyId(customBody, "甲方");
  const partyBId = v.party_b_id?.trim() || customPartyId(customBody, "乙方");
  const signedDate = v.sign_date || todayMinguo();
  const status = fullySigned ? "已雙方簽署" : "草稿（待乙方簽署）";
  const createdAt = generatedAt();
  const signatureParties = [
    {
      label: input.templateId === "custom" ? "甲方" : "甲方（委任 / 出資方）",
      name: partyA,
      id: partyAId,
      sig: input.senderSignatureUrl,
      audit: senderAudit,
    },
    {
      label: input.templateId === "custom" ? "乙方" : "乙方（受任 / 受聘方）",
      name: partyB,
      id: partyBId,
      sig: input.recipientSignatureUrl,
      audit: recipientAudit,
    },
  ];

  return (
    <Document title={title} author="DocGen TW" subject={`合約編號 #${input.contractId}`}>
      <Page size="A4" style={s.page}>
        {!fullySigned && <Text style={s.watermark} fixed>D R A F T</Text>}

        <View
          style={s.runningHeader}
          fixed
          render={({ pageNumber }) => pageNumber > 1 ? (
            <>
              <View style={s.runningHeaderRow}>
                <Text style={s.runningHeaderText}>{headerTitle}</Text>
                <Text style={s.runningHeaderText}>#{input.contractId}</Text>
              </View>
              <View style={s.runningHeaderRule} />
            </>
          ) : null}
        />

        <Text style={s.eyebrow}>DOCGEN TW · 電子契約</Text>
        <Text style={titleStyle ? [s.title, titleStyle] : s.title}>{title}</Text>
        <Text style={s.parties}>立契約書人　{partyA}（甲方）　·　{partyB}（乙方）</Text>
        <Text style={s.contractMeta}>
          合約編號 #{input.contractId}　·　簽約日期 {signedDate}　·　狀態：{status}
        </Text>
        <View style={s.titleRule} />

        {clauses.map((clause) => (
          <View key={clause.n} style={s.clauseBlock}>
            <Text style={s.clauseTitle} minPresenceAhead={28}>第 {num(clause.n)} 條　{clause.title}</Text>
            <View style={s.clauseTitleRule} />
            {input.templateId === "custom" && clause.n === 2 ? (
              <CustomContractBody body={fillTemplate(clause.body, v)} />
            ) : (
              <View style={s.clauseBody}>
                {wrapLines(fillTemplate(clause.body, v).replace(/__+/g, "　　　　"), {
                  font: "serif",
                  fontSize: 10.5,
                  // A4 595.28 - horizontal padding 112 - clause indent 18 = 465.28.
                  // Keep a few points of slack so textkit never re-breaks a line.
                  maxWidth: 458,
                }).map((line, lineIndex) => <Text key={lineIndex}>{line || " "}</Text>)}
              </View>
            )}
            {clause.ref.length > 0 && (
              <View style={s.refRow}>
                <View style={s.refDot} />
                <Text style={s.refText}>依據　{clause.ref.join("　·　")}</Text>
              </View>
            )}
          </View>
        ))}

        <View style={s.signatureSection} wrap={false}>
          <View style={s.signatureRow}>
            {signatureParties.map((party) => (
              <View key={party.label} style={s.signatureCell}>
                <Text style={s.signatureLabel}>{party.label}</Text>
                <SignatureMark src={party.sig} />
                <Text style={s.signatureName}>{party.name}</Text>
                {party.id && <Text style={s.signatureId}>統編 / 身分證　{party.id}</Text>}
                {party.audit && <Text style={s.signatureAudit}>{formatAudit(party.audit)}</Text>}
              </View>
            ))}
          </View>

          <Text style={s.contractDate}>立契約書日期： {signedDate}</Text>

          <View style={s.evidenceBox}>
            <Text style={s.evidenceTitle}>電子簽署存證</Text>
            <Text>合約編號　#{input.contractId}</Text>
            <Text>甲方簽署　{evidenceAudit(senderAudit)}</Text>
            <Text>乙方簽署　{evidenceAudit(recipientAudit)}</Text>
            <Text>產生時間　{createdAt}</Text>
          </View>
        </View>

        <View style={s.disclaimerBlock}>
          <Text>
            ※ 法律免責：本合約由 DocGen TW（文件自動化平台）依使用者填寫之資料及中華民國現行法律一般情形產出，
            僅供當事人交易參考。本平台非執業律師、不取代法律意見；如涉訴訟、重大金額或客製條款，
            建議委請執業律師審閱。因使用本合約所生之爭議，本平台不負法律責任。
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>
            DocGen TW · 編號 #{input.contractId} · 依電子簽章法 §5 與紙本具同等效力
          </Text>
          <Text style={s.footerDisclaimer}>
            本平台僅提供文件自動化與風險提示，非法律意見。詳見 docgen-tw.vercel.app/disclaimer
          </Text>
        </View>
        <View
          style={s.footerPageNumber}
          fixed
          render={(props) => <PageNumber {...props} />}
        />
      </Page>
    </Document>
  );
}

export async function renderContractPdf(input: PdfInput): Promise<Buffer> {
  ensureFonts();
  return await renderToBuffer(<ContractDoc input={input} />);
}
