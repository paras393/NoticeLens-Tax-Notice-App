import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, analysesTable, isLocalDatabase, localDb, noticesTable } from "@workspace/db";
import {
  AnalyzeNoticeBody,
  AnalyzeNoticeParams,
  AnalyzeNoticeResponse,
  AskNoticeBody,
  AskNoticeParams,
  AskNoticeResponse,
  CreateNoticeBody,
  CreateNoticeResponse,
  DeleteNoticeParams,
  GetDashboardResponse,
  GetNoticeParams,
  GetNoticeResponse,
  ListNoticesResponse,
} from "@workspace/api-zod";
import { analyzeNoticeContent, answerNoticeQuestion } from "../lib/notice-analysis";
import { getCurrentUser } from "../lib/session-user";

const router: IRouter = Router();

function formatNotice(notice: typeof noticesTable.$inferSelect) {
  return {
    id: notice.id,
    title: notice.title,
    fileName: notice.fileName,
    fileType: notice.fileType,
    taxSystem: notice.taxSystem,
    status: notice.status,
    noticeType: notice.noticeType,
    deadline: notice.deadline,
    isDemo: notice.isDemo,
    createdAt: notice.createdAt.toISOString(),
  };
}

function formatAnalysis(analysis: typeof analysesTable.$inferSelect) {
  return {
    id: analysis.id,
    noticeId: analysis.noticeId,
    ...analysis.payload,
    createdAt: analysis.createdAt.toISOString(),
  };
}

async function getOwnedNotice(userId: number, noticeId: number) {
  if (isLocalDatabase) return localDb.getNotice(userId, noticeId);
  const [notice] = await db
    .select()
    .from(noticesTable)
    .where(and(eq(noticesTable.id, noticeId), eq(noticesTable.userId, userId)))
    .limit(1);
  return notice;
}

router.get("/notices", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req, res);
  if (isLocalDatabase) {
    res.json(ListNoticesResponse.parse(localDb.listNotices(user.id).map(formatNotice)));
    return;
  }
  const notices = await db
    .select()
    .from(noticesTable)
    .where(eq(noticesTable.userId, user.id))
    .orderBy(desc(noticesTable.createdAt));
  res.json(ListNoticesResponse.parse(notices.map(formatNotice)));
});

router.post("/notices", async (req, res): Promise<void> => {
  const parsed = CreateNoticeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await getCurrentUser(req, res);
  if (isLocalDatabase) {
    const notice = localDb.createNotice({ ...parsed.data, userId: user.id });
    res.status(201).json(CreateNoticeResponse.parse(formatNotice(notice)));
    return;
  }
  const [notice] = await db
    .insert(noticesTable)
    .values({
      userId: user.id,
      title: parsed.data.title,
      fileName: parsed.data.fileName,
      fileType: parsed.data.fileType,
      taxSystem: parsed.data.taxSystem,
      content: parsed.data.content,
      isDemo: parsed.data.isDemo,
    })
    .returning();
  res.status(201).json(CreateNoticeResponse.parse(formatNotice(notice)));
});

router.get("/notices/:noticeId", async (req, res): Promise<void> => {
  const params = GetNoticeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = await getCurrentUser(req, res);
  const notice = await getOwnedNotice(user.id, params.data.noticeId);
  if (!notice) {
    res.status(404).json({ error: "Notice not found" });
    return;
  }
  if (isLocalDatabase) {
    const analysis = localDb.getAnalysis(notice.id);
    res.json(
      GetNoticeResponse.parse({
        ...formatNotice(notice),
        analysis: analysis ? formatAnalysis(analysis) : null,
      }),
    );
    return;
  }
  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.noticeId, notice.id))
    .limit(1);
  res.json(
    GetNoticeResponse.parse({
      ...formatNotice(notice),
      analysis: analysis ? formatAnalysis(analysis) : null,
    }),
  );
});

