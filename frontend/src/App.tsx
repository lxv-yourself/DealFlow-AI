import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles,
} from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { SalesWorkspacePage } from './pages/SalesWorkspacePage';
import { CataloguePage } from './pages/CataloguePage';
import { QuotationManagementPage } from './pages/QuotationManagementPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { fetchHealth } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [pageParams, setPageParams] = useState<any>({});
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    // Read query params if any (e.g. from PayPal redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    const quoteId = urlParams.get('quoteId');

    if (pageParam) {
      setCurrentPage(pageParam);
      setPageParams({ quoteId });
    }

    async function checkHealth() {
      try {
        const h = await fetchHealth();
        setHealthStatus(h);
      } catch (e) {
        setHealthStatus({ status: 'offline' });
      }
    }
    checkHealth();
  }, []);

  const navigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-sand-50 text-stone-800 flex flex-col font-sans selection:bg-beige-300 selection:text-stone-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-beige-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            onClick={() => navigate('landing')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-beige-700 to-beige-500 flex items-center justify-center text-white shadow-md shadow-beige-700/20 group-hover:scale-105 transition">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-1.5">
                <span>DealFlow AI</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-beige-100 text-beige-800 border border-beige-300">
                  SANDBOX
                </span>
              </div>
              <div className="text-[10px] text-stone-500 font-medium -mt-0.5">
                PayPal AI Hackathon 2026
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => navigate('sales')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                currentPage === 'sales'
                  ? 'bg-beige-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-beige-100/70'
              }`}
            >
              AI Sales Assistant
            </button>
            <button
              onClick={() => navigate('catalogue')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                currentPage === 'catalogue'
                  ? 'bg-beige-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-beige-100/70'
              }`}
            >
              Catalogue
            </button>
            <button
              onClick={() => navigate('quotes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                currentPage === 'quotes'
                  ? 'bg-beige-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-beige-100/70'
              }`}
            >
              Quotations
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                currentPage === 'dashboard'
                  ? 'bg-beige-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-beige-100/70'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                currentPage === 'history'
                  ? 'bg-beige-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-beige-100/70'
              }`}
            >
              Audit Ledger
            </button>
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-beige-50 border border-beige-200 text-[11px] text-stone-600">
              <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'ok' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>Backend {healthStatus?.status === 'ok' ? 'Online' : 'Connecting...'}</span>
            </div>

            <button
              onClick={() => navigate('sales')}
              className="px-4 py-2 rounded-xl bg-beige-800 hover:bg-beige-700 font-semibold text-xs text-white shadow-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-beige-300" />
              <span>Try Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content Body */}
      <main className="flex-1">
        {currentPage === 'landing' && <LandingPage onNavigate={navigate} />}
        {currentPage === 'sales' && <SalesWorkspacePage onNavigate={navigate} />}
        {currentPage === 'catalogue' && <CataloguePage onNavigate={navigate} />}
        {currentPage === 'quotes' && <QuotationManagementPage onNavigate={navigate} />}
        {currentPage === 'checkout' && <CheckoutPage quoteId={pageParams.quoteId} onNavigate={navigate} />}
        {currentPage === 'payment-result' && <PaymentResultPage quoteId={pageParams.quoteId} onNavigate={navigate} />}
        {currentPage === 'dashboard' && <DashboardPage onNavigate={navigate} />}
        {currentPage === 'history' && <TransactionHistoryPage onNavigate={navigate} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-beige-200 py-8 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-semibold text-stone-700">DealFlow AI</span> — Autonomous Sales & PayPal Integration Platform.
          </div>
          <div className="flex items-center gap-4 text-stone-500">
            <span>PayPal AI Hackathon 2026</span>
            <span>•</span>
            <span>MIT License</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Sandbox Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
