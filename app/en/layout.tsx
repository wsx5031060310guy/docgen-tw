import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DocGen TW · Taiwan-law contracts, auto-drafted and e-signed",
  description: "Generate a Taiwan-law contract in 3 minutes with statute citations; both parties e-sign with IP, timestamp and signature hash.",
  alternates: {
    languages: {
      "zh-Hant": "/",
      en: "/en",
    },
  },
};

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <div lang="en">{children}</div>;
}
