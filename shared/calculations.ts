import { QuotationItem } from "./types";

export const DEFAULT_TAX_RATE = 0.08; // 8% standard tax rate

export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export interface QuoteCalculationResult {
  items: QuotationItem[];
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export function calculateQuotationTotals(
  rawItems: Array<{
    productId: string;
    sku: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    discountPercent?: number;
    notes?: string;
  }>,
  taxRate: number = DEFAULT_TAX_RATE
): QuoteCalculationResult {
  let subtotalAmount = 0;
  let totalDiscount = 0;
  let taxAmount = 0;

  const items: QuotationItem[] = rawItems.map((item) => {
    const qty = Math.max(1, Math.floor(item.quantity));
    const unitPrice = roundCurrency(Math.max(0, item.unitPrice));
    const discountPercent = Math.min(100, Math.max(0, item.discountPercent || 0));

    const lineRawSubtotal = roundCurrency(unitPrice * qty);
    const lineDiscount = roundCurrency((lineRawSubtotal * discountPercent) / 100);
    const lineSubtotal = roundCurrency(lineRawSubtotal - lineDiscount);
    const lineTax = roundCurrency(lineSubtotal * taxRate);
    const lineTotal = roundCurrency(lineSubtotal + lineTax);

    subtotalAmount = roundCurrency(subtotalAmount + lineSubtotal);
    totalDiscount = roundCurrency(totalDiscount + lineDiscount);
    taxAmount = roundCurrency(taxAmount + lineTax);

    return {
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      unitPrice,
      quantity: qty,
      discountPercent,
      subtotal: lineSubtotal,
      tax: lineTax,
      total: lineTotal,
      notes: item.notes
    };
  });

  const totalAmount = roundCurrency(subtotalAmount + taxAmount);

  return {
    items,
    subtotalAmount,
    taxAmount,
    discountAmount: totalDiscount,
    totalAmount
  };
}

