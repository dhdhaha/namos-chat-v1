import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from '@/lib/nextauth';
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NoticeForm from "@/components/NoticeForm";
import type { notices } from "@prisma/client";

// Vercel 빌드 에러를 방지하기 위해 Props 타입을 별도의 인터페이스로 분리합니다.
interface NoticeEditAdminPageProps {
  params: {
    noticeId: string;
  };
}

async function getNotice(id: number): Promise<notices | null> {
  try {
    const notice = await prisma.notices.findUnique({ where: { id } });
    return notice;
  } catch (error) {
    console.error("Failed to fetch notice:", error);
    return null;
  }
}

export default async function NoticeEditAdminPage({ params }: NoticeEditAdminPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    redirect('/notice');
  }

  const noticeId = parseInt(params.noticeId, 10);
  if (isNaN(noticeId)) {
    redirect('/notice');
  }

  const notice = await getNotice(noticeId);

  if (!notice) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        お知らせが見つかりません。
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center p-4 sticky top-0 bg-black/80 backdrop-blur-sm z-10 border-b border-gray-800">
          <Link
            href={`/notice/${noticeId}`}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft />
          </Link>
          <h1 className="font-bold text-lg mx-auto">お知らせ修正</h1>
        </header>
        <main>
          <NoticeForm initialData={notice} noticeId={noticeId} />
        </main>
      </div>
    </div>
  );
}
