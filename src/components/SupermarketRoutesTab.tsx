import React, { useState, useMemo, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Car,
  Fuel,
  TrendingUp,
  Clock,
  ExternalLink,
  Share2,
  CheckCircle2,
  Store,
  Compass,
  Zap,
  Info,
  ChevronRight,
  Plus,
  Trash2,
  Bike,
  Footprints,
  ShieldCheck,
  Phone,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  LocateFixed,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Supermarket, CartItem, VehicleType } from '../types';
import {
  UserCoordinates,
  calculateDistanceKm,
  calculateEstimatedDurationMin,
  buildMultiStopNavigationUrl,
  buildWazeNavigationUrl,
  buildDirectGpsNavigationUrl,
} from '../utils/geolocation';

interface SupermarketRoutesTabProps {
  supermarkets: Supermarket[];
  cart: CartItem[];
  selectedCity: string;
  onNavigateToCart: () => void;
  onNavigateToSearch: () => void;
  userCoordinates?: UserCoordinates | null;
  onRequestLocation?: () => Promise<void>;
  isLocating?: boolean;
  locationError?: string | null;
}

export const SupermarketRoutesTab: React.FC<SupermarketRoutesTabProps> = ({
  supermarkets,
  cart,
  selectedCity,
  onNavigateToCart,
  onNavigateToSearch,
  userCoordinates,
  onRequestLocation,
  isLocating = false,
  locationError = null,
}) => {
  // Origin address state
  const [originAddress, setOriginAddress] = useState<string>(() => {
    if (userCoordinates?.address) {
      return userCoordinates.address;
    }
    return 'Minha Localização Atual (GPS)';
  });
  const [isUsingGps, setIsUsingGps] = useState<boolean>(true);
  const [returnToOrigin, setReturnToOrigin] = useState<boolean>(true);
  
  // Vehicle & Fuel Settings
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [fuelPrice, setFuelPrice] = useState<number>(5.89); // R$ / litro
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(10.5); // km / litro
  
  // Selected supermarkets for the route
  // By default, pre-select the 2 best stores if cart exists, or Assaí + Carrefour
  const [selectedMarketIds, setSelectedMarketIds] = useState<string[]>(() => {
    // If cart has items, identify stores with best prices
    if (cart.length > 0) {
      const storeCounts: { [marketId: string]: number } = {};
      cart.forEach((item) => {
        const sorted = [...item.product.prices].sort((a, b) => a.price - b.price);
        const best = sorted[0];
        if (best) {
          storeCounts[best.supermarketId] = (storeCounts[best.supermarketId] || 0) + 1;
        }
      });
      const sortedIds = Object.keys(storeCounts).sort((a, b) => storeCounts[b] - storeCounts[a]);
      if (sortedIds.length >= 2) {
        return sortedIds.slice(0, 2);
      } else if (sortedIds.length === 1) {
        return [sortedIds[0], 'carrefour'];
      }
    }
    return ['assai', 'carrefour'];
  });

  const [activeMarketDetail, setActiveMarketDetail] = useState<Supermarket | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  // Filter types
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('todos');

  // Update originAddress when userCoordinates change
  useEffect(() => {
    if (userCoordinates && isUsingGps) {
      setOriginAddress(userCoordinates.address || `Minha Localização GPS (${userCoordinates.lat.toFixed(4)}, ${userCoordinates.lng.toFixed(4)})`);
    }
  }, [userCoordinates, isUsingGps]);

  // Compute live distances for supermarkets based on user GPS if available
  const supermarketsWithLiveDistances = useMemo(() => {
    if (!userCoordinates || !isUsingGps) return supermarkets;

    return supermarkets.map((market) => {
      const realDist = calculateDistanceKm(
        userCoordinates.lat,
        userCoordinates.lng,
        market.lat,
        market.lng
      );
      return {
        ...market,
        distanceKm: realDist,
      };
    });
  }, [supermarkets, userCoordinates, isUsingGps]);

  // Filtered supermarkets for directory
  const filteredSupermarkets = useMemo(() => {
    return supermarketsWithLiveDistances.filter((m) => {
      if (selectedTypeFilter === 'todos') return true;
      return m.type === selectedTypeFilter;
    });
  }, [supermarketsWithLiveDistances, selectedTypeFilter]);

  // Map of products to buy in each supermarket
  const itemsByMarket = useMemo(() => {
    const map: { [marketId: string]: { product: any; quantity: number; price: number; subtotal: number }[] } = {};
    
    selectedMarketIds.forEach((id) => {
      map[id] = [];
    });

    cart.forEach((cartItem) => {
      // Find the cheapest store among the selected ones
      const availablePrices = cartItem.product.prices.filter((p) =>
        selectedMarketIds.includes(p.supermarketId)
      );

      if (availablePrices.length > 0) {
        const best = [...availablePrices].sort((a, b) => a.price - b.price)[0];
        if (map[best.supermarketId]) {
          map[best.supermarketId].push({
            product: cartItem.product,
            quantity: cartItem.quantity,
            price: best.price,
            subtotal: best.price * cartItem.quantity,
          });
        }
      } else {
        // Default to first selected store
        const firstId = selectedMarketIds[0];
        if (firstId && map[firstId]) {
          const p = cartItem.product.prices.find((pr) => pr.supermarketId === firstId) || cartItem.product.prices[0];
          map[firstId].push({
            product: cartItem.product,
            quantity: cartItem.quantity,
            price: p ? p.price : 0,
            subtotal: (p ? p.price : 0) * cartItem.quantity,
          });
        }
      }
    });

    return map;
  }, [cart, selectedMarketIds]);

  // Selected supermarket objects in order
  const selectedMarkets = useMemo(() => {
    return selectedMarketIds
      .map((id) => supermarketsWithLiveDistances.find((s) => s.id === id))
      .filter((s): s is Supermarket => !!s);
  }, [selectedMarketIds, supermarketsWithLiveDistances]);

  // Calculate Route Metrics (Distance, Travel Time, Fuel Cost, Savings)
  const routeMetrics = useMemo(() => {
    if (selectedMarkets.length === 0) {
      return {
        totalDistanceKm: 0,
        totalDurationMin: 0,
        estimatedFuelCost: 0,
        grossSavings: 0,
        netSavings: 0,
        isEconomicallyViable: true,
        legs: [],
      };
    }

    // Legs between stops
    const legs: {
      fromName: string;
      toName: string;
      distanceKm: number;
      durationMin: number;
    }[] = [];

    // Origin -> Stop 1
    const firstStore = selectedMarkets[0];
    let originToFirstKm = firstStore.distanceKm;

    if (userCoordinates && isUsingGps) {
      originToFirstKm = calculateDistanceKm(
        userCoordinates.lat,
        userCoordinates.lng,
        firstStore.lat,
        firstStore.lng
      );
    }

    const originToFirstMin = calculateEstimatedDurationMin(originToFirstKm, vehicleType);
    
    legs.push({
      fromName: isUsingGps ? 'Sua Localização Atual (GPS)' : 'Sua Origem',
      toName: firstStore.name,
      distanceKm: originToFirstKm,
      durationMin: originToFirstMin,
    });

    let totalDist = originToFirstKm;
    let totalDur = originToFirstMin;

    // Intermediate stops (Store 1 -> Store 2 -> ...)
    for (let i = 0; i < selectedMarkets.length - 1; i++) {
      const s1 = selectedMarkets[i];
      const s2 = selectedMarkets[i + 1];
      const interDist = calculateDistanceKm(s1.lat, s1.lng, s2.lat, s2.lng);
      const interDur = calculateEstimatedDurationMin(interDist, vehicleType);
      legs.push({
        fromName: s1.name,
        toName: s2.name,
        distanceKm: interDist,
        durationMin: interDur,
      });
      totalDist += interDist;
      totalDur += interDur;
    }

    // Last Store -> Origin (Return)
    if (returnToOrigin && selectedMarkets.length > 0) {
      const lastStore = selectedMarkets[selectedMarkets.length - 1];
      let returnDist = lastStore.distanceKm;
      if (userCoordinates && isUsingGps) {
        returnDist = calculateDistanceKm(
          lastStore.lat,
          lastStore.lng,
          userCoordinates.lat,
          userCoordinates.lng
        );
      }
      const returnDur = calculateEstimatedDurationMin(returnDist, vehicleType);
      legs.push({
        fromName: lastStore.name,
        toName: isUsingGps ? 'Retorno para Minha Localização' : 'Retorno para Origem',
        distanceKm: returnDist,
        durationMin: returnDur,
      });
      totalDist += returnDist;
      totalDur += returnDur;
    }

    totalDist = +totalDist.toFixed(1);

    // Fuel cost calculation: (Distance / Efficiency) * Price
    let estimatedFuelCost = 0;
    if (vehicleType === 'car') {
      estimatedFuelCost = +((totalDist / fuelEfficiency) * fuelPrice).toFixed(2);
    } else if (vehicleType === 'moto') {
      estimatedFuelCost = +((totalDist / 32) * fuelPrice).toFixed(2); // 32 km/L for motorcycle
    } else if (vehicleType === 'transit') {
      estimatedFuelCost = +(4.40 * 2).toFixed(2); // Bus fare
    }

    // Calculate Gross Savings from Cart if splitting vs most expensive single store
    let grossSavings = 0;
    if (cart.length > 0) {
      const singleStoreTotals = supermarketsWithLiveDistances.map((m) => {
        return cart.reduce((acc, item) => {
          const p = item.product.prices.find((pr) => pr.supermarketId === m.id) || item.product.prices[0];
          return acc + (p ? p.price * item.quantity : 0);
        }, 0);
      });
      const maxSingle = Math.max(...singleStoreTotals);
      const storeItemArrays = Object.values(itemsByMarket) as { product: any; quantity: number; price: number; subtotal: number }[][];
      const optimizedSplitTotal = storeItemArrays.reduce((acc, items) => {
        return acc + items.reduce((iAcc, item) => iAcc + item.subtotal, 0);
      }, 0);
      grossSavings = +(maxSingle - optimizedSplitTotal).toFixed(2);
      if (grossSavings < 0) grossSavings = 0;
    } else {
      grossSavings = selectedMarkets.length > 1 ? 38.50 : 0;
    }

    const netSavings = +(grossSavings - estimatedFuelCost).toFixed(2);
    const isEconomicallyViable = netSavings > 0;

    return {
      totalDistanceKm: totalDist,
      totalDurationMin: totalDur,
      estimatedFuelCost,
      grossSavings,
      netSavings,
      isEconomicallyViable,
      legs,
    };
  }, [
    selectedMarkets,
    vehicleType,
    fuelPrice,
    fuelEfficiency,
    returnToOrigin,
    cart,
    supermarketsWithLiveDistances,
    itemsByMarket,
    userCoordinates,
    isUsingGps,
  ]);

  // Generate Google Maps Multi-Stop Navigation URL starting from User GPS
  const googleMapsUrl = useMemo(() => {
    if (selectedMarkets.length === 0) return '';
    
    const originParam = isUsingGps && userCoordinates
      ? { lat: userCoordinates.lat, lng: userCoordinates.lng }
      : originAddress || selectedCity;

    const destinations = selectedMarkets.map((m) => ({
      lat: m.lat,
      lng: m.lng,
      name: m.name,
      address: m.address,
    }));

    return buildMultiStopNavigationUrl(originParam, destinations, returnToOrigin);
  }, [selectedMarkets, isUsingGps, userCoordinates, originAddress, selectedCity, returnToOrigin]);

  // Generate Waze link to first stop
  const wazeUrl = useMemo(() => {
    if (selectedMarkets.length === 0) return '';
    const first = selectedMarkets[0];
    return buildWazeNavigationUrl(first.lat, first.lng);
  }, [selectedMarkets]);

  // Toggle supermarket in route
  const toggleSupermarketInRoute = (id: string) => {
    setSelectedMarketIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((mId) => mId !== id);
      } else {
        if (prev.length >= 4) {
          alert('Você pode selecionar no máximo 4 supermercados por rota para evitar deslocamento excessivo.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Reorder / Optimize sequence (sort by distance from current location)
  const handleOptimizeSequence = () => {
    const sorted = [...selectedMarkets].sort((a, b) => a.distanceKm - b.distanceKm);
    setSelectedMarketIds(sorted.map((m) => m.id));
  };

  // Handle GPS activation
  const handleUseMyLocation = async () => {
    setIsUsingGps(true);
    if (onRequestLocation) {
      await onRequestLocation();
    }
  };

  // Share Route via WhatsApp
  const handleShareWhatsApp = () => {
    let text = `🛒 *ROTEIRO OTIMIZADO DE SUPERMERCADOS - BUSCAPREÇO*\n\n`;
    text += `📍 *Origem (Ponto de Partida):* ${originAddress}\n`;
    text += `🚗 *Distância Total:* ${routeMetrics.totalDistanceKm} km (~${routeMetrics.totalDurationMin} min)\n`;
    text += `⛽ *Gasto com Combustível:* R$ ${routeMetrics.estimatedFuelCost.toFixed(2).replace('.', ',')}\n`;
    text += `💰 *Economia Líquida Real:* R$ ${routeMetrics.netSavings.toFixed(2).replace('.', ',')} no bolso!\n\n`;
    text += `📋 *ORDEM DAS PARADAS:*\n`;

    selectedMarkets.forEach((market, idx) => {
      text += `\n*${idx + 1}ª Parada: ${market.name}*\n`;
      text += `📍 ${market.address} (${market.distanceKm} km da origem)\n`;
      const items = itemsByMarket[market.id] || [];
      if (items.length > 0) {
        text += `🛍️ *Itens para comprar aqui:*\n`;
        items.forEach((it) => {
          text += `  • ${it.quantity}x ${it.product.name} (R$ ${it.price.toFixed(2).replace('.', ',')})\n`;
        });
        const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
        text += `  👉 Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
      }
    });

    if (returnToOrigin) {
      text += `\n🏁 *Destino Final:* Retorno para a Origem\n`;
    }

    text += `\n🗺️ *Iniciar Navegação GPS no Google Maps:* ${googleMapsUrl}\n`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copy Itinerary
  const handleCopyItinerary = () => {
    let text = `ROTEIRO DE COMPRAS - BUSCAPREÇO SUPERMERCADOS\n\n`;
    text += `Origem: ${originAddress}\n`;
    text += `Distância Total: ${routeMetrics.totalDistanceKm} km (${routeMetrics.totalDurationMin} minutos)\n`;
    text += `Economia Líquida: R$ ${routeMetrics.netSavings.toFixed(2).replace('.', ',')}\n\n`;
    text += `PARADAS:\n`;

    selectedMarkets.forEach((m, idx) => {
      text += `${idx + 1}. ${m.name} - ${m.address}\n`;
      const items = itemsByMarket[m.id] || [];
      if (items.length > 0) {
        items.forEach((it) => {
          text += `   - ${it.quantity}x ${it.product.name}: R$ ${it.subtotal.toFixed(2).replace('.', ',')}\n`;
        });
      }
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateToSearch}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700 hover:text-stone-900 transition shadow-2xs cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 text-emerald-600 rotate-180" />
          <span>Voltar ao Início (Buscar Produtos)</span>
        </button>

        <button
          type="button"
          onClick={onNavigateToCart}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition cursor-pointer"
        >
          <span>Ver Carrinho ({cart.length} itens)</span>
        </button>
      </div>

      {/* Top Banner: Route & Fuel Savings Headline */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Navigation className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Navegação GPS & Otimizador de Rotas
            </span>

            {userCoordinates ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
                GPS Ativo: Iniciando da sua posição atual
              </span>
            ) : (
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition cursor-pointer shadow-xs"
              >
                <LocateFixed className="w-3.5 h-3.5 text-stone-950" />
                {isLocating ? 'Detectando GPS...' : 'Usar Minha Localização Atual (GPS)'}
              </button>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Inicie Rotas Diretamente da Sua Localização
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Calculamos a distância real a partir de onde você está, ordenamos as paradas mais próximas e traçamos o trajeto completo no Google Maps e Waze com navegação curva a curva.
          </p>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-stone-300 block">Distância Total</span>
              <span className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-1 mt-0.5">
                <Navigation className="w-4 h-4 text-emerald-400" />
                {routeMetrics.totalDistanceKm} km
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-stone-300 block">Tempo Estimado</span>
              <span className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-amber-400" />
                ~{routeMetrics.totalDurationMin} min
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-stone-300 block">Gasto de Combustível</span>
              <span className="text-lg sm:text-xl font-extrabold text-stone-200 flex items-center gap-1 mt-0.5">
                <Fuel className="w-4 h-4 text-rose-400" />
                R$ {routeMetrics.estimatedFuelCost.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="bg-emerald-600/90 rounded-2xl p-3 border border-emerald-400/40 shadow-inner">
              <span className="text-[11px] text-emerald-100 block font-medium">Economia Líquida Real</span>
              <span className="text-lg sm:text-xl font-black text-white flex items-center gap-1 mt-0.5">
                <Sparkles className="w-4 h-4 text-emerald-200" />
                R$ {routeMetrics.netSavings.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Quick Direct Start GPS Button */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-stone-950 fill-stone-950" />
              <span>Iniciar Navegação GPS no Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {wazeUrl && (
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl flex items-center gap-2 transition cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Navegar pelo Waze</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Route Settings & Itinerary | Right Interactive Map & Store Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Route Configuration & Step-by-Step Stops (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* 1. Origin & User Location Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">Ponto de Partida da Rota</h3>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">{selectedCity}</span>
            </div>

            {/* GPS Status Banner */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition ${
                userCoordinates
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      userCoordinates
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    <LocateFixed className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">
                      {userCoordinates ? 'Localização GPS Detectada' : 'Usar sua localização em tempo real'}
                    </h4>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {userCoordinates
                        ? userCoordinates.address || `Lat: ${userCoordinates.lat.toFixed(4)}, Lng: ${userCoordinates.lng.toFixed(4)}`
                        : 'Permita o acesso ao GPS para traçar rotas saindo exatamente de onde você está.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    userCoordinates
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Buscando...' : userCoordinates ? 'Atualizar GPS' : 'Ativar GPS'}</span>
                </button>
              </div>

              {locationError && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}
            </div>

            {/* Custom Origin Input Option */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Ou digite um endereço / ponto de partida personalizado:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={originAddress}
                  onChange={(e) => {
                    setOriginAddress(e.target.value);
                    setIsUsingGps(false);
                  }}
                  placeholder="Ex: Av. Paulista, 1000 ou Minha Casa"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1"
                >
                  <LocateFixed className="w-3 h-3 text-emerald-700" />
                  Meu GPS
                </button>
              </div>
            </div>

            {/* Vehicle Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Meio de Transporte
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'car', label: 'Carro', icon: Car },
                  { id: 'moto', label: 'Moto', icon: Zap },
                  { id: 'bike', label: 'Bicicleta', icon: Bike },
                  { id: 'walk', label: 'A Pé', icon: Footprints },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = vehicleType === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setVehicleType(mode.id as VehicleType)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-2xs'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-emerald-600' : 'text-stone-500'}`} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fuel Consumption Settings (if Car or Moto) */}
            {vehicleType === 'car' && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-stone-600 font-medium block mb-1">
                    Preço Combustível
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-stone-400 font-semibold">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="3.00"
                      max="10.00"
                      value={fuelPrice}
                      onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 5.89)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800"
                    />
                    <span className="text-[10px] text-stone-500">/L</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-stone-600 font-medium block mb-1">
                    Consumo Médio
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="5"
                      max="30"
                      value={fuelEfficiency}
                      onChange={(e) => setFuelEfficiency(parseFloat(e.target.value) || 10.5)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800"
                    />
                    <span className="text-[10px] text-stone-500">km/L</span>
                  </div>
                </div>
              </div>
            )}

            {/* Return to Origin Checkbox */}
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={returnToOrigin}
                onChange={(e) => setReturnToOrigin(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <span>Calcular trajeto de volta para o ponto de partida</span>
            </label>
          </div>

          {/* 2. Step-by-Step Itinerary List */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Roteiro de Paradas ({selectedMarkets.length} lojas)
                </h3>
                <p className="text-[11px] text-stone-500">
                  Trajeto otimizado a partir da sua localização
                </p>
              </div>

              <button
                type="button"
                onClick={handleOptimizeSequence}
                title="Ordenar por proximidade da sua localização"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer border border-emerald-200"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mais Próximos Primeiro</span>
              </button>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
              
              {/* Origin Stop */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white shadow-xs">
                  <LocateFixed className="w-3 h-3 text-white" />
                </div>
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                      Partida (Origem)
                    </span>
                    {userCoordinates && isUsingGps && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                        GPS
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">
                    {originAddress}
                  </h4>
                </div>
              </div>

              {/* Supermarket Stops */}
              {selectedMarkets.map((market, idx) => {
                const items = itemsByMarket[market.id] || [];
                const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);

                return (
                  <div key={market.id} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[11px] font-bold ring-4 ring-white shadow-xs">
                      {idx + 1}
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-stone-200 hover:border-emerald-500 shadow-2xs transition space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-stone-900">{market.name}</h4>
                            <span className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0.2 rounded font-bold">
                              {market.distanceKm} km
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">{market.address}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSupermarketInRoute(market.id)}
                          title="Remover parada"
                          className="text-stone-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Items to buy in this supermarket */}
                      {items.length > 0 ? (
                        <div className="bg-emerald-50/70 rounded-lg p-2.5 border border-emerald-200/60 text-xs">
                          <div className="flex items-center justify-between font-bold text-emerald-900 text-[11px] mb-1">
                            <span className="flex items-center gap-1">
                              <Store className="w-3 h-3 text-emerald-700" />
                              {items.length} produto{items.length > 1 ? 's' : ''} mais barato{items.length > 1 ? 's' : ''} aqui:
                            </span>
                            <span className="text-emerald-800 font-extrabold">
                              R$ {subtotal.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <ul className="space-y-0.5 text-[11px] text-stone-600">
                            {items.map((it) => (
                              <li key={it.product.id} className="truncate">
                                • {it.quantity}x {it.product.name} (R$ {it.price.toFixed(2).replace('.', ',')})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic">
                          Nenhum item do carrinho atribuído a esta loja.
                        </p>
                      )}

                      {/* Individual Store GPS Navigation Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                        <div className="flex items-center gap-2 text-[10px] text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {market.openingHours ? market.openingHours.split('|')[0] : '07h às 22h'}
                          </span>
                        </div>

                        <a
                          href={buildDirectGpsNavigationUrl(market, userCoordinates)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Como Chegar</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Destination Stop */}
              {returnToOrigin && (
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white shadow-xs">
                    🏁
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
                    <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                      Destino Final
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">
                      Retorno para {originAddress}
                    </h4>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Abrir Rota com GPS no Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleCopyItinerary}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2.5 rounded-xl border border-stone-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Layers className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Rota'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Visual Map & Supermarket Directory (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. Interactive Visual Route Map */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold">
                  Mapa da Rota ({userCoordinates ? 'Iniciando da sua posição GPS' : selectedCity})
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-300">
                <span>Zoom</span>
                <button
                  onClick={() => setMapZoom((prev) => Math.min(prev + 0.2, 1.6))}
                  className="w-6 h-6 bg-stone-800 hover:bg-stone-700 rounded text-center font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => setMapZoom((prev) => Math.max(prev - 0.2, 0.8))}
                  className="w-6 h-6 bg-stone-800 hover:bg-stone-700 rounded text-center font-bold"
                >
                  -
                </button>
              </div>
            </div>

            {/* Map Canvas / SVG Representation */}
            <div className="relative w-full h-80 sm:h-96 bg-stone-950 overflow-hidden select-none flex items-center justify-center">
              {/* Grid Background Effect */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(#48bb78 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                  backgroundPosition: '0 0, 12px 12px',
                  transform: `scale(${mapZoom})`,
                  transition: 'transform 0.2s ease-out',
                }}
              />

              {/* Map Canvas Graphic */}
              <svg
                viewBox="0 0 600 400"
                className="w-full h-full object-contain"
                style={{ transform: `scale(${mapZoom})`, transition: 'transform 0.2s ease-out' }}
              >
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>
                </defs>

                {/* City Avenues & Rings */}
                <path
                  d="M 50,200 Q 250,50 550,220"
                  stroke="#334155"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 120,50 Q 280,350 480,380"
                  stroke="#334155"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 100,320 L 500,100"
                  stroke="#1e293b"
                  strokeWidth="12"
                  fill="none"
                />
                <circle cx="300" cy="200" r="140" stroke="#1e293b" strokeWidth="2" strokeDasharray="6 6" fill="none" />

                {/* Animated Route Line connecting active stops */}
                {selectedMarkets.length > 0 && (
                  <path
                    d={`M 150,280 ${selectedMarkets
                      .map((m) => {
                        const x = m.id === 'assai' ? 440 : m.id === 'atacadao' ? 420 : m.id === 'carrefour' ? 240 : m.id === 'pao-de-acucar' ? 320 : m.id === 'extra' ? 380 : 190;
                        const y = m.id === 'assai' ? 310 : m.id === 'atacadao' ? 120 : m.id === 'carrefour' ? 210 : m.id === 'pao-de-acucar' ? 140 : m.id === 'extra' ? 320 : 250;
                        return `L ${x},${y}`;
                      })
                      .join(' ')} ${returnToOrigin ? 'L 150,280' : ''}`}
                    stroke="url(#routeGradient)"
                    strokeWidth="4"
                    strokeDasharray="8 4"
                    fill="none"
                    filter="url(#glow)"
                    className="animate-pulse"
                  />
                )}

                {/* Origin Pin (User GPS / Location) */}
                <g transform="translate(150, 280)">
                  <circle r="18" fill="#10b981" opacity="0.3" className="animate-ping" />
                  <circle r="14" fill="#059669" stroke="#ffffff" strokeWidth="2.5" />
                  <text y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                    📍
                  </text>
                  <text y="24" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold">
                    {userCoordinates ? 'Você (GPS)' : 'Origem'}
                  </text>
                </g>

                {/* Supermarket Pins */}
                {supermarketsWithLiveDistances.map((market) => {
                  const isSelected = selectedMarketIds.includes(market.id);
                  const stopIndex = selectedMarketIds.indexOf(market.id);

                  const x = market.id === 'assai' ? 440 : market.id === 'atacadao' ? 420 : market.id === 'carrefour' ? 240 : market.id === 'pao-de-acucar' ? 320 : market.id === 'extra' ? 380 : 190;
                  const y = market.id === 'assai' ? 310 : market.id === 'atacadao' ? 120 : market.id === 'carrefour' ? 210 : market.id === 'pao-de-acucar' ? 140 : market.id === 'extra' ? 320 : 250;

                  return (
                    <g
                      key={market.id}
                      transform={`translate(${x}, ${y})`}
                      className="cursor-pointer transition hover:scale-110"
                      onClick={() => {
                        setActiveMarketDetail(market);
                        toggleSupermarketInRoute(market.id);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <circle r="18" fill={market.logoColor} opacity="0.4" />
                          <circle r="14" fill={market.logoColor} stroke="#ffffff" strokeWidth="2" />
                          <text y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                            {stopIndex + 1}
                          </text>
                        </>
                      ) : (
                        <>
                          <circle r="10" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                          <circle r="4" fill="#ffffff" />
                        </>
                      )}

                      {/* Store Label */}
                      <rect
                        x="-45"
                        y={isSelected ? "18" : "14"}
                        width="90"
                        height="18"
                        rx="4"
                        fill="#0f172a"
                        stroke={isSelected ? "#10b981" : "#334155"}
                        strokeWidth="1"
                        opacity="0.9"
                      />
                      <text
                        y={isSelected ? "31" : "27"}
                        textAnchor="middle"
                        fill={isSelected ? "#ffffff" : "#cbd5e1"}
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {market.name.split(' ')[0]} ({market.distanceKm}km)
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Floating Legend */}
              <div className="absolute bottom-3 left-3 bg-stone-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-700 text-[11px] text-stone-300 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Na Rota ({selectedMarkets.length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-500" /> Outras Redes
                </span>
              </div>

              {/* Waze Quick Button */}
              {wazeUrl && (
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1 transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Abrir no Waze
                </a>
              )}
            </div>
          </div>

          {/* 2. Supermarkets Directory & Multi-Stop Toggle List */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Supermercados e Atacarejos Próximos
                </h3>
                <p className="text-[11px] text-stone-500">
                  {userCoordinates ? 'Distâncias calculadas a partir do seu GPS' : `Distâncias médias em ${selectedCity}`}
                </p>
              </div>

              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-[11px]">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'atacarejo', label: 'Atacarejos' },
                  { id: 'hipermercado', label: 'Hipermercados' },
                  { id: 'supermercado', label: 'Super' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedTypeFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      selectedTypeFilter === f.id
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Supermarket Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSupermarkets.map((market) => {
                const isSelected = selectedMarketIds.includes(market.id);
                const orderIndex = selectedMarketIds.indexOf(market.id);

                return (
                  <div
                    key={market.id}
                    className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-xs'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                            style={{ backgroundColor: market.logoColor }}
                          >
                            {market.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-stone-900 leading-tight">
                              {market.name}
                            </h4>
                            <span className="text-[10px] text-stone-500 font-medium block">
                              {market.type.toUpperCase()} • a {market.distanceKm} km
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {isSelected ? `${orderIndex + 1}ª Parada` : 'Fora da rota'}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-600 line-clamp-1 mb-2">
                        {market.address}
                      </p>

                      {/* Amenities Pills */}
                      {market.features && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {market.features.slice(0, 2).map((feat, fIdx) => (
                            <span
                              key={fIdx}
                              className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Button */}
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => toggleSupermarketInRoute(market.id)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover da Rota
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Adicionar à Rota
                          </>
                        )}
                      </button>

                      <a
                        href={buildDirectGpsNavigationUrl(market, userCoordinates)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Navegar direto para este supermercado"
                        className="p-2 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 rounded-xl transition"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>

                      {market.phone && (
                        <a
                          href={`tel:${market.phone.replace(/\D/g, '')}`}
                          title="Ligar para o supermercado"
                          className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
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
