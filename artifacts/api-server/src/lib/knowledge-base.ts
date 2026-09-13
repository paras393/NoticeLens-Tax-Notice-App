export type KnowledgeRecord = {
  id: string;
  title: string;
  keywords: string[];
  summary: string;
  source: string;
};

const records: KnowledgeRecord[] = [
  {
    id: "universal-extract-before-interpret",
    title: "Extract before interpreting",
    keywords: ["reference", "date", "section", "amount", "deadline", "document"],
    summary:
      "Extract the issuing authority, document type, notice/reference number, dates, year or period, cited provision, amounts, response or payment date, issues alleged, requested information, and stated consequences before interpreting a notice.",
    source: "NoticeLens Knowledge Base · A. Universal Notice-Analysis Rules",
  },
  {
    id: "gst-scrutiny",
    title: "GST scrutiny / ASMT-10 style notice",
    keywords: ["asmt-10", "scrutiny", "mismatch", "discrepancy", "reconciliation"],
    summary:
      "A GST scrutiny notice typically concerns a mismatch or discrepancy identified in return data. It may ask for an explanation, reconciliation, or payment if liability is admitted. The notice itself is not necessarily a final demand.",
    source: "NoticeLens Knowledge Base · D1. GST Scrutiny / ASMT-10 Style Notice",
  },
  {
    id: "gst-itc",
    title: "GST ITC notice",
    keywords: ["itc", "input tax credit", "gstr-2b", "purchase register", "supplier"],
    summary:
      "For an ITC notice, analyze the supplier data, tax period, ITC claimed, legal condition alleged, whether the issue is data-only or substantive, and invoice and payment evidence. A data mismatch alone is not proof of ineligibility.",
    source: "NoticeLens Knowledge Base · D4. GST ITC Notice",
  },
  {
    id: "gst-demand",
    title: "GST demand proceeding",
    keywords: ["drc-01", "demand", "show cause", "tax", "interest", "penalty", "hearing"],
    summary:
      "A GST demand proceeding can include the period, legal provision, tax, interest, penalty, grounds, response, and hearing. DRC-01 is a summary of a show-cause notice in relevant proceedings; DRC-07 records a summary of an order. Do not confuse the two.",
    source: "NoticeLens Knowledge Base · D2. GST SCN / DRC-01 Style Demand Proceeding",
  },
  {
    id: "gst-registration",
    title: "GST registration cancellation notice",
    keywords: ["reg-17", "registration", "cancellation", "non-filing", "revocation"],
    summary:
      "A registration cancellation notice may cite non-filing, business not conducted, fraud or misstatement, or another violation. The response should follow the notice context; do not advise surrender without seeing that context.",
    source: "NoticeLens Knowledge Base · D3. GST Registration Cancellation Notice",
  },
  {
    id: "income-tax-142",
    title: "Income Tax 142(1)-type notice",
    keywords: ["142(1)", "268(1)", "information", "bank statement", "books", "reconciliation"],
    summary:
      "An Income Tax 142(1)-type notice is generally an information or document request before assessment, not itself a demand. Map every department question to the requested data, source document, reconciliation, and explanation.",
    source: "NoticeLens Knowledge Base · D7. Income Tax 142(1)-Type Notice",
  },
  {
    id: "income-tax-143-2",
    title: "Income Tax scrutiny notice",
    keywords: ["143(2)", "scrutiny", "assessment", "questionnaire"],
    summary:
      "A scrutiny notice is used to verify the correctness and completeness of a return. Scrutiny selection does not by itself prove wrong income; the department can request evidence and reconciliation before assessment.",
    source: "NoticeLens Knowledge Base · D9. Income Tax 143(2)-Type Scrutiny",
  },
  {
    id: "income-tax-demand",
    title: "Income Tax demand",
    keywords: ["156", "demand", "refund", "outstanding", "payable"],
    summary:
      "An Income Tax demand communicates tax, interest, penalty, or another amount payable pursuant to an assessment or other order. Extract the demand amount, section or order reference, assessment year, due date, payment status, and whether appeal or stay exists.",
    source: "NoticeLens Knowledge Base · C20. Legacy S.156 Demand",
  },
  {
    id: "response-style",
    title: "Notice explanation response style",
    keywords: ["what", "why", "deadline", "ignore", "pay"],
    summary:
      "Name the notice type, state why it was issued based on the notice, identify the relevant provision, explain it simply, list the exact requested action or documents, state only verified dates or amounts, and mention what is not known.",
    source: "NoticeLens Knowledge Base · E. Response Style Knowledge",
  },
];

export const insufficientInformation =
  "I don't have enough information in this notice and the NoticeLens Knowledge Base to answer that reliably.";

export function retrieveKnowledge(text: string, limit = 4): KnowledgeRecord[] {
  const normalized = text.toLowerCase();
  return records
    .map((record) => ({
      record,
      score: record.keywords.reduce(
        (score, keyword) => score + (normalized.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ record }) => record);
}

export function getKnowledgeRecord(id: string): KnowledgeRecord | undefined {
  return records.find((record) => record.id === id);
}

export function allKnowledgeRecords(): KnowledgeRecord[] {
  return records;
}