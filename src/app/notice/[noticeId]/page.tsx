import NoticeDetailClient from '@/components/NoticeDetailClient';

// Netlify 타입 충돌 회피 버전
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function NoticeDetailPage({ params }: any) {
  return <NoticeDetailClient noticeId={params.noticeId} />;
}