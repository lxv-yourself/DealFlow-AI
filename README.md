# DealFlow AI — Autonomous Sales & PayPal Payment Platform
**PayPal AI Hackathon 2026 Official Submission**

DealFlow AI transforms enterprise B2B sales cycles by pairing conversational AI intelligence with the official **PayPal Sandbox REST API**. 

Instead of waiting days for back-and-forth sales rep emails and manual invoice generation, prospective buyers converse with an autonomous AI sales assistant that understands their requirements, matches real-time inventory from a database catalogue, generates transparent, itemised quotations with taxes and discounts, and generates real PayPal Sandbox checkouts for instant customer authorization and server-side capture.

---

## 🌟 Key Hackathon Highlights

1. **Official PayPal REST API Integration**:
   - OAuth 2.0 token generation & caching with safety buffers (`/v1/oauth2/token`).
   - Orders API v2: Create Order (`/v2/checkout/orders`) with intent `CAPTURE`.
   - Server-Side Capture (`/v2/checkout/orders/{id}/capture`).
   - Webhook Signature Cryptographic Verification (`/v1/notifications/verify-webhook-signature`).
   - Strict Zero-Trust Architecture: Frontend amounts are never trusted; the SQLite engine verifies quote item calculations prior to checkout.
2. **Central, Grounded AI Sales Engine**:
   - Driven by Gemini API with structured JSON output enforcement (`responseMimeType: 'application/json'`).
   - Deterministic grounding: The AI cannot hallucinate non-existent products or arbitrary prices. Every line item is validated against SQLite catalogue records.
3. **Audit-Ready & Idempotent Database**:
   - Built on persistent SQLite with WAL mode, foreign keys, and unique constraint idempotency.
   - Webhook and payment event deduplication to defend against replay and double-capture attacks.

---

## 🏗️ Architecture & Flow

```
[Buyer / Judge] ──> [React 18 + Tailwind UI]
                           │
                 1. Natural Language Requirements
                           ▼
                 [Express API Server] ───> [Gemini AI Engine]
                           │                      │
             2. Matches SQLite Products          3. Structured Proposal
                           ▼
                  [Quotation Engine] (Computes 8% Tax, Line Items, Discounts)
                           │
             4. Buyer Approves Quotation
                           ▼
                 [PayPal Service] ───> [PayPal Sandbox Orders API v2]
                           │
             5. Customer Redirected to PayPal Sandbox
                           ▼
             6. Customer Approves Payment
                           ▼
        7. [Backend Captures Order & Verifies Status]
                           ▼
     8. [SQLite Ledger Updated & Receipt Generated]
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js v20+ or v24
- npm v10+
- (Optional) PayPal Sandbox Account & Gemini API Key

### 1. Clone & Setup Workspace
```bash
git clone https://github.com/your-username/dealflow-ai.git
cd dealflow-ai
```

### 2. Configure Environment Variables
Copy the example environment template into both root and `backend/.env`:
```bash
cp .env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PayPal Sandbox Credentials (from developer.paypal.com)
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# AI Provider Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

*(Note: If no Gemini API key is provided, DealFlow AI automatically activates an intelligent deterministic sales heuristic to ensure the demo is 100% testable by judges offline).*

### 3. Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 4. Run the Application
In terminal 1 (Backend):
```bash
cd backend
npm run dev
# or npm run build && npm start
```

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing

All quotation math, PayPal client authentication, order creation, capture responses, and database idempotency are thoroughly covered with automated unit tests using Vitest.

To run all tests:
```bash
cd backend
npm test
```

Test coverage includes:
- `src/tests/calculations.test.ts`: Rounding accuracy, 8% tax calculation, volume discounts, Zod schema validation.
- `src/tests/paypal.test.ts`: Token caching, OAuth client credentials, PayPal Order creation payload, Capture response handling.
- `src/tests/idempotency.test.ts`: Unique order constraints, duplicate capture prevention, webhook deduplication.

---

## 💳 PayPal Sandbox Judge Testing Instructions

Judges can test the complete end-to-end payment lifecycle:
1. Open the application at `http://localhost:5173` and click **"Launch AI Sales Assistant"**.
2. Select one of the quick test prompts (e.g., *"We need 5 AI agent seats plus cloud hosting"*).
3. The AI reviews requirements and outputs an itemised quotation with live database pricing.
4. Click **"Approve & Proceed to PayPal"**.
5. On the checkout screen, review the backend-verified total and click **"Pay with PayPal Sandbox"**.
6. Log in with your **PayPal Sandbox Personal Buyer** credentials and click **Complete Purchase**.
7. PayPal redirects back to DealFlow AI; the backend automatically triggers the server-side capture, validates the captured amount, and issues an official transaction receipt.
8. Check the **Dashboard** and **Audit Ledger** pages to see real-time revenue updates.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).

