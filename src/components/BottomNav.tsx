"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, PlusSquare, User } from "lucide-react";

// ナビゲーションアイテムのデータ
const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/chatlist", label: "チャット", icon: MessageCircle },
  { href: "/characters/create", label: "作成", icon: PlusSquare },
  { href: "/MyPage", label: "マイページ", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname(); 

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // ✅ ホームボタンの判定ロジックを修正しました
          // これでキャラクター詳細ページでもホームがアクティブになります
          const isActive = item.href === "/"
            ? pathname === "/" || pathname.startsWith("/characters/") && pathname !== "/characters/create"
            : pathname === item.href;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 text-xs transition-colors duration-200"
            >
              <item.icon
                size={24}
                className={isActive ? "text-pink-500" : "text-gray-400"}
              />
              <span
                className={isActive ? "text-pink-500" : "text-gray-400"}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
