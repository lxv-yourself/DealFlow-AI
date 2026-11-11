import React, { useState, useEffect } from 'react';
import { Search, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { fetchProducts } from '../services/api';
import { Product } from '../../../shared/types';

interface CatalogueProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CataloguePage: React.FC<CatalogueProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchProducts();
        if (res.success) {
          setProducts(res.products);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.description.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-beige-200">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">Live Product Catalogue</h1>
          <p className="text-sm text-stone-600 mt-1">
            Genuine enterprise offerings with strictly verified unit pricing and database persistence.
          </p>
        </div>

        <button
          onClick={() => onNavigate('sales')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-beige-800 hover:bg-beige-700 font-medium text-white text-sm shadow-sm transition"
        >
          <span>Ask AI Sales Assistant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 my-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or keyword..."
            className="w-full bg-white border border-beige-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-beige-500 shadow-sm transition"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                selectedCategory === cat
                  ? 'bg-beige-800 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-beige-100/70 border border-beige-300 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-stone-500">Loading products from SQLite database...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-500">No products matching criteria.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="rounded-2xl bg-white border border-beige-200 p-6 flex flex-col justify-between hover:border-beige-400 hover:shadow-md transition shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-beige-100 text-beige-800 border border-beige-200">
                    {prod.sku}
                  </span>
                  <span className="text-xs text-beige-700 font-semibold">{prod.category}</span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 mb-2">{prod.name}</h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">{prod.description}</p>

                <div className="space-y-1.5 mb-6">
                  {prod.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-stone-700">
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-beige-200 flex items-center justify-between">
                <div>
                  <div className="text-xl font-extrabold text-stone-900">
                    ${prod.unitPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">
                    {prod.billingCycle.replace('_', ' ')}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('sales')}
                  className="px-4 py-2 rounded-lg bg-beige-100 hover:bg-beige-200 border border-beige-300 text-xs font-semibold text-stone-800 flex items-center gap-1.5 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Configure Quote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
