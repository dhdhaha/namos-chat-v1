// GET メソッドに対応したAPIルート
export async function GET() {
  return Response.json({ message: "こんにちは、APIルートが動いています！" });
}