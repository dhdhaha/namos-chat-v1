// src/lib/auth.ts
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function verifyUserCredentials(email: string, password: string) {
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = res.rows[0];
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name || user.nickname,
  };
}