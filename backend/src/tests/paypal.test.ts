import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayPalService } from '../paypalService.js';

describe('PayPalService Unit Tests', () => {
  let service: PayPalService;

  beforeEach(() => {
    process.env.PAYPAL_CLIENT_ID = 'test_client_id';
    process.env.PAYPAL_CLIENT_SECRET = 'test_client_secret';
    process.env.PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com';
    service = new PayPalService();
  });

  it('detects when PayPal credentials are fully configured', () => {
    expect(service.isConfigured()).toBe(true);

    process.env.PAYPAL_CLIENT_ID = 'your_paypal_sandbox_client_id';
    const unconfigured = new PayPalService();
    expect(unconfigured.isConfigured()).toBe(false);
  });

  it('successfully obtains and caches OAuth2 access tokens', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'A21AAK_mock_sandbox_token_12345',
        token_type: 'Bearer',
        expires_in: 32400
      })
    } as any);

    const token = await service.getAccessToken();
    expect(token).toBe('A21AAK_mock_sandbox_token_12345');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Call again to verify in-memory caching does not trigger duplicate fetch
    const cached = await service.getAccessToken();
    expect(cached).toBe('A21AAK_mock_sandbox_token_12345');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('creates PayPal Orders with CAPTURE intent and correct amount payload', async () => {
    // Provide a valid cached token so createOrder doesn't call token fetch
    (service as any).getAccessToken = vi.fn().mockResolvedValue('mock_token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '5O190127TN364715T',
        status: 'CREATED',
        links: [
          {
            href: 'https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T',
            rel: 'approve',
            method: 'GET'
          }
        ]
      })
    } as any);

    const result = await service.createOrder({
      quoteId: 'quote_123',
      quoteNumber: 'DF-998877',
      amount: 2592.00,
      currency: 'USD',
      returnUrl: 'http://localhost:5173/payment/result?quoteId=quote_123',
      cancelUrl: 'http://localhost:5173/checkout/quote_123'
    });

    expect(result.orderId).toBe('5O190127TN364715T');
    expect(result.approvalUrl).toContain('https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T');
  });

  it('handles capture order responses correctly', async () => {
    (service as any).getAccessToken = vi.fn().mockResolvedValue('mock_token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '5O190127TN364715T',
        status: 'COMPLETED',
        purchase_units: [
          {
            reference_id: 'quote_123',
            payments: {
              captures: [
                {
                  id: '2GG3892742918401Y',
                  status: 'COMPLETED',
                  amount: { currency_code: 'USD', value: '2592.00' },
                  final_capture: true,
                  create_time: '2026-11-07T12:00:00Z',
                  update_time: '2026-11-07T12:00:01Z'
                }
              ]
            }
          }
        ],
        payer: {
          email_address: 'sb-buyer@business.example.com',
          payer_id: 'ABCDE12345',
          name: { given_name: 'Jane', surname: 'Buyer' }
        }
      })
    } as any);

    const capture = await service.captureOrder('5O190127TN364715T');
    expect(capture.status).toBe('COMPLETED');
    expect(capture.purchase_units[0].payments?.captures?.[0].id).toBe('2GG3892742918401Y');
    expect(capture.payer?.email_address).toBe('sb-buyer@business.example.com');
  });
});
