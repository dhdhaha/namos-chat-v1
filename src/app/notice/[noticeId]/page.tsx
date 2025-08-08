import NoticeDetailClient from '@/components/NoticeDetailClient';

// Next.js 페이지가 받을 수 있는 모든 props를 포함하는 표준 타입 정의입니다.
// searchParams를 추가하여 타입을 더 완전하게 만듭니다.
type Props = {
  params: { noticeId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// 이 페이지는 서버 컴포넌트로서, URL 파라미터를 받아
// 클라이언트 컴포넌트를 렌더링하고 파라미터를 전달합니다.
export default function NoticeDetailPage({ params }: Props) {
  return <NoticeDetailClient noticeId={params.noticeId} />;
}
