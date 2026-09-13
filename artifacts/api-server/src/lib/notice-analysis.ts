import type {
  AnalysisPayload,
  AnalysisSection,
  AnalysisTerm,
  ExtractedNotice,
} from "@workspace/db";
import {
  getKnowledgeRecord,
  insufficientInformation,
  retrieveKnowledge,
} from "./knowledge-base";

const NOT_FOUND = "Not found in the notice.";

const clean = (value: string | undefined): string =>
  value?.trim().replace(/\s+/g, " ").replace(/[.,;:]+$/, "") || NOT_FOUND;

function firstMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
    if (match?.[0]) return clean(match[0]);
  }
  return NOT_FOUND;
}

function extractNotice(text: string): ExtractedNotice {
  const normalized = text.replace(/\r/g, "");
  const amounts =
    normalized.match(/(?:₹|Rs\.?|INR)\s?[\d,]+(?:\.\d{1,2})?/gi) ?? [];
  const sections =
    normalized.match(
      /\b(?:section|u\/s\.?|under section|rule)\s+[0-9A-Za-z()./-]+/gi,
    ) ?? [];

  const requestedAction = firstMatch(normalized, [
    /(?:reply|respond|submit|produce|pay|reconcile|furnish|appear)[^.\n]{0,180}/i,
  ]);
  const documentLines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      /(document|statement|invoice|return|ledger|bank|books|evidence|reconciliation|form 16|26as|gstr)/i.test(
        line,
      ),
    )
    .slice(0, 6);

  return {
    department: firstMatch(normalized, [
      /(?:department|authority|office)\s*[:\-]\s*([^\n]+)/i,
      /(Goods and Services Tax|Income Tax Department)/i,
    ]),
    referenceNumber: firstMatch(normalized, [
      /(?:DIN|reference(?: number| no\.?)?|ref(?:erence)? no\.?)\s*[:#-]?\s*([A-Z0-9./-]+)/i,
    ]),
    noticeDate: firstMatch(normalized, [
      /(?:notice date|date of notice|dated)\s*[:\-]\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
    ]),
    financialYear: firstMatch(normalized, [
      /\b(FY\s?\d{4}\s*-\s*\d{2,4}|financial year\s+\d{4}\s*-\s*\d{2,4})\b/i,
    ]),
    assessmentYear: firstMatch(normalized, [
      /\b(AY\s?\d{4}\s*-\s*\d{2,4}|assessment year\s+\d{4}\s*-\s*\d{2,4})\b/i,
    ]),
    taxPeriod: firstMatch(normalized, [
      /(?:tax period|period)\s*[:\-]\s*([^\n]+)/i,
      /\b((?:April|May|June|July|August|September|October|November|December|January|February|March)\s+\d{4}\s*(?:-|to)\s*(?:April|May|June|July|August|September|October|November|December|January|February|March)\s+\d{4})\b/i,
    ]),
    section: sections[0] ?? NOT_FOUND,
    amounts: amounts.length ? amounts.map(clean) : [NOT_FOUND],
    deadline: firstMatch(normalized, [
      /(?:respond|reply|response|payment|pay|submit)[^.\n]{0,80}?(?:by|before|on)\s+([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
      /(?:deadline|due date|last date)\s*[:\-]\s*([^\n]+)/i,
    ]),
    hearingDate: firstMatch(normalized, [
      /(?:hearing date|personal hearing)\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
    ]),
    requestedAction,
    documents: documentLines.length ? documentLines : [NOT_FOUND],
  };
}

function determineNoticeType(text: string, taxSystem: string): string {
  const normalized = text.toLowerCase();
  if (normalized.includes("asmt-10") || normalized.includes("scrutiny")) {
    return taxSystem === "INCOME_TAX"
      ? "Income Tax scrutiny notice"
      : "GST scrutiny / discrepancy notice";
  }
  if (normalized.includes("drc-01") || normalized.includes("show cause")) {
    return "GST show-cause / demand proceeding";
  }
  if (normalized.includes("reg-17") || normalized.includes("cancellation")) {
    return "GST registration cancellation notice";
  }
  if (normalized.includes("142(1)") || normalized.includes("268(1)")) {
    return "Income Tax information request";
  }
  if (normalized.includes("143(2)")) return "Income Tax scrutiny notice";
  if (normalized.includes("156") || normalized.includes("demand")) {
    return taxSystem === "GST"
      ? "GST demand notice"
      : "Income Tax demand notice";
  }
  return taxSystem === "GST"
    ? "GST notice"
    : taxSystem === "INCOME_TAX"
      ? "Income Tax notice"
      : "Tax notice";
}

function explainWhy(type: string, extracted: ExtractedNotice, knowledge: string): string {
  if (knowledge !== NOT_FOUND) {
    return `${knowledge} Based on this notice, the department appears to be asking for the action shown below.`;
  }
  if (extracted.requestedAction !== NOT_FOUND) {
    return `The notice states this requested action: ${extracted.requestedAction}`;
  }
  return insufficientInformation;
}

function buildSections(
  type: string,
  extracted: ExtractedNotice,
  matched: ReturnType<typeof retrieveKnowledge>,
): AnalysisSection[] {
  const primary = matched[0]?.summary ?? NOT_FOUND;
  const isDemand = /demand|show-cause/i.test(type);
  const isInfoRequest = /information|scrutiny/i.test(type);
  const details =
    extracted.amounts.some((amount) => amount !== NOT_FOUND) ||
    extracted.referenceNumber !== NOT_FOUND ||
    extracted.section !== NOT_FOUND
      ? "The values below are extracted from the uploaded notice. They are not independently verified."
      : NOT_FOUND;

  return [
    {
      key: "what",
      title: "What is this notice?",
      body: `${type}. ${primary}`,
      tone: "default",
    },
    {
      key: "why",
      title: "Why did you receive this?",
      body: explainWhy(type, extracted, primary),
      tone: "default",
    },
    {
      key: "meaning",
      title: "What does this mean?",
      body: isDemand
        ? "This appears to concern a tax, interest, penalty, or another amount described in the notice. Whether anything is presently payable depends on the document stage and the exact wording."
        : isInfoRequest
          ? "This appears to be a compliance or information step. It is not automatically a finding that you have done something wrong."
          : "Read the requested action and the dates in the notice together. This analysis explains the document; it does not decide disputed facts or legal validity.",
      tone: "default",
    },
    {
      key: "details",
      title: "Important details / amounts",
      body: details,
      tone: "default",
      bullets: [
        `Reference number: ${extracted.referenceNumber}`,
        `Section / rule: ${extracted.section}`,
        `Amounts: ${extracted.amounts.join(", ")}`,
        `Period: ${extracted.taxPeriod}`,
      ],
    },
    {
      key: "deadline",
      title: "Deadline",
      body:
        extracted.deadline === NOT_FOUND
          ? "The notice does not show a clear deadline that NoticeLens can verify."
          : extracted.deadline,
      tone: extracted.deadline === NOT_FOUND ? "warning" : "warning",
    },
    {
      key: "next-steps",
      title: "Your Next Steps",
      body:
        extracted.requestedAction === NOT_FOUND
          ? insufficientInformation
          : "Work through the exact request in the notice before the stated date. Keep a copy of your submission and proof of filing or payment.",
      tone: "action",
      bullets:
        extracted.requestedAction === NOT_FOUND
          ? [NOT_FOUND]
          : [extracted.requestedAction, "Check every requested item against the attached notice.", "Consider professional review for disputed amounts, limitation, or appeal rights."],
    },
    {
      key: "documents",
      title: "Documents You May Need",
      body:
        extracted.documents.length && extracted.documents[0] !== NOT_FOUND
          ? "The notice appears to refer to the following material:"
          : "No document list was reliably identified in the notice.",
      tone: "default",
      bullets: extracted.documents,
    },
    {
      key: "terms",
      title: "Understand the Terms",
      body:
        matched.length > 0
          ? "These explanations come from the supplied NoticeLens Knowledge Base and are kept separate from facts extracted from your notice."
          : insufficientInformation,
      tone: "muted",
    },
    {
      key: "ask",
      title: "Ask My Notice",
      body: "Ask a question about this notice. Answers are limited to the uploaded notice and the supplied NoticeLens Knowledge Base.",
      tone: "muted",
    },
  ];
}

function buildTerms(matched: ReturnType<typeof retrieveKnowledge>): AnalysisTerm[] {
  return matched.slice(0, 3).map((record) => ({
    term: record.title,
    explanation: record.summary,
  }));
}

export function analyzeNoticeContent(
  content: string,
  taxSystem: string,
): AnalysisPayload {
  const extracted = extractNotice(content);
  const noticeType = determineNoticeType(content, taxSystem);
  const matched = retrieveKnowledge(`${content} ${noticeType}`);
  const confidence =
    matched.length >= 2 && extracted.requestedAction !== NOT_FOUND
      ? "high"
      : matched.length > 0
        ? "medium"
        : "limited";

  return {
    noticeType,
    confidence,
    extracted,
    sections: buildSections(noticeType, extracted, matched),
    terms: buildTerms(matched),
  };
}

export function answerNoticeQuestion(
  question: string,
  content: string,
  taxSystem: string,
  payload: AnalysisPayload,
): { answer: string; groundedIn: string[] } {
  const normalized = question.toLowerCase();
  const matched = retrieveKnowledge(`${content} ${question} ${payload.noticeType}`);
  const sources = matched.map((record) => record.source);
  const extracted = payload.extracted;

  if (/(deadline|due|last date)/i.test(normalized)) {
    return {
      answer:
        extracted.deadline === NOT_FOUND
          ? insufficientInformation
          : `The deadline identified in this notice is ${extracted.deadline}. NoticeLens does not calculate a different deadline when the notice does not state one.`,
      groundedIn: sources.length ? sources : ["Current notice"],
    };
  }
  if (/(what.*do|next step|respond|reply|action)/i.test(normalized)) {
    return {
      answer:
        extracted.requestedAction === NOT_FOUND
          ? insufficientInformation
          : `The notice asks you to ${extracted.requestedAction}. Check the requested documents and preserve proof of your response.`,
      groundedIn: ["Current notice", ...sources],
    };
  }
  if (/(document|paper|need)/i.test(normalized)) {
    return {
      answer:
        extracted.documents[0] === NOT_FOUND
          ? insufficientInformation
          : `The notice appears to refer to: ${extracted.documents.join("; ")}`,
      groundedIn: ["Current notice", ...sources],
    };
  }
  if (/(section|term|mean|itc|scrutiny|demand|142|143|drc|asmt)/i.test(normalized)) {
    const record = matched[0] ?? getKnowledgeRecord("response-style");
    return {
      answer: record?.summary ?? insufficientInformation,
      groundedIn: record ? [record.source] : ["Current notice"],
    };
  }
  if (/(ignore|not respond|consequence)/i.test(normalized)) {
    return {
      answer:
        extracted.requestedAction === NOT_FOUND
          ? insufficientInformation
          : "Do not ignore an official notice that requires compliance. The actual consequence of not responding is stated only when supported by the notice and the applicable provision; this document analysis cannot determine more from the available text.",
      groundedIn: ["Current notice", ...sources],
    };
  }

  return {
    answer:
      matched[0]?.summary ??
      (content.trim() ? insufficientInformation : insufficientInformation),
    groundedIn: sources.length ? sources : ["Current notice"],
  };
}