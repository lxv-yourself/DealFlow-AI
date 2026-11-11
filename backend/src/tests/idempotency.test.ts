import { describe, it, expect, beforeEach } from 'vitest';
import { db, initializeDatabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

describe('Payment Idempotency & Database Integrity Tests', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  it('prevents duplicate payment records for identical PayPal Order IDs', () => {
    const quoteId = `quote_test_${uuidv4().substring(0, 6)}`;
    const quoteNumber = `DF-TEST-${uuidv4().substring(0, 8)}`;
    const paypalOrderId = `PP-ORDER-${Date.now()}`;

    // Create a dummy quote first to satisfy foreign key
    db.prepare(`
      INSERT INTO quotations (id, quote_number, customer_name, customer_email, subtotal_amount, tax_amount, total_amount, status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?)
    `).run(quoteId, quoteNumber, 'Test User', 'test@example.com', 100, 8, 108, new Date().toISOString());

    // Insert first payment
    db.prepare(`
      INSERT INTO payments (id, quotation_id, paypal_order_id, amount, currency, status)
      VALUES (?, ?, ?, ?, 'USD', 'created')
    `).run(uuidv4(), quoteId, paypalOrderId, 108);

    // Attempting duplicate insert with same paypal_order_id must violate UNIQUE constraint
    expect(() => {
      db.prepare(`
        INSERT INTO payments (id, quotation_id, paypal_order_id, amount, currency, status)
        VALUES (?, ?, ?, ?, 'USD', 'created')
      `).run(uuidv4(), quoteId, paypalOrderId, 108);
    }).toThrow();
  });

  it('records webhook events idempotently using paypal_event_id deduplication', () => {
    const eventId = `WH-EVT-${uuidv4()}`;

    // First webhook event insertion
    db.prepare(`
      INSERT INTO webhook_events (id, event_type, paypal_event_id, resource_type, summary, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'PAYMENT.CAPTURE.COMPLETED', eventId, 'capture', 'Payment captured', '{}');

    // Duplicate webhook should throw UNIQUE constraint error
    expect(() => {
      db.prepare(`
        INSERT INTO webhook_events (id, event_type, paypal_event_id, resource_type, summary, payload)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'PAYMENT.CAPTURE.COMPLETED', eventId, 'capture', 'Payment captured', '{}');
    }).toThrow();
  });
});
