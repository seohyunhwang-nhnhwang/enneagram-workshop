import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "저는 이런 사람이예요 | 에니어그램 워크숍",
  description: "같은 상황, 다른 반응 — 에니어그램으로 서로를 이해하는 시간",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
