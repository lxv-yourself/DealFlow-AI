import { Request, Response } from 'express';
import { db } from '../db.js';
import { paypalService } from '../paypalService.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateQuotationTotals } from '../../../shared/calculations.js';

// Initiates a PayPal Sandbox Order based on verified DB quotation amount
export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const { quotationId, returnUrl, cancelUrl } = req.body;

    if (!quotationId) {
      return res.status(400).json({ success: false, error: 'Quotation ID is required' });
    }

    // 1. Fetch genuine Quotation from SQLite
    const quote = db.prepare('SELECT * FROM quotations WHERE id = ?').get(quotationId) as any;
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    if (quote.status === 'paid') {
      return res.status(400).json({ success: false, error: 'This quotation is already paid.' });
    }

    // 2. Fetch quotation items & re-verify calculations on server
    const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(quotationId) as any[];
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'Quotation has no items.' });
    }

    const reCalculated = calculateQuotationTotals(
      items.map(i => ({
        productId: i.product_id,
        sku: i.sku,
        productName: i.product_name,
        unitPrice: i.unit_price,
        quantity: i.quantity,
        discountPercent: i.discount_percent
      }))
    );

    const verifiedAmount = reCalculated.totalAmount;

    // 3. Check if PayPal is configured
    if (!paypalService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'PayPal Sandbox credentials not configured. Please supply PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in backend/.env',
        needsConfig: true
      });
    }

    // 4. Create PayPal Order
    const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
    const effectiveReturnUrl = returnUrl || `${clientBase}/payment/result?quoteId=${quote.id}`;
    const effectiveCancelUrl = cancelUrl || `${clientBase}/checkout/${quote.id}?cancelled=true`;

    const paypalOrder = await paypalService.createOrder({
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      amount: verifiedAmount,
      currency: quote.currency || 'USD',
      returnUrl: effectiveReturnUrl,
      cancelUrl: effectiveCancelUrl,
      items: items.map(i => ({
        name: i.product_name,
        unitPrice: i.unit_price,
        quantity: i.quantity,
        sku: i.sku
      }))
    });

    // 5. Update quotation with PayPal Order ID
    db.prepare(`
      UPDATE quotations
      SET paypal_order_id = ?, status = 'checkout_created', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(paypalOrder.orderId, quote.id);

    // Record initial pending payment entry
    db.prepare(`
      INSERT OR REPLACE INTO payments (id, quotation_id, paypal_order_id, amount, currency, status)
      VALUES (?, ?, ?, ?, ?, 'created')
    `).run(uuidv4(), quote.id, paypalOrder.orderId, verifiedAmount, quote.currency || 'USD');

    return res.json({
      success: true,
      orderId: paypalOrder.orderId,
      approvalUrl: paypalOrder.approvalUrl,
      amount: verifiedAmount,
      currency: quote.currency
    });
  } catch (err: any) {
    console.error('Checkout creation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Captures a PayPal Sandbox Order upon customer return from approval
export async function capturePayment(req: Request, res: Response) {
  try {
    const { orderId, quoteId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'PayPal order ID is required' });
    }

    // Verify existing payment or quotation status to prevent duplicate capture
    const existingPayment = db.prepare('SELECT * FROM payments WHERE paypal_order_id = ?').get(orderId) as any;
    if (existingPayment && existingPayment.status === 'completed') {
      return res.json({
        success: true,
        message: 'Order already captured previously',
        payment: existingPayment
      });
    }

    if (!paypalService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'PayPal credentials not configured'
      });
    }

    // Call PayPal REST API to capture the payment
    const captureResult = await paypalService.captureOrder(orderId);

    if (captureResult.status === 'COMPLETED') {
      const captureDetails = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
      const captureId = captureDetails?.id;
      const capturedAmount = parseFloat(captureDetails?.amount?.value || '0');
      const currency = captureDetails?.amount?.currency_code || 'USD';
      const payerEmail = captureResult.payer?.email_address;
      const payerName = `${captureResult.payer?.name?.given_name || ''} ${captureResult.payer?.name?.surname || ''}`.trim();
      const payerId = captureResult.payer?.payer_id;

      // Update Database in atomic transaction
      const recordPaymentTx = db.transaction(() => {
        // Update payment record
        db.prepare(`
          INSERT INTO payments (id, quotation_id, paypal_order_id, paypal_capture_id, amount, currency, status, payer_email, payer_name, payer_id, raw_response, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(paypal_order_id) DO UPDATE SET
            paypal_capture_id = excluded.paypal_capture_id,
            status = 'completed',
            amount = excluded.amount,
            payer_email = excluded.payer_email,
            payer_name = excluded.payer_name,
            payer_id = excluded.payer_id,
            raw_response = excluded.raw_response,
            updated_at = CURRENT_TIMESTAMP
        `).run(
          uuidv4(),
          quoteId || existingPayment?.quotation_id,
          orderId,
          captureId,
          capturedAmount,
          currency,
          payerEmail,
          payerName,
          payerId,
          JSON.stringify(captureResult)
        );

        // Mark quote as paid
        if (quoteId || existingPayment?.quotation_id) {
          db.prepare(`
            UPDATE quotations
            SET status = 'paid', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? OR paypal_order_id = ?
          `).run(quoteId || existingPayment?.quotation_id, orderId);
        }
      });

      recordPaymentTx();

      return res.json({
        success: true,
        status: 'COMPLETED',
        captureId,
        orderId,
        amount: capturedAmount,
        currency,
        payerEmail,
        payerName
      });
    } else {
      // Failed or pending status
      db.prepare(`
        UPDATE payments SET status = ?, raw_response = ?, updated_at = CURRENT_TIMESTAMP
        WHERE paypal_order_id = ?
      `).run(captureResult.status.toLowerCase(), JSON.stringify(captureResult), orderId);

      return res.status(400).json({
        success: false,
        status: captureResult.status,
        error: `PayPal order not completed. Current status: ${captureResult.status}`
      });
    }
  } catch (err: any) {
    console.error('Capture payment error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Webhook listener for asynchronous PayPal notifications
export async function handlePayPalWebhook(req: Request, res: Response) {
  try {
    const headers = req.headers;
    const body = req.body;

    const authAlgo = headers['paypal-auth-algo'] as string;
    const certUrl = headers['paypal-cert-url'] as string;
    const transmissionId = headers['paypal-transmission-id'] as string;
    const transmissionSig = headers['paypal-transmission-sig'] as string;
    const transmissionTime = headers['paypal-transmission-time'] as string;

    const isValid = await paypalService.verifyWebhookSignature({
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
      webhookEvent: body
    });

    if (!isValid) {
      console.warn('Invalid PayPal webhook signature received');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const eventId = body.id;
    const eventType = body.event_type;

    // Deduplication check
    const existing = db.prepare('SELECT id FROM webhook_events WHERE paypal_event_id = ?').get(eventId);
    if (existing) {
      return res.status(200).json({ status: 'already_processed' });
    }

    // Record webhook event in audit log
    db.prepare(`
      INSERT INTO webhook_events (id, event_type, paypal_event_id, resource_type, summary, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      eventType,
      eventId,
      body.resource_type || 'unknown',
      body.summary || '',
      JSON.stringify(body)
    );

    // React to relevant PayPal events
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = body.resource;
      const orderId = resource?.supplementary_data?.related_ids?.order_id;
      const captureId = resource?.id;
      const amount = parseFloat(resource?.amount?.value || '0');

      if (orderId) {
        db.prepare(`
          UPDATE payments
          SET status = 'completed', paypal_capture_id = ?, amount = ?, updated_at = CURRENT_TIMESTAMP
          WHERE paypal_order_id = ?
        `).run(captureId, amount, orderId);

        db.prepare(`
          UPDATE quotations
          SET status = 'paid', updated_at = CURRENT_TIMESTAMP
          WHERE paypal_order_id = ?
        `).run(orderId);
      }
    }

    return res.status(200).json({ status: 'received' });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Transaction history and verified analytics
export function getPaymentHistory(req: Request, res: Response) {
  try {
    const payments = db.prepare(`
      SELECT 
        p.*,
        q.quote_number,
        q.customer_name,
        q.customer_email
      FROM payments p
      LEFT JOIN quotations q ON p.quotation_id = q.id
      ORDER BY p.created_at DESC
    `).all() as any[];

    // Calculate executive metrics from genuine completed payments
    const verifiedPayments = payments.filter(p => p.status === 'completed');
    const totalRevenue = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalQuotesCount = (db.prepare('SELECT COUNT(*) as count FROM quotations').get() as any).count;
    const conversionRate = totalQuotesCount > 0 ? (verifiedPayments.length / totalQuotesCount) * 100 : 0;

    return res.json({
      success: true,
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalVerifiedPayments: verifiedPayments.length,
        totalQuotations: totalQuotesCount,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      transactions: payments
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

