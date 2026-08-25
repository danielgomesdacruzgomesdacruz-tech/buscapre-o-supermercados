import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  Filter,
  MapPin,
  Navigation,
  ExternalLink,
  Phone,
  MessageSquare,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  DollarSign,
  Store,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Share2,
  ArrowRight,
  Layers,
  Percent,
  Clock,
  Star,
  Info,
  SlidersHorizontal,
  RefreshCw,
  Wrench,
  Zap,
  Disc,
  Check,
  BookOpen,
} from 'lucide-react';
import { VehicleListing, VehicleDealership, VehicleDealershipOffer } from '../types';
import { INITIAL_VEHICLE_LISTINGS, INITIAL_VEHICLE_DEALERSHIPS } from '../data/mockVehicles';
import { INITIAL_PRODUCTS } from '../data/mockProducts';
import { UserCoordinates } from '../utils/geolocation';

interface VehiclesTabProps {
  selectedCity: string;
  onNavigateToAiSearch?: (query: string) => void;
  onNavigateToRoutes?: () => void;
  initialSearchQuery?: string;
  userCoordinates?: UserCoordinates | null;
}

export const FIPE_VEHICLE_TYPES = [
  { id: 'carros', label: 'Carros & Utilitários', icon: Car },
  { id: 'motos', label: 'Motos', icon: Zap },
  { id: 'caminhoes', label: 'Caminhões & Micro-Ônibus', icon: Layers },
];

export const FIPE_REFERENCE_MONTH = 'Agosto de 2026';

export const QUICK_SEARCH_TAGS = [
  'Onix Plus 2024',
  'Corolla Cross XRE',
  'HB20 Turbo',
  'T-Cross 2025',
  'BYD Dolphin Mini',
  'Hilux SRX 4x4',
  'Jeep Compass',
  'Fiat Strada Volcano',
  'Fastback Limited',
  'Polo Track',
  'Tracker Premier',
  'Bateria Moura 60Ah',
  'Pneu Aro 14',
  'Gasolina Comum',
];

