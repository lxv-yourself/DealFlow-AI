import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './db.js';
import { AIQuoteProposal, AIQuoteProposalSchema, Product } from '../../shared/types.js';

export interface AISalesContext {
  customerName?: string;
  customerEmail?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class AISalesService {
  private client: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (apiKey && !apiKey.includes('your_')) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.client);
  }

  /**
   * Fetch current catalogue from database to supply grounded facts to AI
   */
  private getActiveProducts(): Product[] {
    const rows = db.prepare('SELECT * FROM products ORDER BY name ASC').all() as any[];
    return rows.map((r) => ({
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
  }

  /**
   * Process customer messages and determine product recommendations or quotations
   */
  public async processDialogue(
    userMessage: string,
    context: AISalesContext
  ): Promise<AIQuoteProposal> {
    const products = this.getActiveProducts();

    if (!this.isConfigured()) {
      // Deterministic graceful fallback if GEMINI_API_KEY is not set yet
      return this.heuristicFallback(userMessage, products);
    }

    const systemPrompt = `
You are DealFlow AI, a world-class enterprise B2B sales engineer and payment assistant for PayPal AI Hackathon 2026.
Your job is to assist prospective clients in selecting the best software, hardware, and integration services from the catalogue, explaining pricing with transparency, and assembling itemised quote proposals.

CRITICAL RULES:
1. ONLY recommend products that exist in the provided catalogue.
2. NEVER invent custom prices or fabricate products not in the database.
3. Every quotation must use database unit prices.
4. Output MUST STRICTLY follow the JSON structure specified below. Do not wrap in markdown or backticks.
5. If the user's intent is vague or lacks quantities or specific goals, set requiresMoreInfo: true and provide friendly clarifyingQuestions in the JSON.
6. If the user indicates they want to buy, deploy, or get a quotation, propose the appropriate product items with realistic quantities.

Catalogue Available:
${JSON.stringify(products.map(p => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  category: p.category,
  price: `$${p.unitPrice} (${p.billingCycle})`,
  description: p.description,
  features: p.features
})), null, 2)}

Required JSON Output Schema:
{
  "replyMessage": "Natural language response to the user explaining why these choices fit their needs",
  "explanation": "Detailed breakdown of the recommendation and how it fulfills their business requirements",
  "recommendedProductIds": ["prod_cloud_scale", "prod_ai_agent_seat"],
  "proposedItems": [
    { "productId": "prod_cloud_scale", "quantity": 1 },
    { "productId": "prod_ai_agent_seat", "quantity": 3 }
  ],
  "requiresMoreInfo": false,
  "clarifyingQuestions": []
}
`;

    try {
      const messagesFormatted = [
        ...context.history.map(h => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.content}`),
        `Customer: ${userMessage}`
      ].join('\n');

      const model = this.client!.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent(`${systemPrompt}\n\nConversation so far:\n${messagesFormatted}`);
      const response = await result.response;
      const responseText = response.text()?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      // Validate structured schema with Zod
      const validated = AIQuoteProposalSchema.parse(parsed);

      // Sanitize: ensure only valid product IDs are retained
      const validProductIds = new Set(products.map((p: Product) => p.id));
      validated.recommendedProductIds = validated.recommendedProductIds.filter((id: string) => validProductIds.has(id));
      if (validated.proposedItems) {
        validated.proposedItems = validated.proposedItems.filter((item: { productId: string; quantity: number }) => validProductIds.has(item.productId));
      }

      return validated;
    } catch (err: any) {
      console.error('Error invoking Gemini AI service:', err?.message || err);
      return this.heuristicFallback(userMessage, products);
    }
  }

  /**
   * Deterministic smart matcher when Gemini API key is not present or rate limited
   */
  private heuristicFallback(message: string, products: Product[]): AIQuoteProposal {
    const lower = message.toLowerCase();
    const recommended: string[] = [];
    const proposedItems: Array<{ productId: string; quantity: number }> = [];

    // Keyword heuristics
    if (lower.includes('cloud') || lower.includes('enterprise') || lower.includes('scale') || lower.includes('saas')) {
      recommended.push('prod_cloud_scale');
      proposedItems.push({ productId: 'prod_cloud_scale', quantity: 1 });
    }
    if (lower.includes('agent') || lower.includes('ai') || lower.includes('seat') || lower.includes('sales team') || lower.includes('rep')) {
      recommended.push('prod_ai_agent_seat');
      proposedItems.push({ productId: 'prod_ai_agent_seat', quantity: 3 });
    }
    if (lower.includes('pos') || lower.includes('hardware') || lower.includes('terminal') || lower.includes('qr') || lower.includes('store')) {
      recommended.push('prod_checkout_terminal');
      proposedItems.push({ productId: 'prod_checkout_terminal', quantity: 1 });
    }
    if (lower.includes('audit') || lower.includes('security') || lower.includes('compliance') || lower.includes('pci')) {
      recommended.push('prod_security_audit');
      proposedItems.push({ productId: 'prod_security_audit', quantity: 1 });
    }
    if (lower.includes('erp') || lower.includes('crm') || lower.includes('salesforce') || lower.includes('sync') || lower.includes('connect')) {
      recommended.push('prod_custom_connector');
      proposedItems.push({ productId: 'prod_custom_connector', quantity: 1 });
    }

    if (recommended.length === 0) {
      // Default to core cloud bundle
      recommended.push('prod_cloud_scale', 'prod_ai_agent_seat');
      proposedItems.push(
        { productId: 'prod_cloud_scale', quantity: 1 },
        { productId: 'prod_ai_agent_seat', quantity: 2 }
      );
    }

    return {
      replyMessage: `Based on your request "${message}", I have tailored an optimal configuration matching your requirements using the DealFlow product catalogue.`,
      explanation: 'This solution balances instant autonomous deployment with enterprise security and seamless PayPal checkout integration.',
      recommendedProductIds: recommended,
      proposedItems: proposedItems,
      requiresMoreInfo: false,
      clarifyingQuestions: []
    };
  }
}

export const aiSalesService = new AISalesService();
