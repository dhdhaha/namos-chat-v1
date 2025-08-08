import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// ❌ サーバーレス環境ではローカル書き込み不可のため、fs/pathは使用しない
// import fs from 'fs/promises';
// import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// 画像メタデータの型
type ImageMetaData = {
  url: string;
  keyword: string;
  isMain: boolean;
  displayOrder: number;
};

// GET: ログインユーザーが作成したキャラクター一覧を取得
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

// POST: 新しいキャラクターを作成する（画像はSupabase Storageへアップロード）
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const userIdString = formData.get('userId') as string;
    const name = (formData.get('name') as string) || '';
    const description = (formData.get('description') as string) || '';
    const category = (formData.get('category') as string) || '';
    const hashtagsString = (formData.get('hashtags') as string) || '[]';
    const visibility = (formData.get('visibility') as string) || 'public';
    const safetyFilterString = (formData.get('safetyFilter') as string) || 'true';
    const systemTemplate = (formData.get('systemTemplate') as string) || '';
    const detailSetting = (formData.get('detailSetting') as string) || '';
    const firstSituation = (formData.get('firstSituation') as string) || '';
    const firstMessage = (formData.get('firstMessage') as string) || '';

    // 認証チェック
    if (!userIdString) {
      return NextResponse.json({ message: '認証情報が見つかりません。再度ログインしてください。' }, { status: 401 });
    }
    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ message: '無効なユーザーIDです。' }, { status: 400 });
    }

    // 必須入力チェック
    if (!name.trim()) {
      return NextResponse.json({ message: 'キャラクターの名前は必須項目です。' }, { status: 400 });
    }

    // 各種パース
    const safetyFilter = safetyFilterString === 'true';
    let hashtags: string[] = [];
    try {
      hashtags = JSON.parse(hashtagsString);
    } catch {
      hashtags = [];
    }

    // 画像枚数
    const imageCountString = formData.get('imageCount') as string;
    const imageCount = imageCountString ? parseInt(imageCountString, 10) : 0;

    // ---- Supabase Storage クライアント初期化 ----
    // ※ service_roleキーはサーバー環境変数にのみ設定し、クライアントには絶対に露出しないこと
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'characters';
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('環境変数が不足しています: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ message: 'サーバー設定エラー（Storage接続情報不足）' }, { status: 500 });
    }
    const sb = createClient(supabaseUrl, serviceRoleKey);

    // Storageにアップロードした画像のメタを蓄積
    const imageMetas: ImageMetaData[] = [];

    for (let i = 0; i < imageCount; i++) {
      const file = formData.get(`image_${i}`) as File | null;
      const keyword = (formData.get(`keyword_${i}`) as string) || '';

      if (!file || file.size === 0) continue;

      // 拡張子を推定（なければpng）
      const ext = (file.type?.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '');
      const safeName = (file.name || `image.${ext}`).replace(/\s/g, '_');

      // 衝突回避のための一意なキー
      const objectKey = `uploads/${Date.now()}-${i}-${safeName}`;

      // File -> ArrayBuffer -> Buffer に変換してアップロード
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadErr } = await sb.storage
        .from(bucket)
        .upload(objectKey, Buffer.from(arrayBuffer), {
          contentType: file.type || 'application/octet-stream',
          upsert: false, // 同名ファイルがあればエラー
        });

      if (uploadErr) {
        console.error('Supabase Storageへのアップロード失敗:', uploadErr);
        return NextResponse.json({ message: '画像アップロードに失敗しました。' }, { status: 500 });
      }

      // 公開URLを取得（バケットが公開設定であること）
      const { data: pub } = sb.storage.from(bucket).getPublicUrl(objectKey);
      const imageUrl = pub.publicUrl;

      imageMetas.push({
        url: imageUrl,
        keyword,
        isMain: i === 0,
        displayOrder: i,
      });
    }

    // ▼ 作成データ（authorリレーションでユーザーに紐づけ）
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
      author: {
        connect: { id: userId },
      },
    };

    // トランザクションでキャラクター + 画像を作成
    const newCharacter = await prisma.$transaction(async (tx) => {
      const character = await tx.characters.create({ data: characterData });

      if (imageMetas.length > 0) {
        await tx.character_images.createMany({
          data: imageMetas.map((meta) => ({
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
        include: { characterImages: true },
      });
    });

    return NextResponse.json(
      { message: 'キャラクターの作成に成功しました！', character: newCharacter },
      { status: 201 }
    );
  } catch (error) {
    console.error('--- ❌ [致命的なエラー発生] サーバーエラー:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '不明なサーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}