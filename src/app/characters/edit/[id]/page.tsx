"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CharacterForm from "@/components/CharacterForm"; // 경로가 다를 경우 수정해주세요.

export default function CharacterEditPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const characterId = params.id as string;

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacterData = useCallback(async () => {
    if (!characterId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/characters/${characterId}`);
      if (!response.ok) {
        throw new Error("キャラクターデータの読み込みに失敗しました。");
      }
      const data = await response.json();
      setInitialData(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCharacterData();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, fetchCharacterData, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p>ローディング中...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => router.push('/MyPage')} className="text-pink-400 hover:underline">
                マイページに戻る
            </button>
        </div>
    );
  }

  if (initialData) {
    return <CharacterForm isEditMode={true} initialData={initialData} />;
  }
  
  return null; // 모든 조건에 해당하지 않을 경우
}