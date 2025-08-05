"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { VscChevronLeft, VscSearch } from "react-icons/vsc";
import { BsThreeDotsVertical, BsPlusCircle } from "react-icons/bs";

type ChatData = {
  id: number;
  updatedAt: string;
  characterId: number;
  characters: {
    name: string;
    characterImages: { imageUrl: string }[];
  };
  chat_message: { content: string }[];
};

export default function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch("/api/chats");
        if (!response.ok) throw new Error("データ取得失敗");
        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  const handleNewChat = async (characterId: number) => {
    try {
      const response = await fetch('/api/chats/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, forceCreate: true }),
      });
      if (!response.ok) throw new Error('新規チャットの作成に失敗');
      
      router.push(`/chat/${characterId}`);
    } catch (error) {
      console.error(error);
      alert('新規チャットの作成に失敗しました。');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#1c1c1e] text-gray-400">ローディング中...</div>;
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] p-4 font-sans text-[#f2f2f7]">
      <header className="mb-5 flex items-center justify-between">
        <button onClick={() => router.back()} className="rounded-full p-1 hover:bg-gray-700">
          <VscChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">チャット</h1>
        <BsThreeDotsVertical size={20} className="cursor-pointer" />
      </header>

      <div className="relative mb-6">
        <VscSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="チャット検索"
          className="w-full rounded-lg border-none bg-[#2c2c2e] p-2.5 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <main>
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div key={chat.id} className="mb-4 flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-[#2c2c2e]">
              {/* ▼▼▼ 変更点: LinkのhrefにchatIdをクエリパラメータとして追加します ▼▼▼ */}
              <Link href={`/chat/${chat.characterId}?chatId=${chat.id}`} className="flex flex-grow items-start overflow-hidden">
                <Image
                  src={chat.characters.characterImages[0]?.imageUrl || "/avatars/default.png"}
                  alt={chat.characters.name}
                  width={50}
                  height={50}
                  className="mr-3 rounded-full"
                />
                <div className="flex-grow overflow-hidden">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-base font-medium text-gray-200">
                      {chat.characters.name}
                    </span>
                    <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                      {new Date(chat.updatedAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <p className="truncate text-sm text-gray-400">
                    {chat.chat_message[0]?.content || "まだメッセージがありません。"}
                  </p>
                </div>
              </Link>
              <button 
                onClick={() => handleNewChat(chat.characterId)}
                className="ml-4 flex-shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-600 hover:text-white"
                title="新しいチャットを開始"
              >
                <BsPlusCircle size={22} />
              </button>
            </div>
          ))
        ) : (
          <p className="pt-12 text-center text-gray-500">チャット履歴がありません。</p>
        )}
      </main>
    </div>
  );
}