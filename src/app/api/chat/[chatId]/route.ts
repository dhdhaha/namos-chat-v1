// ランタイムは Node.js（Edge では fs が使えないため）
export const runtime = 'nodejs';

import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google-cloud/vertexai";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

/**
 * サービスアカウント JSON を /tmp に書き出し、
 * GOOGLE_APPLICATION_CREDENTIALS にそのパスを設定する。
 * サーバーレス環境ではローカルのファイルパスにアクセスできないため、
 * 実行時に /tmp を使って ADC（Application Default Credentials）を成立させる。
 */
function ensureGcpCredsFile() {
  // すでにパスがあるなら何もしない
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!json) {
    // 環境変数未設定の場合、後続で ADC が失敗する可能性あり
    console.error("[GCP] GOOGLE_APPLICATION_CREDENTIALS_JSON が未設定です。");
    return;
  }

  const credPath = path.join("/tmp", "gcp-sa.json");
  try {
    fs.writeFileSync(credPath, json, { encoding: "utf8" });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    // console.log("[GCP] サービスアカウントファイルを /tmp に作成しました。");
  } catch (e) {
    console.error("[GCP] サービスアカウントファイル作成失敗:", e);
  }
}

// VertexAI 初期化前に ADC を成立させる
ensureGcpCredsFile();

const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID || "meta-scanner-466006-v8",
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});

const generativeModel = vertex_ai.getGenerativeModel({
  model: "gemini-2.5-pro",
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
});

// ✅ Vercel/Netlify のビルド時の型エラー回避: URL から直接 ID を解析
function extractChatIdFromRequest(request: Request): number | null {
  const url = new URL(request.url);
  const idStr = url.pathname.split('/').pop();
  if (!idStr) return null;
  const parsedId = parseInt(idStr, 10);
  return isNaN(parsedId) ? null : parsedId;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const numericChatId = extractChatIdFromRequest(request);

    if (numericChatId === null) {
      return NextResponse.json({ error: "無効なチャットIDです。" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "メッセージがありません。" }, { status: 400 });
    }

    // DB からチャット＋ユーザー情報を取得
    const chatRoom = await prisma.chat.findUnique({
      where: { id: numericChatId },
      include: {
        characters: true,
        users: { select: { defaultPersonaId: true } },
      },
    });

    if (!chatRoom || !chatRoom.characters) {
      return NextResponse.json({ error: "チャットまたはキャラクターが見つかりません。" }, { status: 404 });
    }

    // ユーザーの基本ペルソナ情報を取得
    let userPersonaInfo = "ユーザーのペルソナは設定されていません。";
    if (chatRoom.users.defaultPersonaId) {
      const userPersona = await prisma.personas.findUnique({
        where: { id: chatRoom.users.defaultPersonaId },
      });
      if (userPersona) {
        userPersonaInfo = `
# ユーザーのペルソナ設定
- ニックネーム: ${userPersona.nickname}
- 年齢: ${userPersona.age || '未設定'}
- 性別: ${userPersona.gender || '未設定'}
- 詳細情報: ${userPersona.description}
`;
      }
    }

    const characterPersona = chatRoom.characters;

    // システムプロンプト
    const systemInstruction = `
あなたは以下の設定を持つキャラクターとしてロールプレイを行ってください。
以下のペルソナを持つユーザーと対話しています。ユーザーのペルソナを会話に反映させてください。

# あなた(AI)のキャラクター設定
- システムテンプレート: ${characterPersona.systemTemplate || "設定なし"}
- 詳細設定: ${characterPersona.detailSetting || "設定なし"}

${userPersonaInfo}
`;

    // 履歴を作成
    const dbMessages = await prisma.chat_message.findMany({
      where: { chatId: numericChatId },
      orderBy: { createdAt: "asc" },
    });

    const chatHistory: Content[] = dbMessages.map((msg) => ({
      role: msg.role as "user" | "model",
      parts: [{ text: msg.content }],
    }));

    // Vertex AI へ送信
    const chat = generativeModel.startChat({
      history: chatHistory,
      systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const aiReply = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      return NextResponse.json({ error: "モデルから有効な応答がありませんでした。" }, { status: 500 });
    }

    // DB へ保存
    await prisma.$transaction([
      prisma.chat_message.create({
        data: { chatId: numericChatId, role: "user", content: message },
      }),
      prisma.chat_message.create({
        data: { chatId: numericChatId, role: "model", content: aiReply },
      }),
    ]);

    return NextResponse.json({ reply: aiReply });
  } catch (error) {
    console.error("APIルートエラー:", error);
    return NextResponse.json({ error: "内部サーバーエラーが発生しました。" }, { status: 500 });
  }
}