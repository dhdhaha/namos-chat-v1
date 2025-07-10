import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

type ImageMetaData = {
  url: string;
  keyword: string;
  isMain: boolean;
  displayOrder: number;
};

export async function POST(request: Request) {
  console.log("\n\n--- 🚀 [デバッグ開始] APIルートが呼び出されました ---");
  try {
    const formData = await request.formData();
    console.log("--- ✅ [ステップ1] FormDataの解析に成功 ---");

    console.log("--- 🔬 [ステップ2] 受信した生のFormDataキーと値 ---");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  - ${key}: [File: ${value.name}, Size: ${value.size}]`);
      } else {
        console.log(`  - ${key}: ${value}`);
      }
    }

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

    console.log("--- 🔬 [ステップ3] 各変数を抽出 ---");
    console.log({ name, description, category, hashtagsString, visibility, safetyFilterString, systemTemplate, detailSetting, firstSituation, firstMessage });
    
    if (!name || !name.trim()) {
      console.log("--- ❌ [バリデーションエラー] 名前が空です。");
      return NextResponse.json({ message: "キャラクターの名前は必須項目です。" }, { status: 400 });
    }
    console.log("--- ✅ [ステップ3.5] 名前のバリデーションに成功 ---");

    const safetyFilter = safetyFilterString === 'true';
    let hashtags: string[] = [];
    try {
      hashtags = JSON.parse(hashtagsString);
    } catch {
      console.log("--- ⚠️ [警告] ハッシュタグのパースに失敗、空配列を使用 ---");
      hashtags = [];
    }
    console.log("--- ✅ [ステップ4] データの型変換に成功 ---", { safetyFilter, hashtags });

    const imageCountString = formData.get('imageCount') as string;
    const imageCount = imageCountString ? parseInt(imageCountString) : 0;
    const imageMetas: ImageMetaData[] = [];
    console.log(`--- ⏳ [ステップ5] 画像処理を開始します... (合計: ${imageCount}個) ---`);

    for (let i = 0; i < imageCount; i++) {
      const file = formData.get(`image_${i}`) as File | null;
      const keyword = formData.get(`keyword_${i}`) as string || '';
      
      console.log(`--- ⏳ 画像 ${i + 1} を処理中...`);
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name}`;
        const savePath = path.join(process.cwd(), 'public/uploads', filename);
        await fs.mkdir(path.dirname(savePath), { recursive: true });
        await fs.writeFile(savePath, buffer);
        const imageUrl = `/uploads/${filename}`;
        imageMetas.push({ url: imageUrl, keyword, isMain: i === 0, displayOrder: i });
        console.log(`--- ✅ 画像 ${i + 1} の保存に成功: ${imageUrl}`);
      }
    }
    console.log("--- ✅ [ステップ6] すべての画像処理が完了しました ---");
    
    // 데이터베이스 저장을 위한 데이터 구조 생성
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
    };

    console.log("--- 🔬 [ステップ7] Prisma.createに渡す最終的なキャラクターデータ: ---");
    console.log(JSON.stringify(characterData, null, 2));

    console.log("--- ⏳ [ステップ8] データベースへの保存処理を試みます ---");
    
    // 트랜잭션 사용하여 캐릭터와 이미지를 함께 저장
    const newCharacter = await prisma.$transaction(async (tx) => {
      // 1. 캐릭터 생성
      const character = await tx.characters.create({
        data: characterData,
      });

      // 2. 이미지가 있으면 이미지 생성
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

      // 3. 생성된 캐릭터와 이미지 정보를 함께 반환
      return await tx.characters.findUnique({
        where: { id: character.id },
        include: {
          characterImages: true,
        },
      });
    });

    console.log("--- ✅ [ステップ9] 全てのDB作業が完了しました！ ---");
    return NextResponse.json({ 
      message: 'キャラクターの作成に成功しました！', 
      character: newCharacter 
    }, { status: 201 });

  } catch (error) {
    console.error("--- ❌ [致命的なエラー発生] サーバーエラー:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: '不明なサーバーエラーが発生しました' }, { status: 500 });
  }
}