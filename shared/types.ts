import { z } from "zod";

// Product Schema
export const ProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  unitPrice: z.number().positive(),
  currency: z.string().default("USD"),
  inventory: z.number().int().nonnegative(),
  features: z.array(z.string()).default([]),
  billingCycle: z.enum(["one_time", "monthly", "annually"]).default("one_time"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Product = z.infer<typeof ProductSchema>;

// Quotation Item Schema
export const QuotationItemSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  productName: z.string(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  notes: z.string().optional()
});

export type QuotationItem = z.infer<typeof QuotationItemSchema>;

// Quotation Status
export const QuotationStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "checkout_created",
  "paid",
  "cancelled",
  "expired"
]);

export type QuotationStatus = z.infer<typeof QuotationStatusSchema>;

// Quotation Schema
export const QuotationSchema = z.object({
  id: z.string(),
  quoteNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  companyName: z.string().optional(),
  currency: z.string().default("USD"),
  items: z.array(QuotationItemSchema).min(1),
  subtotalAmount: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().positive(),
  status: QuotationStatusSchema,
  aiReasoning: z.string().optional(),
  customerNotes: z.string().optional(),
  paypalOrderId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string()
});

export type Quotation = z.infer<typeof QuotationSchema>;

// Payment Status
export const PaymentStatusSchema = z.enum([
  "created",
  "approved",
  "completed",
  "failed",
  "cancelled",
  "refunded"
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// Payment Record Schema
export const PaymentRecordSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  paypalOrderId: z.string(),
  paypalCaptureId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  status: PaymentStatusSchema,
  payerEmail: z.string().optional(),
  payerName: z.string().optional(),
  payerId: z.string().optional(),
  createTime: z.string(),
  updateTime: z.string().optional(),
  rawCaptureResponse: z.string().optional()
});

export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;

// Conversation Message
export const ConversationMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.string(),
  structuredQuote: QuotationSchema.optional()
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

// AI Quote Proposal schema (AI output parsing)
export const AIQuoteProposalSchema = z.object({
  replyMessage: z.string(),
  explanation: z.string(),
  recommendedProductIds: z.array(z.string()),
  proposedItems: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive()
    })
  ).optional(),
  requiresMoreInfo: z.boolean().default(false),
  clarifyingQuestions: z.array(z.string()).optional()
});

export type AIQuoteProposal = z.infer<typeof AIQuoteProposalSchema>;

