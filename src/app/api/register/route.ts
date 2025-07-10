console.log("✅ /api/register 라우트 실행됨!");

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// Prisma クライアントの初期化
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "無効なContent-Typeです。application/jsonが必要です。" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, password, name, phone, nickname } = body;

    // 入力チェック
    if (!email || !password || !name || !phone || !nickname) {
      return NextResponse.json(
        { error: "すべての項目を入力してください。" },
        { status: 400 }
      );
    }

    // ユーザー重複チェック
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email },
          { phone },
          { nickname }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "すでに登録されているユーザー情報があります。" },
        { status: 409 }
      );
    }

    // パスワードをハッシュ化して保存
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        nickname
      }
    });

    // 成功レスポンスをJSONで返却
    return NextResponse.json(
      { message: "会員登録が完了しました。", user: newUser },
      { status: 201 }
    );

  } catch (error) {
    console.error("登録エラー:", error);

    // JSONでエラーレスポンス返却 (HTML 방지)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}