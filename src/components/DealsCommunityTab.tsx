import React, { useState } from 'react';
import {
  Tag,
  Users,
  Plus,
  TrendingDown,
  Clock,
  CheckCircle2,
  Store,
  Sparkles,
  ArrowRight,
  Flame,
  ThumbsUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Supermarket } from '../types';

interface DealsCommunityTabProps {
  products: Product[];
  supermarkets: Supermarket[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onContributeManualPrice: (
    productName: string,
    supermarketName: string,
    price: number
  ) => void;
  onNavigateHome?: () => void;
}

export const DealsCommunityTab: React.FC<DealsCommunityTabProps> = ({
  products,
  supermarkets,
  onAddToCart,
  onContributeManualPrice,
  onNavigateHome,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [marketName, setMarketName] = useState(supermarkets[0]?.name || '');
  const [priceInput, setPriceInput] = useState('');
  const [userName, setUserName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [communityFeed, setCommunityFeed] = useState([
    { id: '1', user: 'Carlos Mendes', product: 'Picanha Resfriada Friboi (kg)', market: 'Carrefour Hiper', price: 59.90, time: 'Há 12 minutos', upvotes: 24 },
    { id: '2', user: 'Juliana Rocha', product: 'Arroz Branco Camil 5kg', market: 'Assaí Atacadista', price: 26.50, time: 'Há 28 minutos', upvotes: 18 },
    { id: '3', user: 'Felipe Alencar', product: 'Leite Integral UHT Italac 1L', market: 'Atacadão', price: 4.19, time: 'Há 45 minutos', upvotes: 32 },
    { id: '4', user: 'Mariana Souza', product: 'Sabão em Pó Omo 1.6kg', market: 'Assaí Atacadista', price: 19.90, time: 'Há 1 hora', upvotes: 15 },
  ]);

  // Find biggest discounted deals in catalog
  const topDeals = products
    .map((prod) => {
      const sorted = [...prod.prices].sort((a, b) => a.price - b.price);
      const lowest = sorted[0];
      const highest = sorted[sorted.length - 1];
      const diff = highest.price - lowest.price;
      const discountPct = Math.round((diff / highest.price) * 100);
      return {
        product: prod,
        lowest,
        highest,
        diff,
        discountPct,
      };
    })
    .sort((a, b) => b.discountPct - a.discountPct)
    .slice(0, 6);

  const handleUpvote = (id: string) => {
    setCommunityFeed((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item
      )
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(priceInput.replace(',', '.'));
    if (!prodName || isNaN(priceNum) || priceNum <= 0) return;

    onContributeManualPrice(prodName, marketName, priceNum);

    setCommunityFeed((prev) => [
      {
        id: Date.now().toString(),
        user: userName || 'Colaborador Anônimo',
        product: prodName,
        market: marketName,
        price: priceNum,
        time: 'Agora mesmo',
        upvotes: 1,
      },
      ...prev,
    ]);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowSubmitModal(false);
      setProdName('');
      setPriceInput('');
      setUserName('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Back Navigation Bar */}
      {onNavigateHome && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700 hover:text-stone-900 transition shadow-2xs cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-emerald-600 rotate-180" />
            <span>Voltar ao Início (Buscar Produtos)</span>
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-800 text-rose-200 border border-rose-700 mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Radar de Ofertas Quentes & Colaboração
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            As maiores quedas de preço e ofertas da comunidade
          </h2>
          <p className="text-rose-200 text-xs sm:text-sm mt-1.5">
            Economize aproveitando as maiores variações de preço do dia ou cadastre um preço que você encontrou no mercado do seu bairro.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="bg-rose-500 hover:bg-rose-400 text-stone-950 text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-md flex items-center gap-2 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Preço que Vi no Mercado
        </button>
      </div>

      {/* Top Deals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-stone-900">
              Maiores Diferenças de Preço de Hoje (Até -{topDeals[0]?.discountPct}%)
            </h3>
          </div>
          <span className="text-xs text-stone-500">Atualizado a cada 15 min</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topDeals.map(({ product, lowest, highest, diff, discountPct }) => (
            <div
              key={product.id}
              className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs hover:border-rose-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="bg-rose-100 text-rose-800 text-xs font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> -{discountPct}% vs mais caro
                  </span>
                  <span className="text-[11px] font-bold text-stone-400">
                    {product.brand}
                  </span>
                </div>

                <div className="flex items-center gap-3 my-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-stone-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-stone-500">{product.volumeOrWeight}</p>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="text-stone-600 font-medium">Melhor Preço:</span>
                    <span className="text-base font-extrabold text-emerald-800">
                      R$ {lowest.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                    <span>em {lowest.supermarketName}</span>
                    <span className="line-through text-rose-600">
                      R$ {highest.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onAddToCart(product, 1)}
                className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar à Lista
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Community Activity Feed */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Feed de Preços da Comunidade (Tempo Real)
              </h3>
              <p className="text-[11px] text-stone-500">
                Preços verificados e informados por outros consumidores
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
          >
            + Enviar Preço
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {communityFeed.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                  {item.user.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-stone-900">{item.product}</p>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                    <span className="font-semibold text-stone-700">{item.market}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                    <span>•</span>
                    <span>por {item.user}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-extrabold text-emerald-800">
                  R$ {item.price.toFixed(2).replace('.', ',')}
                </span>

                <button
                  onClick={() => handleUpvote(item.id)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-stone-600 transition font-medium cursor-pointer"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{item.upvotes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Submit Manual Price */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Cadastrar Preço que Encontrou
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Ajude a comunidade a economizar compartilhando ofertas que você viu no mercado!
            </p>

            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-stone-900">Preço Cadastrado com Sucesso!</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Obrigado pela sua contribuição! O preço já está visível para todos.
                </p>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nome do Produto:
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ex: Leite Integral Piracanjuba 1L"
                    className="w-full px-3 py-2 text-xs font-medium text-stone-900 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Supermercado:
                    </label>
                    <select
                      value={marketName}
                      onChange={(e) => setMarketName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium text-stone-900 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    >
                      {supermarkets.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                      <option value="Supermercado Local">Outro Supermercado / Bairro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Preço Encontrado:
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-stone-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-8 pr-3 py-2 text-xs font-bold text-stone-900 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Seu Nome (opcional):
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ex: Ana Silva"
                    className="w-full px-3 py-2 text-xs font-medium text-stone-900 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Enviar Preço
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
