# Judge Evaluation & Testing Guide — DealFlow AI
**PayPal AI Hackathon 2026**

Welcome to DealFlow AI. This guide was prepared specifically for hackathon judges to verify the end-to-end functionality of both the AI sales assistant and the official PayPal Sandbox integration.

---

## ⚡ 1-Minute Launch Instructions

```bash
# Terminal 1: Start Backend (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend (Port 5173)
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔍 How to Test Each Mandatory Hackathon Feature

### 1. Central AI Functionality (Natural Language Understanding & Grounded Quotations)
1. In the top navigation, click **"AI Sales Assistant"**.
2. Click any of the pre-set test prompts or type a custom request:
   - *"We are a 25-person team looking for 5 AI agent seats, enterprise cloud hosting, and an ERP live sync connector."*
3. **What to Observe**:
   - The assistant answers with reasoned business analysis.
   - It itemizes each SKU directly from the persistent SQLite database.
   - It computes 8% tax and grand totals using verified server-side math.
   - The AI **never hallucinates fake prices** or custom non-existent items.

### 2. Quotation Review & Approval
1. Under the generated quotation card, click **"Approve & Proceed to PayPal"** (or view it under the **"Quotations"** page).
2. The system transitions the quote status from `draft` to `approved`.

### 3. Official PayPal Sandbox Checkout
1. On the **Checkout** page, observe the order breakdown.
2. Click **"Pay with PayPal Sandbox"**.
3. *Note*: To complete the full redirect to PayPal, ensure `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are provided in `backend/.env`. If you do not have sandbox credentials handy, the application displays a clear configuration guide without crashing.
4. If configured with sandbox credentials, you are directed to `sandbox.paypal.com`. Enter your **PayPal Sandbox Personal Buyer** credentials and click **Complete Purchase**.

### 4. Server-Side Capture & Transaction Confirmation
1. PayPal redirects back to `http://localhost:5173/?page=payment-result&token={PAYPAL_ORDER_ID}`.
2. The backend captures the order on the server, verifies the capture status, and updates the SQLite database.
3. The screen displays the confirmed transaction receipt with the official **PayPal Capture ID**.

### 5. Verified Revenue Dashboard & Audit Ledger
1. Click **"Dashboard"** to see total verified revenue and conversion metrics updated in real-time.
2. Click **"Audit Ledger"** to inspect the audit log containing the PayPal Order ID, Capture ID, Payer Email, and timestamp.

---

## 🧪 Automated Test Verification
You can run the automated test suite directly in the terminal:
```bash
cd backend
npm test
```
All unit tests for financial calculations, PayPal OAuth caching, Order creation, and database idempotency pass with 100% success.

