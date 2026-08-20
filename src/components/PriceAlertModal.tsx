import React, { useState } from 'react';
import { X, Bell, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface PriceAlertModalProps {
  product: Product | null;
  onClose: () => void;
  onSaveAlert: (productId: string, productName: string, targetPrice: number, currentLowest: number) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  product,
  onClose,
  onSaveAlert,
}) => {
  if (!product) return null;

  const currentLowest = Math.min(...product.prices.map((p) => p.price));
  const [targetPrice, setTargetPrice] = useState(
    (currentLowest * 0.9).toFixed(2)
  );
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetPrice.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onSaveAlert(product.id, product.name, val, currentLowest);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">Criar Alerta de Preço</h3>
            <p className="text-xs text-stone-500">Seja avisado quando o preço baixar</p>
          </div>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 mb-4 flex items-center gap-3">
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
          />
          <div>
            <p className="text-xs font-bold text-stone-800 line-clamp-1">{product.name}</p>
            <p className="text-xs text-stone-500">
              Menor preço atual:{' '}
              <span className="font-semibold text-emerald-700">
                R$ {currentLowest.toFixed(2).replace('.', ',')}
              </span>
            </p>
          </div>
        </div>

        {saved ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2 animate-bounce" />
            <h4 className="text-sm font-bold text-stone-900">Alerta Configurado!</h4>
            <p className="text-xs text-stone-500 mt-1">
              Você será notificado assim que encontrarmos o produto por R$ {targetPrice} ou menos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Avise-me quando o preço for igual ou menor que:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Sugerido: 10% de economia (R$ {(currentLowest * 0.9).toFixed(2).replace('.', ',')})
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                Ativar Alerta
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
