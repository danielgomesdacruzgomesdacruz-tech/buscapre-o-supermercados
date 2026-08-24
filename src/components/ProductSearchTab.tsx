import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Minus,
  Check,
  TrendingDown,
  LineChart,
  Bell,
  Sparkles,
  ShoppingBag,
  Store,
  Layers,
  Car,
  Fuel,
  Pill,
  Smartphone,
  Hammer,
  Tag,
  DollarSign,
  Building2,
  Zap,
} from 'lucide-react';
import { Product, Supermarket } from '../types';
import { VehiclesTab } from './VehiclesTab';

interface ProductSearchTabProps {
  products: Product[];
  supermarkets: Supermarket[];
  onAddToCart: (product: Product, quantity?: number) => void;
  cartQuantities: { [productId: string]: number };
  onOpenHistory: (product: Product) => void;
  onOpenAlert: (product: Product) => void;
  onNavigateToAiSearch: (query: string, domain?: string) => void;
  selectedCity?: string;
  onNavigateToRoutes?: () => void;
  onNavigateToVehicles?: () => void;
  onNavigateToAppliances?: () => void;
}

export interface DomainCategoryConfig {
  id: string;
  name: string;
  shortLabel: string;
  icon: React.ElementType;
  badge: string;
  headline: string;
  subtitle: string;
  placeholder: string;
  gradientClass: string;
  accentBg: string;
  accentText: string;
  categories: { id: string; label: string }[];
  quickTags: string[];
}

