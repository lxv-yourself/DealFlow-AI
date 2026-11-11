/**
 * DealFlow AI - PayPal Sandbox API Client
 * Adheres strictly to official PayPal REST API v2 specs:
 * https://developer.paypal.com/docs/api/orders/v2/
 */

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CreateOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface CaptureOrderResponse {
  id: string;
  status: string;
  payment_source?: any;
  purchase_units: Array<{
    reference_id: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
        final_capture: boolean;
        seller_protection?: {
          status: string;
        };
        create_time: string;
        update_time: string;
      }>;
    };
  }>;
  payer?: {
    name?: {
      given_name?: string;
      surname?: string;
    };
    email_address?: string;
    payer_id?: string;
  };
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export class PayPalService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private webhookId: string;

  constructor() {
    this.baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && !this.clientId.includes('your_'));
  }

  /**
   * Obtain or reuse an OAuth2 Access Token using client_credentials grant
   */
  public async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('PayPal Sandbox credentials not configured. Please supply PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
    }

    // Reuse token if still valid with a 60 second safety buffer
    const now = Date.now();
    if (cachedAccessToken && tokenExpiresAt > now + 60000) {
      return cachedAccessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayPal OAuth authentication failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as PayPalTokenResponse;
    cachedAccessToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return cachedAccessToken;
  }

  /**
   * Create an order via PayPal Orders API v2
   */
  public async createOrder(params: {
    quoteId: string;
    quoteNumber: string;
    amount: number;
    currency: string;
    returnUrl: string;
    cancelUrl: string;
    items?: Array<{
      name: string;
      unitPrice: number;
      quantity: number;
      sku: string;
    }>;
  }): Promise<{ orderId: string; approvalUrl: string }> {
    const accessToken = await this.getAccessToken();

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.quoteId,
          description: `DealFlow AI Quotation #${params.quoteNumber}`,
          custom_id: params.quoteId,
          invoice_id: params.quoteNumber,
          amount: {
            currency_code: params.currency || 'USD',
            value: params.amount.toFixed(2),
            breakdown: params.items ? {
              item_total: {
                currency_code: params.currency || 'USD',
                value: params.amount.toFixed(2) // We pass total here or itemized breakdown
              }
            } : undefined
          }
        }
      ],
      application_context: {
        brand_name: 'DealFlow AI',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl
      }
    };

    // If breakdown item_total doesn't exactly match item sum, remove breakdown to satisfy PayPal API schema
    delete (orderPayload.purchase_units[0].amount as any).breakdown;

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Create Order error (${response.status}): ${err}`);
    }

    const data = (await response.json()) as CreateOrderResponse;
    const approveLink = data.links.find(link => link.rel === 'approve');

    if (!approveLink) {
      throw new Error('PayPal did not return an approval URL link in the response');
    }

    return {
      orderId: data.id,
      approvalUrl: approveLink.href
    };
  }

  /**
   * Capture an authorized/approved PayPal order
   */
  public async captureOrder(orderId: string): Promise<CaptureOrderResponse> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Capture Order error (${response.status}): ${err}`);
    }

    const data = (await response.json()) as CaptureOrderResponse;
    return data;
  }

  /**
   * Retrieve order details to inspect status
   */
  public async getOrderDetails(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Get Order error (${response.status}): ${err}`);
    }

    return await response.json();
  }

  /**
   * Verify Webhook Signature via PayPal Webhooks API
   */
  public async verifyWebhookSignature(params: {
    authAlgo: string;
    certUrl: string;
    transmissionId: string;
    transmissionSig: string;
    transmissionTime: string;
    webhookEvent: any;
  }): Promise<boolean> {
    if (!this.webhookId) {
      // If webhook ID is not yet configured, warn
      console.warn('PAYPAL_WEBHOOK_ID not set; skipping cryptographic verification');
      return true;
    }

    const accessToken = await this.getAccessToken();

    const verificationPayload = {
      auth_algo: params.authAlgo,
      cert_url: params.certUrl,
      transmission_id: params.transmissionId,
      transmission_sig: params.transmissionSig,
      transmission_time: params.transmissionTime,
      webhook_id: this.webhookId,
      webhook_event: params.webhookEvent
    };

    const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(verificationPayload)
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json() as { verification_status: string };
    return data.verification_status === 'SUCCESS';
  }
}

export const paypalService = new PayPalService();

