# PayPal AI Hackathon 2026 Submission Document
**Project Name**: DealFlow AI  
**Repository**: Public GitHub Repository with MIT License  
**Demo Video**: Public YouTube Video (< 3 Minutes)

---

## 1. Problem Statement
B2B procurement and sales workflows are plagued by friction:
1. Long quotation lag times (averaging 3-7 business days).
2. Disconnected invoicing processes disconnected from CRM and negotiation channels.
3. High payment drop-off rates due to manual PDF invoice remittance.

## 2. Solution: DealFlow AI
DealFlow AI is an autonomous sales intelligence platform that bridges conversational AI with official PayPal REST payment infrastructure:
- **Intelligent Discovery**: Clarifies client needs using natural language processing.
- **Strictly Grounded Proposals**: Recommends real items from a persistent SQLite catalogue with zero price hallucination.
- **Instant Official PayPal Checkout**: Automatically provisions Sandbox Orders v2 and guides customers through quick authorization.
- **Server-Side Security**: Captures orders on the server and synchronizes status with webhook event handlers.

## 3. PayPal Technologies & REST APIs Used
1. **OAuth 2.0 Client Credentials Grant** (`/v1/oauth2/token`): Authenticates API calls and utilizes in-memory token reuse with safety buffers.
2. **Orders API v2** (`/v2/checkout/orders`): Generates orders with intent `CAPTURE` and strict reference tracking.
3. **Capture API v2** (`/v2/checkout/orders/{id}/capture`): Executes server-side capture upon customer redirect.
4. **Webhooks API v1** (`/v1/notifications/verify-webhook-signature`): Idempotent asynchronous reconciliation and cryptographic signature verification.

## 4. AI Technology
- **Gemini API & Structured JSON Parsing**: Enforces `responseMimeType: 'application/json'` to guarantee that AI recommendations comply with Zod validation schemas.
- **Fail-Safe Offline Heuristics**: If no API key is provided, the platform gracefully switches to deterministic catalogue matching so hackathon judges can evaluate the system without credential blockers.

## 5. Security & Idempotency
- Zero-trust frontend amount enforcement.
- Client secret isolation.
- Duplicate capture prevention via SQLite database constraints.
- Cryptographic webhook validation.

