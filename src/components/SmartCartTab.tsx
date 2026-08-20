import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  TrendingDown,
  Share2,
  Copy,
  Check,
  Store,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Download,
  Navigation,
  MapPin,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, Supermarket, Product } from '../types';

interface SmartCartTabProps {
  cart: CartItem[];
  supermarkets: Supermarket[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: (productId?: string) => void;
  onNavigateToSearch: () => void;
  onNavigateToRoutes?: () => void;
}

export const SmartCartTab: React.FC<SmartCartTabProps> = ({
  cart,
  supermarkets,
  onUpdateQuantity,
  onClearCart,
  onNavigateToSearch,
  onNavigateToRoutes,
}) => {
  const [copied, setCopied] = useState(false);
  const [aiTips, setAiTips] = useState<any[]>([]);
  const [loadingAiTips, setLoadingAiTips] = useState(false);
  const [checklistMode, setChecklistMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({});

  // 1. Calculate Single Store Totals
  const storeTotals = useMemo(() => {
    return supermarkets.map((market) => {
      let total = 0;
      let missingItemsCount = 0;

      cart.forEach((item) => {
        const priceObj = item.product.prices.find((p) => p.supermarketId === market.id);
        if (priceObj) {
          total += priceObj.price * item.quantity;
        } else {
          // fallback to average price if not explicitly in store
          const avg =
            item.product.prices.reduce((acc, p) => acc + p.price, 0) / item.product.prices.length;
          total += avg * item.quantity;
          missingItemsCount++;
        }
      });

      return {
        market,
        total,
        missingItemsCount,
      };
    }).sort((a, b) => a.total - b.total);
  }, [cart, supermarkets]);

  // 2. Calculate Multi-Store Optimized Split (Buy each item where it's cheapest)
  const splitPlan = useMemo(() => {
    if (cart.length === 0) return null;

    const storeGroups: { [marketId: string]: { market: Supermarket; items: { product: Product; quantity: number; price: number; subtotal: number }[]; subtotal: number } } = {};

    let totalOptimized = 0;

    cart.forEach((item) => {
      // Find cheapest store for this product
      const sortedPrices = [...item.product.prices].sort((a, b) => a.price - b.price);
      const cheapest = sortedPrices[0];
      const market = supermarkets.find((m) => m.id === cheapest.supermarketId) || supermarkets[0];

      if (!storeGroups[market.id]) {
        storeGroups[market.id] = {
          market,
          items: [],
          subtotal: 0,
        };
      }

      const itemSubtotal = cheapest.price * item.quantity;
      storeGroups[market.id].items.push({
        product: item.product,
        quantity: item.quantity,
        price: cheapest.price,
        subtotal: itemSubtotal,
      });
      storeGroups[market.id].subtotal += itemSubtotal;
      totalOptimized += itemSubtotal;
    });

    const cheapestSingleStore = storeTotals[0] || { total: totalOptimized, market: supermarkets[0] };
    const mostExpensiveSingleStore = storeTotals[storeTotals.length - 1] || { total: totalOptimized, market: supermarkets[0] };
    const savingsAmount = cheapestSingleStore.total - totalOptimized;
    const maxSavingsAmount = mostExpensiveSingleStore.total - totalOptimized;
    const savingsPercentage = cheapestSingleStore.total > 0 ? Math.round((savingsAmount / cheapestSingleStore.total) * 100) : 0;

    return {
      storeGroups: Object.values(storeGroups).filter((g) => g.items.length > 0),
      totalOptimized,
      cheapestSingleStore,
      mostExpensiveSingleStore,
      savingsAmount,
      maxSavingsAmount,
      savingsPercentage,
    };
  }, [cart, supermarkets, storeTotals]);

  // Trigger celebration confetti
  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Fetch AI tips
  const fetchAiTips = async () => {
    if (cart.length === 0) return;
    setLoadingAiTips(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          price: Math.min(...i.product.prices.map((p) => p.price)),
        })),
        totalSavings: splitPlan ? splitPlan.maxSavingsAmount.toFixed(2) : 0,
      };

