import type {
  Analysis,
  AnalysisPayload,
  Notice,
  User,
} from "./schema";

type NewNotice = Pick<
  Notice,
  "userId" | "title" | "fileName" | "fileType" | "taxSystem" | "content" | "isDemo"
>;

type NoticeUpdate = Pick<Notice, "status" | "noticeType" | "deadline">;

class LocalDatabase {
  private nextUserId = 1;
  private nextNoticeId = 1;
  private nextAnalysisId = 1;
  private users: User[] = [];
  private notices: Notice[] = [];
  private analyses: Analysis[] = [];

  getUserBySessionKey(sessionKey: string): User | undefined {
    return this.users.find((user) => user.sessionKey === sessionKey);
  }

  createUser(sessionKey: string): User {
    const user: User = {
      id: this.nextUserId++,
      sessionKey,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  listNotices(userId: number): Notice[] {
    return this.notices
      .filter((notice) => notice.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getNotice(userId: number, noticeId: number): Notice | undefined {
    return this.notices.find(
      (notice) => notice.id === noticeId && notice.userId === userId,
    );
  }

  createNotice(input: NewNotice): Notice {
    const notice: Notice = {
      ...input,
      id: this.nextNoticeId++,
      status: "uploaded",
      noticeType: null,
      deadline: null,
      createdAt: new Date(),
    };
    this.notices.push(notice);
    return notice;
  }

  deleteNotice(userId: number, noticeId: number): boolean {
    const index = this.notices.findIndex(
      (notice) => notice.id === noticeId && notice.userId === userId,
    );
    if (index === -1) return false;
    this.notices.splice(index, 1);
    this.analyses = this.analyses.filter((analysis) => analysis.noticeId !== noticeId);
    return true;
  }

  getAnalysis(noticeId: number): Analysis | undefined {
    return this.analyses.find((analysis) => analysis.noticeId === noticeId);
  }

  saveAnalysis(noticeId: number, payload: AnalysisPayload): Analysis {
    const existing = this.getAnalysis(noticeId);
    if (existing) {
      existing.payload = payload;
      existing.createdAt = new Date();
      return existing;
    }
    const analysis: Analysis = {
      id: this.nextAnalysisId++,
      noticeId,
      payload,
      createdAt: new Date(),
    };
    this.analyses.push(analysis);
    return analysis;
  }

  updateNotice(noticeId: number, update: NoticeUpdate): void {
    const notice = this.notices.find((item) => item.id === noticeId);
    if (notice) Object.assign(notice, update);
  }
}

export const localDb = new LocalDatabase();
