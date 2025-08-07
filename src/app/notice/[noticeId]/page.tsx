import NoticeDetailClient from '@/components/NoticeDetailClient';

// page.tsx가 받는 props의 타입을 정의합니다.
interface NoticeDetailPageProps {
  params: {
    noticeId: string;
  };
}

// 이 페이지는 서버 컴포넌트로서, URL 파라미터를 받아
// 클라이언트 컴포넌트를 렌더링하고 파라미터를 전달합니다.
export default function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  return <NoticeDetailClient noticeId={params.noticeId} />;
}
