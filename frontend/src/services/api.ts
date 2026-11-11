export const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  return res.json();
}

export async function sendSalesChatMessage(params: {
  conversationId?: string;
  message: string;
  customerName?: string;
  customerEmail?: string;
}) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function fetchQuotes() {
  const res = await fetch(`${API_BASE}/quotes`);
  return res.json();
}

export async function fetchQuoteById(id: string) {
  const res = await fetch(`${API_BASE}/quotes/${id}`);
  return res.json();
}

export async function approveQuote(id: string) {
  const res = await fetch(`${API_BASE}/quotes/${id}/approve`, {
    method: 'POST'
  });
  return res.json();
}

export async function createCheckoutSession(params: {
  quotationId: string;
  returnUrl?: string;
  cancelUrl?: string;
}) {
  const res = await fetch(`${API_BASE}/checkout/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function capturePaymentOrder(params: {
  orderId: string;
  quoteId?: string;
}) {
  const res = await fetch(`${API_BASE}/checkout/capture-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function fetchPaymentHistory() {
  const res = await fetch(`${API_BASE}/payments/history`);
  return res.json();
}

