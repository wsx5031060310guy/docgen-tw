import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://docgen-tw.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "DocGen TW · 台灣法律合約自動產生平台",
  description:
    "3 分鐘產出可信合約，附完整法條依據。雙方電子簽署，留存 IP、時間戳與簽名雜湊。",
  openGraph: {
    title: "DocGen TW · 台灣法律合約自動產生 + 電子簽署",
    description: "10 種範本（承攬 / NDA / 借貸 / 委任 / 勞動 / 租賃 / 買賣 / 催款 / 存證 / 自訂），每條款附中華民國法條依據。",
    url: SITE_URL,
    siteName: "DocGen TW",
    locale: "zh_TW",
  },
};

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DocGen TW",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description: "台灣法律合約自動產生 + 電子簽署 SaaS。提供文件自動化與風險提示，非取代律師意見。",
  areaServed: { "@type": "Country", name: "Taiwan" },
};

const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocGen TW",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  inLanguage: "zh-Hant",
  offers: {
    "@type": "Offer",
    price: "99",
    priceCurrency: "TWD",
    description: "單份合約 NT$99 解鎖；月訂閱 NT$299。",
  },
  featureList: [
    "10 種台灣法律合約範本",
    "動態表單 + 即時 PDF 預覽",
    "雙方電子簽署（依電子簽章法 §4、§9）",
    "簽署 IP / 時間戳 / SHA-256 雜湊存證",
    "規則式合約風險檢查",
    "案件資料夾 + 付款追蹤 + 到期提醒",
  ],
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DocGen TW",
  url: SITE_URL,
  inLanguage: "zh-Hant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&family=Noto+Serif+TC:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <JsonLd data={ORG_LD} />
        <JsonLd data={SOFTWARE_LD} />
        <JsonLd data={WEBSITE_LD} />
      </head>
      <body>{children}</body>
    </html>
  );
}
