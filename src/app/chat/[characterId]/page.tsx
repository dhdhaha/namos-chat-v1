"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link'; // Link를 import합니다
import { ArrowLeft, Settings, Plus, Camera, Mic, Send } from 'lucide-react';

// (変更なし) 型定義
type Message = {
  role: "user" | "model";
  parts: [{ text: string }];
  timestamp?: string;
};
type CharacterInfo = {
  name: string;
  characterImages: { imageUrl: string }[];
};
type DbMessage = {
  role: string;
  content: string;
  createdAt: string;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ characterId: string }>();
  const searchParams = useSearchParams();
  const { characterId } = params;

  // ... (State管理とuseEffect, その他の関数は変更ありません)
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login'); 
    },
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [characterInfo, setCharacterInfo] = useState<CharacterInfo | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const chatIdFromQuery = searchParams.get('chatId');

    if (status === "authenticated" && characterId) {
      const initializeChat = async () => {
        setIsInitialLoading(true);
        try {
          const charResponse = await fetch(`/api/characters/${characterId}`);
          if (!charResponse.ok) throw new Error('キャラクター情報の取得に失敗');
          const charData = await charResponse.json();
          setCharacterInfo(charData);

          const chatSessionResponse = await fetch('/api/chats/find-or-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              characterId: characterId,
              chatId: chatIdFromQuery 
            }),
          });
          if (!chatSessionResponse.ok) throw new Error('チャットセッションの取得に失敗');
          const chatSessionData = await chatSessionResponse.json();
          
          setChatId(chatSessionData.id);
          const formattedMessages = chatSessionData.chat_message.map((msg: DbMessage) => ({
            role: msg.role as "user" | "model",
            parts: [{ text: msg.content }],
            timestamp: new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(formattedMessages);

        } catch (error) {
          console.error(error);
          alert('チャットの読み込みに失敗しました。');
          router.back();
        } finally {
          setIsInitialLoading(false);
        }
      };
      initializeChat();
    }
  }, [status, characterId, router, searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatId) return;

    const userMessage: Message = { 
      role: "user", 
      parts: [{ text: input }],
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setIsLoading(true);
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const messageToSend = input;
    setInput('');

    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) throw new Error('APIからの応答エラー');

      const data = await response.json();
      setMessages([
        ...updatedMessages, 
        { 
          role: 'model', 
          parts: [{ text: data.reply }],
          timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } catch (error) {
      console.error("チャットエラー:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: 'エラーが発生しました。もう一度お試しください。' }],
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isInitialLoading) {
    return <div className="min-h-screen bg-black text-white flex justify-center items-center">チャットを準備中...</div>;
  }
  
  if (!characterInfo) {
    return <div className="min-h-screen bg-black text-white flex justify-center items-center">キャラクター情報が見つかりません。</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* ▼▼▼ このヘッダー部分を修正しました ▼▼▼ */}
      <header className="flex items-center justify-between p-3 border-b border-gray-700 bg-black/50 backdrop-blur-sm">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-700 rounded-full">
          <ArrowLeft size={24} />
        </button>
        
        {/* Linkコンポーネントでプロフィール部分をラップ */}
        <Link href={`/characters/${characterId}`} className="flex flex-col items-center hover:opacity-80 transition-opacity">
          <Image 
            src={characterInfo.characterImages[0]?.imageUrl || '/default-avatar.png'} 
            alt={characterInfo.name} 
            width={40} height={40} className="rounded-full" 
          />
          <span className="text-sm font-semibold mt-1">{characterInfo.name}</span>
        </Link>
        
        <button className="p-2 hover:bg-gray-700 rounded-full">
          <Settings size={24} />
        </button>
      </header>
      
      {/* mainとfooterは変更ありません */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-xl ${
                msg.role === 'user' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-white'
            }`}>
              <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
            </div>
            {msg.timestamp && (
              <span className="text-xs text-gray-400 mt-1 px-1">{msg.timestamp}</span>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start">
                <div className="bg-gray-800 px-4 py-3 rounded-xl">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 border-t border-gray-700 bg-black/50 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button type="button" className="p-2 hover:bg-gray-700 rounded-full"><Plus size={24}/></button>
          <button type="button" className="p-2 hover:bg-gray-700 rounded-full"><Camera size={24}/></button>
          <button type="button" className="p-2 hover:bg-gray-700 rounded-full"><Mic size={24}/></button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力"
            disabled={isLoading}
            className="flex-1 bg-gray-800 border-none rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-pink-600 hover:bg-pink-700 rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={24} className="text-white"/>
          </button>
        </form>
      </footer>
    </div>
  );
}