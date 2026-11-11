# PayPal Integration Guide — DealFlow AI

This document outlines the official PayPal REST API implementation in DealFlow AI.

## 1. PayPal API Specifications Used
- **Base URL**: `https://api-m.sandbox.paypal.com`
- **Authentication**: OAuth 2.0 Client Credentials Grant (`/v1/oauth2/token`)
- **Orders API v2**:
  - `POST /v2/checkout/orders` with `intent: "CAPTURE"`
  - `POST /v2/checkout/orders/{id}/capture`
  - `GET /v2/checkout/orders/{id}`
- **Webhooks API v1**:
  - `POST /v1/notifications/verify-webhook-signature`

## 2. Token Lifecycle & In-Memory Caching
The `PayPalService` class checks whether a cached OAuth access token exists and remains valid for at least another 60 seconds. This avoids redundant HTTP handshakes and minimizes latency during high-frequency quote checks.

## 3. Order Creation Payload Structure
```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "quote_12345",
      "description": "DealFlow AI Quotation #DF-123456",
      "custom_id": "quote_12345",
      "invoice_id": "DF-123456",
      "amount": {
        "currency_code": "USD",
        "value": "2592.00"
      }
    }
  ],
  "application_context": {
    "brand_name": "DealFlow AI",
    "landing_page": "BILLING",
    "user_action": "PAY_NOW",
    "return_url": "http://localhost:5173/?page=payment-result&quoteId=quote_12345",
    "cancel_url": "http://localhost:5173/?page=checkout&quoteId=quote_12345&cancelled=true"
  }
}
```

## 4. Server-Side Order Capture Workflow
1. Customer is redirected to PayPal Sandbox and enters credentials.
2. Upon customer approval, PayPal redirects back to `return_url` with query parameter `token={PAYPAL_ORDER_ID}`.
3. The DealFlow AI frontend detects `token` and issues `POST /api/checkout/capture-order` to the backend.
4. The backend securely invokes `https://api-m.sandbox.paypal.com/v2/checkout/orders/{token}/capture`.
5. If status is `COMPLETED`, SQLite marks the quote status as `paid` and creates an audit record with `paypal_capture_id`, `amount`, and `payer_email`.
6. Frontend displays the verified receipt.

## 5. Webhook Event Verification
For asynchronous notifications (such as refunds or delayed settlements), DealFlow AI provides `/api/webhooks/paypal`.
The endpoint checks incoming headers (`paypal-auth-algo`, `paypal-cert-url`, `paypal-transmission-id`, `paypal-transmission-sig`, `paypal-transmission-time`) against PayPal's verification endpoint.
Verified events are stored in `webhook_events` with unique constraint enforcement on `paypal_event_id`.

