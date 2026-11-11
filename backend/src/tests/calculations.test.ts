import { describe, it, expect } from 'vitest';
import { calculateQuotationTotals, roundCurrency } from '../../../shared/calculations';
import { AIQuoteProposalSchema, QuotationSchema } from '../../../shared/types';

describe('Quotation Calculations & Math Integrity', () => {
  it('correctly rounds currency values to 2 decimal places', () => {
    expect(roundCurrency(19.999)).toBe(20);
    expect(roundCurrency(12.344)).toBe(12.34);
    expect(roundCurrency(12.345)).toBe(12.35);
  });

  it('calculates quotation item totals, 8% tax, and grand totals accurately', () => {
    const rawItems = [
      {
        productId: 'prod_cloud_scale',
        sku: 'DF-CLOUD-SCALE',
        productName: 'DealFlow Cloud Enterprise (Annual)',
        unitPrice: 2400.00,
        quantity: 1,
        discountPercent: 10 // 10% discount -> $2160
      },
      {
        productId: 'prod_ai_agent_seat',
        sku: 'DF-SEAT-PRO',
        productName: 'DealFlow AI Sales Agent Seat',
        unitPrice: 120.00,
        quantity: 2,
        discountPercent: 0 // -> $240
      }
    ];

    const result = calculateQuotationTotals(rawItems, 0.08);

    // Subtotal: 2160 + 240 = 2400
    expect(result.subtotalAmount).toBe(2400.00);
    // Discount amount: 240
    expect(result.discountAmount).toBe(240.00);
    // Tax: 2400 * 0.08 = 192.00
    expect(result.taxAmount).toBe(192.00);
    // Total: 2400 + 192 = 2592.00
    expect(result.totalAmount).toBe(2592.00);

    // Verify itemized calculations
    expect(result.items[0].subtotal).toBe(2160.00);
    expect(result.items[0].tax).toBe(172.80);
    expect(result.items[0].total).toBe(2332.80);

    expect(result.items[1].subtotal).toBe(240.00);
    expect(result.items[1].tax).toBe(19.20);
    expect(result.items[1].total).toBe(259.20);
  });

  it('validates AI quote proposal schema against invalid payload structures', () => {
    const validProposal = {
      replyMessage: "Here is your customized quotation",
      explanation: "Includes high availability cloud instance and 3 agent seats",
      recommendedProductIds: ["prod_cloud_scale", "prod_ai_agent_seat"],
      proposedItems: [
        { productId: "prod_cloud_scale", quantity: 1 },
        { productId: "prod_ai_agent_seat", quantity: 3 }
      ],
      requiresMoreInfo: false,
      clarifyingQuestions: []
    };

    const parsed = AIQuoteProposalSchema.safeParse(validProposal);
    expect(parsed.success).toBe(true);

    const invalidProposal = {
      replyMessage: "Invalid missing proposed items",
      // missing required fields
    };
    const failed = AIQuoteProposalSchema.safeParse(invalidProposal);
    expect(failed.success).toBe(false);
  });
});
