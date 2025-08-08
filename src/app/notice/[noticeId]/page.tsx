import NoticeDetailClient from '@/components/NoticeDetailClient';

// Netlify 타입 충돌 회피 버전
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function NoticeDetailPage({
  params,
}: {
  params: any;
  searchParams?: Record<string, string | string[] | undefined>;
})  {
  return <NoticeDetailClient noticeId={params.noticeId} />;
}