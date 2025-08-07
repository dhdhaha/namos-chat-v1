"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ChevronRight, PlusCircle } from 'lucide-react';

// お知らせデータの型定義
type Notice = {
  id: number;
  category: string;
  title: string;
  createdAt: string;
};

export default function NoticesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/notice');
        if (!response.ok) {
          throw new Error('お知らせの読み込みに失敗しました。');
        }
        const data = await response.json();
        setNotices(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'アップデート': return 'text-green-400';
      case '重要': return 'text-red-400';
      case 'イベント': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">ローディング中...</div>;
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between p-4 sticky top-0 bg-black/80 backdrop-blur-sm z-10 border-b border-gray-800">
          <button 
            onClick={() => router.push('/MyPage')}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft />
          </button>
          <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2">お知らせ</h1>
          {session?.user?.role === 'ADMIN' ? (
            <button 
              onClick={() => router.push('/notice/admin')}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <PlusCircle />
            </button>
          ) : (
            <div className="w-10 h-10"></div> // 버튼 영역만큼 공간 확보
          )}
        </header>

        <main>
          <ul>
            {notices.length > 0 ? (
              notices.map((notice) => (
                <li key={notice.id}>
                  <button 
                    onClick={() => router.push(`/notice/${notice.id}`)}
                    className="w-full flex items-center justify-between p-4 border-b border-gray-800 hover:bg-gray-900 transition-colors cursor-pointer"
                  >
                    <div className="flex-grow text-left">
                      <p className={`text-sm font-bold ${getCategoryClass(notice.category)}`}>
                        [{notice.category}]
                      </p>
                      <h2 className="text-white mt-1">{notice.title}</h2>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notice.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <ChevronRight className="text-gray-600" />
                  </button>
                </li>
              ))
            ) : (
              <p className="text-center text-gray-500 p-8">登録されたお知らせがありません。</p>
            )}
          </ul>
        </main>
      </div>
    </div>
  );
}
