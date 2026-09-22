---
name: RevenueCat Test Store currency support
description: RevenueCat Test Store price configuration limits relevant to NoticeLens web subscriptions.
---

RevenueCat’s Test Store price endpoint currently rejects INR for NoticeLens product pricing, even though INR is a valid ISO 4217 code. The provider accepts only its supported Test Store currency set, so an exact ₹199 price cannot be represented there.

**Why:** The requested NoticeLens Plus price was rejected with a provider parameter error, while the same amount in USD was accepted.

**How to apply:** Do not silently substitute USD or hardcode ₹199 in the client. Treat the currency as an external RevenueCat configuration decision before claiming the subscription setup is complete.