import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocGen TW · 台灣法律合約自動產生平台",
  description:
    "3 分鐘產出可信合約，附完整法條依據。雙方電子簽署，留存 IP、時間戳與簽名雜湊。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&family=Noto+Serif+TC:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
