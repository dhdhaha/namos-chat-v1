import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/nextauth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);

  // ▼▼▼ 変更点 1: chatIdも受け取るようにする ▼▼▼
  const { characterId, chatId, forceCreate } = await request.json(); 

  if (!characterId) {
    return NextResponse.json({ error: "キャラクターIDが必要です。" }, { status: 400 });
  }
  const numericCharacterId = parseInt(characterId, 10);

  try {
    // ▼▼▼ 変更点 2: chatIdが指定されている場合は、そのチャットを直接探す ▼▼▼
    if (chatId) {
      const specificChat = await prisma.chat.findUnique({
        where: {
          id: parseInt(chatId, 10),
          userId: userId, // 他のユーザーのチャットルームを読み込めないようにセキュリティチェック
        },
        include: {
          chat_message: { orderBy: { createdAt: "asc" } },
        },
      });
      if (specificChat) {
        return NextResponse.json(specificChat);
      }
      // もし指定されたchatIdが見つからない場合は、フォールバックして最新のものを探す
    }

    if (forceCreate) {
      const newChat = await prisma.chat.create({
        data: { userId, characterId: numericCharacterId, updatedAt: new Date() },
      });
      return NextResponse.json({ ...newChat, chat_message: [] });
    }

    // --- chatIdが指定されていない場合の既存ロジック ---
    const existingChat = await prisma.chat.findFirst({
      where: { userId, characterId: numericCharacterId },
      orderBy: { id: 'desc' },
      include: {
        chat_message: { orderBy: { createdAt: "asc" } },
      },
    });

    if (existingChat) {
      return NextResponse.json(existingChat);
    }

    const newChat = await prisma.chat.create({
      data: { userId, characterId: numericCharacterId, updatedAt: new Date() },
    });
    return NextResponse.json({ ...newChat, chat_message: [] });

  } catch (error) {
    console.error("チャットの検索または作成エラー:", error);
    return NextResponse.json(
      { error: "チャットセッションの開始に失敗しました。" },
      { status: 500 }
    );
  }
}