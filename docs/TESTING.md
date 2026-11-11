# Testing & Quality Assurance — DealFlow AI

DealFlow AI includes comprehensive test suites spanning financial precision, API contract compliance, and database idempotency.

## Test Matrix

| Test Suite | File | Focus Areas |
|---|---|---|
| **Quotation Math & Schema** | `backend/src/tests/calculations.test.ts` | Currency rounding, 8% tax calculation, volume discounts, Zod schema validation |
| **PayPal REST API** | `backend/src/tests/paypal.test.ts` | OAuth token caching, Order creation payload, Capture response parsing |
| **Database Idempotency** | `backend/src/tests/idempotency.test.ts` | SQLite unique constraints, duplicate payment prevention, webhook deduplication |

## Running the Automated Tests
```bash
cd backend
npm test
```

## Running Build & Type Checks
```bash
# Backend TypeScript Check & Build
cd backend
npm run lint
npm run build

# Frontend TypeScript Check & Build
cd ../frontend
npm run build
```
All tests, type checks, and production bundles pass cleanly with zero warnings or errors.

