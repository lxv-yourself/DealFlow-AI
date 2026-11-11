import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  CreditCard,
  ArrowUpRight
} from 'lucide-react';
import { fetchPaymentHistory } from '../services/api';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchPaymentHistory();
        if (res.success) {
          setData(res);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = data?.metrics || {
    totalRevenue: 0,
    totalVerifiedPayments: 0,
    totalQuotations: 0,
    conversionRate: 0
  };

  const transactions = data?.transactions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-beige-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">Executive Sales & Revenue</h1>
          <p className="text-sm text-stone-600 mt-1">
            Real-time analytics strictly verified against PayPal capture records and SQLite database entries.
          </p>
        </div>

        <button
          onClick={() => onNavigate('sales')}
          className="px-5 py-2.5 rounded-xl bg-beige-800 hover:bg-beige-700 font-semibold text-white text-sm shadow-sm transition"
        >
          New Sales Simulation
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm">
          <div className="flex justify-between items-center text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900 font-mono">
            ${metrics.totalRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-emerald-800 mt-2 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official PayPal Captures Only</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm">
          <div className="flex justify-between items-center text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Payments</span>
            <CreditCard className="w-4 h-4 text-[#003087]" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900 font-mono">
            {metrics.totalVerifiedPayments}
          </div>
          <div className="text-xs text-stone-500 mt-2">
            Audited in database ledger
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm">
          <div className="flex justify-between items-center text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quotations Created</span>
            <FileText className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900 font-mono">
            {metrics.totalQuotations}
          </div>
          <div className="text-xs text-stone-500 mt-2">
            Assembled by DealFlow AI
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm">
          <div className="flex justify-between items-center text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quote Conversion</span>
            <TrendingUp className="w-4 h-4 text-beige-700" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900 font-mono">
            {metrics.conversionRate}%
          </div>
          <div className="text-xs text-stone-500 mt-2">
            Quotations converted to payment
          </div>
        </div>
      </div>

      {/* Recent Verified Transactions Table */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-stone-900">Recent Transactions</h2>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-beige-800 hover:text-beige-900 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-beige-200 overflow-hidden shadow-sm">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-stone-500 text-sm">
              No payments captured yet. Create a quote and test the PayPal checkout!
            </div>
          ) : (
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-sand-100/70 text-xs font-semibold text-stone-600 uppercase tracking-wider border-b border-beige-200">
                <tr>
                  <th className="px-6 py-4">PayPal Order ID</th>
                  <th className="px-6 py-4">Quote Ref</th>
                  <th className="px-6 py-4">Payer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-100">
                {transactions.slice(0, 5).map((t: any) => (
                  <tr key={t.id} className="hover:bg-sand-50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-stone-900 text-xs">
                      {t.paypal_order_id}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-stone-500">
                      {t.quote_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-700">
                      {t.payer_email || t.customer_email || 'Sandbox Buyer'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-stone-900">
                      ${(t.amount || 0).toFixed(2)} USD
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
