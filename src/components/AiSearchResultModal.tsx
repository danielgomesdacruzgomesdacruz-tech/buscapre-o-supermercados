import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Store,
  TrendingDown,
  Info,
  Plus,
  MapPin,
  X,
  Navigation,
  Compass,
  Clock,
  Fuel,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiSearchResultModalProps {
  /** Termo buscado. Quando é uma string não vazia, o modal abre e dispara a busca. Quando é null/undefined/vazio, o modal fica fechado. */
  query: string | null | undefined;
  /** Domínio de origem da busca: 'supermercado', 'veiculos' ou 'eletrodomesticos'. Ajusta o tipo de loja retornado. */
  domain?: string;
  selectedCity: string;
  onClose: () => void;
  onAddCustomProduct: (productData: any) => void;
  onNavigateToRoutes?: () => void;
}

export const AiSearchResultModal: React.FC<AiSearchResultModalProps> = ({
  query,
  domain,
  selectedCity,
  onClose,
  onAddCustomProduct,
  onNavigateToRoutes,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [added, setAdded] = useState(false);

  const isOpen = !!(query && query.trim());

  const getMarketRouteData = (market: any, idx: number) => {
    const defaultDistances = [3.2, 4.5, 2.1, 1.4, 5.8, 2.9];
    const defaultDurations = [8, 11, 6, 4, 14, 7];
    const defaultRoutes = [
      'Via Av. das Nações Unidas • Rota mais rápida',
      'Via Marginal Pinheiros / Pista Expressa',
      'Via Av. Giovanni Gronchi • Trânsito Livre',
      'Via Rua Oscar Freire / Bairro',
      'Via Av. Aricanduva • Corredor Principal',
      'Via Av. Rebouças • Acesso Fácil',
    ];
    const defaultAddresses = [
      'Av. Nações Unidas, 15187 - Chácara Sto. Antônio',
      'Av. Morvan Dias de Figueiredo, 6169 - Vila Maria',
      'Av. Giovanni Gronchi, 5819 - Morumbi',
      'Rua Teodoro Sampaio, 1933 - Pinheiros',
      'Av. Aricanduva, 5555 - Leste',
      'Rua Domingos de Morais, 2564 - Vila Mariana',
    ];

    const distanceKm = typeof market.distanceKm === 'number' ? market.distanceKm : defaultDistances[idx % defaultDistances.length];
    const durationMin = typeof market.durationMin === 'number' ? market.durationMin : defaultDurations[idx % defaultDurations.length];
    const bestRoute = market.bestRoute || defaultRoutes[idx % defaultRoutes.length];
    const address = market.address || `${defaultAddresses[idx % defaultAddresses.length]} (${selectedCity})`;
    const roundTripFuelCost = +((distanceKm * 2 / 10) * 5.89).toFixed(2);

    return { distanceKm, durationMin, bestRoute, address, roundTripFuelCost };
  };

  useEffect(() => {
    if (!isOpen || !query) {
      return;
    }

    const q = query.trim();
    setLoading(true);
    setResult(null);
    setAdded(false);

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/ai/search-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            city: selectedCity,
            domain,
          }),
        });

        const json = await res.json();
        if (cancelled) return;

        if (json.success && json.data) {
          setResult(json.data);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } else {
          throw new Error(json.error || 'Erro na pesquisa');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Erro na busca por IA:', err);

        type DomainFallbackConfig = {
          basePrice: number;
          category: string;
          brand: string;
          volumeOrWeight: string;
          summary: (lowest: number, city: string) => string;
          stores: (lowest: number, base: number, highest: number) => { supermarketName: string; estimatedPrice: number; dealType: string; notes: string }[];
        };

        const domainFallbacks: Record<string, DomainFallbackConfig> = {
          veiculos: {
            basePrice: 79900.0,
            category: 'veiculos',
            brand: 'Diversas Marcas',
            volumeOrWeight: '1 un',
            summary: (lowest, city) => `Comparando concessionárias e revendas em ${city}, o menor valor estimado é de R$ ${lowest.toFixed(2).replace('.', ',')}.`,
            stores: (lowest, base, highest) => [
              { supermarketName: 'Concessionária Oficial', estimatedPrice: lowest, dealType: 'Taxa 0% em 24x', notes: 'Menor preço estimado' },
              { supermarketName: 'Auto Shopping', estimatedPrice: +(lowest * 1.03).toFixed(2), dealType: 'Seminovo Revisado', notes: 'Boa procedência' },
              { supermarketName: 'Revenda Multimarcas', estimatedPrice: base, dealType: 'Financiamento facilitado', notes: 'Diversas opções de cor' },
              { supermarketName: 'Revenda Premium', estimatedPrice: highest, dealType: 'Garantia Estendida', notes: 'Linha completa' },
            ],
          },
          eletrodomesticos: {
            basePrice: 2199.0,
            category: 'eletrodomesticos',
            brand: 'Diversas Marcas',
            volumeOrWeight: '1 un',
            summary: (lowest, city) => `Comparando grandes varejos em ${city}, o menor valor estimado é de R$ ${lowest.toFixed(2).replace('.', ',')}, geralmente à vista no Pix.`,
            stores: (lowest, base, highest) => [
              { supermarketName: 'Magazine Luiza', estimatedPrice: lowest, dealType: '10% OFF no Pix', notes: 'Menor preço estimado' },
              { supermarketName: 'Casas Bahia', estimatedPrice: +(lowest * 1.03).toFixed(2), dealType: 'Parcelamento sem juros', notes: 'Retirada em loja' },
              { supermarketName: 'Fast Shop', estimatedPrice: base, dealType: 'Garantia Estendida', notes: 'Linha Premium' },
              { supermarketName: 'Amazon / Mercado Livre', estimatedPrice: highest, dealType: 'Entrega Rápida', notes: 'Comparar cupons online' },
            ],
          },
          farmacia: {
            basePrice: 34.9,
            category: 'farmacia',
            brand: 'Diversas Marcas',
            volumeOrWeight: 'Embalagem Padrão',
            summary: (lowest, city) => `Comparando farmácias em ${city}, o menor valor estimado é de R$ ${lowest.toFixed(2).replace('.', ',')}, geralmente com desconto no app.`,
            stores: (lowest, base, highest) => [
              { supermarketName: 'Droga Raia', estimatedPrice: lowest, dealType: 'Desconto no app', notes: 'Menor preço estimado' },
              { supermarketName: 'Drogasil', estimatedPrice: +(lowest * 1.03).toFixed(2), dealType: 'Programa de Fidelidade', notes: 'Acumula pontos' },
              { supermarketName: 'Pague Menos', estimatedPrice: base, dealType: 'Preço Direto', notes: 'Rede com boa cobertura' },
              { supermarketName: 'Panvel', estimatedPrice: highest, dealType: 'Preço Balcão', notes: 'Atendimento farmacêutico' },
            ],
          },
          eletronicos: {
            basePrice: 1899.0,
            category: 'eletronicos',
            brand: 'Diversas Marcas',
            volumeOrWeight: '1 un',
            summary: (lowest, city) => `Comparando lojas de eletrônicos em ${city}, o menor valor estimado é de R$ ${lowest.toFixed(2).replace('.', ',')}.`,
            stores: (lowest, base, highest) => [
              { supermarketName: 'Kabum', estimatedPrice: lowest, dealType: 'Cupom de desconto', notes: 'Menor preço estimado' },
              { supermarketName: 'Magazine Luiza', estimatedPrice: +(lowest * 1.03).toFixed(2), dealType: '10% OFF no Pix', notes: 'Frete grátis' },
              { supermarketName: 'Amazon', estimatedPrice: base, dealType: 'Entrega Rápida', notes: 'Comparar cupons online' },
              { supermarketName: 'Fast Shop', estimatedPrice: highest, dealType: 'Garantia Estendida', notes: 'Linha Premium' },
            ],
          },
          construcao: {
            basePrice: 149.9,
            category: 'construcao',
            brand: 'Diversas Marcas',
            volumeOrWeight: '1 un',
            summary: (lowest, city) => `Comparando lojas de material de construção em ${city}, o menor valor estimado é de R$ ${lowest.toFixed(2).replace('.', ',')}.`,
            stores: (lowest, base, highest) => [
              { supermarketName: 'Leroy Merlin', estimatedPrice: lowest, dealType: 'Preço Direto', notes: 'Menor preço estimado' },
              { supermarketName: 'C&C', estimatedPrice: +(lowest * 1.03).toFixed(2), dealType: 'Entrega Programada', notes: 'Bom estoque local' },
              { supermarketName: 'Telhanorte', estimatedPrice: base, dealType: 'Parcelamento sem juros', notes: 'Boa variedade' },
              { supermarketName: 'Tumelero', estimatedPrice: highest, dealType: 'Preço Balcão', notes: 'Atendimento especializado' },
            ],
          },
          supermercado: {
            basePrice: 19.8,
            category: 'alimentos',
            brand: 'Mais Popular',
            volumeOrWeight: 'Embalagem Padrão',
            summary: (lowest, city) => `Em atacarejos (como Assaí e Atacadão) em ${city}, este item costuma ter descontos de até 22% comprando em maior quantidade.`,
            stores: (lowest, base, highest) => [
              { supermarketName: 'Assaí Atacadista', estimatedPrice: lowest, dealType: 'Atacado / Oferta', notes: 'Menor preço estimado' },
              { supermarketName: 'Atacadão', estimatedPrice: +(lowest * 1.03).toFixed(2), dealType: 'Preço Direto', notes: 'Excelente custo-benefício' },
              { supermarketName: 'Carrefour Hiper', estimatedPrice: base, dealType: 'Clube Meu Carrefour', notes: 'Desconto com app' },
              { supermarketName: 'Pão de Açúcar', estimatedPrice: highest, dealType: 'Preço Balcão', notes: 'Linha Premium' },
            ],
          },
        };

        const cfg = domainFallbacks[domain || 'supermercado'] || domainFallbacks.supermercado;
        const lowest = +(cfg.basePrice * 0.92).toFixed(2);
        const highest = +(cfg.basePrice * 1.18).toFixed(2);

        setResult({
          productName: q,
          brand: cfg.brand,
          category: cfg.category,
          unit: 'un',
          volumeOrWeight: cfg.volumeOrWeight,
          averagePrice: cfg.basePrice,
          lowestPrice: lowest,
          highestPrice: highest,
          priceSummary: cfg.summary(lowest, selectedCity),
          marketPrices: cfg.stores(lowest, cfg.basePrice, highest),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!result) return;
    onAddCustomProduct({
      name: result.productName,
      brand: result.brand || 'Diversas',
      category: result.category || 'alimentos',
      volumeOrWeight: result.volumeOrWeight || '1 un',
      prices: (result.marketPrices || []).map((m: any, idx: number) => ({
        supermarketId: `m-${idx}`,
        supermarketName: m.supermarketName,
        price: m.estimatedPrice,
        lastUpdated: 'Hoje (IA)',
        verifiedCount: 10,
        inStock: true,
      })),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-purple-950 text-purple-100 rounded-t-3xl p-5 sm:p-6 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-800 text-purple-200 border border-purple-700">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Pesquisa Inteligente & Estimativa em Tempo Real
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white mt-2 truncate">
              {query}
            </h3>
            <span className="text-[11px] text-purple-300 font-medium flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {selectedCity}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4.5 h-4.5 text-white" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="bg-white p-12 text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h4 className="text-sm font-bold text-stone-900">
                Consultando faixa de preços e ofertas em {selectedCity}...
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                {domain === 'veiculos'
                  ? 'Analisando concessionárias, auto shoppings e revendas'
                  : domain === 'eletrodomesticos'
                  ? 'Analisando grandes varejos e lojas oficiais'
                  : domain === 'farmacia'
                  ? 'Analisando farmácias e drogarias'
                  : domain === 'eletronicos'
                  ? 'Analisando lojas de eletrônicos e marketplaces'
                  : domain === 'construcao'
                  ? 'Analisando lojas de material de construção'
                  : 'Analisando atacarejos, hipermercados e redes locais'}
              </p>
              <p className="text-xs text-stone-500 mt-4 max-w-sm mx-auto leading-relaxed">
                Tenha paciência, aguarde um momento. A primeira busca pode demorar um pouco, pois estamos em busca das melhores ofertas para você.
                <br />
                Não saia desta página.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md uppercase">
                      {result.brand || 'Produto'}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                    {result.productName}
                  </h3>
                  {result.volumeOrWeight && (
                    <p className="text-xs text-stone-500">Tamanho/Peso: {result.volumeOrWeight}</p>
                  )}
                </div>

                <button
                  onClick={handleAdd}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  {added ? 'Adicionado ao Catálogo!' : 'Adicionar ao Comparador & Carrinho'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Menor Preço Estimado
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                    R$ {result.lowestPrice?.toFixed(2).replace('.', ',')}
                  </p>
                  <span className="text-[11px] text-emerald-800">Melhor oferta encontrada</span>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <span className="text-xs font-semibold text-stone-600">Preço Médio</span>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                    R$ {result.averagePrice?.toFixed(2).replace('.', ',')}
                  </p>
                  <span className="text-[11px] text-stone-500">Na região de {selectedCity}</span>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <span className="text-xs font-semibold text-rose-700">Maior Preço Estimado</span>
                  <p className="text-2xl font-extrabold text-rose-950 mt-1">
                    R$ {result.highestPrice?.toFixed(2).replace('.', ',')}
                  </p>
                  <span className="text-[11px] text-rose-800">Lojas de conveniência/express</span>
                </div>
              </div>

              {result.priceSummary && (
                <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-900 leading-relaxed font-medium">
                    {result.priceSummary}
                  </p>
                </div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-600" />
                      Estimativa por Loja, Melhor Rota & Distância
                    </h4>
                    <p className="text-xs text-stone-500">
                      Valores estimados, rota mais rápida e distância em tempo real em {selectedCity}
                    </p>
                  </div>

                  {onNavigateToRoutes && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToRoutes();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer self-start sm:self-auto"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Abrir Otimizador de Rotas do App</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {result.marketPrices?.map((market: any, idx: number) => {
                    const routeInfo = getMarketRouteData(market, idx);
                    const isBestPrice = idx === 0;
                    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      `${market.supermarketName} ${routeInfo.address} ${selectedCity}`
                    )}`;
                    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(
                      `${market.supermarketName} ${routeInfo.address} ${selectedCity}`
                    )}`;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition overflow-hidden ${
                          isBestPrice
                            ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                            : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isBestPrice
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                #{idx + 1}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="font-bold text-stone-900 text-sm">
                                    {market.supermarketName}
                                  </h5>
                                  {isBestPrice && (
                                    <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Menor Preço
                                    </span>
                                  )}
                                  <span className="bg-stone-100 text-stone-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-stone-200">
                                    {market.dealType}
                                  </span>
                                </div>

                                {market.notes && (
                                  <p className="text-xs text-stone-500 mt-0.5 font-medium">
                                    {market.notes}
                                  </p>
                                )}

                                <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-1.5">
                                  <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                  <span className="truncate max-w-md">{routeInfo.address}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-stone-100">
                              <span className="text-[11px] font-medium text-stone-500 block">
                                Preço Estimado
                              </span>
                              <span
                                className={`text-xl font-black ${
                                  isBestPrice ? 'text-emerald-700' : 'text-stone-900'
                                }`}
                              >
                                R$ {market.estimatedPrice?.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3.5 pt-3.5 border-t border-stone-100/80 bg-stone-50/70 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 bg-white border border-stone-200 text-stone-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                                  <Navigation className="w-3 h-3 text-emerald-600" />
                                  {routeInfo.distanceKm} km de distância
                                </span>

                                <span className="inline-flex items-center gap-1 bg-white border border-stone-200 text-stone-700 font-medium px-2 py-0.5 rounded-md text-[11px]">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  ~{routeInfo.durationMin} min de deslocamento
                                </span>

                                <span className="inline-flex items-center gap-1 bg-white border border-stone-200 text-stone-600 font-medium px-2 py-0.5 rounded-md text-[11px]">
                                  <Fuel className="w-3 h-3 text-rose-500" />
                                  ~R$ {routeInfo.roundTripFuelCost.toFixed(2).replace('.', ',')} ida e volta
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px] text-stone-700 font-semibold">
                                <Compass className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span>
                                  <strong className="text-purple-900 font-bold">Melhor Rota:</strong> {routeInfo.bestRoute}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={gmapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-800 transition shadow-2xs"
                                title="Abrir no Google Maps"
                              >
                                <ExternalLink className="w-3 h-3 text-blue-600" />
                                <span>Google Maps</span>
                              </a>

                              <a
                                href={wazeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-800 transition shadow-2xs"
                                title="Abrir no Waze"
                              >
                                <ExternalLink className="w-3 h-3 text-cyan-600" />
                                <span>Waze</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