export const VehiclesTab: React.FC<VehiclesTabProps> = ({
  selectedCity,
  onNavigateToAiSearch,
  onNavigateToRoutes,
  initialSearchQuery = '',
  userCoordinates,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'prices' | 'fipe_consult' | 'dealerships' | 'simulator' | 'parts'>('prices');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedMake, setSelectedMake] = useState<string>('todos');
  const [selectedBodyType, setSelectedBodyType] = useState<string>('todos');
  const [selectedCondition, setSelectedCondition] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'fipe_diff' | 'lowest_price' | 'highest_price' | 'name'>('fipe_diff');
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(INITIAL_VEHICLE_LISTINGS[0]?.id || null);

  // Step-by-Step FIPE Official Lookup State
  const [fipeType, setFipeType] = useState<string>('carros');
  const [fipeMake, setFipeMake] = useState<string>('Chevrolet');
  const [fipeModel, setFipeModel] = useState<string>('Onix Plus');
  const [fipeYear, setFipeYear] = useState<string>('2024');

  // Simulator State
  const [simulatorVehicle, setSimulatorVehicle] = useState<VehicleListing>(INITIAL_VEHICLE_LISTINGS[0]);
  const [simPrice, setSimPrice] = useState<number>(INITIAL_VEHICLE_LISTINGS[0].minPrice);
  const [simDownPayment, setSimDownPayment] = useState<number>(30000);
  const [simInstallments, setSimInstallments] = useState<number>(48);
  const [simMonthlyRate, setSimMonthlyRate] = useState<number>(1.29); // % a.m.

  // Available Makes for filter
  const availableMakes = useMemo(() => {
    const makes = Array.from(new Set(INITIAL_VEHICLE_LISTINGS.map((v) => v.make)));
    return ['todos', ...makes];
  }, []);

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    return INITIAL_VEHICLE_LISTINGS.filter((vehicle) => {
      const matchesQuery =
        !searchQuery ||
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.fipeCode.includes(searchQuery);

      const matchesMake = selectedMake === 'todos' || vehicle.make === selectedMake;
      const matchesBody = selectedBodyType === 'todos' || vehicle.bodyType === selectedBodyType;
      const matchesCondition =
        selectedCondition === 'todos' ||
        (selectedCondition === 'zero_km' && vehicle.condition === 'zero_km') ||
        (selectedCondition === 'seminovo' && vehicle.condition !== 'zero_km');

      return matchesQuery && matchesMake && matchesBody && matchesCondition;
    }).sort((a, b) => {
      if (sortBy === 'fipe_diff') {
        const diffA = a.fipePrice - a.minPrice;
        const diffB = b.fipePrice - b.minPrice;
        return diffB - diffA; // largest discount from FIPE first
      }
      if (sortBy === 'lowest_price') {
        return a.minPrice - b.minPrice;
      }
      if (sortBy === 'highest_price') {
        return b.minPrice - a.minPrice;
      }
      if (sortBy === 'name') {
        return a.model.localeCompare(b.model);
      }
      return 0;
    });
  }, [searchQuery, selectedMake, selectedBodyType, selectedCondition, sortBy]);

  // FIPE Step-by-Step Selected Vehicle Result
  const fipeConsultResult = useMemo(() => {
    // Try exact match or partial match in mock listings
    const match = INITIAL_VEHICLE_LISTINGS.find(
      (v) =>
        v.make.toLowerCase() === fipeMake.toLowerCase() &&
        v.model.toLowerCase().includes(fipeModel.toLowerCase())
    );
    return match || INITIAL_VEHICLE_LISTINGS[0];
  }, [fipeMake, fipeModel, fipeYear]);

  // Available models for currently selected FIPE make
  const availableFipeModels = useMemo(() => {
    const models = INITIAL_VEHICLE_LISTINGS.filter((v) => v.make.toLowerCase() === fipeMake.toLowerCase()).map(
      (v) => v.model
    );
    return models.length > 0 ? Array.from(new Set(models)) : ['Modelo Padrão'];
  }, [fipeMake]);

  // Auto Parts & Fuel Products
  const automotiveProducts = useMemo(() => {
    return INITIAL_PRODUCTS.filter(
      (p) =>
        p.domain === 'veiculos' ||
        ['combustivel', 'pneus_rodas', 'oleos_fluidos', 'baterias_eletrica', 'pecas_manutencao'].includes(
          p.category
        )
    );
  }, []);

  // Simulator Calculations
  const financedAmount = Math.max(0, simPrice - simDownPayment);
  const calculatedMonthlyPayment = useMemo(() => {
    if (financedAmount <= 0) return 0;
    const r = simMonthlyRate / 100;
    const n = simInstallments;
    // Standard PMT formula: P = (r * PV) / (1 - (1 + r)^-n)
    const pmt = (r * financedAmount) / (1 - Math.pow(1 + r, -n));
    return Math.round(pmt);
  }, [financedAmount, simMonthlyRate, simInstallments]);

  const totalFinancedCost = simDownPayment + calculatedMonthlyPayment * simInstallments;
  const totalInterest = totalFinancedCost - simPrice;

  const openGps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  const openWhatsapp = (phone: string, vehicleName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá! Vi a oferta do ${vehicleName} na Tabela FIPE do BuscaPreço e gostaria de mais informações sobre estoque e financiamento.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Tabela FIPE Oficial */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Car className="w-3.5 h-3.5" />
              Tabela FIPE Oficial • Referência {FIPE_REFERENCE_MONTH}
            </span>
            <span className="text-xs text-stone-300 flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              <MapPin className="w-3 h-3 text-amber-400" /> {selectedCity}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Consulta Tabela FIPE & Preços de Compra de Veículos
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1.5 mb-5 max-w-3xl">
            Pesquise o <strong>valor oficial de referência da Tabela FIPE</strong> para carros, utilitários, picapes e seminovos. Compare com as ofertas reais de concessionárias e lojas com estoque faturado em <strong>{selectedCity}</strong>.
          </p>

          {/* Search bar inside banner */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                id="vehicle-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque por modelo, marca ou código FIPE (Ex: Onix, Corolla, HB20, T-Cross, BYD, Compass, 004518-7)..."
                className="w-full pl-11 pr-20 py-3 bg-white text-stone-900 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-400 focus:outline-hidden shadow-md"
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
                onClick={() => onNavigateToAiSearch(searchQuery || 'Tabela FIPE e preços de compra de veículos 2025/2026')}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                Pesquisar
              </button>
            )}
          </div>

          {/* Quick Search Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 text-[11px] text-stone-300">
            <span className="font-bold text-amber-300 shrink-0">Mais Buscados:</span>
            {QUICK_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(tag);
                  setActiveSubTab('prices');
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition whitespace-nowrap cursor-pointer border border-white/10"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Sub-tabs: Tabela FIPE & Ofertas vs Consulta Passo a Passo vs Concessionárias vs Simulador vs Peças */}
      <div className="bg-white border border-stone-200 rounded-2xl p-1.5 shadow-xs flex flex-wrap items-center gap-1">
        <button
          type="button"
          id="btn-subtab-prices"
          onClick={() => setActiveSubTab('prices')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'prices'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Tabela FIPE & Ofertas ({filteredVehicles.length})</span>
        </button>

        <button
          type="button"
          id="btn-subtab-fipe-consult"
          onClick={() => setActiveSubTab('fipe_consult')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'fipe_consult'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Consulta FIPE Passo-a-Passo</span>
        </button>

        <button
          type="button"
          id="btn-subtab-dealerships"
          onClick={() => setActiveSubTab('dealerships')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'dealerships'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Concessionárias & Lojas ({INITIAL_VEHICLE_DEALERSHIPS.length})</span>
        </button>

        <button
          type="button"
          id="btn-subtab-simulator"
          onClick={() => setActiveSubTab('simulator')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'simulator'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Simulador de Financiamento</span>
        </button>

        <button
          type="button"
          id="btn-subtab-parts"
          onClick={() => setActiveSubTab('parts')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'parts'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Peças, Pneus & Postos</span>
        </button>
      </div>

      {/* VIEW 1: TABELA FIPE & OFERTAS EM CONCESSIONÁRIAS */}
      {activeSubTab === 'prices' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Make Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-xs font-bold text-stone-500 shrink-0 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Marca:
              </span>
              {availableMakes.map((make) => (
                <button
                  key={make}
                  type="button"
                  onClick={() => setSelectedMake(make)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedMake === make
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {make === 'todos' ? 'Todas as Marcas' : make}
                </button>
              ))}
            </div>

            {/* Category / Body Type & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-stone-600">Categoria:</span>
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'suv', label: 'SUV' },
                  { id: 'sedan', label: 'Sedan' },
                  { id: 'hatch', label: 'Hatch' },
                  { id: 'picape', label: 'Picape' },
                  { id: 'eletrico', label: '100% Elétrico' },
                  { id: 'hibrido', label: 'Híbrido' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedBodyType(type.id)}
                    className={`text-xs px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                      selectedBodyType === type.id
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">Ordenar por:</span>
                <select
                  aria-label="Ordenar veículos por"
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="text-xs font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
                >
                  <option value="fipe_diff">Maior Desconto Abaixo da FIPE</option>
                  <option value="lowest_price">Menor Preço de Compra</option>
                  <option value="highest_price">Maior Preço</option>
                  <option value="name">Modelo (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick FIPE Step Shortcut Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-xs text-amber-950 font-medium">
                Quer fazer uma <strong>consulta oficial por Marca & Modelo</strong> para ver o código FIPE e histórico dos últimos 6 meses?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('fipe_consult')}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer shrink-0"
            >
              Abrir Consulta FIPE
            </button>
          </div>

          {/* Vehicles List */}
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => {
              const isExpanded = expandedVehicleId === vehicle.id;
              const fipeDiff = vehicle.fipePrice - vehicle.minPrice;
              const isBelowFipe = fipeDiff > 0;
              const discountPercent = Math.round((fipeDiff / vehicle.fipePrice) * 100);

              return (
                <div
                  key={vehicle.id}
                  id={`vehicle-card-${vehicle.id}`}
                  className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all"
                >
                  {/* Card Header Section */}
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                    {/* Vehicle Photo and Primary Info */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                      <div className="relative w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={vehicle.imageUrl}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs uppercase">
                          {vehicle.year}/{vehicle.modelYear}
                        </span>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 text-stone-900">
                          {vehicle.bodyType.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-md">
                            {vehicle.make}
                          </span>
                          <span className="text-xs text-stone-500 font-mono bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded">
                            Cód. FIPE: {vehicle.fipeCode}
                          </span>
                          {vehicle.highlightTag && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-semibold rounded-md">
                              {vehicle.highlightTag}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold text-stone-900">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-xs text-stone-600 font-medium">
                          {vehicle.version} • {vehicle.fuelType.toUpperCase()} • Câmbio {vehicle.transmission.toUpperCase()}
                        </p>

                        {/* Badges / Features */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {vehicle.features.slice(0, 3).map((feat, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11px] bg-stone-50 text-stone-600 px-2 py-0.5 rounded-md border border-stone-150"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price Comparison Summary Box */}
                    <div className="w-full lg:w-auto bg-stone-50 border border-stone-200/80 rounded-2xl p-4 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
                      <div className="text-left lg:text-right">
                        <span className="text-[11px] font-semibold text-stone-500 uppercase block">
                          Tabela FIPE Oficial
                        </span>
                        <span className="text-sm font-bold text-stone-600 line-through">
                          R$ {vehicle.fipePrice.toLocaleString('pt-BR')}
                        </span>
                        <div className="mt-1">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                            Melhor Preço em Loja:
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-emerald-700">
                            R$ {vehicle.minPrice.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {isBelowFipe && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg shadow-2xs">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
                            R$ {fipeDiff.toLocaleString('pt-BR')} abaixo da FIPE (-{discountPercent}%)
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedVehicleId(isExpanded ? null : vehicle.id)}
                          className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>{isExpanded ? 'Ocultar Lojas' : `Ver ${vehicle.dealerships.length} Locais de Venda`}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Dealerships Section */}
                  {isExpanded && (
                    <div className="bg-stone-50 border-t border-stone-200 p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-amber-600" />
                          Concessionárias e Lojas com este modelo em estoque ({vehicle.dealerships.length}):
                        </h4>
                        <span className="text-[11px] text-stone-500">
                          Preços e condições verificadas hoje em {selectedCity}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {vehicle.dealerships.map((offer, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 relative"
                          >
                            {/* Dealership Info */}
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div>
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">
                                    {offer.dealershipType === 'concessionaria_oficial'
                                      ? 'Concessionária Oficial'
                                      : offer.dealershipType === 'auto_shopping'
                                      ? 'Auto Shopping'
                                      : 'Seminovos Revisados'}
                                  </span>
                                  <h5 className="text-sm font-extrabold text-stone-900 mt-1">
                                    {offer.dealershipName}
                                  </h5>
                                </div>
                                <span className="text-xs font-bold text-amber-700 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {offer.rating}
                                </span>
                              </div>

                              <p className="text-[11px] text-stone-500 line-clamp-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                {offer.address}
                              </p>

                              {/* Route & Distance Badge */}
                              <div className="mt-2 bg-stone-50 border border-stone-150 rounded-xl p-2 text-[11px] text-stone-700 space-y-0.5">
                                <div className="flex items-center justify-between font-bold text-stone-800">
                                  <span className="flex items-center gap-1">
                                    <Navigation className="w-3 h-3 text-amber-600" />
                                    {offer.distanceKm} km • {offer.durationMin} min
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-700">
                                    {offer.conditionBadge}
                                  </span>
                                </div>
                                <p className="text-[10px] text-stone-500">
                                  {offer.bestRoute}
                                </p>
                              </div>

                              {/* Price and Financing */}
                              <div className="mt-3 pt-2 border-t border-stone-100">
                                <div className="flex items-baseline justify-between">
                                  <span className="text-[11px] text-stone-500 font-medium">Preço de Loja:</span>
                                  <span className="text-base font-black text-stone-900">
                                    R$ {offer.price.toLocaleString('pt-BR')}
                                  </span>
                                </div>
                                {offer.financingInstallment48x && (
                                  <p className="text-[11px] text-amber-900 font-semibold text-right">
                                    Entrada R$ {offer.financingEntryMin?.toLocaleString('pt-BR')} + 48x de R$ {offer.financingInstallment48x.toLocaleString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                              <button
                                type="button"
                                onClick={() => openGps(offer.address)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5 text-amber-700" />
                                <span>Ver Rota</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (offer.whatsapp) {
                                    openWhatsapp(offer.whatsapp, `${vehicle.make} ${vehicle.model}`);
                                  } else {
                                    window.open(`tel:${offer.phone}`, '_self');
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Falar com Loja</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Simulator Shortcut & History */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                            <Percent className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-stone-900">
                              Gostou deste modelo? Calcule suas parcelas personalizadas
                            </h5>
                            <p className="text-[11px] text-stone-500">
                              Simule entrada, prazos e compare taxas entre bancos parceiros
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSimulatorVehicle(vehicle);
                            setSimPrice(vehicle.minPrice);
                            setSimDownPayment(Math.round(vehicle.minPrice * 0.3));
                            setActiveSubTab('simulator');
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                        >
                          Simular Financiamento do {vehicle.model}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: CONSULTA FIPE PASSO-A-PASSO OFICIAL */}
      {activeSubTab === 'fipe_consult' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full w-fit mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                Consulta Oficial da Fundação Instituto de Pesquisas Econômicas (FIPE)
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                Consulta Oficial Tabela FIPE
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Selecione o tipo de veículo, marca, modelo e ano para obter a cotação oficial do mês de referência ({FIPE_REFERENCE_MONTH}).
              </p>
            </div>

            {/* Step Selector Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1: Vehicle Type */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
                  Tipo de Veículo:
                </label>
                <select
                  aria-label="Tipo de veículo FIPE"
                  value={fipeType}
                  onChange={(e) => setFipeType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                >
                  {FIPE_VEHICLE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Make */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
                  Marca:
                </label>
                <select
                  aria-label="Marca do veículo FIPE"
                  value={fipeMake}
                  onChange={(e) => {
                    setFipeMake(e.target.value);
                    const matching = INITIAL_VEHICLE_LISTINGS.find((v) => v.make === e.target.value);
                    if (matching) {
                      setFipeModel(matching.model);
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                >
                  {Array.from(new Set(INITIAL_VEHICLE_LISTINGS.map((v) => v.make))).map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Model */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-black">3</span>
                  Modelo:
                </label>
                <select
                  aria-label="Modelo do veículo FIPE"
                  value={fipeModel}
                  onChange={(e) => setFipeModel(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                >
                  {availableFipeModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: Year */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-black">4</span>
                  Ano / Combustível:
                </label>
                <select
                  aria-label="Ano do modelo FIPE"
                  value={fipeYear}
                  onChange={(e) => setFipeYear(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                >
                  <option value="2026">2026 Zero KM (Flex/Elétrico)</option>
                  <option value="2025">2025 Flex / Gasolina</option>
                  <option value="2024">2024 Flex / Gasolina</option>
                  <option value="2023">2023 Flex</option>
                  <option value="2022">2022 Flex</option>
                  <option value="2021">2021 Flex</option>
                  <option value="2020">2020 Flex</option>
                </select>
              </div>
            </div>

            {/* Official FIPE Result Card */}
            {fipeConsultResult && (
              <div className="bg-gradient-to-br from-stone-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                      Certificado de Consulta Tabela FIPE
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-white">
                      {fipeConsultResult.make} {fipeConsultResult.model}
                    </h4>
                    <p className="text-sm text-stone-300 mt-1">
                      {fipeConsultResult.version} • Ano Modelo: {fipeYear} • Câmbio {fipeConsultResult.transmission.toUpperCase()}
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-left md:text-right shrink-0">
                    <span className="text-[11px] text-stone-300 block uppercase">Código FIPE Oficial</span>
                    <span className="text-xl font-mono font-bold text-amber-300">{fipeConsultResult.fipeCode}</span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">Mês: {FIPE_REFERENCE_MONTH}</span>
                  </div>
                </div>

                {/* Price Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <span className="text-xs text-stone-400 uppercase font-semibold block">Preço Médio FIPE</span>
                    <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                      R$ {fipeConsultResult.fipePrice.toLocaleString('pt-BR')}
                    </div>
                    <span className="text-[11px] text-stone-400 mt-1 block">Referência oficial para seguro e IPVA</span>
                  </div>

                  <div className="bg-emerald-950/40 rounded-2xl p-5 border border-emerald-500/30">
                    <span className="text-xs text-emerald-300 uppercase font-bold block">Menor Preço em Loja</span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                      R$ {fipeConsultResult.minPrice.toLocaleString('pt-BR')}
                    </div>
                    <span className="text-[11px] text-emerald-300 mt-1 block">
                      🔥 R$ {(fipeConsultResult.fipePrice - fipeConsultResult.minPrice).toLocaleString('pt-BR')} abaixo da FIPE
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <span className="text-xs text-stone-400 uppercase font-semibold block">IPVA Anual Estimado (SP 4%)</span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                      R$ {Math.round(fipeConsultResult.fipePrice * 0.04).toLocaleString('pt-BR')}
                    </div>
                    <span className="text-[11px] text-stone-400 mt-1 block">Parcelável em até 5x no estado</span>
                  </div>
                </div>

                {/* Historical Price Trend */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" />
                      Histórico de Preços FIPE dos Últimos Meses:
                    </h5>
                    <span className="text-[11px] text-stone-400">Variação estável no mercado</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {fipeConsultResult.history.map((h, i) => (
                      <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5 text-center">
                        <span className="text-[11px] text-stone-400 font-semibold block">{h.date}</span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          R$ {h.fipeValue.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-emerald-400">FIPE Oficial</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatorVehicle(fipeConsultResult);
                      setSimPrice(fipeConsultResult.minPrice);
                      setSimDownPayment(Math.round(fipeConsultResult.minPrice * 0.3));
                      setActiveSubTab('simulator');
                    }}
                    className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Percent className="w-4 h-4" />
                    <span>Simular Financiamento Deste Veículo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery(fipeConsultResult.model);
                      setActiveSubTab('prices');
                      setExpandedVehicleId(fipeConsultResult.id);
                    }}
                    className="w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Store className="w-4 h-4 text-amber-400" />
                    <span>Ver {fipeConsultResult.dealerships.length} Concessionárias com Estoque</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: LOCAIS DE VENDA & CONCESSIONÁRIAS */}
      {activeSubTab === 'dealerships' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-600" />
                Concessionárias, Auto Shoppings e Revendas Autorizadas em {selectedCity}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Encontre o showroom mais próximo com estoque faturado, laudo cautelar aprovado e melhores rotas de acesso.
              </p>
            </div>

            {onNavigateToRoutes && (
              <button
                type="button"
                onClick={onNavigateToRoutes}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span>Otimizador de Rotas & Gasolina</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_VEHICLE_DEALERSHIPS.map((dealer) => (
              <div
                key={dealer.id}
                id={`dealership-card-${dealer.id}`}
                className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {dealer.type === 'concessionaria_oficial'
                            ? 'Concessionária Oficial'
                            : dealer.type === 'auto_shopping'
                            ? 'Auto Shopping'
                            : 'Loja Seminovos Multimarcas'}
                        </span>
                        {dealer.verifiedBadge && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> Verificada
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-stone-900 mt-1">
                        {dealer.name}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{dealer.rating}</span>
                        <span className="text-[10px] text-stone-400 font-normal">({dealer.reviewCount})</span>
                      </div>
                      <span className="text-[11px] font-bold text-stone-700 block mt-0.5">
                        {dealer.stockCount} veículos
                      </span>
                    </div>
                  </div>

                  {/* Address & Route Information */}
                  <p className="text-xs text-stone-600 flex items-start gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{dealer.address}</span>
                  </p>

                  <div className="mt-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-xs text-stone-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-950">
                      <span className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-amber-700" />
                        Melhor Rota: {dealer.distanceKm} km • ~{dealer.durationMin} min
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600">
                      {dealer.bestRoute}
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {dealer.features.map((feat, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>

                  {/* Opening hours & Financing */}
                  <div className="mt-3 text-[11px] text-stone-500 space-y-0.5">
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" /> {dealer.openingHours}
                    </p>
                    <p className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-stone-400" /> Financiamento: {dealer.financingPartners.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => openGps(dealer.address)}
                    className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 text-stone-950" />
                    <span>Como Chegar (GPS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (dealer.whatsapp) {
                        openWhatsapp(dealer.whatsapp, 'Showroom');
                      } else {
                        window.open(`tel:${dealer.phone}`, '_self');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp / Ligar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: SIMULADOR DE COMPRA & FINANCIAMENTO */}
      {activeSubTab === 'simulator' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-600" />
              Simulador de Compra & Financiamento de Veículos
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Calcule a entrada, quantidade de parcelas e veja a estimativa de juros e custo total antes de ir à concessionária.
            </p>
          </div>

          {/* Model Selector in Simulator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5">
                  Selecione o Veículo para Simular:
                </label>
                <select
                  aria-label="Selecione o veículo para simulação"
                  value={simulatorVehicle.id}
                  onChange={(e) => {
                    const found = INITIAL_VEHICLE_LISTINGS.find((v) => v.id === e.target.value);
                    if (found) {
                      setSimulatorVehicle(found);
                      setSimPrice(found.minPrice);
                      setSimDownPayment(Math.round(found.minPrice * 0.3));
                    }
                  }}
                  className="w-full text-xs sm:text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                >
                  {INITIAL_VEHICLE_LISTINGS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} - R$ {v.minPrice.toLocaleString('pt-BR')} (FIPE: R$ {v.fipePrice.toLocaleString('pt-BR')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    Valor de Negociação do Veículo:
                  </label>
                  <span className="text-sm font-black text-stone-900">
                    R$ {simPrice.toLocaleString('pt-BR')}
                  </span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={400000}
                  step={1000}
                  value={simPrice}
                  onChange={(e) => setSimPrice(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Down Payment Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    Valor de Entrada (Recomendado 20% a 50%):
                  </label>
                  <span className="text-sm font-black text-amber-800">
                    R$ {simDownPayment.toLocaleString('pt-BR')} ({Math.round((simDownPayment / simPrice) * 100)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={simPrice}
                  step={1000}
                  value={simDownPayment}
                  onChange={(e) => setSimDownPayment(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Installments Options */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5">
                  Prazo de Financiamento:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[12, 24, 36, 48, 60].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setSimInstallments(months)}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        simInstallments === months
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {months}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    Taxa de Juros Estimada:
                  </label>
                  <span className="text-xs font-bold text-stone-800">
                    {simMonthlyRate}% ao mês ({((Math.pow(1 + simMonthlyRate / 100, 12) - 1) * 100).toFixed(1)}% a.a.)
                  </span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={2.5}
                  step={0.05}
                  value={simMonthlyRate}
                  onChange={(e) => setSimMonthlyRate(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Results Box */}
            <div className="bg-stone-900 text-white rounded-3xl p-6 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Resultado da Simulação
                </span>
                <h4 className="text-lg font-extrabold text-white">
                  {simulatorVehicle.make} {simulatorVehicle.model}
                </h4>
                <p className="text-xs text-stone-400">
                  {simulatorVehicle.version}
                </p>

                <div className="mt-6 bg-white/10 rounded-2xl p-4 border border-white/10">
                  <span className="text-xs text-stone-300 block">Valor da Parcela Estimada:</span>
                  <div className="text-3xl font-black text-amber-400 mt-0.5">
                    {simInstallments}x de R$ {calculatedMonthlyPayment.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[11px] text-stone-300 mt-1 block">
                    Financiamento de R$ {financedAmount.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="text-stone-400 block text-[11px]">Entrada:</span>
                    <span className="font-bold text-white">
                      R$ {simDownPayment.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="text-stone-400 block text-[11px]">Custo Total:</span>
                    <span className="font-bold text-white">
                      R$ {totalFinancedCost.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Concessionárias com aprovação de crédito na hora</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('dealerships');
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Store className="w-4 h-4" />
                  <span>Ver Lojas com Estoque Deste Veículo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: AUTOPEÇAS, PNEUS, BATERIAS & POSTOS */}
      {activeSubTab === 'parts' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-amber-600" />
                Autopeças, Pneus, Baterias, Óleos & Postos em {selectedCity}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Compare os menores preços de manutenção preventiva, pneus de alta durabilidade e combustíveis perto de você.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {automotiveProducts.map((prod) => {
              const lowestPrice = Math.min(...prod.prices.map((p) => p.price));
              const bestStore = prod.prices.find((p) => p.price === lowestPrice);

              return (
                <div
                  key={prod.id}
                  className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="relative h-40 rounded-2xl overflow-hidden bg-stone-100 mb-3">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white uppercase">
                        {prod.category.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-stone-500 block uppercase">{prod.brand}</span>
                    <h4 className="text-sm font-extrabold text-stone-900 mt-0.5 leading-snug">{prod.name}</h4>
                  </div>

                  <div className="border-t border-stone-100 pt-3 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase block">Menor Preço Encontrado</span>
                      <span className="text-lg font-black text-emerald-700">
                        R$ {lowestPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-500 block">{bestStore?.supermarketName}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (bestStore) {
                          openGps(bestStore.supermarketName);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Onde Comprar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
