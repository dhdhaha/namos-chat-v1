"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

type PersonaData = {
  nickname: string;
  age: number | null;
  gender: '女性' | '男性' | null;
  description: string;
};

export default function PersonaFormPage() {
  const router = useRouter();
  const params = useParams();
  
  const personaId = params.personaId?.[0]; 
  const isEditMode = !!personaId;

  const [formData, setFormData] = useState<PersonaData>({
    nickname: '',
    age: null,
    gender: null,
    description: '',
  });
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchPersona = async () => {
        try {
          const response = await fetch(`/api/persona/${personaId}`);
          if (!response.ok) throw new Error('ペルソナ情報の読み込みに失敗しました。');
          const data = await response.json();
          setFormData({
              nickname: data.nickname,
              age: data.age,
              gender: data.gender,
              description: data.description,
          });
        } catch (error) {
          console.error(error);
          alert((error as Error).message);
          router.push('/persona/list');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPersona();
    }
  }, [isEditMode, personaId, router]);

  const handleChange = (field: keyof PersonaData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, age: value === '' ? null : Number(value) }));
  };

  const handleSave = async () => {
    if (isSubmitting || !formData.nickname || !formData.description) return;
    setIsSubmitting(true);

    const url = isEditMode ? `/api/persona/${personaId}` : '/api/persona';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            age: formData.age ? Number(formData.age) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存に失敗しました。');
      }

      alert(isEditMode ? 'ペルソナが更新されました。' : 'ペルソナが作成されました。');
      router.push('/persona/list');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">ローディング中...</div>;
  }

  return (
    <div className="bg-black min-h-screen text-white p-4">
      <header className="flex justify-between items-center py-4">
        {/* ✅ cursor-pointerを追加しました */}
        <button 
          onClick={() => router.push('/persona/list')} 
          className="p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="text-lg font-bold">{isEditMode ? 'ペルソナ修正' : 'ペルソナ追加'}</h1>
        {/* ✅ cursor-pointerを追加しました */}
        <button
          onClick={handleSave}
          className={`font-bold py-2 px-3 rounded-lg transition-colors disabled:cursor-not-allowed ${
            formData.nickname && formData.description 
            ? 'text-white hover:bg-gray-800 cursor-pointer' 
            : 'text-gray-600'
          }`}
          disabled={!formData.nickname || !formData.description || isSubmitting}
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </header>
      <main className="mt-8 space-y-8">
        <div>
          <label className="text-sm font-bold text-white">ニックネーム <span className="text-red-500">*</span></label>
          <div className="relative mt-2">
            <input type="text" value={formData.nickname} onChange={(e) => handleChange('nickname', e.target.value)} maxLength={20} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{formData.nickname.length}/20</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-white">年齢</label>
          <input type="number" value={formData.age ?? ''} onChange={handleAgeChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-2 focus:outline-none focus:ring-2 focus:ring-pink-500" />
        </div>
        <div>
          <label className="text-sm font-bold text-white">性別</label>
          {/* ✅ cursor-pointerを追加しました */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button onClick={() => handleChange('gender', '女性')} className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${formData.gender === '女性' ? 'bg-pink-500/20 border-pink-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>女性</button>
            <button onClick={() => handleChange('gender', '男性')} className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${formData.gender === '男性' ? 'bg-pink-500/20 border-pink-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>男性</button>
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-white">詳細情報 <span className="text-red-500">*</span></label>
          <div className="relative mt-2">
            <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} maxLength={1000} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500" />
            <span className="absolute right-3 bottom-3 text-sm text-gray-400">{formData.description.length}/1000</span>
          </div>
        </div>
      </main>
    </div>
  );
}
