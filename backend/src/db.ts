import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'dealflow.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const rawDb = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
rawDb.exec('PRAGMA journal_mode = WAL;');
rawDb.exec('PRAGMA foreign_keys = ON;');

/**
 * Clean wrapper mimicking standard prepared statement API:
 * .prepare(sql).all(...params)
 * .prepare(sql).get(...params)
 * .prepare(sql).run(...params)
 * .exec(sql)
 * .transaction(fn)
 */
export const db = {
  exec(sql: string) {
    return rawDb.exec(sql);
  },
  prepare(sql: string) {
    const stmt = rawDb.prepare(sql);
    return {
      all(...params: any[]) {
        return stmt.all(...params);
      },
      get(...params: any[]) {
        return stmt.get(...params);
      },
      run(...params: any[]) {
        return stmt.run(...params);
      }
    };
  },
  transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      rawDb.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT;');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK;');
        throw err;
      }
    }) as T;
  }
};

export function initializeDatabase() {
  db.exec(`
    -- Products Table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      unit_price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      inventory INTEGER NOT NULL DEFAULT 100,
      features TEXT NOT NULL DEFAULT '[]',
      billing_cycle TEXT NOT NULL DEFAULT 'one_time',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Conversations Table
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      customer_name TEXT,
      customer_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Messages Table
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    -- Quotations Table
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quote_number TEXT UNIQUE NOT NULL,
      conversation_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      company_name TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      subtotal_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      ai_reasoning TEXT,
      customer_notes TEXT,
      paypal_order_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
    );

    -- Quotation Items Table
    CREATE TABLE IF NOT EXISTS quotation_items (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      discount_percent REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Payments Table (Audit-friendly, idempotent)
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL,
      paypal_order_id TEXT UNIQUE NOT NULL,
      paypal_capture_id TEXT UNIQUE,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'created',
      payer_email TEXT,
      payer_name TEXT,
      payer_id TEXT,
      raw_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id)
    );

    -- Webhook Events (for duplicate prevention and audit logging)
    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      paypal_event_id TEXT UNIQUE NOT NULL,
      resource_type TEXT NOT NULL,
      summary TEXT,
      payload TEXT NOT NULL,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'processed'
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
    CREATE INDEX IF NOT EXISTS idx_quotations_paypal_order ON quotations(paypal_order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_quotation ON payments(quotation_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(paypal_order_id);
  `);

  // Seed default demonstration products if empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (countRow.count === 0) {
    seedDemoProducts();
  }
}

export function seedDemoProducts() {
  const insert = db.prepare(`
    INSERT INTO products (id, sku, name, category, description, unit_price, currency, inventory, features, billing_cycle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoProducts = [
    {
      id: 'prod_cloud_scale',
      sku: 'DF-CLOUD-SCALE',
      name: 'DealFlow Cloud Enterprise (Annual)',
      category: 'Software & Cloud',
      description: 'Unified high-availability sales automation cloud cluster with multi-region backup and SOC2 compliance.',
      unit_price: 2400.00,
      currency: 'USD',
      inventory: 50,
      features: JSON.stringify(['99.99% SLA uptime', 'Unlimited AI quote generations', 'Dedicated VPC', '24/7 Priority Support']),
      billing_cycle: 'annually'
    },
    {
      id: 'prod_ai_agent_seat',
      sku: 'DF-SEAT-PRO',
      name: 'DealFlow AI Sales Agent Seat',
      category: 'Software & Cloud',
      description: 'Dedicated autonomous sales intelligence seat with real-time deal negotiations, dynamic discounts, and CRM sync.',
      unit_price: 120.00,
      currency: 'USD',
      inventory: 500,
      features: JSON.stringify(['Gemini AI engine integrated', 'Real-time PayPal checkout generation', 'Multi-currency quoting']),
      billing_cycle: 'monthly'
    },
    {
      id: 'prod_checkout_terminal',
      sku: 'DF-TERM-EDGE',
      name: 'DealFlow POS Edge Gateway',
      category: 'Hardware',
      description: 'Secure on-premise hardware appliance for instant contactless PayPal QR and omni-channel transaction reconciliation.',
      unit_price: 499.00,
      currency: 'USD',
      inventory: 75,
      features: JSON.stringify(['High-speed thermal receipt printer sync', 'PayPal QR scanner built-in', 'End-to-end encrypted storage']),
      billing_cycle: 'one_time'
    },
    {
      id: 'prod_security_audit',
      sku: 'DF-SEC-AUDIT',
      name: 'PayPal Integration & Security Audit',
      category: 'Professional Services',
      description: 'Comprehensive white-glove security verification, PCI-DSS gap analysis, and PayPal webhook validation service.',
      unit_price: 1500.00,
      currency: 'USD',
      inventory: 20,
      features: JSON.stringify(['Automated pen-test report', 'Webhook idempotent verification setup', 'Direct architect consultation']),
      billing_cycle: 'one_time'
    },
    {
      id: 'prod_custom_connector',
      sku: 'DF-ERP-CONN',
      name: 'Enterprise ERP / CRM Live Sync Connector',
      category: 'Integration Add-ons',
      description: 'Plug-and-play middleware bridging SAP, Salesforce, and NetSuite directly to DealFlow quotes and PayPal transaction logs.',
      unit_price: 850.00,
      currency: 'USD',
      inventory: 100,
      features: JSON.stringify(['Sub-second bi-directional sync', 'Automated reconciliation journal', 'Webhook retry queue']),
      billing_cycle: 'one_time'
    }
  ];

  const insertMany = db.transaction((products: typeof demoProducts) => {
    for (const p of products) {
      insert.run(
        p.id,
        p.sku,
        p.name,
        p.category,
        p.description,
        p.unit_price,
        p.currency,
        p.inventory,
        p.features,
        p.billing_cycle
      );
    }
  });

  insertMany(demoProducts);
}
