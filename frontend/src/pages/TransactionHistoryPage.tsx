import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  RefreshCw,
  Search
} from 'lucide-react';
import { fetchPaymentHistory } from '../services/api';

interface HistoryProps {
  onNavigate: (page: string, params?: any) => void;
}

export const TransactionHistoryPage: React.FC<HistoryProps> = ({ onNavigate }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchPaymentHistory();
      if (res.success) {
        setTransactions(res.transactions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    return (
      (t.paypal_order_id && t.paypal_order_id.toLowerCase().includes(q)) ||
      (t.paypal_capture_id && t.paypal_capture_id.toLowerCase().includes(q)) ||
      (t.payer_email && t.payer_email.toLowerCase().includes(q)) ||
      (t.quote_number && t.quote_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-beige-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">Transaction Audit Ledger</h1>
          <p className="text-sm text-stone-600 mt-1">
            Cryptographically tracked payment records with official PayPal order & capture references.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-beige-100 border border-beige-300 text-xs text-stone-700 font-semibold shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      <div className="my-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, capture ID, or payer email..."
            className="w-full bg-white border border-beige-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-beige-500 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-500">Loading audit records...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/70 rounded-2xl border border-dashed border-beige-300 shadow-sm">
          <CreditCard className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800">No Transactions Found</h3>
          <p className="text-xs text-stone-500 mt-1">No payments match your query.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-beige-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-sand-100/70 font-semibold text-stone-600 uppercase tracking-wider border-b border-beige-200">
              <tr>
                <th className="px-6 py-4">PayPal Order ID</th>
                <th className="px-6 py-4">Capture ID</th>
                <th className="px-6 py-4">Quote Number</th>
                <th className="px-6 py-4">Payer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Captured At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-sand-50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-stone-900">
                    {t.paypal_order_id}
                  </td>
                  <td className="px-6 py-4 font-mono text-emerald-800 font-semibold">
                    {t.paypal_capture_id || '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-stone-600 font-medium">
                    {t.quote_number || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-stone-900 font-medium">{t.payer_name || 'Sandbox Customer'}</div>
                    <div className="text-[10px] text-stone-500">{t.payer_email || 'sb-user@dealflow.ai'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      t.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-stone-900">
                    ${(t.amount || 0).toFixed(2)} {t.currency}
                  </td>
                  <td className="px-6 py-4 text-stone-500">
                    {new Date(t.created_at).toLocaleString()}
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
