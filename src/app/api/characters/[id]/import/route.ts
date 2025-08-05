import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SourceImage {
  imageUrl: string;
  keyword?: string;
  isMain: boolean;
  displayOrder: number;
}

/**
 * POST: 既存のキャラクターに、別のキャラクターの情報を上書き（インポート）します。
 * Vercel環境で動作するように、物理的なファイル操作をなくし、
 * データベース操作のみで完結するようにロジックを修正しました。
 */
export async function POST(
  request: NextRequest,
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any // ❗️타입을 완전히 제거하거나 any로 해야 Vercel에서 통과
) {
  const { id } = context.params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  const targetCharacterId = parseInt(id, 10);
  const userId = parseInt(session.user.id, 10);

  if (isNaN(targetCharacterId)) {
    return NextResponse.json({ error: '無効なキャラクターIDです。' }, { status: 400 });
  }

  try {
    const sourceCharacterData = await request.json();

    const targetCharacter = await prisma.characters.findFirst({
      where: { id: targetCharacterId, author_id: userId },
    });

    if (!targetCharacter) {
      return NextResponse.json({ error: 'インポート先のキャラクターが見つからないか、権限がありません。' }, { status: 404 });
    }

    const updatedCharacter = await prisma.$transaction(async (tx) => {
      await tx.character_images.deleteMany({ where: { characterId: targetCharacterId } });

      if (sourceCharacterData.characterImages && Array.isArray(sourceCharacterData.characterImages)) {
        const newImageMetas = sourceCharacterData.characterImages.map((img: SourceImage) => ({
          characterId: targetCharacterId,
          imageUrl: img.imageUrl,
          keyword: img.keyword || '',
          isMain: img.isMain,
          displayOrder: img.displayOrder,
        }));

        if (newImageMetas.length > 0) {
          await tx.character_images.createMany({ data: newImageMetas });
        }
      }

      const dataToUpdate = {
        name: sourceCharacterData.name,
        description: sourceCharacterData.description,
        systemTemplate: sourceCharacterData.systemTemplate,
        firstSituation: sourceCharacterData.firstSituation,
        firstMessage: sourceCharacterData.firstMessage,
        visibility: sourceCharacterData.visibility,
        safetyFilter: sourceCharacterData.safetyFilter,
        category: sourceCharacterData.category,
        hashtags: sourceCharacterData.hashtags,
        detailSetting: sourceCharacterData.detailSetting,
      };

      return await tx.characters.update({
        where: { id: targetCharacterId },
        data: dataToUpdate,
        include: {
          characterImages: true,
        },
      });
    });

    return NextResponse.json(updatedCharacter);

  } catch (error) {
    console.error('キャラクターのインポートエラー:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: '無効なJSONデータです。' }, { status: 400 });
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}