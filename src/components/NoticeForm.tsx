"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { notices as Notice } from '@prisma/client';

type NoticeFormProps = {
  initialData?: Notice | null; // 修正用データ
  noticeId?: number | null;     // 修正用ID
};

export default function NoticeForm({ initialData = null, noticeId = null }: NoticeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('一般');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setContent(initialData.content);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!title || !category || !content) {
      setError('すべての項目を入力してください。');
      setIsSubmitting(false);
      return;
    }

    const apiUrl = isEditMode ? `/api/notice/${noticeId}` : '/api/notice';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存に失敗しました。');
      }

      alert(`お知らせを${isEditMode ? '更新' : '作成'}しました。`);
      router.push('/notice');
      router.refresh(); // サーバーコンポーネントのデータを更新
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      {error && <p className="text-red-500 bg-red-900/20 p-3 rounded-md">{error}</p>}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">タイトル</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">カテゴリー</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500"
        >
          <option>一般</option>
          <option>アップデート</option>
          <option>重要</option>
          <option>イベント</option>
        </select>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">内容 (HTML使用可能)</label>
        <textarea
          id="content"
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors"
      >
        {isSubmitting ? '保存中...' : (isEditMode ? '更新する' : '作成する')}
      </button>
    </form>
  );
}
