import NoticeDetailClient from "@/components/NoticeDetailClient";

// 타입 정의 없이 바로 구조 분해로 작성
export default function NoticeDetailPage({
  params,
}: {
  params: { noticeId: string };
}) {
  return <NoticeDetailClient noticeId={params.noticeId} />;
}