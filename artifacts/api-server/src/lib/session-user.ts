import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, isLocalDatabase, localDb, usersTable } from "@workspace/db";

const COOKIE_NAME = "notice_lens_user";

export async function getCurrentUser(req: Request, res: Response) {
  let sessionKey = req.signedCookies?.[COOKIE_NAME] as string | undefined;
  if (!sessionKey) {
    sessionKey = crypto.randomUUID();
    res.cookie(COOKIE_NAME, sessionKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
  }

  if (isLocalDatabase) {
    return localDb.getUserBySessionKey(sessionKey) ?? localDb.createUser(sessionKey);
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.sessionKey, sessionKey))
    .limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(usersTable)
    .values({ sessionKey })
    .returning();
  return created;
}
