import React from 'react';
import { X, TrendingDown, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductHistoryModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const minPrice = Math.min(...product.prices.map((p) => p.price));
  const maxPrice = Math.max(...product.prices.map((p) => p.price));
  const avgPrice = product.prices.reduce((acc, p) => acc + p.price, 0) / product.prices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
          />
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              {product.brand} • {product.category}
            </span>
            <h3 className="text-lg font-bold text-stone-900">{product.name}</h3>
            <p className="text-xs text-stone-500">EAN: {product.ean} | {product.volumeOrWeight}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <span className="text-[11px] font-medium text-emerald-700">Menor Preço Hoje</span>
            <p className="text-lg font-bold text-emerald-800">
              R$ {minPrice.toFixed(2).replace('.', ',')}
            </p>
            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <TrendingDown className="w-3 h-3" /> Mais barato
            </span>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
            <span className="text-[11px] font-medium text-stone-600">Preço Médio</span>
            <p className="text-lg font-bold text-stone-800">
              R$ {avgPrice.toFixed(2).replace('.', ',')}
            </p>
            <span className="text-[10px] text-stone-500">em 6 supermercados</span>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
            <span className="text-[11px] font-medium text-rose-700">Maior Preço</span>
            <p className="text-lg font-bold text-rose-800">
              R$ {maxPrice.toFixed(2).replace('.', ',')}
            </p>
            <span className="text-[10px] text-rose-600 flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +{(((maxPrice - minPrice) / minPrice) * 100).toFixed(0)}% variação
            </span>
          </div>
        </div>

        {/* History timeline */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-600" />
            Histórico de Preços (Últimos Meses)
          </h4>
          <div className="space-y-2 border border-stone-100 rounded-xl p-3 bg-stone-50/50">
            {product.history.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100 last:border-0">
                <span className="font-medium text-stone-700">{h.date}</span>
                <span className="text-stone-500 text-[11px]">{h.supermarketName}</span>
                <span className="font-bold text-stone-900">R$ {h.price.toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price by Supermarket Table */}
        <div>
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
            Preço Atual por Supermercado
          </h4>
          <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto rounded-xl border border-stone-200">
            {product.prices
              .sort((a, b) => a.price - b.price)
              .map((p, idx) => (
                <div key={p.supermarketId} className="flex items-center justify-between p-2.5 text-xs hover:bg-stone-50 transition">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      idx === 0 ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-stone-800">{p.supermarketName}</p>
                      <p className="text-[10px] text-stone-400">Atualizado: {p.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${idx === 0 ? 'text-emerald-700 text-sm' : 'text-stone-900'}`}>
                      R$ {p.price.toFixed(2).replace('.', ',')}
                    </p>
                    {p.clubPrice && (
                      <p className="text-[10px] text-purple-700 font-medium">
                        Clube: R$ {p.clubPrice.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl transition shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
