"use client";

import { useState, useEffect } from 'react';
import CharacterRow from '@/components/CharacterRow';
import { Search, Calendar, User } from 'lucide-react';

// ▼▼▼ 変更点 1: キャラクターの正確な型を定義します ▼▼▼
type Character = {
  id: number;
  name: string;
  description: string | null;
  characterImages: { imageUrl: string }[];
};

// ▼▼▼ 変更点 2: any[] の代わりに上で定義したCharacter[]を使用します ▼▼▼
type MainPageData = {
  trendingCharacters: Character[];
  newTopCharacters: Character[];
  specialCharacters: Character[];
  generalCharacters: Character[];
};

export default function HomePage() {
  const [pageData, setPageData] = useState<MainPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/main-page');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setPageData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-black text-white">ローディング中...</div>;
  }

  if (!pageData) {
    return <div className="flex h-screen items-center justify-center bg-black text-white">データの読み込みに失敗しました。</div>;
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 pb-20">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-pink-500">ナモアイ</h1>
        <div className="flex items-center gap-4">
          <Search className="cursor-pointer" />
          <Calendar className="cursor-pointer" />
          <User className="cursor-pointer" />
        </div>
      </header>

      <div className="bg-pink-500 rounded-lg p-4 mb-8 text-center">
        <h2 className="font-bold">毎日出席して最大10倍の報酬をゲット！</h2>
      </div>

      <CharacterRow title="今話題のキャラクター" characters={pageData.trendingCharacters} />
      <CharacterRow title="ホットな新作TOP10" characters={pageData.newTopCharacters} />
      <CharacterRow title="見逃せない特集キャラクター" characters={pageData.specialCharacters} />
      <CharacterRow title="新規キャラクター紹介" characters={pageData.generalCharacters} />
    </div>
  );
}