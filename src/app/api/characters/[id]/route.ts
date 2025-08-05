import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// GET: 特定のキャラクターの詳細情報を取得します（公開ページ用）
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  const characterId = parseInt(params.id, 10);
  if (isNaN(characterId)) {
    return NextResponse.json({ error: '無効なIDです。'}, { status: 400 });
  }

  try {
    const character = await prisma.characters.findUnique({
      where: {
        id: characterId,
      },
      include: {
        characterImages: {
            orderBy: {
                displayOrder: 'asc'
            }
        },
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
          }
        },
        _count: {
          select: { 
            favorites: true,
            chat: true,
          }
        }
      }
    });

    if (!character) {
      return NextResponse.json({ error: 'キャラクターが見つかりません。' }, { status: 404 });
    }
    return NextResponse.json(character);
  } catch (error) {
    console.error('キャラクター詳細の取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}

// PUT: キャラクター情報を更新します
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }

    const characterIdToUpdate = parseInt(params.id, 10);
    const userId = parseInt(session.user.id, 10);

    if (isNaN(characterIdToUpdate) || isNaN(userId)) {
      return NextResponse.json({ error: '無効なIDです。'}, { status: 400 });
    }

    try {
        const formData = await request.formData();

        const originalCharacter = await prisma.characters.findFirst({
            where: { id: characterIdToUpdate, author_id: userId }
        });

        if (!originalCharacter) {
            return NextResponse.json({ error: 'キャラクターが見つからないか、更新権限がありません。' }, { status: 404 });
        }

        const updatedCharacter = await prisma.$transaction(async (tx) => {
            const imagesToDeleteString = formData.get('imagesToDelete') as string;
            if (imagesToDeleteString) {
                const imagesToDelete: number[] = JSON.parse(imagesToDeleteString);
                if (imagesToDelete.length > 0) {
                    const images = await tx.character_images.findMany({ where: { id: { in: imagesToDelete } } });
                    for (const img of images) {
                        try {
                            await fs.unlink(path.join(process.cwd(), 'public', img.imageUrl));
                        } catch (e) {
                            console.error(`ファイルの物理削除に失敗: ${img.imageUrl}`, e);
                        }
                    }
                    await tx.character_images.deleteMany({ where: { id: { in: imagesToDelete } } });
                }
            }

            const newImageCountString = formData.get('newImageCount') as string;
            const newImageCount = newImageCountString ? parseInt(newImageCountString, 10) : 0;
            const newImageMetas = [];

            const existingImageCount = await tx.character_images.count({ where: { characterId: characterIdToUpdate }});
            let displayOrderCounter = existingImageCount;

            for (let i = 0; i < newImageCount; i++) {
                const file = formData.get(`new_image_${i}`) as File | null;
                const keyword = formData.get(`new_keyword_${i}`) as string || '';

                if (file && file.size > 0) {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
                    const savePath = path.join(process.cwd(), 'public/uploads', filename);

                    await fs.mkdir(path.dirname(savePath), { recursive: true });
                    await fs.writeFile(savePath, buffer);
                    
                    newImageMetas.push({
                        characterId: characterIdToUpdate,
                        imageUrl: `/uploads/${filename}`,
                        keyword,
                        isMain: false,
                        displayOrder: displayOrderCounter++,
                    });
                }
            }
            // ▼▼▼ 変更点: `as any`を削除しました ▼▼▼
            if (newImageMetas.length > 0) {
                await tx.character_images.createMany({ data: newImageMetas });
            }
            
            const dataToUpdate = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                systemTemplate: formData.get('systemTemplate') as string,
                firstSituation: formData.get('firstSituation') as string,
                firstMessage: formData.get('firstMessage') as string,
                visibility: formData.get('visibility') as string,
                safetyFilter: formData.get('safetyFilter') === 'true',
                category: formData.get('category') as string,
                hashtags: JSON.parse(formData.get('hashtags') as string || '[]'),
                detailSetting: formData.get('detailSetting') as string,
            };

            return await tx.characters.update({
                where: { id: characterIdToUpdate },
                data: dataToUpdate
            });
        });

        return NextResponse.json(updatedCharacter);

    } catch (error) {
        console.error('キャラクターの更新エラー:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}

// DELETE: 特定のキャラクターを削除します (変更なし)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }

    const characterId = parseInt(params.id, 10);
    const userId = parseInt(session.user.id, 10);

    if (isNaN(characterId) || isNaN(userId)) {
        return NextResponse.json({ error: '無効なIDです。'}, { status: 400 });
    }

    try {
        const character = await prisma.characters.findFirst({
            where: {
                id: characterId,
                author_id: userId,
            },
            include: { characterImages: true }
        });

        if (!character) {
            return NextResponse.json({ error: 'キャラクターが見つからないか、削除権限がありません。' }, { status: 404 });
        }
        
        for (const img of character.characterImages) {
            const filePath = path.join(process.cwd(), 'public', img.imageUrl);
            try {
                await fs.unlink(filePath);
            } catch (e) {
                console.error(`ファイルの物理削除に失敗: ${filePath}`, e);
            }
        }

        await prisma.characters.delete({
            where: { id: characterId },
        });

        return NextResponse.json({ message: 'キャラクターが正常に削除されました。' }, { status: 200 });

    } catch (error) {
        console.error('キャラクターの削除エラー:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}