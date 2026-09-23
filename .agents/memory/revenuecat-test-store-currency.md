---
name: RevenueCat Test Store currency support
description: RevenueCat Test Store price configuration limits relevant to NoticeLens web subscriptions.
---

RevenueCat’s Test Store price endpoint rejects INR for NoticeLens product pricing, even though INR is a valid ISO 4217 code. The Test Store also permits only one USD price per product; changing that price requires replacing the development product and reattaching its relationships.

**Why:** INR was rejected by the provider, and adding a second USD price to the existing product returned a conflict. The approved development configuration uses USD 2.99.

**How to apply:** Do not retry INR or hardcode prices in the client. Treat RevenueCat’s returned formatted price as the UI source of truth; when the Test Store price must change, replace the development product only after the user approves the possible test-purchase reset.