export const DOMAIN_CATEGORIES: DomainCategoryConfig[] = [
  {
    id: 'supermercado',
    name: 'Supermercados',
    shortLabel: 'Supermercado',
    icon: Store,
    badge: 'Mais de 6 redes de supermercados comparadas em tempo real',
    headline: 'Encontre o menor preço no supermercado perto de você',
    subtitle: 'Compare arroz, carnes, leite, cerveja, sabão e muito mais. Descubra onde comprar mais barato.',
    placeholder: 'Busque por produto, marca ou código de barras (Ex: Arroz Camil, Heineken, Omo)...',
    gradientClass: 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900',
    accentBg: 'bg-emerald-600',
    accentText: 'text-emerald-300',
    categories: [
      { id: 'todos', label: 'Todos os Itens' },
      { id: 'alimentos', label: 'Alimentos Básicos' },
      { id: 'carnes', label: 'Carnes & Aves' },
      { id: 'hortifruti', label: 'Hortifrúti' },
      { id: 'laticinios', label: 'Laticínios & Ovos' },
      { id: 'limpeza', label: 'Limpeza' },
      { id: 'bebidas', label: 'Bebidas' },
      { id: 'higiene', label: 'Higiene & Beleza' },
    ],
    quickTags: ['Arroz 5kg', 'Feijão Carioca', 'Leite Integral', 'Azeite Extra Virgem', 'Picanha', 'Heineken 350ml', 'Sabão Omo'],
  },
  {
    id: 'veiculos',
    name: 'Veículos & Automotivo',
    shortLabel: 'Veículos & Autos',
    icon: Car,
    badge: 'Tabela FIPE oficial, concessionárias, revendas e peças comparados',
    headline: 'Tabela de Preços de Compra de Veículos e Concessionárias',
    subtitle: 'Consulte a Tabela FIPE oficial, compare preços reais de carros novos e seminovos em concessionárias e encontre locais de venda perto de você.',
    placeholder: 'Busque por modelo, marca ou versão (Ex: Onix Plus, Corolla Cross, HB20, T-Cross, Dolphin Mini, Hilux)...',
    gradientClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950',
    accentBg: 'bg-amber-600',
    accentText: 'text-amber-300',
    categories: [
      { id: 'veiculos_tabela', label: '🚗 Tabela FIPE & Preços de Compra' },
      { id: 'locais_venda', label: '🏢 Concessionárias & Locais de Venda' },
      { id: 'todos', label: '📦 Todos os Itens Automotivos' },
      { id: 'combustivel', label: '⛽ Combustíveis & Postos' },
      { id: 'pneus_rodas', label: '🛞 Pneus & Rodas' },
      { id: 'oleos_fluidos', label: '🛢️ Óleos & Troca de Óleo' },
      { id: 'baterias_eletrica', label: '⚡ Baterias Automotivas' },
      { id: 'pecas_manutencao', label: '🔧 Peças & Manutenção' },
    ],
    quickTags: ['Onix Plus 2024', 'Corolla Cross', 'HB20 Turbo', 'T-Cross 2025', 'BYD Dolphin Mini', 'Gasolina Comum', 'Pneu Aro 14 Pirelli', 'Bateria Moura 60Ah'],
  },
  {
    id: 'farmacia',
    name: 'Farmácia & Saúde',
    shortLabel: 'Farmácia',
    icon: Pill,
    badge: 'Drogarias, remédios genéricos e produtos de cuidados pessoais',
    headline: 'Encontre o menor preço em farmácias e drogarias perto de você',
    subtitle: 'Compare medicamentos de referência, genéricos, vitaminas, fraldas infantis e dermocosméticos.',
    placeholder: 'Busque por medicamento, genérico ou cosmético (Ex: Dipirona, Vitamina C, Protetor Solar)...',
    gradientClass: 'bg-gradient-to-br from-cyan-950 via-sky-900 to-slate-900',
    accentBg: 'bg-sky-600',
    accentText: 'text-sky-300',
    categories: [
      { id: 'todos', label: 'Todos em Farmácia' },
      { id: 'higiene', label: '💊 Medicamentos & Cuidados' },
      { id: 'alimentos', label: '🍊 Vitaminas & Suplementos' },
    ],
    quickTags: ['Dipirona 500mg', 'Vitamina C Efervescente', 'Protetor Solar FPS 50', 'Fralda Pampers M', 'Dorflex'],
  },
  {
    id: 'eletronicos',
    name: 'Eletrônicos & Tech',
    shortLabel: 'Eletrônicos',
    icon: Smartphone,
    badge: 'Grandes varejistas, smartphones e informática comparados',
    headline: 'Compare preços de eletrônicos, smartphones e informática',
    subtitle: 'Pesquise celulares, fones de ouvido, notebooks, televisores e acessórios com os menores preços da web.',
    placeholder: 'Busque por produto de tecnologia (Ex: Smartphone, Smart TV, Fone Bluetooth, Notebook)...',
    gradientClass: 'bg-gradient-to-br from-purple-950 via-indigo-900 to-slate-900',
    accentBg: 'bg-purple-600',
    accentText: 'text-purple-300',
    categories: [
      { id: 'todos', label: 'Todos em Tecnologia' },
      { id: 'eletronicos', label: '📱 Celulares & Acessórios' },
    ],
    quickTags: ['Smartphone 128GB', 'Fone Sem Fio Bluetooth', 'Smart TV 50"', 'Notebook i5', 'Power Bank'],
  },
  {
    id: 'eletrodomesticos',
    name: 'Eletrodomésticos & Linha Branca',
    shortLabel: 'Eletrodomésticos',
    icon: Zap,
    badge: 'Magalu, Casas Bahia, Fast Shop, Amazon e Mercado Livre comparados',
    headline: 'Compare preços de eletrodomésticos com Selo Procel A+++',
    subtitle: 'Encontre geladeiras Frost Free, lavadoras e lava e seca, air fryers, fornos e ar-condicionado com os maiores descontos no Pix e cupons.',
    placeholder: 'Busque por eletrodoméstico (Ex: Geladeira Brastemp Frost Free, Air Fryer Walita, Lava e Seca 11kg)...',
    gradientClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950',
    accentBg: 'bg-sky-600',
    accentText: 'text-sky-300',
    categories: [
      { id: 'todos', label: '⚡ Todos os Eletros' },
      { id: 'eletrodomesticos', label: '❄️ Linha Branca & Cozinha' },
    ],
    quickTags: ['Geladeira Frost Free Inox', 'Air Fryer 4L', 'Lava e Seca Inverter', 'Cooktop Indução', 'Micro-ondas 32L', 'Ar-Condicionado Inverter'],
  },
  {
    id: 'construcao',
    name: 'Casa & Construção',
    shortLabel: 'Construção',
    icon: Hammer,
    badge: 'Home centers, depósitos de materiais e ferramentas',
    headline: 'Compare materiais de construção, ferramentas e tintas',
    subtitle: 'Encontre onde comprar materiais de reforma, iluminação e ferramentas com os melhores descontos.',
    placeholder: 'Busque por material de construção ou ferramenta (Ex: Furadeira Bosch, Tinta Látex 18L, Cimento)...',
    gradientClass: 'bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950',
    accentBg: 'bg-orange-600',
    accentText: 'text-orange-300',
    categories: [
      { id: 'todos', label: 'Todos Construção' },
      { id: 'construcao', label: '🔨 Ferramentas & Equipamentos' },
    ],
    quickTags: ['Furadeira de Impacto', 'Tinta Acrílica 18L', 'Chuveiro Eletrônico', 'Lâmpada LED 9W'],
  },
];

