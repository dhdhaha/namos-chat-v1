import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import NoticeForm from "@/components/NoticeForm";

// このページはサーバーコンポーネントとして動作します
export default async function NoticeCreateAdminPage() {
  const session = await getServerSession(authOptions);

  // セッションがない、または管理者でない場合はリダイレクト
  if (session?.user?.role !== 'ADMIN') {
    redirect('/notice');
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center p-4 sticky top-0 bg-black/80 backdrop-blur-sm z-10 border-b border-gray-800">
          {/* ✅ お知らせ一覧ページに戻る */}
          <Link href="/notice">
            <ArrowLeft />
          </Link>
          <h1 className="font-bold text-lg mx-auto">お知らせ作成</h1>
        </header>
        <main>
          <NoticeForm />
        </main>
      </div>
    </div>
  );
}
