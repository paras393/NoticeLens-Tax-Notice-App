# NoticeLens

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

## Run locally

### Prerequisites

- Node.js 22 or compatible Node.js runtime
- pnpm
- PostgreSQL database
- A `DATABASE_URL` environment variable
- Optional RevenueCat Test Store configuration through `VITE_REVENUECAT_PUBLIC_KEY`

Install dependencies:

```bash
pnpm install
```

Set the required environment values using your local environment or Replit Secrets. Do not commit secrets:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
VITE_REVENUECAT_PUBLIC_KEY=your_public_revenuecat_web_key
```

Start the API server in one terminal:

```bash
pnpm --filter @workspace/api-server run dev
```

Start the frontend in another terminal:

```bash
pnpm --filter @workspace/notice-lens run dev
```

The managed Replit workflow supplies `PORT` and `BASE_PATH` when configured. The API server requires a reachable PostgreSQL database before it can start.

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

## Shipaton Next Gen submission

NoticeLens is prepared for the Next Gen submission format with a public source repository, an MIT open-source license, documented setup instructions, fictional demo data, and a working product walkthrough. The submission should include:

- A publicly accessible demo video shorter than two minutes on YouTube or Vimeo.
- This public repository URL.
- A clear description of what NoticeLens does and why it matters.
- A 1024 × 1024 app icon and portrait screenshot assets in `assets/` and `screenshots/`.
- Student eligibility and guardian consent information on Devpost when applicable.

The intended submission positioning is **Next Gen Award**, with a secondary social-impact story: helping ordinary taxpayers and small businesses understand intimidating notices and identify their next safe step.

## Submission assets

- App icon source: `assets/noticelens-icon.svg`
- App icon PNG: `assets/noticelens-icon-1024.png`
- Portrait product screenshot: `screenshots/noticelens-knowledge-base-1179x2556.png`

## License

This project is open source under the [MIT License](LICENSE).
