import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
// 1. AppShell과 Providersコンポーネントをインポートします
import AppShell from "@/components/AppShell";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// geistMonoフォントは現在使用されていないため、削除しました
// const geistMono = Geist_Mono({ ... });

export const metadata: Metadata = {
  // サイトのタイトルと説明を適切に設定します
  title: "NAMOAI Chat",
  description: "AIキャラクターチャットサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ページの言語を日本語に設定します
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased`}>
        {/* 2. NextAuthのセッション状態をアプリ全体で共有するためにProvidersでラップします */}
        <Providers>
          {/* 3. 全てのページ内容({children})をAppShellコンポーネントでラップします。
            これにより、AppShellがパスに応じてナビゲーションバーの表示・非表示を管理します。
          */}
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
