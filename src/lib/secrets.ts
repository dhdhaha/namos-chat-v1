import fs from "fs";
import path from "path";

const runtimePath = path.join(process.cwd(), "secrets", "runtime.json");

let secrets: Record<string, string> = {};
if (fs.existsSync(runtimePath)) {
  secrets = JSON.parse(fs.readFileSync(runtimePath, "utf8"));
}

export default secrets;
