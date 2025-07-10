// src/app/api/dbtest/route.ts
import pool from '@/lib/db';

export async function GET() {
  const res = await pool.query('SELECT NOW()');
  return Response.json({ serverTime: res.rows[0] });
}