"use client";

import { useSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Heart, ChevronRight, Megaphone, Settings, Users, BookUser,
  MessageSquareText, MailQuestion, User, ShieldCheck, BrainCircuit,
  LogOut, Coins,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";

// ユーザーのプロフィール画像がない場合に表示するデフォルトのSVGアイコンコンポーネント
const DefaultAvatarIcon = ({ size = 48 }: { size?: number }) => (
  <div
    className="rounded-full bg-gray-700 flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    <User size={size * 0.6} className="text-gray-400" />
  </div>
);

// 確認モーダルコンポーネントの型定義
type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }: ConfirmationModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white rounded-lg p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <p className="text-sm text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="border border-gray-600 hover:bg-gray-700 py-2 px-4 rounded-lg">{cancelText}</button>
          <button onClick={onConfirm} className="bg-pink-600 hover:bg-pink-700 py-2 px-4 rounded-lg">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// メニューアイテムの型定義
type MenuItem = {
  icon: ReactNode;
  text: string;
  action: () => void;
  badge?: string;
};

// ログインしているユーザー向けのビュー
const LoggedInView = ({ session }: { session: Session }) => {
  const router = useRouter();
  const [points, setPoints] = useState<{ total: number; loading: boolean }>({ total: 0, loading: true });
  const [isSafetyFilterOn, setIsSafetyFilterOn] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pointsRes = await fetch('/api/users/points');
        if (pointsRes.ok) {
          const pointsData = await pointsRes.json();
          setPoints({ total: (pointsData.free_points || 0) + (pointsData.paid_points || 0), loading: false });
        } else {
            setPoints({ total: 0, loading: false });
        }

        const filterRes = await fetch('/api/users/safety-filter');
        if (filterRes.ok) {
          const filterData = await filterRes.json();
          setIsSafetyFilterOn(filterData.safetyFilter);
        }
      } catch (error) {
        console.error(error);
        setPoints({ total: 0, loading: false });
      }
    };
    fetchData();
  }, []);

  const handleNavigate = (path: string) => router.push(path);

  // フィルターの状態を更新する共通関数
  const updateSafetyFilter = async (newStatus: boolean) => {
    try {
      const response = await fetch('/api/users/safety-filter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safetyFilter: newStatus }),
      });
      if (!response.ok) throw new Error('設定の変更に失敗しました。');
      
      const data = await response.json();
      setIsSafetyFilterOn(data.safetyFilter);
      alert(`セーフティフィルターを${newStatus ? 'ON' : 'OFF'}にしました。`);
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。');
    } finally {
      setIsModalOpen(false);
    }
  };

  // クリック時の処理をトグル方式に変更
  const handleSafetyFilterToggle = () => {
    if (isSafetyFilterOn) {
      setIsModalOpen(true);
    } else {
      updateSafetyFilter(true);
    }
  };

  const myMenuItems: MenuItem[] = [
    { icon: <User size={20} className="text-gray-400" />, text: "キャラクター管理", action: () => handleNavigate("/character-management") },
    { 
      icon: <ShieldCheck size={20} className="text-gray-400" />, 
      text: "セーフティフィルター", 
      badge: isSafetyFilterOn ? "ON" : "OFF", 
      action: handleSafetyFilterToggle
    },
    { icon: <BrainCircuit size={20} className="text-gray-400" />, text: "ペルソナ設定", action: () => handleNavigate("/persona/list") },
  ];
  const infoMenuItems: Omit<MenuItem, 'badge'>[] = [
    { icon: <Users size={20} className="text-gray-400" />, text: "ディスコード", action: () => handleNavigate("/discord") },
    { icon: <BookUser size={20} className="text-gray-400" />, text: "ユーザーガイド", action: () => handleNavigate("/guide") },
    { icon: <Megaphone size={20} className="text-gray-400" />, text: "お知らせ", action: () => handleNavigate("/notice") },
  ];

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => updateSafetyFilter(false)}
        title="年齢確認"
        message="あなたは成人ですか？ 「はい」を選択すると、成人向けコンテンツが表示される可能性があります。"
        confirmText="はい"
        cancelText="いいえ"
      />
      <main className="flex flex-col gap-6">
        <div className="bg-[#1C1C1E] p-4 rounded-lg flex items-center">
          <div className="mr-4">
            {session.user?.image ? (
              <Image src={session.user.image} alt="User Avatar" width={48} height={48} className="rounded-full" />
            ) : (
              <DefaultAvatarIcon size={48} />
            )}
          </div>
          <div className="flex-grow">
            {/* ✨ ここを修正しました ✨ */}
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{session.user?.name || "ユーザー"}</p>
              {/* ユーザーのroleが'ADMIN'の場合、管理者バッジを表示します */}
              {session.user?.role === 'ADMIN' && (
                <span className="text-xs bg-pink-600 text-white font-semibold py-1 px-2 rounded-md">
                  管理者
                </span>
              )}
            </div>
          </div>
          <button onClick={() => handleNavigate(`/profile/${session.user?.id}`)} className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-lg transition-colors duration-200">
            マイプロフィール
          </button>
        </div>

        <button
          onClick={() => handleNavigate('/billing')}
          className="w-full bg-[#1C1C1E] p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <Coins size={20} className="text-yellow-400" />
            <span className="font-semibold">保有ポイント</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">
              {points.loading ? '読み込み中...' : `${points.total.toLocaleString()} P`}
            </span>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </button>

        <div className="bg-[#1C1C1E] rounded-lg">
          <div className="px-4 pt-4 pb-2"><h2 className="text-xs text-gray-500">MY</h2></div>
          <nav className="flex flex-col">
            {myMenuItems.map((item) => (
              <button key={item.text} onClick={item.action} className="w-full flex items-center text-left p-4 hover:bg-gray-800 transition-colors duration-200 cursor-pointer">
                {item.icon}
                <span className="ml-4 text-base">{item.text}</span>
                {item.badge && (<span className={`ml-auto text-sm px-2 py-1 rounded ${isSafetyFilterOn ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{item.badge}</span>)}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="bg-[#1C1C1E] rounded-lg">
          <div className="px-4 pt-4 pb-2"><h2 className="text-xs text-gray-500">コミュニケーション・案内</h2></div>
          <nav className="flex flex-col">
            {infoMenuItems.map((item) => (
              <button key={item.text} onClick={item.action} className="w-full flex items-center text-left p-4 hover:bg-gray-800 transition-colors duration-200 cursor-pointer">
                {item.icon}
                <span className="ml-4 text-base">{item.text}</span>
              </button>
            ))}
          </nav>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center justify-center text-left p-4 bg-[#1C1C1E] rounded-lg hover:bg-red-800/50 transition-colors duration-200 cursor-pointer">
          <LogOut size={20} className="text-red-500 mr-3" />
          <span className="text-red-500 font-semibold">ログアウト</span>
        </button>
      </main>
    </>
  );
};

// ログインしていないユーザー向けのビュー
const LoggedOutView = () => {
  const router = useRouter();
  const handleNavigate = (path: string) => {
    router.push(path);
  };
  const menuItems = [
    { icon: <Users size={20} className="text-gray-400" />, text: "ディスコード", href: "/discord" },
    { icon: <BookUser size={20} className="text-gray-400" />, text: "ユーザーガイド", href: "/guide" },
    { icon: <Megaphone size={20} className="text-gray-400" />, text: "お知らせ", badge: "アップデート", href: "/notices" },
    { icon: <MailQuestion size={20} className="text-gray-400" />, text: "ご意見箱", href: "/suggestions" },
    { icon: <MessageSquareText size={20} className="text-gray-400" />, text: "フィードバック", href: "/feedback" },
    { icon: <Settings size={20} className="text-gray-400" />, text: "設定", href: "/settings" },
  ];
  return (
    <main className="flex flex-col gap-6">
      <button onClick={() => router.push("/login")} className="w-full bg-[#1C1C1E] p-4 rounded-lg flex items-center cursor-pointer hover:bg-gray-800 transition-colors duration-200">
        <div className="bg-pink-500 p-3 rounded-full mr-4"><Heart size={24} className="text-white" fill="white" /></div>
        <div className="text-left"><p className="font-semibold">ログインして始める</p></div>
        <ChevronRight size={20} className="text-gray-400 ml-auto" />
      </button>
      <div className="bg-[#1C1C1E] rounded-lg">
        <div className="px-4 pt-4 pb-2"><h2 className="text-xs text-gray-500">コミュニケーション・案内</h2></div>
        <nav className="flex flex-col">
          {menuItems.map((item, index) => (
            <button key={index} onClick={() => handleNavigate(item.href)} className="w-full flex items-center text-left p-4 hover:bg-gray-800 transition-colors duration-200 cursor-pointer">
              {item.icon}
              <span className="ml-4 text-base">{item.text}</span>
              {item.badge && (<span className="ml-auto text-sm text-pink-400 font-semibold">{item.badge}</span>)}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
};

export default function MyPage() {
  const { data: session, status } = useSession();
  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans pb-20">
      <header className="text-center py-4"><h1 className="text-lg font-bold">マイページ</h1></header>
      {status === "loading" && <p className="text-center">ローディング中...</p>}
      {status === "authenticated" && <LoggedInView session={session} />}
      {status === "unauthenticated" && <LoggedOutView />}
    </div>
  );
}
