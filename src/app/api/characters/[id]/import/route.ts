import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// POST: JSONデータを使用してキャラクター情報を上書き（インポート）する
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }

    const targetCharacterId = parseInt(params.id, 10);
    const userId = parseInt(session.user.id, 10);

    try {
        // インポートするデータをJSON形式で受け取る
        const sourceCharacterData = await request.json();

        // インポート先のキャラクターが存在し、本人のものであるか確認
        const targetCharacter = await prisma.characters.findFirst({
            where: { id: targetCharacterId, author_id: userId }
        });

        if (!targetCharacter) {
            return NextResponse.json({ error: 'インポート先のキャラクターが見つからないか、権限がありません。' }, { status: 404 });
        }
        
        const updatedCharacter = await prisma.$transaction(async (tx) => {
            // 1. インポート先の既存画像をDBとファイルシステムから全て削除
            const oldImages = await tx.character_images.findMany({ where: { characterId: targetCharacterId } });
            for (const img of oldImages) {
                const oldPath = path.join(process.cwd(), 'public', img.imageUrl);
                try {
                    await fs.unlink(oldPath);
                } catch (e) { console.error(`古いファイルの削除に失敗: ${oldPath}`, e); }
            }
            await tx.character_images.deleteMany({ where: { characterId: targetCharacterId } });

            // 2. ソースの画像を物理的に新しいファイルとしてコピーして作成
            const newImageMetas = [];
            if (sourceCharacterData.characterImages && Array.isArray(sourceCharacterData.characterImages)) {
                for (const img of sourceCharacterData.characterImages) {
                    const sourcePath = path.join(process.cwd(), 'public', img.imageUrl);
                    const newFilename = `${Date.now()}-${path.basename(img.imageUrl)}`;
                    const newSavePath = path.join(process.cwd(), 'public/uploads', newFilename);
                    
                    try {
                        await fs.copyFile(sourcePath, newSavePath);
                        newImageMetas.push({
                            characterId: targetCharacterId,
                            imageUrl: `/uploads/${newFilename}`,
                            keyword: img.keyword || '',
                            isMain: img.isMain,
                            displayOrder: img.displayOrder,
                        });
                    } catch (e) { console.error(`ファイルのコピーに失敗: ${sourcePath}`, e); }
                }
            }
            if (newImageMetas.length > 0) {
                await tx.character_images.createMany({ data: newImageMetas });
            }

            // 3. テキスト情報を更新
            // ✅ ESLintエラーを回避するため、更新に必要なデータだけを明示的に抽出する方式に変更
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
                data: dataToUpdate
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