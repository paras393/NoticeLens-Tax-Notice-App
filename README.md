# NoticeLens

NoticeLens helps people understand Indian GST and Income Tax notices with a simple, practical explanation of what the notice says and what to do next.

Tagline: **Understand your notice. Know your next step.**

## What is included

- PDF/JPG/JPEG/PNG upload flow with GST, Income Tax, or Not Sure classification
- Deterministic notice extraction and analysis using the supplied NoticeLens Knowledge Base
- Three fictional demos marked `DEMO — FICTIONAL DATA`
- Grounded Ask My Notice questions limited to the current notice and supplied knowledge
- Private, cookie-scoped history with reopen and delete
- Free + NoticeLens Plus purchase and restore states through RevenueCat Test Store
- Expandable PostgreSQL models for User, Notice, and Analysis

## Run

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/notice-lens run dev
```

The managed workflows provide the required `PORT` and `BASE_PATH` values.

## Configuration

Copy `.env.example` into the environment configuration. The RevenueCat Web SDK key is public and is read by the browser through `VITE_REVENUECAT_PUBLIC_KEY`.

RevenueCat configuration expected by the app:

- Entitlement: `notice_lens_plus`
- Offering: `default`
- Product: `notice_lens_plus_monthly`

## Safety boundary

NoticeLens does not use OpenAI, Gemini, Claude, or another live LLM. Notice facts are extracted from the uploaded document with deterministic rules. Tax explanations come only from `knowledge-base/noticelens_tax_knowledge_base.md`. When the available information is not enough, the app says so instead of guessing.

NoticeLens provides educational and informational assistance based on the uploaded document and referenced tax information. It does not replace advice from a qualified Chartered Accountant, tax professional or lawyer.