import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { localDb } from "./local";

const { Pool } = pg;

export const isLocalDatabase =
  process.env.NOTICE_LENS_DB === "memory" || !process.env.DATABASE_URL;

export const pool = isLocalDatabase
  ? null
  : new Pool({ connectionString: process.env.DATABASE_URL });
export const db: any = isLocalDatabase ? null : drizzle(pool!, { schema });

export * from "./schema";
export { localDb } from "./local";
