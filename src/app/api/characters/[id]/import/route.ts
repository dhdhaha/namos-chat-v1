import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET: キャラクター詳細取得
 */
// @ts-expect-error -- context 타입 선언은 Vercel에서 금지됨
export async function GET(request: Request, context) {
  const { id } = (context as { params: { id: string } }).params;
  const characterId = parseInt(id, 10);

  if (isNaN(characterId)) {
    return NextResponse.json({ error: '無効なキャラクターIDです。' }, { status: 400 });
  }

  const character = await prisma.characters.findUnique({
    where: { id: characterId },
    include: {
      characterImages: true,
    },
  });

  if (!character) {
    return NextResponse.json({ error: 'キャラクターが見つかりません。' }, { status: 404 });
  }

  return NextResponse.json(character);
}

/**
 * POST: キャラクターインポート
 */
// @ts-expect-error -- context 타입 선언은 Vercel에서 금지됨
export async function POST(request: Request, context) {
  const { id } = (context as { params: { id: string } }).params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  const targetCharacterId = parseInt(id, 10);
  const userId = parseInt(session.user.id, 10);

  if (isNaN(targetCharacterId)) {
    return NextResponse.json({ error: '無効なキャラクターIDです。' }, { status: 400 });
  }

  const sourceCharacterData = await request.json();

  const targetCharacter = await prisma.characters.findFirst({
    where: { id: targetCharacterId, author_id: userId },
  });

  if (!targetCharacter) {
    return NextResponse.json({ error: 'キャラクターが見つからないか、権限がありません。' }, { status: 404 });
  }

  const updatedCharacter = await prisma.$transaction(async (tx) => {
    await tx.character_images.deleteMany({ where: { characterId: targetCharacterId } });

    if (sourceCharacterData.characterImages && Array.isArray(sourceCharacterData.characterImages)) {
      const newImageMetas = sourceCharacterData.characterImages.map((img: any) => ({
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
}