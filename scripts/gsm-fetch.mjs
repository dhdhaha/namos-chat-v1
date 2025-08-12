// scripts/gsm-fetch.mjs
import fs from "node:fs";
import path from "node:path";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

// 1) 서비스 계정 키(JSON) 파일로 저장
const saDir = path.join(process.cwd(), "gcp");
const saPath = path.join(saDir, "sa.json");
fs.mkdirSync(saDir, { recursive: true });

const saJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (!saJson) {
  console.error("❌ GOOGLE_APPLICATION_CREDENTIALS_JSON 없음");
  process.exit(1);
}
// (옵션) 최소 유효성 검사
try {
  const j = JSON.parse(saJson);
  if (j.type !== "service_account") throw new Error("type != service_account");
} catch (e) {
  console.error("❌ 서비스 계정 키 JSON 파싱 실패. 정확한 JSON을 넣었는지 확인하세요.");
  throw e;
}
fs.writeFileSync(saPath, saJson, "utf8");

// 2) GSM 클라이언트 (ADC)
process.env.GOOGLE_APPLICATION_CREDENTIALS = saPath;
const client = new SecretManagerServiceClient();

// ✅ 여기 수정: 두 이름 모두 지원
const projectId = process.env.GOOGLE_PROJECT_ID || process.env.GCP_PROJECT_ID;
if (!projectId) {
  console.error("❌ GOOGLE_PROJECT_ID (또는 GCP_PROJECT_ID) 없음");
  process.exit(1);
}

const names = (process.env.GSM_SECRET_NAMES || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const outDir = path.join(process.cwd(), "secrets");
fs.mkdirSync(outDir, { recursive: true });

const bag = {};
for (const name of names) {
  const [res] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/latest`,
  });
  bag[name] = res.payload?.data?.toString("utf8") ?? "";
  console.log(`✅ fetched: ${name}`);
}

fs.writeFileSync(path.join(outDir, "runtime.json"), JSON.stringify(bag, null, 2));
console.log("✅ wrote secrets/runtime.json");