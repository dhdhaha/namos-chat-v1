import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: 現在のユーザーのセーフティフィルター設定を取得します
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { safetyFilter: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ safetyFilter: user.safetyFilter });
  } catch (error) {
    // ▼▼▼ 変更点: console.errorを追加してエラー内容をログに出力 ▼▼▼
    console.error('フィルター取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

// PUT: ユーザーのセーフティフィルター設定を更新します
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  try {
    const { safetyFilter } = await request.json();
    
    if (typeof safetyFilter !== 'boolean') {
      return NextResponse.json({ error: '無効な値です。' }, { status: 400 });
    }

    await prisma.users.update({
      where: { id: userId },
      data: { safetyFilter: safetyFilter },
    });

    return NextResponse.json({ success: true, safetyFilter });
  } catch (error) {
    // ▼▼▼ 変更点: console.errorを追加してエラー内容をログに出力 ▼▼▼
    console.error('フィルター更新エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}