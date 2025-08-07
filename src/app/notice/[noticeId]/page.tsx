import NoticeDetailClient from '@/components/NoticeDetailClient';

// page.tsxが受け取るpropsの型を定義します。
interface NoticeDetailPageProps {
  params: {
    noticeId: string;
  };
}

// このページはサーバーコンポーネントとして、URL 파라미터를 받아
// クライアントコンポーネントをレンダリングし、파라미터를 전달합니다.
export default function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  return <NoticeDetailClient noticeId={params.noticeId} />;
}