// Fallback legacy categories
export const CATEGORIES = DOMAIN_CATEGORIES[0].categories;

export const ProductSearchTab: React.FC<ProductSearchTabProps> = ({
  products,
  supermarkets,
  onAddToCart,
  cartQuantities,
  onOpenHistory,
  onOpenAlert,
  onNavigateToAiSearch,
  selectedCity = 'São Paulo, SP',
  onNavigateToRoutes,
  onNavigateToVehicles,
  onNavigateToAppliances,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('supermercado');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedSupermarkets, setSelectedSupermarkets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'lowest_price' | 'highest_savings' | 'unit_price' | 'name'>('lowest_price');

  const currentDomainConfig = useMemo(() => {
    return DOMAIN_CATEGORIES.find((d) => d.id === selectedDomain) || DOMAIN_CATEGORIES[0];
  }, [selectedDomain]);

  const handleSelectDomain = (domainId: string) => {
    setSelectedDomain(domainId);
    setSelectedCategory('todos');
    if (domainId === 'veiculos' && onNavigateToVehicles) {
      onNavigateToVehicles();
    } else if (domainId === 'eletrodomesticos' && onNavigateToAppliances) {
      onNavigateToAppliances();
    }
  };

  const toggleSupermarket = (id: string) => {
    setSelectedSupermarkets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Domain match logic
        if (selectedDomain === 'veiculos') {
          const isVehicleProduct =
            product.domain === 'veiculos' ||
            ['combustivel', 'pneus_rodas', 'oleos_fluidos', 'baterias_eletrica', 'pecas_manutencao', 'veiculos'].includes(product.category);
          if (!isVehicleProduct && !searchQuery) return false;
        } else if (selectedDomain === 'eletrodomesticos') {
          const isApplianceProduct =
            product.domain === 'eletrodomesticos' || product.category === 'eletrodomesticos';
          if (!isApplianceProduct && !searchQuery) return false;
        } else if (selectedDomain === 'supermercado') {
          const isVehicleProduct =
            product.domain === 'veiculos' ||
            ['combustivel', 'pneus_rodas', 'oleos_fluidos', 'baterias_eletrica', 'pecas_manutencao'].includes(product.category);
          if (isVehicleProduct && !searchQuery) return false;
        }

        // Search filter
        const matchesQuery =
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.ean.includes(searchQuery);

        // Category filter
        const matchesCategory =
          selectedCategory === 'todos' || product.category === selectedCategory;

        // Supermarket filter
        const matchesSupermarket =
          selectedSupermarkets.length === 0 ||
          product.prices.some((p) => selectedSupermarkets.includes(p.supermarketId));

        return matchesQuery && matchesCategory && matchesSupermarket;
      })
      .sort((a, b) => {
        const getMinPrice = (prod: Product) => Math.min(...prod.prices.map((p) => p.price));
        const getMaxPrice = (prod: Product) => Math.max(...prod.prices.map((p) => p.price));

        if (sortBy === 'lowest_price') {
          return getMinPrice(a) - getMinPrice(b);
        }
        if (sortBy === 'highest_savings') {
          const savingsA = getMaxPrice(a) - getMinPrice(a);
          const savingsB = getMaxPrice(b) - getMinPrice(b);
          return savingsB - savingsA;
        }
        if (sortBy === 'unit_price') {
          const unitPriceA = getMinPrice(a) / (a.unitValue || 1);
          const unitPriceB = getMinPrice(b) / (b.unitValue || 1);
          return unitPriceA - unitPriceB;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [products, searchQuery, selectedDomain, selectedCategory, selectedSupermarkets, sortBy]);

  const isVehicleQuery = useMemo(() => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase().trim();
    const vehicleKeywords = [
      'veiculo', 'veículo', 'veiculos', 'veículos', 'carro', 'carros', 'fipe', 'concessionaria', 'concessionária',
      'onix', 'corolla', 'hb20', 't-cross', 'byd', 'dolphin', 'tracker', 'compass', 'hilux', 'moura', 'pneu', 'pneus',
      'gasolina', 'etanol', 'oleo', 'óleo', 'lubrificante', 'autopeça', 'autopeças', 'seminovo', 'seminovos', 'zero km', '0km',
      'toyota', 'chevrolet', 'volkswagen', 'fiat', 'hyundai', 'honda', 'renault', 'nissan', 'jeep'
    ];
    return vehicleKeywords.some((kw) => q.includes(kw));
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Domain Category Selector Tabs */}
      <div className="bg-white border border-stone-200 rounded-2xl p-2 shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <div className="flex items-center gap-1.5 min-w-max">
            {DOMAIN_CATEGORIES.map((domain) => {
              const Icon = domain.icon;
              const isSelected = selectedDomain === domain.id;
              return (
                <button
                  key={domain.id}
                  id={`domain-tab-${domain.id}`}
                  onClick={() => handleSelectDomain(domain.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? `${domain.accentBg} text-white shadow-sm ring-2 ring-stone-900/10 scale-[1.02]`
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
                  <span>{domain.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* When Vehicle domain is active, render dedicated VehiclesTab */}
      {selectedDomain === 'veiculos' ? (
        <VehiclesTab
          selectedCity={selectedCity}
          onNavigateToAiSearch={onNavigateToAiSearch}
          onNavigateToRoutes={onNavigateToRoutes}
          initialSearchQuery={searchQuery}
        />
      ) : (
        <>
          {/* Smart Vehicle Suggestion Banner if user typed car/vehicle keywords */}
          {isVehicleQuery && (
            <div className="bg-amber-50 border border-amber-300 text-amber-950 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-200/80 rounded-xl text-amber-900 shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-950">
                    Você pesquisou por veículo / automotivo: <span className="underline font-extrabold text-amber-900">"{searchQuery}"</span>
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Deseja consultar a Tabela FIPE oficial de compra, concessionárias autorizadas e simulador de financiamento?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDomain('veiculos');
                  if (onNavigateToVehicles) {
                    onNavigateToVehicles();
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Car className="w-3.5 h-3.5" />
                Ver Tabela FIPE & Concessionárias
              </button>
            </div>
          )}
          {/* Hero / Search Section */}
          <div className={`${currentDomainConfig.gradientClass} rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-all duration-300`}>
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-xs border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {currentDomainConfig.badge}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentDomainConfig.headline}
              </h2>
              <p className="text-stone-200 text-xs sm:text-sm mt-1.5 mb-5">
                {currentDomainConfig.subtitle}
              </p>

              {/* Search Input Bar */}
              <div className="relative flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    id="main-product-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={currentDomainConfig.placeholder}
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

                <button
                  type="button"
                  onClick={() => onNavigateToAiSearch(searchQuery || currentDomainConfig.quickTags[0], selectedDomain)}
                  className={`${currentDomainConfig.accentBg} hover:opacity-90 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap transition cursor-pointer`}
                >
                  <Sparkles className="w-4 h-4" />
                  Pesquisar com IA na Web
                </button>
              </div>

              {/* Quick Search Suggestions Chips */}
              <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-white/10">
                <span className="text-[11px] font-semibold text-stone-300 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-400" />
                  Mais buscados:
                </span>
                {currentDomainConfig.quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      setSelectedCategory('todos');
                    }}
                    className="text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg transition border border-white/10 cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {currentDomainConfig.categories.map((cat) => (
              <button
                key={cat.id}
                id={`subcat-btn-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Filter and Supermarket Bar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Supermarket Checkboxes */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                Lojas & Redes:
              </span>
              {supermarkets.map((market) => {
                const isSelected = selectedSupermarkets.includes(market.id);
                return (
                  <button
                    key={market.id}
                    onClick={() => toggleSupermarket(market.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                    {market.name}
                  </button>
                );
              })}
              {selectedSupermarkets.length > 0 && (
                <button
                  onClick={() => setSelectedSupermarkets([])}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold ml-1 cursor-pointer"
                >
                  Limpar filtros de lojas
                </button>
              )}
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-xs font-medium text-stone-600">Ordenar por:</span>
              <select
                aria-label="Ordenar produtos por"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="text-xs font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
              >
                <option value="lowest_price">Menor Preço</option>
                <option value="highest_savings">Maior Economia (Diferença)</option>
                <option value="unit_price">Preço por Unidade / Litro</option>
                <option value="name">Nome do Produto</option>
              </select>
            </div>
          </div>

          {/* Active Filter / Reset Bar */}
          {(searchQuery || selectedCategory !== 'todos' || selectedSupermarkets.length > 0) && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <span className="font-bold text-amber-900">Filtros ativos:</span>
                {searchQuery && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200 font-bold">
                    "{searchQuery}"
                  </span>
                )}
                {selectedCategory !== 'todos' && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200">
                    {currentDomainConfig.categories.find((c) => c.id === selectedCategory)?.label || selectedCategory}
                  </span>
                )}
                {selectedSupermarkets.length > 0 && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200">
                    {selectedSupermarkets.length} loja(s)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todos');
                  setSelectedSupermarkets([]);
                }}
                className="text-amber-900 hover:text-amber-950 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                ← Voltar ao Início (Ver Todos os Produtos)
              </button>
            </div>
          )}

          {/* Product Results Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">Nenhum produto encontrado</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-5">
                Não encontramos itens para a sua busca. Você pode voltar ao catálogo inicial completo ou pesquisar na web em tempo real.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {isVehicleQuery && (
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('veiculos')}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Car className="w-4 h-4" />
                    Abrir Tabela FIPE & Veículos
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('todos');
                    setSelectedSupermarkets([]);
                  }}
                  className="bg-stone-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  ← Voltar ao Início / Limpar Busca
                </button>
                {searchQuery && (
                  <button
                    onClick={() => onNavigateToAiSearch(searchQuery, selectedDomain)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Pesquisar "{searchQuery}" com IA
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
                const bestPrice = sortedPrices[0];
                const highestPrice = sortedPrices[sortedPrices.length - 1];
                const maxSavings = highestPrice.price - bestPrice.price;
                const savingsPercent = Math.round((maxSavings / highestPrice.price) * 100);
                const currentQty = cartQuantities[product.id] || 0;

                // Calculate unit cost (ex: R$ / kg)
                const unitPriceVal = (bestPrice.price / product.unitValue).toFixed(2).replace('.', ',');
                const unitLabel = product.unit === 'g' ? 'por 500g' : product.unit === 'ml' ? 'por 350ml' : `por ${product.unit}`;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Card Top */}
                    <div className="p-4 sm:p-5">
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 rounded-xl object-cover border border-stone-100"
                          />
                          {savingsPercent > 10 && (
                            <span className="absolute -top-1.5 -left-1.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                              -{savingsPercent}%
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {product.brand}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                title="Histórico de preços"
                                onClick={() => onOpenHistory(product)}
                                className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition"
                              >
                                <LineChart className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Criar alerta de preço"
                                onClick={() => onOpenAlert(product)}
                                className="p-1 text-stone-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-sm font-bold text-stone-900 mt-1 line-clamp-2 group-hover:text-emerald-700 transition">
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {product.volumeOrWeight} • EAN: {product.ean}
                          </p>
                        </div>
                      </div>

                      {/* Best Deal Spotlight Box */}
                      <div className="mt-4 bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-emerald-600" />
                            Melhor Preço:
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-sm">
                            R$ {unitPriceVal} {unitLabel}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mt-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-extrabold text-emerald-950">
                              R$ {bestPrice.price.toFixed(2).replace('.', ',')}
                            </span>
                            {bestPrice.clubPrice && (
                              <span className="text-[11px] font-semibold text-purple-700">
                                (Clube: R$ {bestPrice.clubPrice.toFixed(2).replace('.', ',')})
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-stone-800">{bestPrice.supermarketName}</span>
                        </div>

                        {maxSavings > 0 && (
                          <p className="text-[11px] text-emerald-800 mt-1 font-medium">
                            Economize até <span className="font-bold">R$ {maxSavings.toFixed(2).replace('.', ',')}</span> comparando mercados
                          </p>
                        )}
                      </div>

                      {/* Supermarkets Price Breakdown Table */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 px-1">
                          <span>Supermercado</span>
                          <span>Preço</span>
                        </div>
                        {sortedPrices.slice(0, 4).map((pricePoint, idx) => {
                          const smObj = supermarkets.find(
                            (s) => s.id === pricePoint.supermarketId || s.name.toLowerCase() === pricePoint.supermarketName.toLowerCase()
                          );
                          const dist = smObj?.distanceKm;

                          return (
                            <div
                              key={pricePoint.supermarketId}
                              className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg ${
                                idx === 0
                                  ? 'bg-emerald-100/60 font-bold text-emerald-950 border border-emerald-200/50'
                                  : 'hover:bg-stone-50 text-stone-700'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate pr-2">
                                <span className="truncate">{pricePoint.supermarketName}</span>
                                {typeof dist === 'number' && (
                                  <span className="text-[10px] text-stone-600 font-medium shrink-0 bg-stone-100/80 px-1 py-0.2 rounded-xs">
                                    {dist} km
                                  </span>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold">
                                  R$ {pricePoint.price.toFixed(2).replace('.', ',')}
                                </span>
                                {pricePoint.wholesalePrice && (
                                  <span className="text-[10px] text-stone-500 ml-1">
                                    (Atac. {pricePoint.wholesaleMinQty}+: R$ {pricePoint.wholesalePrice.toFixed(2).replace('.', ',')})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {sortedPrices.length > 4 && (
                          <button
                            onClick={() => onOpenHistory(product)}
                            className="text-[11px] text-emerald-700 hover:underline font-semibold block text-center w-full pt-1"
                          >
                            + Ver todos os {sortedPrices.length} supermercados
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Add to Cart */}
                    <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                      {currentQty > 0 ? (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <div className="flex items-center gap-1 bg-white border border-emerald-300 rounded-xl p-1 shadow-2xs">
                            <button
                              onClick={() => onAddToCart(product, currentQty - 1)}
                              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-lg transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-stone-900">
                              {currentQty}
                            </span>
                            <button
                              onClick={() => onAddToCart(product, currentQty + 1)}
                              className="w-7 h-7 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-xs font-bold text-emerald-800">
                            R$ {(bestPrice.price * currentQty).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ) : (
                        <button
                          id={`add-cart-btn-${product.id}`}
                          onClick={() => onAddToCart(product, 1)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar à Lista de Compras
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
