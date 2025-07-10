"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { Mail, Lock } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      console.error("ログイン失敗:", result.error);
      // TODO: エラー 표시 처리
    } else {
      console.log("ログイン成功！");
      router.push("/home"); // ✅ 로그인 성공 시 홈으로 이동
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">ログイン/会員登録</h1>

      <Card className="w-full max-w-md bg-[#1a1a1a]">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm">
            サービスを利用するためにはログインが必要です。
          </p>

          <Button
            className="w-full flex items-center justify-start gap-2 cursor-pointer bg-white text-black hover:bg-pink-600 hover:text-white transition-colors"
            onClick={() => signIn("google")}
          >
            <FcGoogle size={20} /> Googleアカウントで始まる。
          </Button>

          <div className="border-t border-gray-700 my-4"></div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-white" />
              <Input
                type="email"
                placeholder="メール"
                className="bg-[#333] text-white placeholder-gray-400 border border-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Lock size={16} className="text-white" />
              <Input
                type="password"
                placeholder="パスワード"
                className="bg-[#333] text-white placeholder-gray-400 border border-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="text-right text-sm text-pink-400 cursor-pointer hover:underline">
              パスワード再設定
            </div>

            <Button
              className="w-full bg-pink-500 hover:bg-pink-600 cursor-pointer"
              onClick={handleLogin}
            >
              ログイン
            </Button>
          </div>

          <p className="text-center text-sm mt-4">
            <span
              className="text-pink-400 cursor-pointer hover:underline"
              onClick={() => router.push("/register")} // ✅ 회원가입 페이지로 이동
            >
              アカウントがない方
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
