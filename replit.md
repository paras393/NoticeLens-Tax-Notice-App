# NoticeLens

NoticeLens helps users understand Indian GST and Income Tax notices with deterministic, knowledge-base-grounded explanations and clear next steps.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/notice-lens` — mobile-first React/Vite app and RevenueCat Web SDK integration
- `artifacts/api-server` — Express API, private cookie-scoped notice routes, and deterministic analysis
- `lib/db/src/schema` — User, Notice, and Analysis Drizzle models
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `knowledge-base/noticelens_tax_knowledge_base.md` — user-supplied substantive reference library

## Architecture decisions

- The uploaded notice is the primary source for facts; the knowledge base is only used for explanations and term retrieval.
- Notice analysis intentionally uses deterministic extraction and retrieval; no live LLM is used.
- Notice files are not persisted as bytes; the API stores notice metadata, extracted content, and analysis JSON only.
- Anonymous signed session cookies isolate each browser's notice history without creating a local authentication system.

## Product

- Upload a GST or Income Tax notice, choose the tax system, and receive a structured analysis.
- Explore three fictional demos, ask grounded questions, and save/reopen/delete notice analyses.
- View live RevenueCat Test Store offering price, purchase, entitlement, and restore states for NoticeLens Plus.

## User preferences

- Keep all tax explanations grounded in the supplied NoticeLens Knowledge Base.
- Never invent missing facts, deadlines, rates, or legal conclusions.

## Gotchas

- If the notice and knowledge base are insufficient, use the product's exact insufficient-information message.
- Configure `VITE_REVENUECAT_PUBLIC_KEY` before expecting a live Plus offering.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