      const res = await fetch('/api/ai/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.tips) {
        setAiTips(data.tips);
        triggerCelebration();
      }
    } catch (err) {
      console.error('Erro ao buscar dicas de IA:', err);
    } finally {
      setLoadingAiTips(false);
    }
  };

  // WhatsApp Share Formatter
  const shareToWhatsapp = () => {
    if (!splitPlan) return;

    let text = `🛒 *MINHA LISTA DE COMPRAS INTELIGENTE*\n`;
    text += `Economia calculada no BuscaPreço Supermercados!\n\n`;

    splitPlan.storeGroups.forEach((group) => {
      text += `📍 *COMPRAR NO ${group.market.name.toUpperCase()}* (Subtotal: R$ ${group.subtotal.toFixed(2).replace('.', ',')}):\n`;
      group.items.forEach((item) => {
        text += `  ▫️ [ ] ${item.quantity}x ${item.product.name} - R$ ${item.price.toFixed(2).replace('.', ',')} cada\n`;
      });
      text += `\n`;
    });

    text += `💰 *Total Otimizado:* R$ ${splitPlan.totalOptimized.toFixed(2).replace('.', ',')}\n`;
    text += `🎉 *Economia Total:* R$ ${splitPlan.maxSavingsAmount.toFixed(2).replace('.', ',')}!\n`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = () => {
    if (!splitPlan) return;
    let text = `LISTA DE COMPRAS - BUSCAPREÇO SUPERMERCADOS\n\n`;
    splitPlan.storeGroups.forEach((group) => {
      text += `Loja: ${group.market.name} (R$ ${group.subtotal.toFixed(2).replace('.', ',')})\n`;
      group.items.forEach((item) => {
        text += `- ${item.quantity}x ${item.product.name} (R$ ${item.price.toFixed(2).replace('.', ',')})\n`;
      });
      text += `\n`;
    });
    text += `Total: R$ ${splitPlan.totalOptimized.toFixed(2).replace('.', ',')}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-stone-200 shadow-xs max-w-2xl mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-stone-900">Seu carrinho inteligente está vazio</h3>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-2 mb-6">
          Adicione produtos para que nosso algoritmo calcule qual supermercado é mais barato e como economizar até 30% dividindo suas compras!
        </p>
        <button
          onClick={onNavigateToSearch}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-xs inline-flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Explorar Produtos e Preços
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Savings Summary */}
      {splitPlan && (
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-200 border border-emerald-500/30 mb-2">
              <TrendingDown className="w-3.5 h-3.5" />
              Otimização de Compras Ativada
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Economia de até R$ {splitPlan.maxSavingsAmount.toFixed(2).replace('.', ',')}
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Comprando nas lojas certas, seu total cai de{' '}
              <span className="line-through text-emerald-300 font-semibold">
                R$ {splitPlan.mostExpensiveSingleStore.total.toFixed(2).replace('.', ',')}
              </span>{' '}
              para apenas{' '}
              <span className="text-white font-extrabold text-base bg-emerald-900/60 px-2 py-0.5 rounded-md">
                R$ {splitPlan.totalOptimized.toFixed(2).replace('.', ',')}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={shareToWhatsapp}
              className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Enviar no WhatsApp
            </button>
            <button
              onClick={copyToClipboard}
              className="bg-emerald-900/80 hover:bg-emerald-900 text-white border border-emerald-500/40 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Lista'}
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Items List, Right Store Totals & Split Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Itens na Lista ({cart.reduce((acc, i) => acc + i.quantity, 0)} un)
                </h3>
                <button
                  onClick={() => setChecklistMode(!checklistMode)}
                  className={`text-xs px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                    checklistMode
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {checklistMode ? 'Modo Mercado (Ativo)' : 'Modo Checklist'}
                </button>
              </div>

              <button
                onClick={() => onClearCart()}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Lista
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {cart.map((item) => {
                const sortedPrices = [...item.product.prices].sort((a, b) => a.price - b.price);
                const bestPrice = sortedPrices[0];
                const isChecked = checkedItems[item.product.id] || false;

                return (
                  <div
                    key={item.product.id}
                    className={`py-3.5 flex items-center justify-between gap-3 transition ${
                      isChecked ? 'opacity-40 line-through' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {checklistMode && (
                        <button
                          onClick={() => toggleCheck(item.product.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 hover:border-emerald-500'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-stone-100 shrink-0"
                      />

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          <span className="text-emerald-700 font-bold">
                            R$ {bestPrice.price.toFixed(2).replace('.', ',')}
                          </span>
                          <span>em {bestPrice.supermarketName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-md transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 rounded-md transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-stone-900 min-w-16 text-right">
                        R$ {(bestPrice.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>

                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 0)}
                        className="p-1 text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Tips Section */}
          <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-purple-950">
                    Dicas de Economia com IA
                  </h4>
                  <p className="text-[11px] text-purple-700">
                    Análise inteligente de promoções e substituições
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAiTips}
                disabled={loadingAiTips}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                {loadingAiTips ? 'Analisando...' : 'Gerar Novas Dicas'}
              </button>
            </div>

            {aiTips.length > 0 ? (
              <div className="space-y-2.5 mt-3">
                {aiTips.map((tip, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-3 border border-purple-100 shadow-2xs text-xs">
                    <p className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      {tip.title}
                    </p>
                    <p className="text-stone-600 text-[11px] mt-1 leading-relaxed">{tip.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-purple-800 bg-white/70 p-3 rounded-xl border border-purple-100">
                💡 Clique em "Gerar Novas Dicas" para que a IA analise os produtos da sua lista e indique os melhores dias da semana para comprar, marcas equivalentes mais baratas e formatos econômicos.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Supermarket Comparison & Split Plan */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Divisão Estratégica de Lojas (Multi-Store Optimizer) */}
          {splitPlan && (
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-md">
                  Melhor Estratégia
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  R$ {splitPlan.totalOptimized.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-stone-900 mb-1">
                Dividir em {splitPlan.storeGroups.length} supermercados
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Compre cada produto exatamente onde ele está mais barato:
              </p>

              <div className="space-y-3">
                {splitPlan.storeGroups.map((group) => (
                  <div
                    key={group.market.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/60">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-stone-900">{group.market.name}</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-800">
                        R$ {group.subtotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {group.items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between text-[11px] text-stone-600"
                        >
                          <span className="truncate pr-2">
                            • {item.quantity}x {item.product.name}
                          </span>
                          <span className="font-semibold text-stone-800 shrink-0">
                            R$ {item.subtotal.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {onNavigateToRoutes && (
                <div className="mt-4 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={onNavigateToRoutes}
                    className="w-full bg-stone-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    <span>Ver Melhor Rota no Mapa & Custo de Gasolina</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                  <p className="text-[10px] text-stone-500 text-center mt-1.5">
                    Calcula a distância em km, rota multi-paradas e lucro líquido real.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. Total se Comprar 100% em uma Única Loja */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-stone-600" />
              Total em Cada Supermercado (Compra Completa)
            </h4>

            <div className="space-y-2">
              {storeTotals.map((storeTotal, idx) => {
                const diffFromLowest =
                  storeTotal.total - (storeTotals[0]?.total || 0);

                return (
                  <div
                    key={storeTotal.market.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      idx === 0
                        ? 'bg-emerald-50/80 border-emerald-300 font-bold'
                        : 'bg-stone-50/60 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900">{storeTotal.market.name}</span>
                        {idx === 0 && (
                          <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                            Loja Única + Barata
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {storeTotal.market.type.toUpperCase()} • a {storeTotal.market.distanceKm} km
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold ${idx === 0 ? 'text-emerald-800 text-sm' : 'text-stone-900'}`}>
                        R$ {storeTotal.total.toFixed(2).replace('.', ',')}
                      </p>
                      {diffFromLowest > 0 && (
                        <p className="text-[10px] text-rose-600 font-medium">
                          +R$ {diffFromLowest.toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
