import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock
} from 'lucide-react';
import { capturePaymentOrder, fetchQuoteById } from '../services/api';
import { Quotation } from '../../../shared/types';

interface PaymentResultProps {
  quoteId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const PaymentResultPage: React.FC<PaymentResultProps> = ({ quoteId, onNavigate }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  const [details, setDetails] = useState<any>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token'); // PayPal Sandbox order ID returned as token in redirect URL
    const cancelled = params.get('cancelled');
    const effectiveQuoteId = quoteId || params.get('quoteId');

    if (cancelled) {
      setStatus('cancelled');
      return;
    }

    async function process() {
      // If we have token (PayPal Order ID) returned in URL, trigger backend server-side capture
      if (token) {
        try {
          const capRes = await capturePaymentOrder({
            orderId: token,
            quoteId: effectiveQuoteId || undefined
          });

          if (capRes.success && capRes.status === 'COMPLETED') {
            setStatus('success');
            setDetails(capRes);
          } else {
            setStatus('failed');
            setErrorMessage(capRes.error || 'Payment capture could not be confirmed.');
          }
        } catch (e: any) {
          setStatus('failed');
          setErrorMessage(e.message || 'Capture failed');
        }
      }

      // Load quotation details if available
      if (effectiveQuoteId) {
        try {
          const qRes = await fetchQuoteById(effectiveQuoteId);
          if (qRes.success) {
            setQuotation(qRes.quotation);
            if (qRes.quotation.status === 'paid' && !token) {
              setStatus('success');
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (!token && (!effectiveQuoteId || quotation?.status !== 'paid')) {
        // If neither was provided, show status check
        setStatus(quotation?.status === 'paid' ? 'success' : 'loading');
      }
    }

    process();
  }, [quoteId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="p-8 rounded-3xl bg-white border border-beige-200 text-center shadow-sm">
        {status === 'loading' && (
          <div className="py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-beige-100 border border-beige-300 text-beige-800 mx-auto flex items-center justify-center animate-spin">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Verifying PayPal Capture</h2>
            <p className="text-sm text-stone-600">
              Backend is confirming PayPal Sandbox capture and updating cryptographic ledger...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                PAYMENT CONFIRMED
              </span>
              <h2 className="text-3xl font-extrabold text-stone-900 mt-3">Payment Successful</h2>
              <p className="text-sm text-stone-600 mt-1">
                Your transaction has been captured and validated via the PayPal REST API.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-5 rounded-2xl bg-sand-50 border border-beige-200 text-left space-y-3">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-beige-200">
                <span className="text-stone-500 font-medium">PayPal Capture ID</span>
                <span className="font-mono text-emerald-800 font-bold">
                  {details?.captureId || quotation?.paypalOrderId || '2GG-SB-CAPTURED'}
                </span>
              </div>

              {details?.orderId && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 font-medium">PayPal Order ID</span>
                  <span className="font-mono text-stone-800 font-semibold">{details.orderId}</span>
                </div>
              )}

              {details?.payerEmail && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 font-medium">Payer Sandbox Email</span>
                  <span className="text-stone-800">{details.payerEmail}</span>
                </div>
              )}

              {quotation && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 font-medium">Quotation Ref</span>
                  <span className="font-mono text-stone-800 font-semibold">#{quotation.quoteNumber}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm pt-3 border-t border-beige-200 font-bold">
                <span className="text-stone-800">Amount Captured</span>
                <span className="font-mono text-stone-900 text-base">
                  ${(details?.amount || quotation?.totalAmount || 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 py-3 px-4 rounded-xl bg-beige-800 hover:bg-beige-700 font-semibold text-white text-sm shadow-sm transition"
              >
                Go to Revenue Dashboard
              </button>
              <button
                onClick={() => onNavigate('history')}
                className="flex-1 py-3 px-4 rounded-xl bg-beige-100 hover:bg-beige-200 border border-beige-300 text-stone-800 font-semibold text-sm transition"
              >
                View Audit Ledger
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-300 text-rose-700 mx-auto flex items-center justify-center">
              <XCircle className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Payment Incomplete</h2>
            <p className="text-sm text-stone-600">{errorMessage || 'PayPal was unable to capture this transaction.'}</p>
            <button
              onClick={() => onNavigate('sales')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-beige-800 text-white font-medium text-sm shadow-sm"
            >
              Return to Sales Assistant
            </button>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-300 text-amber-700 mx-auto flex items-center justify-center">
              <Clock className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Checkout Cancelled</h2>
            <p className="text-sm text-stone-600">
              The PayPal Sandbox transaction was cancelled. No charges were made to your sandbox account.
            </p>
            <button
              onClick={() => onNavigate('quotes')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-beige-800 text-white font-medium text-sm shadow-sm"
            >
              Back to Quotations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
