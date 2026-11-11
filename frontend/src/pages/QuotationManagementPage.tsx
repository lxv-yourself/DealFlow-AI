import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CreditCard
} from 'lucide-react';
import { fetchQuotes, approveQuote } from '../services/api';

interface QuotesProps {
  onNavigate: (page: string, params?: any) => void;
}

export const QuotationManagementPage: React.FC<QuotesProps> = ({ onNavigate }) => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuotes = async () => {
    try {
      const res = await fetchQuotes();
      if (res.success) {
        setQuotes(res.quotations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await approveQuote(id);
      if (res.success) {
        loadQuotes();
        onNavigate('checkout', { quoteId: id });
      }
    } catch (e) {
      alert('Error approving quote');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">PAID</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-beige-100 text-beige-900 border border-beige-300">APPROVED</span>;
      case 'checkout_created':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">CHECKOUT OPEN</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">DRAFT</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center pb-8 border-b border-beige-200">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">Quotation Management</h1>
          <p className="text-sm text-stone-600 mt-1">Review, approve, and track buyer quotations assembled by DealFlow AI.</p>
        </div>

        <button
          onClick={() => onNavigate('sales')}
          className="px-5 py-2.5 rounded-xl bg-beige-800 hover:bg-beige-700 font-semibold text-white text-sm shadow-sm transition"
        >
          Create New Quotation
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-500">Loading quotations...</div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-24 bg-white/70 rounded-2xl border border-dashed border-beige-300 mt-8 shadow-sm">
          <FileText className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800">No Quotations Found</h3>
          <p className="text-sm text-stone-500 mt-1">Generate your first quote using the AI Sales Assistant.</p>
          <button
            onClick={() => onNavigate('sales')}
            className="mt-6 px-6 py-2.5 rounded-xl bg-beige-800 hover:bg-beige-700 text-white font-medium text-sm shadow-sm transition"
          >
            Launch Assistant
          </button>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl bg-white border border-beige-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-sand-100/70 text-xs font-semibold text-stone-600 uppercase tracking-wider border-b border-beige-200">
              <tr>
                <th className="px-6 py-4">Quote Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-100">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-sand-50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-stone-900">
                    {q.quoteNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-stone-800">{q.customerName}</div>
                    <div className="text-xs text-stone-500">{q.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(q.status)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-stone-900">
                    ${q.totalAmount.toFixed(2)} USD
                  </td>
                  <td className="px-6 py-4 text-xs text-stone-500">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {q.status !== 'paid' && (
                      <button
                        onClick={() => handleApprove(q.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-beige-800 hover:bg-beige-700 font-semibold text-xs text-white transition shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay with PayPal</span>
                      </button>
                    )}
                    {q.status === 'paid' && (
                      <button
                        onClick={() => onNavigate('payment-result', { quoteId: q.id })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-beige-100 hover:bg-beige-200 border border-beige-300 text-xs text-emerald-800 font-medium transition"
                      >
                        <span>Receipt</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
