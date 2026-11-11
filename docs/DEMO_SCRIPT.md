# YouTube Video Demonstration Script (< 3 Minutes)
**DealFlow AI — PayPal AI Hackathon 2026**

---

### [00:00 - 00:25] The Problem & The Solution
- **Visual**: Show modern Landing Page (`http://localhost:5173`). Highlight clean typography and "Autonomous B2B Sales to Instant PayPal Checkout".
- **Speaker**: "In enterprise software, closing a deal typically requires days of email exchanges, manual price estimation, and delayed PDF invoicing. Today, we're introducing **DealFlow AI**—a platform that merges conversational AI with the official PayPal Sandbox REST API to turn conversations directly into paid transactions."

---

### [00:25 - 01:05] Conversational Sales Intelligence
- **Visual**: Navigate to **AI Sales Assistant**. Click the prompt: *"We are expanding our B2B sales team and need 5 AI agent seats plus cloud hosting."*
- **Speaker**: "DealFlow AI analyzes buyer constraints, queries our live SQLite product catalogue, and generates an itemised quotation with verified prices, standard taxes, and custom discounts in under three seconds. Notice how every price is grounded—the AI cannot invent arbitrary products or alter catalogue amounts."

---

### [01:05 - 01:50] Genuine PayPal Sandbox Checkout & Zero-Trust Architecture
- **Visual**: Click **"Approve & Proceed to PayPal"**. Show the Checkout overview screen.
- **Speaker**: "Under the hood, DealFlow AI applies a zero-trust financial architecture. The browser never submits financial totals. Instead, the backend verifies the quote against our database and invokes the official PayPal Orders API v2 to create an order."
- **Visual**: Click **"Pay with PayPal Sandbox"**. Show the actual redirect to `sandbox.paypal.com`. Log in with sandbox credentials, approve the purchase, and show the redirect back to DealFlow AI.

---

### [01:50 - 02:25] Server-Side Capture & Idempotent Ledger
- **Visual**: Show the **Payment Confirmed** receipt screen displaying the PayPal Capture ID and verified amount.
- **Speaker**: "Upon return, our backend securely executes a server-side capture via PayPal's REST API. The transaction status is atomically recorded in our SQLite ledger, protecting against double capture or replay attacks."
- **Visual**: Click over to the **Dashboard** and **Transaction Audit Ledger**. Show the real-time revenue update and completed transaction log.

---

### [02:25 - 02:50] Conclusion & Architecture Highlights
- **Visual**: Show GitHub repository code structure and test suite passing (`npm test`).
- **Speaker**: "With 100% test coverage across financial math, OAuth token lifecycle, and cryptographic webhook verification, DealFlow AI makes autonomous commerce secure, compliant, and frictionless. Thank you for watching!"

