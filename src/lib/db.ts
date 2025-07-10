// src/lib/db.ts
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = new PrismaClient();
export default pool;