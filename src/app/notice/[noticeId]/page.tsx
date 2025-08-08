import NoticeDetailClient from '@/components/NoticeDetailClient';

// Netlify 호환 버전
export default function NoticeDetailPage({
  params,
}: {
  params: { noticeId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  return <NoticeDetailClient noticeId={params.noticeId} />;
}