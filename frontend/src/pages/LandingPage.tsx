import React from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  BarChart3, 
  Lock, 
  Layers, 
  ChevronRight 
} from 'lucide-react';

interface LandingProps {
  onNavigate: (page: string, params?: any) => void;
}

export const LandingPage: React.FC<LandingProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-sand-50 text-stone-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 border-b border-beige-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-beige-200/50 via-beige-100/30 to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-beige-100 border border-beige-300 text-beige-800 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-beige-700" />
            <span>PayPal AI Hackathon 2026 Showcase</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 max-w-4xl leading-[1.18]">
            Autonomous B2B Sales Conversations to Instant{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-beige-700 via-amber-800 to-stone-900">
              PayPal Checkout
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl leading-relaxed">
            DealFlow AI replaces sluggish sales negotiation cycles. Conversational AI understands buyer requirements, matches live catalogue inventory, builds itemised quotes, and initiates genuine PayPal Sandbox payments in seconds.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 items-center">
            <button
              onClick={() => onNavigate('sales')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-beige-800 hover:bg-beige-700 font-semibold text-white shadow-md shadow-beige-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Bot className="w-5 h-5 text-beige-200" />
              <span>Launch AI Sales Assistant</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('catalogue')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-beige-50 border border-beige-300 text-stone-700 font-medium shadow-sm transition-all"
            >
              <span>Explore Product Catalogue</span>
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-beige-100/60 hover:bg-beige-100 border border-beige-300/80 text-stone-700 font-medium transition-all text-sm"
            >
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>Verified Revenue Dashboard</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-beige-200">
            <div className="p-4 rounded-xl bg-white/70 border border-beige-200 shadow-sm">
              <div className="text-3xl font-bold text-stone-900 tracking-tight">100%</div>
              <div className="text-xs text-stone-500 mt-1 font-medium">Grounded Product Pricing</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-beige-200 shadow-sm">
              <div className="text-3xl font-bold text-stone-900 tracking-tight">&lt; 3 Sec</div>
              <div className="text-xs text-stone-500 mt-1 font-medium">Itemised Quote Generation</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-beige-200 shadow-sm">
              <div className="text-3xl font-bold text-[#003087] tracking-tight">PayPal v2</div>
              <div className="text-xs text-stone-500 mt-1 font-medium">Official Orders & Webhook API</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-beige-200 shadow-sm">
              <div className="text-3xl font-bold text-emerald-700 tracking-tight">Idempotent</div>
              <div className="text-xs text-stone-500 mt-1 font-medium">Audit-Ready Ledger</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-beige-700">Architecture & Lifecycle</h2>
          <p className="mt-2 text-3xl font-extrabold text-stone-900">How DealFlow AI Closes Deals</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm hover:border-beige-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-beige-100 flex items-center justify-center text-beige-800 mb-5">
              <Bot className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-beige-700 font-bold mb-1">STEP 01</div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Natural Dialogue</h3>
            <p className="text-sm text-stone-600">Buyers describe needs, team size, and architectural limits. AI clarifies missing constraints.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm hover:border-beige-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 mb-5">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-amber-800 font-bold mb-1">STEP 02</div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Itemised Quotation</h3>
            <p className="text-sm text-stone-600">Backend strictly matches SQLite catalogue prices, calculates 8% tax, discounts, and yields a formal quote.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm hover:border-beige-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-[#003087]/10 flex items-center justify-center text-[#003087] mb-5">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-[#003087] font-bold mb-1">STEP 03</div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">PayPal Sandbox Order</h3>
            <p className="text-sm text-stone-600">Secure backend token exchange invokes PayPal Orders API v2. Customer completes sandbox authorization.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-beige-200 shadow-sm hover:border-beige-400 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-emerald-800 font-bold mb-1">STEP 04</div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Capture & Webhooks</h3>
            <p className="text-sm text-stone-600">Server captures payment, updates transactional SQLite ledger, verifies PayPal webhook signatures, and emits receipts.</p>
          </div>
        </div>
      </div>

      {/* Security Principles */}
      <div className="py-16 bg-beige-100/70 border-y border-beige-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4 p-5 rounded-2xl bg-white/80 border border-beige-200 shadow-sm">
              <div className="p-3 rounded-lg bg-beige-100 text-beige-800 h-fit">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-stone-900">Zero Trust Frontend Amounts</h4>
                <p className="mt-1 text-sm text-stone-600">Frontend never sets payment amounts. Backend verifies quotation integrity against database rows before PayPal order creation.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-white/80 border border-beige-200 shadow-sm">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-800 h-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-stone-900">Secret Isolation</h4>
                <p className="mt-1 text-sm text-stone-600">PAYPAL_CLIENT_SECRET remains solely on the backend. No credentials leaked to browser network bundles.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-white/80 border border-beige-200 shadow-sm">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-800 h-fit">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-stone-900">Idempotent Webhooks</h4>
                <p className="mt-1 text-sm text-stone-600">Deduplicated PayPal event handlers prevent double capture or replay attacks with cryptographic signature checks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-20 text-center max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-stone-900">Ready to test the interactive sales flow?</h2>
        <p className="mt-3 text-stone-600">Judge-friendly demo mode: try natural prompts, receive verified quotes, and experience real PayPal Sandbox checkout.</p>
        <button
          onClick={() => onNavigate('sales')}
          className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-beige-800 hover:bg-beige-700 text-white font-semibold text-base shadow-lg shadow-beige-900/10 transition"
        >
          <span>Start Interactive AI Demo</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
