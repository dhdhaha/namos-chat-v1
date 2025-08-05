"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MoreVertical, Heart, MessageSquare, KeyRound, Mail, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

// API応答の型定義を更新
type ProfileData = {
  id: number;
  name: string;
  nickname: string;
  email: string; // emailを追加
  image_url: string | null;
  bio: string | null;
  totalMessageCount: number;
  characters: {
    id: number;
    name: string;
    characterImages: { imageUrl: string }[];
    _count: { favorites: number; chat: number };
  }[];
  _count: {
    followers: number;
    following: number;
  };
};

// ✅ anyの代わりに、パスワード用の具体的な型を定義
type PasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// パスワード変更モーダル
const PasswordChangeModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (passwords: PasswordPayload) => Promise<void>; }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onSave({ currentPassword, newPassword, confirmPassword });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 text-white rounded-lg p-6 w-full max-w-sm mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">パスワード変更</h2>
                    {/* ✅ ボタンにホバー効果とスタイルを追加 */}
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors cursor-pointer"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                    <input type="password" placeholder="現在のパスワード" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" />
                    <input type="password" placeholder="新しいパスワード" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" />
                    <input type="password" placeholder="新しいパスワード（確認）" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" />
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    {/* ✅ ボタンにホバー効果とスタイルを追加 */}
                    <button onClick={onClose} className="border border-gray-600 hover:bg-gray-700 py-2 px-4 rounded-lg transition-colors cursor-pointer">キャンセル</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-pink-600 hover:bg-pink-700 py-2 px-4 rounded-lg disabled:bg-pink-800 transition-colors cursor-pointer">
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const { data: session } = useSession();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.userId) {
      const fetchProfile = async () => {
        try {
          const response = await fetch(`/api/profile/${params.userId}`);
          if (!response.ok) throw new Error('プロファイル情報の読み込みに失敗');
          const data = await response.json();
          setProfile(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [params.userId]);

  // メニューの外側をクリックしたときに閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ anyの代わりにPasswordPayload型を使用
  const handlePasswordChange = async ({ currentPassword, newPassword, confirmPassword }: PasswordPayload) => {
    if (newPassword !== confirmPassword) {
      alert("新しいパスワードが一致しません。");
      return;
    }
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'パスワードの変更に失敗しました。');
      }
      alert('パスワードが正常に変更されました。');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-black text-white">ローディング中...</div>;
  }

  if (!profile) {
    return <div className="flex h-screen items-center justify-center bg-black text-white">プロファイルが見つかりません。</div>;
  }
  
  const isMyProfile = session?.user?.id === profile.id.toString();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <>
      <PasswordChangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handlePasswordChange} />
      <div className="bg-black min-h-screen text-white">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center justify-between p-4 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
            {/* ✅ ボタンにホバー効果とスタイルを追加 */}
            <button onClick={() => router.push('/MyPage')} className="p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"><ArrowLeft /></button>
            <h1 className="font-bold text-lg">マイプロフィール</h1>
            <div className="relative" ref={menuRef}>
              {/* ✅ ボタンにホバー効果とスタイルを追加 */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"><MoreVertical /></button>
              {isMenuOpen && isMyProfile && (
                <div className="absolute right-0 mt-2 w-64 bg-[#2C2C2E] border border-gray-700 rounded-lg shadow-lg z-20">
                  <div className="p-4 border-b border-gray-700">
                    <p className="text-sm text-gray-400 flex items-center gap-2"><Mail size={14}/> {profile.email}</p>
                  </div>
                  <ul>
                    <li>
                      {/* ✅ ボタンにホバー効果とスタイルを追加 */}
                      <button onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors cursor-pointer">
                        <KeyRound size={16} /> パスワード変更
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </header>
          
          <main className="p-4">
            <section className="flex items-center gap-4 mb-4">
              <Image src={profile.image_url || '/default-avatar.png'} alt={profile.nickname} width={80} height={80} className="rounded-full" />
              <div>
                <h2 className="text-2xl font-bold">{profile.nickname}</h2>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>フォロワー {profile._count.followers}</span>
                  <span>フォロー {profile._count.following}</span>
                </div>
              </div>
            </section>
            <p className="text-gray-300 mb-4">{profile.bio || '自己紹介がありません。'}</p>
            {isMyProfile && (
                // ✅ ボタンにホバー効果とスタイルを追加
                <Link href="/profile-edit" className="block w-full bg-gray-800 hover:bg-gray-700 font-semibold py-2 rounded-lg mb-6 text-center transition-colors cursor-pointer">
                    プロフィール編集
                </Link>
            )}
            <section>
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold">{profile.characters.length}個のキャラクター | 会話量 {formatNumber(profile.totalMessageCount)}</h3>
                 <span className="text-sm text-gray-400">会話量順</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 {profile.characters.map(char => (
                   <Link href={`/characters/${char.id}`} key={char.id} className="block group">
                     <div className="bg-[#1C1C1E] rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                       <div className="relative aspect-[3/4]">
                         <Image src={char.characterImages[0]?.imageUrl || '/default-avatar.png'} alt={char.name} fill className="object-cover" />
                       </div>
                       <div className="p-3">
                         <h4 className="font-semibold truncate text-white">{char.name}</h4>
                         <div className="flex justify-between text-xs text-gray-400 mt-1">
                           <div className="flex items-center gap-1"><Heart size={12}/> {char._count.favorites}</div>
                           <div className="flex items-center gap-1"><MessageSquare size={12}/> {char._count.chat}</div>
                         </div>
                       </div>
                     </div>
                   </Link>
                 ))}
               </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
