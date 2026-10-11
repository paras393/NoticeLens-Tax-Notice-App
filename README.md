# NoticeLens

**Understand your notice. Know your next step.**

NoticeLens is a grounded workspace for Indian GST and Income Tax notices. It helps taxpayers, freelancers, and small businesses move from an intimidating government document to a clear explanation of what the notice says, what action it requests, and which date matters next.

## Why it matters

Tax notices are often difficult to interpret quickly, especially when the recipient does not have immediate access to a Chartered Accountant or tax lawyer. NoticeLens reduces confusion without pretending to replace professional advice. It extracts practical facts from a notice, explains supported terms in plain language, and clearly indicates when the available information is not enough.

## Why is NoticeLens more useful than a general AI assistant?

**NoticeLens is built specifically to help people understand GST and Income Tax notices.** Instead of giving a broad chatbot experience, it focuses on one important document and explains what the recipient needs to understand and review.

### 1. Focused and grounded answers

NoticeLens reads the uploaded notice together with a specialized tax-notice reference library. This keeps the explanation connected to the actual document and relevant tax concepts instead of relying only on broad general knowledge.

This reduces the risk of irrelevant or unsupported answers. If an important date, amount, section, or requested action is not present in the notice, NoticeLens indicates that it was not found instead of filling the gap with an assumption.

### 2. No prompt-writing or AI knowledge required

Many people do not know how to write a detailed prompt or ask a general AI assistant the right tax question. They may not know which part of the notice is important or what they should ask first.

NoticeLens gives them a structured explanation in plain language:

- What the notice is about
- Why they may have received it
- What the notice means
- What the department appears to be asking for
- What deadline or amount is mentioned
- Which documents may be needed

The user can understand the notice without first learning how to communicate with an AI assistant.

### 3. Converts a long notice into practical next information

A tax notice is not only difficult because of its language. It can also contain important dates, amounts, sections, document requirements, and response instructions across different parts of the document.

NoticeLens brings these practical details together in one readable brief. It highlights the response deadline, requested action, amounts, documents, and reference details so the user can quickly understand what requires attention.

This makes NoticeLens more than a general question-answering tool. It acts as a focused reading layer that helps a person move from:

> “I received a notice, but I do not understand it”

to:

> “I understand why I received it, what it means, what information is available, and what I need to review next.”

NoticeLens does not replace a tax professional or decide legal validity. It helps the user understand the document before taking the appropriate next step.

## Post-submission updates

After the original submission, we continued improving the interface and user experience. These updates include a clearer notice-meaning summary, a simplified extracted-details section, collapsible explanations, and Plus-gated Ask My Notice and officer-message features.

These improvements were made after the original submission and are shared for transparency. The submitted video and entry represent the version submitted before the deadline.


## Run locally

Requirements: Node.js 22+ and pnpm. Local mode uses in-memory storage; data resets when the API process stops.

```bash
pnpm install
cp .env.example .env
```

Start the API and frontend in separate terminals:

```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
PORT=4173 BASE_PATH=/ pnpm --filter @workspace/notice-lens run dev
```

Open `http://localhost:4173`. The frontend development server proxies `/api` requests to the API on port 5000.

### Or use the hosted demo

You can either run NoticeLens locally using the steps above or open the [hosted demo](https://notice-lens-tax-notice-app--rahul5556.replit.app) directly in a browser.

## Core experience

1. Upload a PDF, JPG, JPEG, or PNG notice and select GST, Income Tax, or Not Sure.
2. NoticeLens extracts supported facts such as notice type, reference number, deadline, amount, requested action, and documents mentioned.
3. The app presents a structured notice brief with plain-language analysis and grounded next steps.
4. Ask My Notice answers questions using only the current notice and the supplied NoticeLens knowledge base.
5. Fictional demo notices provide a fast way to review the experience without uploading a personal document.
6. Private cookie-scoped history lets users reopen and delete saved notices.

## Demo path

For a fast review, open the Demo page and choose one of the three entries marked **DEMO — FICTIONAL DATA**. A strong walkthrough is:

1. Open a fictional GST or Income Tax notice.
2. Read the deadline and requested action in the notice brief.
3. Inspect the extracted facts and plain-language terms.
4. Ask a question in Ask My Notice.
5. Confirm that the answer is grounded in the current notice and knowledge base.
6. Open History to show the private archive.

## Safety boundary

NoticeLens provides educational and informational assistance based on the uploaded document and referenced tax information. It does not replace advice from a qualified Chartered Accountant, tax professional, or lawyer. When the available information is insufficient, the app says so instead of guessing.

## License

This project is open source under the [MIT License](LICENSE).

For persistent deployment storage, set `DATABASE_URL` and remove `NOTICE_LENS_DB=memory` from the environment before starting the API. PostgreSQL mode remains available for deployed environments.
