import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  CheckCircle, 
  FileText, 
  ArrowRight, 
  Info
} from 'lucide-react';
import { sendSalesChatMessage, approveQuote } from '../services/api';
import { Quotation } from '../../../shared/types';

interface SalesWorkspaceProps {
  onNavigate: (page: string, params?: any) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  quote?: Quotation;
  explanation?: string;
}

const SAMPLE_PROMPTS = [
  "We are expanding our B2B sales team and need 5 AI agent seats plus cloud hosting.",
  "We need a complete omni-channel setup: POS Edge Gateway and an ERP live sync connector.",
  "Can you quote a full enterprise package with PayPal security audit and high-availability cloud?"
];

export const SalesWorkspacePage: React.FC<SalesWorkspaceProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: "Hello! I'm DealFlow AI, your dedicated sales and payment engineering assistant. How can I help equip your team today? Feel free to describe your requirements, infrastructure scale, or custom integration needs.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Quotation | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const response = await sendSalesChatMessage({
        conversationId,
        message: textToSend,
        customerName: 'Demo Buyer',
        customerEmail: 'buyer.sandbox@dealflow.ai'
      });

      if (response.success) {
        if (!conversationId) setConversationId(response.conversationId);

        const assistantMsg: Message = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: response.proposal.replyMessage,
          explanation: response.proposal.explanation,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quote: response.quote || undefined
        };

        setMessages(prev => [...prev, assistantMsg]);
        if (response.quote) {
          setActiveQuote(response.quote);
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `Error: ${response.error || 'Failed to process response'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to connect to the backend server. Please verify backend is running on port 5000.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndPay = async (quoteId: string) => {
    setApprovalLoading(true);
    try {
      const res = await approveQuote(quoteId);
      if (res.success) {
        onNavigate('checkout', { quoteId });
      }
    } catch (e) {
      alert('Failed to approve quotation.');
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-sand-50 text-stone-800 flex flex-col lg:flex-row">
      {/* Left Column: Chat Dialogue Area */}
      <div className="flex-1 flex flex-col border-r border-beige-200 h-[calc(100vh-4rem)] bg-white/40">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-beige-200 bg-white/80 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-beige-100 border border-beige-300 flex items-center justify-center text-beige-800 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 text-sm">DealFlow AI Sales Engineer</div>
              <div className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Grounded in SQLite Live Catalogue
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('catalogue')}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-beige-100 hover:bg-beige-200 border border-beige-300 text-stone-700 font-medium transition"
          >
            View Products
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-beige-800 text-white' : 'bg-beige-100 text-beige-800 border border-beige-300'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-3 max-w-[85%]">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-beige-800 text-white rounded-tr-none'
                    : 'bg-white border border-beige-200 text-stone-800 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.explanation && (
                  <div className="p-3.5 rounded-xl bg-beige-100/70 border border-beige-300 text-xs text-stone-700 flex gap-2 shadow-sm">
                    <Info className="w-4 h-4 shrink-0 text-beige-700 mt-0.5" />
                    <div>
                      <div className="font-semibold text-stone-900">AI Recommendation Context</div>
                      <div className="mt-0.5 text-stone-600 leading-relaxed">{msg.explanation}</div>
                    </div>
                  </div>
                )}

                {msg.quote && (
                  <div className="p-5 rounded-2xl bg-white border border-beige-300 shadow-md">
                    <div className="flex items-center justify-between pb-3 border-b border-beige-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-beige-700" />
                        <span className="font-bold text-sm text-stone-900">Quotation #{msg.quote.quoteNumber}</span>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
                        {msg.quote.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="py-3 space-y-2">
                      {msg.quote.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-stone-700">{it.quantity}x {it.productName}</span>
                          <span className="font-mono text-stone-900 font-semibold">${it.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-beige-200 flex justify-between items-center text-sm">
                      <span className="text-stone-500 font-medium">Total (inc. tax):</span>
                      <span className="font-bold text-stone-900 text-base">${msg.quote.totalAmount.toFixed(2)} USD</span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleApproveAndPay(msg.quote!.id)}
                        disabled={approvalLoading}
                        className="flex-1 py-2 px-3 rounded-lg bg-beige-800 hover:bg-beige-700 font-semibold text-white text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve & Proceed to PayPal</span>
                      </button>
                      <button
                        onClick={() => onNavigate('quote-detail', { id: msg.quote!.id })}
                        className="py-2 px-3 rounded-lg bg-beige-100 hover:bg-beige-200 text-stone-700 text-xs font-medium border border-beige-300 transition"
                      >
                        Inspect Details
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-stone-400 px-1">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-stone-500 text-xs py-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-beige-300 flex items-center justify-center text-beige-700 animate-spin shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>DealFlow AI is analyzing constraints and checking catalogue pricing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pill Container */}
        {messages.length <= 2 && (
          <div className="px-6 py-2">
            <div className="text-xs text-stone-500 font-medium mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-beige-700" />
              <span>Judge Test Prompts:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-xs bg-white hover:bg-beige-100 border border-beige-200 text-stone-700 py-1.5 px-3 rounded-lg transition text-left shadow-sm"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4 border-t border-beige-200 bg-white/80 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recommendations, specify agent seats, or ask to purchase..."
              disabled={loading}
              className="flex-1 bg-white border border-beige-300 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-beige-500 shadow-sm transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-xl bg-beige-800 hover:bg-beige-700 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Live Quotation Preview Drawer */}
      <div className="w-full lg:w-96 p-6 bg-sand-100/60 border-l border-beige-200 overflow-y-auto">
        <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-beige-700" />
          <span>Active Quotation Session</span>
        </h3>

        {activeQuote ? (
          <div className="p-5 rounded-2xl bg-white border border-beige-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-stone-400 font-medium">Quote ID</span>
                <div className="font-mono text-sm font-bold text-stone-900">{activeQuote.quoteNumber}</div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                {activeQuote.status.toUpperCase()}
              </span>
            </div>

            <div className="border-t border-beige-200 pt-3 space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Line Items</span>
              {activeQuote.items.map((it, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-beige-50/70 border border-beige-200">
                  <div className="text-xs font-medium text-stone-800">{it.productName}</div>
                  <div className="flex justify-between text-[11px] text-stone-500 mt-1">
                    <span>{it.quantity} × ${it.unitPrice.toFixed(2)}</span>
                    <span className="font-mono text-stone-900 font-bold">${it.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-beige-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-mono text-stone-900 font-medium">${activeQuote.subtotalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax (8% standard)</span>
                <span className="font-mono text-stone-900 font-medium">${activeQuote.taxAmount.toFixed(2)}</span>
              </div>
              {activeQuote.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Special Discount</span>
                  <span className="font-mono">-${activeQuote.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-beige-200">
                <span>Total Due</span>
                <span className="font-mono text-stone-900">${activeQuote.totalAmount.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={() => handleApproveAndPay(activeQuote.id)}
              disabled={approvalLoading}
              className="w-full py-3 rounded-xl bg-beige-800 hover:bg-beige-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Proceed to PayPal Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/70 border border-dashed border-beige-300 text-center shadow-sm">
            <FileText className="w-8 h-8 text-stone-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-stone-700">No Active Quote Yet</div>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Describe your software or hardware requirements to DealFlow AI in the chat to generate an itemised quotation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
