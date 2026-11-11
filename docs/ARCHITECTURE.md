# System Architecture — DealFlow AI

## 1. Overview
DealFlow AI is an end-to-end autonomous sales intelligence platform designed to connect conversational natural-language deal making with verifiable transaction execution via PayPal.

## 2. Monorepo Organization
- `backend/`: Node.js + Express API in TypeScript. Manages SQLite database persistence, Gemini API communication, and the PayPal REST API client.
- `frontend/`: React 18 + Vite + Tailwind CSS application featuring responsive design, chat interfaces, quotation previews, and real-time ledger dashboards.
- `shared/`: Source of truth for Zod schemas (`types.ts`) and pure quotation computation functions (`calculations.ts`). Ensures financial calculations are strictly isomorphic between client display and server enforcement.
- `docs/`: Comprehensive documentation and submission guides for judges.

## 3. Security Architecture
- **Zero-Trust Financial Calculations**: The client never sends financial amounts to the server during payment requests. Instead, the client sends only the `quotationId`. The backend retrieves the quote, recalculates taxes and discounts from the database, and creates the PayPal order with that verified total.
- **Secret Isolation**: `PAYPAL_CLIENT_SECRET` and `GEMINI_API_KEY` are isolated to backend environment variables.
- **Idempotency & Replay Defense**:
  - The `payments` table enforces `UNIQUE(paypal_order_id)`.
  - The `webhook_events` table enforces `UNIQUE(paypal_event_id)` to ensure repeated notifications are ignored.
  - Server-side capture prevents repeated authorizations.

## 4. Grounded AI Strategy
The AI assistant cannot invent arbitrary SKUs or fictional prices. The backend passes the current active product catalogue from SQLite into the system prompt. Gemini is constrained to output structured JSON with `responseMimeType: 'application/json'`. If an invalid product ID is returned, the backend sanitizer filters it out before assembling the quote.

