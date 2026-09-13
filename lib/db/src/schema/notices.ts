import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const noticesTable = pgTable("notices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  taxSystem: text("tax_system").notNull(),
  status: text("status").notNull().default("uploaded"),
  noticeType: text("notice_type"),
  deadline: text("deadline"),
  isDemo: boolean("is_demo").notNull().default(false),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNoticeSchema = createInsertSchema(noticesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Notice = typeof noticesTable.$inferSelect;

export type ExtractedNotice = {
  department: string;
  referenceNumber: string;
  noticeDate: string;
  financialYear: string;
  assessmentYear: string;
  taxPeriod: string;
  section: string;
  amounts: string[];
  deadline: string;
  hearingDate: string;
  requestedAction: string;
  documents: string[];
};

export type AnalysisSection = {
  key: string;
  title: string;
  body: string;
  tone: "default" | "warning" | "action" | "muted";
  bullets?: string[];
};

export type AnalysisTerm = {
  term: string;
  explanation: string;
};

export type AnalysisPayload = {
  noticeType: string;
  confidence: "high" | "medium" | "limited";
  extracted: ExtractedNotice;
  sections: AnalysisSection[];
  terms: AnalysisTerm[];
};

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  noticeId: integer("notice_id").notNull().unique().references(() => noticesTable.id, { onDelete: "cascade" }),
  payload: jsonb("payload").$type<AnalysisPayload>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Analysis = typeof analysesTable.$inferSelect;