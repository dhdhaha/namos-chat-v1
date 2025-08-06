import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';

const prisma = new PrismaClient();

type ImageMetaData = {
  url: string;
  keyword: string;
  isMain: boolean;
  displayOrder: number;
};

// GET: ログインユーザーが作成したキャラクターのリストを取得する
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id, 10);

    const characters = await prisma.characters.findMany({
      where: { author_id: userId },
      orderBy: { id: 'desc' },
      include: {
        characterImages: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
        _count: {
          select: { favorites: true, interactions: true },
        },
      },
    });

    return NextResponse.json(characters);

  } catch (error) {
    console.error('キャラクターリストの取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}

// POST: 新しいキャラクターを作成する
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const userIdString = formData.get('userId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || '';
    const hashtagsString = formData.get('hashtags') as string || '[]';
    const visibility = formData.get('visibility') as string || 'public';
    const safetyFilterString = formData.get('safetyFilter') as string || 'true';
    const systemTemplate = formData.get('systemTemplate') as string || '';
    const detailSetting = formData.get('detailSetting') as string || '';
    const firstSituation = formData.get('firstSituation') as string || '';
    const firstMessage = formData.get('firstMessage') as string || '';

    if (!userIdString) {
      return NextResponse.json({ message: "認証情報が見つかりません。再度ログインしてください。" }, { status: 401 });
    }
    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ message: "無効なユーザーIDです。" }, { status: 400 });
    }
    
    if (!name || !name.trim()) {
      return NextResponse.json({ message: "キャラクターの名前は必須項目です。" }, { status: 400 });
    }

    const safetyFilter = safetyFilterString === 'true';
    let hashtags: string[] = [];
    try {
      hashtags = JSON.parse(hashtagsString);
    } catch {
      hashtags = [];
    }
    
    const imageCountString = formData.get('imageCount') as string;
    const imageCount = imageCountString ? parseInt(imageCountString) : 0;
    const imageMetas: ImageMetaData[] = [];

    for (let i = 0; i < imageCount; i++) {
      const file = formData.get(`image_${i}`) as File | null;
      const keyword = formData.get(`keyword_${i}`) as string || '';
      
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const savePath = path.join(process.cwd(), 'public/uploads', filename);
        await fs.mkdir(path.dirname(savePath), { recursive: true });
        await fs.writeFile(savePath, buffer);
        const imageUrl = `/uploads/${filename}`;
        imageMetas.push({ url: imageUrl, keyword, isMain: i === 0, displayOrder: i });
      }
    }
    
    // ▼▼▼ 変更点 1: `users` を `author` に修正 ▼▼▼
    const characterData = {
      name,
      description,
      systemTemplate,
      firstSituation,
      firstMessage,
      visibility,
      safetyFilter,
      category,
      hashtags,
      detailSetting,
      author: { // `users`ではなく`author`を使用
        connect: {
          id: userId,
        },
      },
    };

    const newCharacter = await prisma.$transaction(async (tx) => {
      const character = await tx.characters.create({
        data: characterData,
      });

      if (imageMetas.length > 0) {
        await tx.character_images.createMany({
          data: imageMetas.map(meta => ({
            characterId: character.id,
            imageUrl: meta.url,
            keyword: meta.keyword,
            isMain: meta.isMain,
            displayOrder: meta.displayOrder,
          })),
        });
      }

      return await tx.characters.findUnique({
        where: { id: character.id },
        include: {
          characterImages: true,
        },
      });
    });

    return NextResponse.json({ 
      message: 'キャラクターの作成に成功しました！', 
      character: newCharacter 
    }, { status: 201 });

  } catch (error) {
    // ▼▼▼ 変更点 2: console.errorの韓国語を日本語に修正 ▼▼▼
    console.error("--- ❌ [致命的なエラー発生] サーバーエラー:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: '不明なサーバーエラーが発生しました' }, { status: 500 });
  }
}