router.delete("/notices/:noticeId", async (req, res): Promise<void> => {
  const params = DeleteNoticeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = await getCurrentUser(req, res);
  if (isLocalDatabase) {
    if (!localDb.deleteNotice(user.id, params.data.noticeId)) {
      res.status(404).json({ error: "Notice not found" });
      return;
    }
    res.sendStatus(204);
    return;
  }
  const deleted = await db
    .delete(noticesTable)
    .where(and(eq(noticesTable.id, params.data.noticeId), eq(noticesTable.userId, user.id)))
    .returning({ id: noticesTable.id });
  if (!deleted[0]) {
    res.status(404).json({ error: "Notice not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/notices/:noticeId/analyze", async (req, res): Promise<void> => {
  const params = AnalyzeNoticeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = AnalyzeNoticeBody.safeParse(req.body ?? {});
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const user = await getCurrentUser(req, res);
  const notice = await getOwnedNotice(user.id, params.data.noticeId);
  if (!notice) {
    res.status(404).json({ error: "Notice not found" });
    return;
  }

  const content = body.data.content ?? notice.content;
  const taxSystem = body.data.taxSystem ?? notice.taxSystem;
  const payload = analyzeNoticeContent(content, taxSystem);
  if (isLocalDatabase) {
    const analysis = localDb.saveAnalysis(notice.id, payload);
    localDb.updateNotice(notice.id, {
      status: "analyzed",
      noticeType: payload.noticeType,
      deadline: payload.extracted.deadline,
    });
    res.json(AnalyzeNoticeResponse.parse(formatAnalysis(analysis)));
    return;
  }
  const [analysis] = await db
    .insert(analysesTable)
    .values({ noticeId: notice.id, payload })
    .onConflictDoUpdate({
      target: analysesTable.noticeId,
      set: { payload, createdAt: new Date() },
    })
    .returning();
  await db
    .update(noticesTable)
    .set({
      status: "analyzed",
      noticeType: payload.noticeType,
      deadline: payload.extracted.deadline,
    })
    .where(eq(noticesTable.id, notice.id));

  res.json(
    AnalyzeNoticeResponse.parse({
      ...formatAnalysis(analysis),
    }),
  );
});

router.post("/notices/:noticeId/ask", async (req, res): Promise<void> => {
  const params = AskNoticeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = AskNoticeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const user = await getCurrentUser(req, res);
  const notice = await getOwnedNotice(user.id, params.data.noticeId);
  if (!notice) {
    res.status(404).json({ error: "Notice not found" });
    return;
  }
  const analysis = isLocalDatabase
    ? localDb.getAnalysis(notice.id)
    : (await db
        .select()
        .from(analysesTable)
        .where(eq(analysesTable.noticeId, notice.id))
        .limit(1))[0];
  const payload = analysis?.payload ?? analyzeNoticeContent(notice.content, notice.taxSystem);
  const result = answerNoticeQuestion(
    body.data.question,
    notice.content,
    notice.taxSystem,
    payload,
  );
  res.json(
    AskNoticeResponse.parse({
      question: body.data.question,
      answer: result.answer,
      groundedIn: result.groundedIn,
    }),
  );
});

router.get("/dashboard", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req, res);
  const notices: Array<typeof noticesTable.$inferSelect> = isLocalDatabase
    ? localDb.listNotices(user.id)
    : await db
        .select()
        .from(noticesTable)
        .where(eq(noticesTable.userId, user.id))
        .orderBy(desc(noticesTable.createdAt));
  res.json(
    GetDashboardResponse.parse({
      totalNotices: notices.length,
      analyzedNotices: notices.filter((notice) => notice.status === "analyzed").length,
      gstNotices: notices.filter((notice) => notice.taxSystem === "GST").length,
      incomeTaxNotices: notices.filter((notice) => notice.taxSystem === "INCOME_TAX").length,
      recent: notices.slice(0, 5).map(formatNotice),
    }),
  );
});

export default router;
