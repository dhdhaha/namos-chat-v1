import NoticeDetailClient from '@/components/NoticeDetailClient';

// Next.js 표준 PageProps 타입 정의
interface NoticeDetailPageProps {
  params: { noticeId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// 서버 컴포넌트
export default function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  return <NoticeDetailClient noticeId={params.noticeId} />;
}