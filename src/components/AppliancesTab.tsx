import React, { useState, useMemo } from 'react';
import {
  Search,
  Zap,
  SlidersHorizontal,
  Flame,
  Wind,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Store,
  ExternalLink,
  MapPin,
  Navigation,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  Percent,
  TrendingDown,
  Info,
  Scale,
  Truck,
  Copy,
  ChevronRight,
  Filter,
  Check,
  X,
  Plus,
  Compass,
} from 'lucide-react';
import { ApplianceProduct, ApplianceSubcategory, ApplianceStoreOffer, AppliancePhysicalStore, Product } from '../types';
import { INITIAL_APPLIANCE_PRODUCTS, INITIAL_APPLIANCE_STORES } from '../data/mockAppliances';
import { UserCoordinates, calculateDistanceKm, calculateEstimatedDurationMin } from '../utils/geolocation';

interface AppliancesTabProps {
  selectedCity: string;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onNavigateToAiSearch?: (query: string) => void;
  onNavigateToRoutes?: () => void;
  initialSearchQuery?: string;
  userCoordinates?: UserCoordinates | null;
}

export const APPLIANCE_SUBCATEGORIES: { id: 'todos' | ApplianceSubcategory; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todos os Eletros', icon: '⚡' },
  { id: 'geladeiras', label: 'Geladeiras & Freezers', icon: '❄️' },
  { id: 'lavadoras', label: 'Lavadoras & Lava e Seca', icon: '🧺' },
  { id: 'airfryer', label: 'Air Fryers & Fritadeiras', icon: '🍟' },
  { id: 'microondas', label: 'Micro-ondas & Fornos', icon: '🍲' },
  { id: 'fogoes', label: 'Fogões & Cooktops', icon: '🔥' },
  { id: 'lavaloucas', label: 'Lava-Louças', icon: '🍽️' },
  { id: 'climatizacao', label: 'Ar-Condicionado', icon: '💨' },
  { id: 'portateis', label: 'Eletroportáteis & Robôs', icon: '☕' },
];

export const QUICK_APPLIANCE_TAGS = [
  'Geladeira Frost Free Inox',
  'Air Fryer 4 Litros',
  'Lava e Seca Inverter',
  'Cooktop de Indução',
  'Micro-ondas 32L Espelhado',
  'Ar-Condicionado Dual Inverter',
  'Lava-Louças 14 Serviços',
  'Robô Aspirador WAP',
];

