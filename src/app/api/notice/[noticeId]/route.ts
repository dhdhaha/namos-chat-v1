import { NextResponse } from 'next/server';
// Prisma.PrismaClientKnownRequestError 타입을 사용하기 위해 Prisma를 함께 임포트합니다.
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptions 경로 확인

const prisma = new PrismaClient();

/**
 * GET: 特定のお知らせの詳細情報をIDで取得します
 */
export async function GET(
  request: Request,
  { params }: { params: { noticeId: string } }
) {
  try {
    const noticeId = parseInt(params.noticeId, 10);

    if (isNaN(noticeId)) {
      return NextResponse.json({ error: '無効なIDです。' }, { status: 400 });
    }

    const notice = await prisma.notices.findUnique({
      where: { id: noticeId },
    });

    if (!notice) {
      return NextResponse.json(
        { error: 'お知らせが見つかりません。' },
        { status: 404 }
      );
    }

    return NextResponse.json(notice);
  } catch (error) {
    console.error('お知らせ詳細の取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
}

/**
 * PUT: 特定のお知らせを更新します (管理者のみ)
 */
export async function PUT(
  request: Request,
  { params }: { params: { noticeId: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: '権限がありません。' }, { status: 403 });
  }

  try {
    const noticeId = parseInt(params.noticeId, 10);
    if (isNaN(noticeId)) {
      return NextResponse.json({ error: '無効なIDです。' }, { status: 400 });
    }

    const { title, category, content } = await request.json();
    if (!title || !category || !content) {
      return NextResponse.json({ error: 'すべてのフィールドは必須です。' }, { status: 400 });
    }

    const updatedNotice = await prisma.notices.update({
      where: { id: noticeId },
      data: { title, category, content },
    });

    return NextResponse.json(updatedNotice);
  } catch (error) {
    console.error('お知らせ更新エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}


/**
 * DELETE: 特定のお知らせを削除します (管理者のみ)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { noticeId: string } }
) {
  // 1. セッションを取得して管理者権限を確認
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: '権限がありません。' }, { status: 403 });
  }

  try {
    const noticeId = parseInt(params.noticeId, 10);
    if (isNaN(noticeId)) {
      return NextResponse.json({ error: '無効なIDです。' }, { status: 400 });
    }

    // 2. Prismaを使用して該当のお知らせを削除
    await prisma.notices.delete({
      where: { id: noticeId },
    });

    // 3. 成功レスポンスを返す
    return NextResponse.json({ message: 'お知らせが正常に削除されました。' }, { status: 200 });

  } catch (error) {
    console.error('お知らせ削除エラー:', error);
    // ✨ anyの代わりにPrisma.PrismaClientKnownRequestErrorを使用して型安全にエラーを処理します。
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return NextResponse.json({ error: '削除対象のお知らせが見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}