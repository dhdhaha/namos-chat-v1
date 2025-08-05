"use client";

import CharacterForm from "@/components/CharacterForm"; // 경로가 다를 경우 수정해주세요.

export default function CharacterCreatePage() {
  // 생성 모드로 CharacterForm 컴포넌트를 렌더링합니다.
  return <CharacterForm isEditMode={false} />;
}