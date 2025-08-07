"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = ['アップデート', '重要', 'イベント'];

// ✅ Vercelビルドエラーを解決するため、ページの引数構造を修正しました。
export default function NoticeEditAdminPage({ params }: { params: { noticeId: string } }) {
  const router = useRouter();
  const { noticeId } = params; // useParamsの代わりにpropsから直接取得
  const { data: session, status } = useSession();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 権限チェックとデータ取得
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      alert('アクセス権限がありません。');
      router.push('/notice');
      return;
    }

    const fetchNotice = async () => {
      try {
        const response = await fetch(`/api/notice/${noticeId}`);
        if (!response.ok) throw new Error('お知らせ情報の読み込みに失敗しました。');
        const data = await response.json();
        setTitle(data.title);
        setCategory(data.category);
        setContent(data.content);
      } catch (error) {
        console.error(error);
        alert((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotice();
  }, [session, status, router, noticeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !title || !content) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/notice/${noticeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'お知らせの更新に失敗しました。');
      }

      alert('お知らせが正常に更新されました。');
      router.push('/notice');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || status === 'loading') {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">ローディング中...</div>;
  }

  // 管理者でない場合は何も表示しない
  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center p-4 sticky top-0 bg-black/80 backdrop-blur-sm z-10 border-b border-gray-800">
          <button onClick={() => router.push('/notice')}>
            <ArrowLeft />
          </button>
          <h1 className="font-bold text-lg mx-auto">お知らせ修正</h1>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">カテゴリー</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">タイトル</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力してください"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">内容</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="お知らせの内容を入力してください（HTMLタグ使用可能）"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 h-60 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !title || !content}
              className="bg-pink-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-pink-700 transition-colors disabled:bg-pink-800 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
