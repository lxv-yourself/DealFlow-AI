import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  ExternalLink, 
  AlertCircle
} from 'lucide-react';
import { fetchQuoteById, createCheckoutSession } from '../services/api';
import { Quotation } from '../../../shared/types';

interface CheckoutProps {
  quoteId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const CheckoutPage: React.FC<CheckoutProps> = ({ quoteId, onNavigate }) => {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfig, setNeedsConfig] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchQuoteById(quoteId);
        if (res.success) {
          setQuotation(res.quotation);
        } else {
          setError(res.error || 'Failed to load quote');
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }
    if (quoteId) {
      load();
    }
  }, [quoteId]);

  const handlePayPalCheckout = async () => {
    if (!quotation) return;
    setSubmitting(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/?page=payment-result&quoteId=${quotation.id}`;
      const cancelUrl = `${window.location.origin}/?page=checkout&quoteId=${quotation.id}&cancelled=true`;

      const res = await createCheckoutSession({
        quotationId: quotation.id,
        returnUrl,
        cancelUrl
      });

      if (res.success && res.approvalUrl) {
        // Genuine official redirect to PayPal Sandbox Checkout
        window.location.href = res.approvalUrl;
      } else {
        if (res.needsConfig) {
          setNeedsConfig(true);
        }
        setError(res.error || 'Unable to initiate PayPal checkout');
      }
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-stone-500">Loading checkout order details...</div>;
  }

  if (!quotation) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-stone-900">Quotation Not Found</h2>
        <p className="text-sm text-stone-600 mt-2">{error || 'Unable to locate quotation ID.'}</p>
        <button
          onClick={() => onNavigate('sales')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-beige-800 text-white font-medium text-sm shadow-sm"
        >
          Return to Sales Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => onNavigate('quotes')}
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 mb-8 font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Quotation Management</span>
      </button>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Left: Summary */}
        <div className="md:col-span-3 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-beige-200">
              <div>
                <span className="text-xs text-stone-400 font-medium">Order Reference</span>
                <h2 className="text-lg font-bold text-stone-900 font-mono">{quotation.quoteNumber}</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-beige-100 text-beige-800 border border-beige-300 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Backend Verified</span>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Item Breakdown</span>
              {quotation.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div>
                    <div className="text-stone-900 font-medium">{item.productName}</div>
                    <div className="text-xs text-stone-500">
                      Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-mono text-stone-900 font-bold">
                    ${item.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-beige-200 space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-mono text-stone-900 font-medium">${quotation.subtotalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax (8%)</span>
                <span className="font-mono text-stone-900 font-medium">${quotation.taxAmount.toFixed(2)}</span>
              </div>
              {quotation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Volume Discount</span>
                  <span className="font-mono">-${quotation.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold text-stone-900 pt-2 border-t border-beige-200">
                <span>Total Due</span>
                <span className="font-mono text-stone-900">${quotation.totalAmount.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-beige-100/70 border border-beige-300 text-xs text-stone-700 flex gap-3 shadow-sm">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-900">Zero-Trust Payment Policy:</span> The final charge is calculated and locked on the backend SQLite engine. The frontend client does not submit or alter financial totals.
            </div>
          </div>
        </div>

        {/* Right: PayPal Sandbox Action */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#003087]/10 border border-[#003087]/20 flex items-center justify-center font-bold text-[#003087] text-xs">
                  PP
                </div>
                <h3 className="font-bold text-stone-900 text-base">PayPal Checkout</h3>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed mb-6">
                Pay quickly and securely using the official PayPal Sandbox Orders API. You will be redirected to PayPal Sandbox to authorize the order.
              </p>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 mb-6 shadow-sm">
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>PayPal Sandbox Notice</span>
                  </div>
                  {error}
                  {needsConfig && (
                    <div className="mt-2 text-[11px] text-stone-700 bg-white/80 p-2 rounded border border-rose-200">
                      To enable live PayPal Sandbox redirects, configure your sandbox credentials in <code className="text-beige-800 font-bold">backend/.env</code>:
                      <br/>PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handlePayPalCheckout}
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-[#FFC439] hover:bg-[#F4B41A] text-stone-900 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <CreditCard className="w-4 h-4" />
              <span>{submitting ? 'Connecting to PayPal...' : 'Pay with PayPal Sandbox'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white border border-beige-200 text-[11px] text-stone-600 space-y-1.5 shadow-sm">
            <div className="font-semibold text-stone-800">Sandbox Testing Details:</div>
            <div>• Environment: <code className="text-[#003087] font-semibold">api-m.sandbox.paypal.com</code></div>
            <div>• Buyer account: Use your PayPal Sandbox Personal account</div>
            <div>• Idempotency & server-side capture enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
};