export const AppliancesTab: React.FC<AppliancesTabProps> = ({
  selectedCity,
  onAddToCart,
  onNavigateToAiSearch,
  onNavigateToRoutes,
  initialSearchQuery = '',
  userCoordinates,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedSubcategory, setSelectedSubcategory] = useState<'todos' | ApplianceSubcategory>('todos');
  const [selectedVoltage, setSelectedVoltage] = useState<string>('todos');
  const [selectedEnergyRating, setSelectedEnergyRating] = useState<string>('todos');
  const [selectedBrand, setSelectedBrand] = useState<string>('todos');
  const [selectedFinish, setSelectedFinish] = useState<string>('todos');
  const [onlyHistoricLow, setOnlyHistoricLow] = useState<boolean>(false);
  const [onlyFreeShipping, setOnlyFreeShipping] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(7000);
  const [sortBy, setSortBy] = useState<'lowest_price' | 'highest_savings' | 'lowest_energy' | 'rating' | 'name'>('lowest_price');

  // Modal & Comparative state
  const [selectedProductDetails, setSelectedProductDetails] = useState<ApplianceProduct | null>(null);
  const [comparisonList, setComparisonList] = useState<ApplianceProduct[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [electricityTariff, setElectricityTariff] = useState<number>(0.85); // R$ por kWh médio no Brasil

  // Extract unique brands for filter
  const brandsList = useMemo(() => {
    const brands = Array.from(new Set(INITIAL_APPLIANCE_PRODUCTS.map((p) => p.brand)));
    return ['todos', ...brands.sort()];
  }, []);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return INITIAL_APPLIANCE_PRODUCTS.filter((product) => {
      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesBrand = product.brand.toLowerCase().includes(q);
        const matchesModel = product.model.toLowerCase().includes(q);
        const matchesFeatures = product.keyFeatures.some((f) => f.toLowerCase().includes(q));
        const matchesCapacity = product.capacity.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesModel && !matchesFeatures && !matchesCapacity) {
          return false;
        }
      }

      // Subcategory filter
      if (selectedSubcategory !== 'todos' && product.subcategory !== selectedSubcategory) {
        return false;
      }

      // Voltage filter
      if (selectedVoltage !== 'todos') {
        if (selectedVoltage === '110V' && !product.voltage.includes('110V') && product.voltage !== 'Bivolt') return false;
        if (selectedVoltage === '220V' && !product.voltage.includes('220V') && product.voltage !== 'Bivolt') return false;
        if (selectedVoltage === 'Bivolt' && product.voltage !== 'Bivolt') return false;
      }

      // Energy rating filter
      if (selectedEnergyRating !== 'todos' && product.energyRating !== selectedEnergyRating) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'todos' && product.brand !== selectedBrand) {
        return false;
      }

      // Finish / Color filter
      if (selectedFinish !== 'todos') {
        if (selectedFinish === 'inox' && !product.colorFinish.toLowerCase().includes('inox')) return false;
        if (selectedFinish === 'branco' && !product.colorFinish.toLowerCase().includes('branco')) return false;
        if (selectedFinish === 'preto' && !product.colorFinish.toLowerCase().includes('preto')) return false;
      }

      // Historic low only filter
      if (onlyHistoricLow && !product.isHistoricLow) {
        return false;
      }

      // Free shipping filter
      if (onlyFreeShipping && !product.offers.some((o) => o.freeShipping)) {
        return false;
      }

      // Price filter
      if (product.lowestPrice > maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'lowest_price') {
        return a.lowestPrice - b.lowestPrice;
      }
      if (sortBy === 'highest_savings') {
        const savingsA = a.highestPrice - a.lowestPrice;
        const savingsB = b.highestPrice - b.lowestPrice;
        return savingsB - savingsA;
      }
      if (sortBy === 'lowest_energy') {
        return a.monthlyEnergyKwh - b.monthlyEnergyKwh;
      }
      if (sortBy === 'rating') {
        const maxRatingA = Math.max(...a.offers.map((o) => o.rating));
        const maxRatingB = Math.max(...b.offers.map((o) => o.rating));
        return maxRatingB - maxRatingA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [
    searchQuery,
    selectedSubcategory,
    selectedVoltage,
    selectedEnergyRating,
    selectedBrand,
    selectedFinish,
    onlyHistoricLow,
    onlyFreeShipping,
    maxPrice,
    sortBy,
  ]);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const toggleCompare = (product: ApplianceProduct) => {
    setComparisonList((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], product];
      }
      return [...prev, product];
    });
  };

  const openGps = (address: string) => {
    const originQuery =
      userCoordinates?.lat && userCoordinates?.lng
        ? `${userCoordinates.lat},${userCoordinates.lng}`
        : 'My+Location';
    const dest = encodeURIComponent(address);
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${dest}&travelmode=driving`,
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Eletrodomésticos & Linha Branca */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          {/* Search Input Bar */}
          <div className="relative flex flex-col sm:flex-row gap-2 mb-5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                id="main-appliance-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque por eletrodoméstico, marca, modelo ou recurso (Ex: Geladeira Brastemp Frost Free, Air Fryer Walita, Lava e Seca 11kg)..."
                className="w-full pl-11 pr-20 py-3 bg-white text-stone-900 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-sky-400 focus:outline-hidden shadow-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-700 text-xs font-bold px-2 py-1 bg-stone-100 rounded-md cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {onNavigateToAiSearch && (
              <button
                type="button"
                onClick={() => onNavigateToAiSearch(searchQuery || 'Qual a melhor geladeira custo-benefício 2026?')}
                className="bg-sky-600 hover:opacity-90 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Pesquisar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Comparador Oficial de Eletrodomésticos
            </span>
            <span className="bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Selo Procel A+++ & Eficiência Energética
            </span>
            <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              Magalu • Casas Bahia • Fast Shop • Amazon • Mercado Livre
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Pesquise e Compare Preços de Eletrodomésticos
          </h2>
          <p className="text-stone-300 text-sm max-w-3xl leading-relaxed">
            Compare geladeiras Frost Free, lavadoras e lava e seca, air fryers, fornos e micro-ondas, cooktops de indução e ar-condicionado. Encontre descontos à vista no Pix, cupons ativos e lojas com showroom físico perto de você em <span className="text-sky-300 font-bold">{selectedCity}</span>.
          </p>

          {/* Quick Search Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] font-semibold text-stone-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Sugestões rápidas:
            </span>
            {QUICK_APPLIANCE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-[11px] bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white px-2.5 py-1 rounded-full border border-white/15 transition cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Quick Stats Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-stone-800/80">
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3">
              <span className="text-[11px] text-stone-400 font-medium block">Maior Economia no Pix</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">Até 15% OFF</span>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3">
              <span className="text-[11px] text-stone-400 font-medium block">Lojas Comparadas</span>
              <span className="text-base sm:text-lg font-black text-sky-400">+8 Grandes Varejos</span>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3">
              <span className="text-[11px] text-stone-400 font-medium block">Selo Econômico</span>
              <span className="text-base sm:text-lg font-black text-amber-400">Procel A+++</span>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3">
              <span className="text-[11px] text-stone-400 font-medium block">Histórico de Preços</span>
              <span className="text-base sm:text-lg font-black text-indigo-400">Últimos 6 Meses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Floating Bar if items are selected */}
      {comparisonList.length > 0 && (
        <div className="sticky top-20 z-30 bg-stone-900 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-white shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Comparador Ativo ({comparisonList.length}/3 selecionados)
              </h4>
              <p className="text-[11px] text-stone-300">
                {comparisonList.map((p) => p.brand + ' ' + p.model).join(' • ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setComparisonList([])}
              className="text-xs text-stone-400 hover:text-white px-3 py-1.5 rounded-lg border border-stone-700 hover:border-stone-600 transition cursor-pointer"
            >
              Limpar
            </button>
            <button
              onClick={() => setShowComparisonModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              Comparar Especificações Lado a Lado
            </button>
          </div>
        </div>
      )}

      {/* Subcategory Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {APPLIANCE_SUBCATEGORIES.map((cat) => {
          const isActive = selectedSubcategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedSubcategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap border transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-stone-200 space-y-4">
        {/* Advanced Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Voltagem */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Voltagem
            </label>
            <select
              value={selectedVoltage}
              onChange={(e) => setSelectedVoltage(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todas as Voltagens</option>
              <option value="110V">110V (127V)</option>
              <option value="220V">220V</option>
              <option value="Bivolt">Bivolt Automático</option>
            </select>
          </div>

          {/* Eficiência Procel */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Selo Procel
            </label>
            <select
              value={selectedEnergyRating}
              onChange={(e) => setSelectedEnergyRating(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todos os Selos</option>
              <option value="A+++">A+++ (Mais Econômico)</option>
              <option value="A++">A++</option>
              <option value="A+">A+</option>
              <option value="A">Selo A</option>
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Marca
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-sky-500"
            >
              {brandsList.map((b) => (
                <option key={b} value={b}>
                  {b === 'todos' ? 'Todas as Marcas' : b}
                </option>
              ))}
            </select>
          </div>

          {/* Acabamento / Cor */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Acabamento
            </label>
            <select
              value={selectedFinish}
              onChange={(e) => setSelectedFinish(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todos os Acabamentos</option>
              <option value="inox">Inox / Evox</option>
              <option value="branco">Branco</option>
              <option value="preto">Preto / Black Inox</option>
            </select>
          </div>

          {/* Ordenação */}
          <div>
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Ordenar Por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-sky-500"
            >
              <option value="lowest_price">Menor Preço à Vista (Pix)</option>
              <option value="highest_savings">Maior Economia (R$)</option>
              <option value="lowest_energy">Menor Consumo de Energia</option>
              <option value="rating">Melhor Avaliação</option>
              <option value="name">Nome (A - Z)</option>
            </select>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-col justify-end gap-1.5">
            <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={onlyHistoricLow}
                onChange={(e) => setOnlyHistoricLow(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>🔥 Menor preço 40 dias</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={onlyFreeShipping}
                onChange={(e) => setOnlyFreeShipping(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>🚚 Frete Grátis</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-stone-900">
            {filteredProducts.length} eletrodomésticos encontrados
          </span>
          {searchQuery && (
            <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-md">
              Termo: "{searchQuery}"
            </span>
          )}
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
          <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-stone-800">Nenhum eletrodoméstico encontrado com os filtros atuais</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Tente remover alguns filtros de voltagem, marca ou acabamento, ou realize uma busca mais genérica como "Geladeira", "Air Fryer" ou "Lava e Seca".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSubcategory('todos');
              setSelectedVoltage('todos');
              setSelectedEnergyRating('todos');
              setSelectedBrand('todos');
              setSelectedFinish('todos');
              setOnlyHistoricLow(false);
              setOnlyFreeShipping(false);
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const bestOffer = product.offers[0] || null;
            const savings = product.highestPrice - product.lowestPrice;
            const savingsPercent = Math.round((savings / product.highestPrice) * 100);
            const isComparing = comparisonList.some((p) => p.id === product.id);

            // Calculate estimated monthly electricity cost: kWh * tariff
            const monthlyCost = (product.monthlyEnergyKwh * electricityTariff).toFixed(2);

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Top Image Banner */}
                <div className="relative h-56 bg-stone-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="bg-sky-950/80 backdrop-blur-md border border-sky-400/40 text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {product.brand} • {product.model}
                    </span>

                    {product.isHistoricLow && (
                      <span className="bg-rose-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <TrendingDown className="w-3 h-3" />
                        Menor Preço 40 dias
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Stats */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Selo {product.energyRating} ({product.monthlyEnergyKwh > 0 ? `~R$ ${monthlyCost}/mês` : 'Gás'})
                    </span>

                    <span className="bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-semibold">
                      {product.voltage}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Subcategory & Capacity */}
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        {product.capacity}
                      </span>
                      <span>{product.colorFinish}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-sky-700 transition">
                      {product.name}
                    </h3>

                    {/* Key Highlights */}
                    <ul className="text-xs text-stone-600 space-y-1 mb-3">
                      {product.keyFeatures.slice(0, 2).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing Comparison Box */}
                  <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">
                          Menor Preço à Vista (Pix)
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-stone-950">
                            R$ {product.lowestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {savings > 0 && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                              -{savingsPercent}%
                            </span>
                          )}
                        </div>
                      </div>

                      {bestOffer && (
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 font-medium block">Loja Líder:</span>
                          <span className="text-xs font-bold text-stone-800">{bestOffer.storeName}</span>
                        </div>
                      )}
                    </div>

                    {bestOffer && (
                      <div className="text-[11px] text-stone-600 flex items-center justify-between pt-1 border-t border-stone-200/60">
                        <span>
                          ou <strong>{bestOffer.installmentCount}x de R$ {bestOffer.installmentValue.toFixed(2)}</strong> sem juros
                        </span>
                        {bestOffer.freeShipping && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Truck className="w-3 h-3" /> Frete Grátis
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Store Offers Preview */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Comparativo em {product.offers.length} Lojas:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {product.offers.slice(0, 4).map((offer) => (
                        <div
                          key={offer.storeId}
                          className="bg-white border border-stone-200 rounded-xl p-2 text-left flex flex-col justify-between text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-800 text-[11px] truncate">{offer.storeName}</span>
                            {offer.couponCode && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1 rounded">
                                Cupom
                              </span>
                            )}
                          </div>
                          <span className="font-extrabold text-stone-900 text-xs mt-1">
                            R$ {offer.cashPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => toggleCompare(product)}
                      className={`flex-1 text-xs font-semibold py-2.5 px-3 rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isComparing
                          ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      {isComparing ? 'Selecionado' : 'Comparar'}
                    </button>

                    <button
                      onClick={() => setSelectedProductDetails(product)}
                      className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Ver Todas Ofertas</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Energy Cost Simulator Widget */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-amber-950">
                Calculadora de Consumo de Energia Elétrica (Selo Procel)
              </h3>
            </div>
            <p className="text-xs text-amber-800 max-w-2xl">
              Eletrodomésticos com Selo Procel A+++ consomem até 35% menos energia por mês do que modelos convencionais de 5 anos atrás. Ajuste sua tarifa de energia para calcular o custo mensal real de funcionamento.
            </p>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-3 flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">Tarifa de Energia (R$/kWh)</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.50"
                  max="1.30"
                  step="0.05"
                  value={electricityTariff}
                  onChange={(e) => setElectricityTariff(parseFloat(e.target.value))}
                  className="w-24 accent-amber-600"
                />
                <span className="text-xs font-bold text-stone-900">R$ {electricityTariff.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-200 flex items-center justify-between z-10">
              <div>
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-full">
                  {selectedProductDetails.brand} • {selectedProductDetails.model}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                  {selectedProductDetails.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Product Overview Top */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 rounded-2xl overflow-hidden bg-stone-100 h-64 border border-stone-200">
                  <img
                    src={selectedProductDetails.imageUrl}
                    alt={selectedProductDetails.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="md:col-span-2 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                      Selo Procel {selectedProductDetails.energyRating}
                    </span>
                    <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                      Voltagem: {selectedProductDetails.voltage}
                    </span>
                    <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                      Capacidade: {selectedProductDetails.capacity}
                    </span>
                    <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                      Garantia: {selectedProductDetails.warrantyMonths} Meses
                    </span>
                  </div>

                  <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 space-y-1">
                    <span className="text-xs text-sky-900 font-medium">Preço à Vista com Desconto:</span>
                    <div className="text-2xl font-black text-sky-950">
                      R$ {selectedProductDetails.lowestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-xs text-sky-800 font-semibold block">
                      Variação de mercado: R$ {selectedProductDetails.lowestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} até R$ {selectedProductDetails.highestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Economia de até R$ {(selectedProductDetails.highestPrice - selectedProductDetails.lowestPrice).toFixed(2)})
                    </span>
                  </div>

                  {/* Key Features */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Destaques & Recursos:
                    </h4>
                    <ul className="text-xs text-stone-600 space-y-1">
                      {selectedProductDetails.keyFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* All Online Retail Store Offers */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-sky-600" />
                  Preços e Ofertas em Grandes Varejistas Online
                </h4>

                <div className="space-y-2">
                  {selectedProductDetails.offers.map((offer) => (
                    <div
                      key={offer.storeId}
                      className="bg-stone-50 hover:bg-stone-100/70 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{offer.storeName}</span>
                          <span className="text-[10px] text-stone-500">★ {offer.rating} ({offer.reviewCount} avaliações)</span>
                          {offer.freeShipping && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Frete Grátis
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-stone-600 flex flex-wrap items-center gap-2">
                          <span>{offer.cashDiscountLabel || 'À vista no Pix'}</span>
                          <span>•</span>
                          <span>{offer.installmentCount}x de R$ {offer.installmentValue.toFixed(2)} s/ juros</span>
                        </div>

                        {offer.couponCode && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300">
                              Cupom: {offer.couponCode} (-R$ {offer.couponDiscountValue})
                            </span>
                            <button
                              onClick={() => handleCopyCoupon(offer.couponCode!)}
                              className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold underline cursor-pointer"
                            >
                              {copiedCoupon === offer.couponCode ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:text-right shrink-0">
                        <div>
                          <span className="text-xs text-stone-400 block font-medium">Valor à Vista</span>
                          <span className="text-lg font-black text-stone-950">
                            R$ {offer.cashPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <a
                          href={offer.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>Ir à Loja</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Showrooms Nearby */}
              <div className="space-y-3 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Lojas com Showroom e Pronta Entrega na sua Região ({selectedCity})
                  </h4>
                  {onNavigateToRoutes && (
                    <button
                      onClick={() => {
                        setSelectedProductDetails(null);
                        onNavigateToRoutes();
                      }}
                      className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      Ver no Mapa de Rotas
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProductDetails.nearbyStores.map((store) => (
                    <div
                      key={store.id}
                      className="bg-white border border-stone-200 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-xs">{store.name}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            Mostruário Disponível
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">{store.address}</p>
                        <p className="text-[11px] text-stone-500">{store.openingHours}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                        <span className="font-bold text-stone-700">~{store.distanceKm} km ({store.durationMin} min)</span>
                        <button
                          onClick={() => openGps(store.address)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-emerald-600" />
                          GPS Rota
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Table */}
              <div className="space-y-3 pt-4 border-t border-stone-200">
                <h4 className="text-sm font-bold text-stone-900">Especificações Técnicas Completas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-bold">ALTURA</span>
                    <span className="font-bold text-stone-800">{selectedProductDetails.dimensions.heightCm} cm</span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-bold">LARGURA</span>
                    <span className="font-bold text-stone-800">{selectedProductDetails.dimensions.widthCm} cm</span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-bold">PROFUNDIDADE</span>
                    <span className="font-bold text-stone-800">{selectedProductDetails.dimensions.depthCm} cm</span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-[10px] text-stone-400 block font-bold">PESO LÍQUIDO</span>
                    <span className="font-bold text-stone-800">{selectedProductDetails.dimensions.weightKg} kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showComparisonModal && comparisonList.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-200 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-bold text-stone-900">
                  Comparativo Técnico Lado a Lado ({comparisonList.length} itens)
                </h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 bg-stone-50 font-bold text-stone-500 uppercase border-b border-stone-200 w-44">
                      Especificação
                    </th>
                    {comparisonList.map((item) => (
                      <th key={item.id} className="p-3 bg-stone-50 border-b border-stone-200 min-w-[220px]">
                        <div className="space-y-2">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-28 object-cover rounded-xl border border-stone-200"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-extrabold text-stone-900 text-xs block leading-snug line-clamp-2">
                            {item.name}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Menor Preço à Vista</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 font-black text-sm text-sky-950">
                        R$ {item.lowestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Maior Preço no Varejo</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 text-stone-500">
                        R$ {item.highestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Selo Procel</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 font-bold text-emerald-700">
                        Selo {item.energyRating}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Consumo Elétrico Estimado</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 font-semibold text-stone-800">
                        {item.monthlyEnergyKwh} kWh/mês (~R$ {(item.monthlyEnergyKwh * electricityTariff).toFixed(2)}/mês)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Voltagem</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">
                        {item.voltage}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Capacidade</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 font-semibold text-stone-800">
                        {item.capacity}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Acabamento / Cor</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">
                        {item.colorFinish}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Dimensões (AxLxP)</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">
                        {item.dimensions.heightCm} x {item.dimensions.widthCm} x {item.dimensions.depthCm} cm
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-500 bg-stone-50/50">Garantia</td>
                    {comparisonList.map((item) => (
                      <td key={item.id} className="p-3 text-stone-800">
                        {item.warrantyMonths} Meses
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
