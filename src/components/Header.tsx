import React from 'react';
import {
  ShoppingCart,
  Receipt,
  Search,
  Tag,
  MapPin,
  Store,
  Navigation,
  Car,
  Compass,
  LocateFixed,
  Zap,
  Pill,
  Smartphone,
  Hammer,
} from 'lucide-react';
import { UserCoordinates } from '../utils/geolocation';

interface DomainCategoryConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  accentBg: string;
}

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  userCoordinates?: UserCoordinates | null;
  onRequestLocation?: () => void;
  isLocating?: boolean;
  /** Categorias exibidas logo abaixo do título quando a aba Supermercados está ativa. */
  domainCategories?: DomainCategoryConfig[];
  selectedDomain?: string;
  onSelectDomain?: (domainId: string) => void;
}

export const CITIES = [
  'São Paulo, SP',
  'Rio de Janeiro, RJ',
  'Belo Horizonte, MG',
  'Curitiba, PR',
  'Porto Alegre, RS',
  'Salvador, BA',
  'Brasília, DF',
  'Recife, PE',
  'Fortaleza, CE',
  'Campinas, SP',
  'Goiânia, GO',
];

interface TabHeaderConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  prefix: string;
  highlightTitle: string;
  titleColor: string;
  badgeText: string;
  badgeStyle: string;
  subtitle: string;
  cityPinColor: string;
}

// Título do cabeçalho exibido quando a aba Supermercados está ativa, um por
// categoria da barra de domínios (Supermercados, Veículos, Farmácia, etc).
const SEARCH_DOMAIN_CONFIGS: Record<string, TabHeaderConfig> = {
  supermercado: {
    icon: Store,
    iconBg: 'bg-emerald-600 group-hover:bg-emerald-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Supermercados',
    titleColor: 'text-emerald-600',
    badgeText: 'Ao Vivo • Preços de Hoje',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    subtitle: '',
    cityPinColor: 'text-emerald-600',
  },
  veiculos: {
    icon: Car,
    iconBg: 'bg-amber-500 group-hover:bg-amber-600',
    iconColor: 'text-stone-950',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Veículos',
    titleColor: 'text-amber-700',
    badgeText: 'FIPE Oficial • Concessionárias',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
    subtitle: '',
    cityPinColor: 'text-amber-600',
  },
  farmacia: {
    icon: Pill,
    iconBg: 'bg-sky-600 group-hover:bg-sky-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Farmácias',
    titleColor: 'text-sky-700',
    badgeText: 'Medicamentos & Saúde',
    badgeStyle: 'bg-sky-100 text-sky-900 border-sky-300',
    subtitle: '',
    cityPinColor: 'text-sky-600',
  },
  eletronicos: {
    icon: Smartphone,
    iconBg: 'bg-purple-600 group-hover:bg-purple-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Eletrônicos',
    titleColor: 'text-purple-700',
    badgeText: 'Celulares & Tecnologia',
    badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300',
    subtitle: '',
    cityPinColor: 'text-purple-600',
  },
  eletrodomesticos: {
    icon: Zap,
    iconBg: 'bg-sky-600 group-hover:bg-sky-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Eletrodomésticos',
    titleColor: 'text-sky-700',
    badgeText: 'Selo Procel A+++ • Grandes Varejos',
    badgeStyle: 'bg-sky-100 text-sky-900 border-sky-300',
    subtitle: '',
    cityPinColor: 'text-sky-600',
  },
  construcao: {
    icon: Hammer,
    iconBg: 'bg-orange-600 group-hover:bg-orange-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Construção',
    titleColor: 'text-orange-700',
    badgeText: 'Materiais & Ferramentas',
    badgeStyle: 'bg-orange-100 text-orange-900 border-orange-300',
    subtitle: '',
    cityPinColor: 'text-orange-600',
  },
};

