import { Request, Response } from 'express';
import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateQuotationTotals } from '../../../shared/calculations.js';
import { aiSalesService } from '../aiService.js';
import { paypalService } from '../paypalService.js';
import { Quotation, QuotationItem } from '../../../shared/types.js';

// Get all catalogue products
export function getProducts(req: Request, res: Response) {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY name ASC').all() as any[];
    const products = rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      category: r.category,
      description: r.description,
      unitPrice: r.unit_price,
      currency: r.currency,
      inventory: r.inventory,
      features: JSON.parse(r.features || '[]'),
      billingCycle: r.billing_cycle,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    return res.json({ success: true, products });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Conversation Dialogue & AI Sales Engine
export async function chatWithSalesAI(req: Request, res: Response) {
  try {
    const { conversationId, message, customerName, customerEmail } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A message string is required.' });
    }

    let convId = conversationId;
    if (!convId) {
      convId = `conv_${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO conversations (id, customer_name, customer_email)
        VALUES (?, ?, ?)
      `).run(convId, customerName || 'Valued Customer', customerEmail || 'customer@example.com');
    }

    // Persist incoming user message
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, 'user', ?)
    `).run(uuidv4(), convId, message);

    // Retrieve past history
    const pastMessages = db.prepare(`
      SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
    `).all(convId) as Array<{ role: 'user' | 'assistant'; content: string }>;

    // Consult AI Sales Service
    const aiProposal = await aiSalesService.processDialogue(message, {
      customerName,
      customerEmail,
      history: pastMessages
    });

    let generatedQuote: Quotation | null = null;

    // If proposed items are recommended, assemble a quotation backed by genuine DB records
    if (aiProposal.proposedItems && aiProposal.proposedItems.length > 0) {
      const productIds = aiProposal.proposedItems.map((i: { productId: string }) => i.productId);
      const placeholders = productIds.map(() => '?').join(',');
      const dbProducts = db.prepare(`SELECT * FROM products WHERE id IN (${placeholders})`).all(...productIds) as any[];

      const productMap = new Map(dbProducts.map(p => [p.id, p]));

      const rawItems = aiProposal.proposedItems.map((item: { productId: string; quantity: number }) => {
        const prod = productMap.get(item.productId);
        if (!prod) return null;
        return {
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          unitPrice: prod.unit_price,
          quantity: item.quantity
        };
      }).filter(Boolean) as any[];

      if (rawItems.length > 0) {
        const calculated = calculateQuotationTotals(rawItems);
        const quoteId = `quote_${uuidv4().substring(0, 8)}`;
        const quoteNumber = `DF-${Date.now().toString().slice(-6)}`;
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        const now = new Date().toISOString();

        // Transaction to insert quote & quotation_items
        const createQuoteTx = db.transaction(() => {
          db.prepare(`
            INSERT INTO quotations (
              id, quote_number, conversation_id, customer_name, customer_email, company_name,
              currency, subtotal_amount, tax_amount, discount_amount, total_amount,
              status, ai_reasoning, expires_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            quoteId,
            quoteNumber,
            convId,
            customerName || 'Valued Client',
            customerEmail || 'client@dealflow.ai',
            'DealFlow Partner',
            'USD',
            calculated.subtotalAmount,
            calculated.taxAmount,
            calculated.discountAmount,
            calculated.totalAmount,
            'draft',
            aiProposal.explanation,
            expiresAt,
            now,
            now
          );

          const insertItem = db.prepare(`
            INSERT INTO quotation_items (
              id, quotation_id, product_id, sku, product_name, unit_price, quantity,
              discount_percent, subtotal, tax, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const it of calculated.items) {
            insertItem.run(
              uuidv4(),
              quoteId,
              it.productId,
              it.sku,
              it.productName,
              it.unitPrice,
              it.quantity,
              it.discountPercent,
              it.subtotal,
              it.tax,
              it.total
            );
          }
        });

        createQuoteTx();

        generatedQuote = {
          id: quoteId,
          quoteNumber,
          customerName: customerName || 'Valued Client',
          customerEmail: customerEmail || 'client@dealflow.ai',
          companyName: 'DealFlow Partner',
          currency: 'USD',
          items: calculated.items,
          subtotalAmount: calculated.subtotalAmount,
          taxAmount: calculated.taxAmount,
          discountAmount: calculated.discountAmount,
          totalAmount: calculated.totalAmount,
          status: 'draft',
          aiReasoning: aiProposal.explanation,
          createdAt: now,
          updatedAt: now,
          expiresAt
        };
      }
    }

    // Persist assistant message
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, metadata)
      VALUES (?, ?, 'assistant', ?, ?)
    `).run(
      uuidv4(),
      convId,
      aiProposal.replyMessage,
      generatedQuote ? JSON.stringify({ quoteId: generatedQuote.id }) : null
    );

    return res.json({
      success: true,
      conversationId: convId,
      proposal: aiProposal,
      quote: generatedQuote
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Retrieve single quote with items
export function getQuoteById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const quote = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(id) as any[];

    return res.json({
      success: true,
      quotation: {
        id: quote.id,
        quoteNumber: quote.quote_number,
        customerName: quote.customer_name,
        customerEmail: quote.customer_email,
        companyName: quote.company_name,
        currency: quote.currency,
        subtotalAmount: quote.subtotal_amount,
        taxAmount: quote.tax_amount,
        discountAmount: quote.discount_amount,
        totalAmount: quote.total_amount,
        status: quote.status,
        aiReasoning: quote.ai_reasoning,
        customerNotes: quote.customer_notes,
        paypalOrderId: quote.paypal_order_id,
        createdAt: quote.created_at,
        updatedAt: quote.updated_at,
        expiresAt: quote.expires_at,
        items: items.map(i => ({
          productId: i.product_id,
          sku: i.sku,
          productName: i.product_name,
          unitPrice: i.unit_price,
          quantity: i.quantity,
          discountPercent: i.discount_percent,
          subtotal: i.subtotal,
          tax: i.tax,
          total: i.total,
          notes: i.notes
        }))
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// List all quotes
export function getAllQuotes(req: Request, res: Response) {
  try {
    const quotes = db.prepare('SELECT * FROM quotations ORDER BY created_at DESC').all() as any[];
    return res.json({
      success: true,
      quotations: quotes.map(q => ({
        id: q.id,
        quoteNumber: q.quote_number,
        customerName: q.customer_name,
        customerEmail: q.customer_email,
        totalAmount: q.total_amount,
        status: q.status,
        createdAt: q.created_at,
        expiresAt: q.expires_at
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Approve a quote and set to approved
export function approveQuote(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const quote = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    if (quote.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Quotation has already been paid.' });
    }

    db.prepare('UPDATE quotations SET status = "approved", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    return res.json({ success: true, message: 'Quotation approved successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
