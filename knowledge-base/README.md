# NoticeLens Knowledge Base

`noticelens_tax_knowledge_base.md` is the user-supplied substantive reference library for NoticeLens.

The API keeps deterministic retrieval records in `artifacts/api-server/src/lib/knowledge-base.ts`. Those records point back to the supplied sections and are used only to explain what is already present in the notice. They are not a second legal source.

Rules:

- Never invent a deadline, rate, threshold, amount, legal conclusion, or missing fact.
- Treat the uploaded notice as the source of notice facts.
- Keep law/reference knowledge, AI explanation, practical next step, and uncertainty separate.
- When the notice and this knowledge base are not enough, return the exact insufficient-information message used by the product.