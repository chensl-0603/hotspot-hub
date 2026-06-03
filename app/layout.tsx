import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotspot Hub · 全球热点聚合",
  description: "GitHub 趋势、技术前沿、资本市场、地缘要闻。一眼读完今天的全球热点。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="antialiased">
      <body className="min-h-screen text-white selection:bg-white/15">
        {children}
      </body>
    </html>
  );
}
