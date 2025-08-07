import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 에러 방지를 위해 Geist 대신 Inter 폰트를 사용합니다.
import "./globals.css";
import AppShell from "@/components/AppShell";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter', // CSS 변수 이름을 폰트에 맞게 수정
});

export const metadata: Metadata = {
  title: "NAMOAI Chat",
  description: "AIキャラクターチャットサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* 폰트 변수를 body에 적용합니다 */}
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
