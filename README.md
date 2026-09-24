# NoticeLens

**Understand your notice. Know your next step.**

NoticeLens is a grounded workspace for Indian GST and Income Tax notices. It helps taxpayers, freelancers, and small businesses move from an intimidating government document to a clear explanation of what the notice says, what action it requests, and which date matters next.

## Why it matters

Tax notices are often difficult to interpret quickly, especially when the recipient does not have immediate access to a Chartered Accountant or tax lawyer. NoticeLens reduces confusion without pretending to replace professional advice. It extracts practical facts from a notice, explains supported terms in plain language, and clearly indicates when the available information is not enough.

## Core experience

1. Upload a PDF, JPG, JPEG, or PNG notice and select GST, Income Tax, or Not Sure.
2. NoticeLens extracts supported facts such as notice type, reference number, deadline, amount, requested action, and documents mentioned.
3. The app presents a structured notice brief with plain-language analysis and grounded next steps.
4. Ask My Notice answers questions using only the current notice and the supplied NoticeLens knowledge base.
5. Fictional demo notices provide a fast way to review the experience without uploading a personal document.
6. Private cookie-scoped history lets users reopen and delete saved notices.
7. NoticeLens Plus uses RevenueCat Test Store for the purchase and restore flow.

## What is technically distinctive

NoticeLens does not send uploaded notices to OpenAI, Gemini, Claude, or another live LLM. Notice facts are extracted with deterministic rules, and explanations come from the versioned NoticeLens knowledge base. This makes the product narrower, but easier to explain and safer to demonstrate: the app does not invent an answer when the available notice information is insufficient.

The repository contains a React/Vite frontend, an Express API server, shared workspace packages, deterministic document extraction, PostgreSQL models, and RevenueCat Web SDK integration. The analysis page separates the notice brief, evidence/extracted facts, plain-language terms, and grounded questions so the user can see what the product knows and what it does not claim.

## Demo path

For a fast review, open the Demo page and choose one of the three entries marked **DEMO — FICTIONAL DATA**. A strong walkthrough is:

1. Open a fictional GST or Income Tax notice.
2. Read the deadline and requested action in the notice brief.
3. Inspect the extracted facts and plain-language terms.
4. Ask a question in Ask My Notice.
5. Confirm that the answer is grounded in the current notice and knowledge base.
6. Open History to show the private archive.
7. Open Pricing to review the RevenueCat-powered Plus flow.

Use fictional demos for recordings unless you have explicit permission to show a real document. Never include real PAN, Aadhaar, bank, address, or tax identifiers in a public demo.

## RevenueCat configuration

RevenueCat is used for the NoticeLens Plus purchase and restore flow. The browser reads the public key from `VITE_REVENUECAT_PUBLIC_KEY`.

- Entitlement: `notice_lens_plus`
- Offering: `default`
- Product: `notice_lens_plus_monthly`

The app does not hardcode or invent a price; the displayed price is served by the current RevenueCat offering. The repository preserves loading, purchase, restore, entitlement, success, and error states for the integration.

## Safety boundary

NoticeLens provides educational and informational assistance based on the uploaded document and referenced tax information. It does not replace advice from a qualified Chartered Accountant, tax professional, or lawyer. When the available information is insufficient, the app says so instead of guessing.

## License

This project is open source under the [MIT License](LICENSE).