const TAB_HEADER_CONFIGS: Record<string, TabHeaderConfig> = {
  cart: {
    icon: ShoppingCart,
    iconBg: 'bg-emerald-600 group-hover:bg-emerald-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Carrinho Inteligente & Divisão de Compras',
    titleColor: 'text-emerald-600',
    badgeText: 'Otimizador de Economia',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    subtitle: 'Cálculo de menor valor total com divisão otimizada entre supermercados e atacarejos.',
    cityPinColor: 'text-emerald-600',
  },
  routes: {
    icon: Navigation,
    iconBg: 'bg-indigo-600 group-hover:bg-indigo-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Melhores Rotas & Mapa de Lojas',
    titleColor: 'text-indigo-600',
    badgeText: 'GPS & Custo de Combustível',
    badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    subtitle: 'Trajetos otimizados ponto a ponto, consumo de gasolina/etanol e tempo estimado no trânsito.',
    cityPinColor: 'text-indigo-600',
  },
  scanner: {
    icon: Receipt,
    iconBg: 'bg-amber-600 group-hover:bg-amber-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Scanner OCR de Nota Fiscal com IA',
    titleColor: 'text-amber-700',
    badgeText: 'Gemini Vision AI',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
    subtitle: 'Fotografe o QR Code ou cupom fiscal impresso para extrair produtos, comparar valores e atualizar preços.',
    cityPinColor: 'text-amber-600',
  },
  deals: {
    icon: Tag,
    iconBg: 'bg-rose-600 group-hover:bg-rose-700',
    iconColor: 'text-white',
    prefix: 'Super Busca Preços',
    highlightTitle: 'Radar de Ofertas & Comunidade',
    titleColor: 'text-rose-600',
    badgeText: 'Preços Colaborativos',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-200',
    subtitle: 'Encartes, promoções relâmpago e preços enviados e confirmados por consumidores na sua região.',
    cityPinColor: 'text-rose-600',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  selectedCity,
  setSelectedCity,
  userCoordinates,
  onRequestLocation,
  isLocating = false,
  domainCategories,
  selectedDomain,
  onSelectDomain,
}) => {
  const currentConfig =
    activeTab === 'search'
      ? SEARCH_DOMAIN_CONFIGS[selectedDomain || 'supermercado'] || SEARCH_DOMAIN_CONFIGS.supermercado
      : TAB_HEADER_CONFIGS[activeTab] || SEARCH_DOMAIN_CONFIGS.supermercado;
  const ActiveIcon = currentConfig.icon;

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with dynamic tab identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3 text-left group">
            <div
              className={`w-10 h-10 rounded-xl ${currentConfig.iconBg} ${currentConfig.iconColor} transition flex items-center justify-center shadow-xs font-bold text-xl shrink-0`}
            >
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                  {currentConfig.prefix}{' '}
                  <span className={`${currentConfig.titleColor} font-extrabold`}>
                    {currentConfig.highlightTitle}
                  </span>
                </h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentConfig.badgeStyle}`}
                >
                  {currentConfig.badgeText}
                </span>
              </div>
              {currentConfig.subtitle && (
                <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
                  {currentConfig.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* City selector & Cart button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* GPS Location Button */}
            {onRequestLocation && (
              <button
                type="button"
                onClick={onRequestLocation}
                title={
                  userCoordinates
                    ? `GPS Ativo: ${userCoordinates.address || 'Localização obtida'}`
                    : 'Usar minha localização GPS para calcular distâncias e rotas'
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  userCoordinates
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                    : isLocating
                    ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700 border-stone-200'
                }`}
              >
                <LocateFixed
                  className={`w-3.5 h-3.5 ${
                    userCoordinates
                      ? 'text-emerald-600'
                      : isLocating
                      ? 'text-amber-600 animate-spin'
                      : 'text-stone-500'
                  }`}
                />
                <span className="text-[11px]">
                  {isLocating ? 'Buscando GPS...' : userCoordinates ? 'GPS Ativo' : 'Meu GPS'}
                </span>
                {userCoordinates && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                )}
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/70 border border-stone-200 px-3 py-1.5 rounded-xl text-xs text-stone-700 transition">
              <MapPin className={`w-3.5 h-3.5 ${currentConfig.cityPinColor} shrink-0`} />
              <select
                aria-label="Selecione sua cidade"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none text-xs font-medium text-stone-800 focus:outline-hidden cursor-pointer"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="header-cart-btn"
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4 hidden sm:block" />
              <span>Carrinho</span>
              {cartCount > 0 && (
                <span className="bg-emerald-700 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-5 text-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Domain Category Selector Tabs (só aparece na aba Supermercados) */}
        {activeTab === 'search' && domainCategories && domainCategories.length > 0 && selectedDomain && onSelectDomain && (
          <div className="pb-3">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 sm:overflow-x-auto sm:no-scrollbar">
              {domainCategories.map((domain) => {
                const Icon = domain.icon;
                const isSelected = selectedDomain === domain.id;
                return (
                  <button
                    key={domain.id}
                    id={`domain-tab-${domain.id}`}
                    onClick={() => onSelectDomain(domain.id)}
                    title={domain.name}
                    aria-label={domain.name}
                    className={`group w-full sm:w-auto sm:shrink-0 flex items-center justify-start gap-2 h-11 px-3.5 sm:py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-150 ease-out active:scale-[0.97] cursor-pointer ${
                      isSelected
                        ? `${domain.accentBg} text-white shadow-md ring-2 ring-stone-900/10`
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200/80'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-stone-600'}`} />
                    <span className="whitespace-nowrap text-sm font-bold italic truncate">
                      {domain.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar pt-1 border-t border-stone-100">
          <button
            id="tab-cart"
            onClick={() => setActiveTab('cart')}
            className={`flex items-center gap-1.5 py-2.5 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition rounded-t-lg ${
              activeTab === 'cart'
                ? 'border-emerald-600 text-emerald-700 font-semibold bg-emerald-50/50'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>Carrinho Inteligente</span>
            {cartCount > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          <button
            id="tab-routes"
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-1.5 py-2.5 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition rounded-t-lg ${
              activeTab === 'routes'
                ? 'border-indigo-600 text-indigo-700 font-semibold bg-indigo-50/50'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>Melhor Rota & Mapa</span>
          </button>

          <button
            id="tab-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1.5 py-2.5 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition rounded-t-lg ${
              activeTab === 'scanner'
                ? 'border-amber-600 text-amber-800 font-semibold bg-amber-50/50'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Scanner de Nota Fiscal (IA)</span>
          </button>

          <button
            id="tab-deals"
            onClick={() => setActiveTab('deals')}
            className={`flex items-center gap-1.5 py-2.5 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition rounded-t-lg ${
              activeTab === 'deals'
                ? 'border-rose-600 text-rose-700 font-semibold bg-rose-50/50'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
            }`}
          >
            <Tag className="w-4 h-4 text-rose-500" />
            <span>Radar de Ofertas & Comunidade</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
