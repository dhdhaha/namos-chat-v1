import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = parseInt(params.userId, 10);
  
  if (isNaN(userId)) {
    return NextResponse.json({ error: '無効なユーザーIDです。' }, { status: 400 });
  }

  try {
    // 1. ユーザーの基本情報を取得
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true, // ✅ emailフィールドを追加しました
        image_url: true,
        bio: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    // 2. フォロワー数とフォロー数を直接カウント
    const followerCount = await prisma.follows.count({
      where: { followingId: userId }
    });
    const followingCount = await prisma.follows.count({
      where: { followerId: userId }
    });

    // 3. ユーザーが作成したキャラクターリストを取得
    const characters = await prisma.characters.findMany({
      where: { author_id: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        characterImages: { where: { isMain: true }, take: 1 },
        _count: {
          select: { favorites: true, chat: true }
        }
      }
    });
    
    // 4. 全体の会話量を計算
    const totalMessageCount = await prisma.chat_message.count({
        where: {
            chat: {
                characters: {
                    author_id: userId
                }
            }
        }
    });

    // 返すデータの構造を修正します
    const profileData = {
      ...user,
      characters,
      totalMessageCount,
      _count: { // _countオブジェクトでラップ
        followers: followerCount,
        following: followingCount,
      }
    };

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('プロファイルデータの取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
