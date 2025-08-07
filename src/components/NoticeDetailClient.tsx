"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

// お知らせ詳細データの型定義
type NoticeDetail = {
  id: number;
  category: string;
  title: string;
  createdAt: string;
  content: string;
};

// このクライアントコンポーネントが受け取るpropsの型
interface NoticeDetailClientProps {
  noticeId: string;
}

export default function NoticeDetailClient({ noticeId }: NoticeDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (noticeId) {
      const fetchNoticeDetail = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/notice/${noticeId}`);
          if (!response.ok)
            throw new Error("お知らせの読み込みに失敗しました。");
          const data = await response.json();
          setNotice(data);
        } catch (error) {
          console.error(error);
          router.push("/notice");
        } finally {
          setIsLoading(false);
        }
      };
      fetchNoticeDetail();
    }
  }, [noticeId, router]);

  const handleDelete = async () => {
    if (!window.confirm("このお知らせを本当に削除しますか？")) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/notice/${noticeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "削除に失敗しました。");
      }
      alert("お知らせが削除されました。");
      router.push("/notice");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        ローディング中...
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        お知らせが見つかりません。
      </div>
    );
  }

  const getCategoryClass = (category: string) => {
    switch (category) {
      case "アップデート":
        return "text-green-400";
      case "重要":
        return "text-red-400";
      case "イベント":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between p-4 sticky top-0 bg-black/80 backdrop-blur-sm z-10 border-b border-gray-800">
          <Link
            href="/notice"
            className="p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft />
          </Link>
          <h1 className="font-bold text-lg">お知らせ詳細</h1>
          {session?.user?.role === "ADMIN" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/notice/admin/${noticeId}`)}
                disabled={isProcessing}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          ) : (
            <div className="w-20" />
          )}
        </header>

        <main className="p-6">
          <p
            className={`text-sm font-bold ${getCategoryClass(notice.category)}`}
          >
            [{notice.category}]
          </p>
          <h2 className="text-2xl font-bold text-white mt-2">{notice.title}</h2>
          <p className="text-xs text-gray-500 mt-3">
            {new Date(notice.createdAt).toLocaleDateString("ja-JP")}
          </p>
          <div className="border-t border-gray-800 my-6"></div>
          <article
            className="prose prose-invert prose-p:text-gray-300 prose-strong:text-pink-400"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />
        </main>
      </div>
    </div>
  );
}
