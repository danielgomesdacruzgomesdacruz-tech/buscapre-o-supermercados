export interface Supermarket {
  id: string;
  name: string;
  chain: string;
  logoColor: string;
  address: string;
  bairro?: string;
  distanceKm: number;
  rating: number;
  deliveryAvailable: boolean;
  clubName?: string;
  type: 'atacarejo' | 'hipermercado' | 'supermercado' | 'bairro';
  lat: number;
  lng: number;
  openingHours?: string;
  parking?: string;
  phone?: string;
  features?: string[];
}

export type VehicleType = 'car' | 'moto' | 'transit' | 'bike' | 'walk';

export interface RouteStop {
  id: string;
  order: number;
  type: 'origin' | 'supermarket' | 'destination';
  title: string;
  address: string;
  supermarket?: Supermarket;
  distanceFromPrevKm: number;
  durationFromPrevMin: number;
  itemsToBuy?: {
    productName: string;
    quantity: number;
    subtotal: number;
  }[];
  subtotalToSpend?: number;
  lat: number;
  lng: number;
}

export interface RouteOptimizationResult {
  originAddress: string;
  stops: RouteStop[];
  totalDistanceKm: number;
  totalDurationMin: number;
  estimatedFuelCost: number;
  vehicleType: VehicleType;
  fuelPricePerLiter: number;
  fuelEfficiencyKmPerLiter: number;
  grossProductSavings: number;
  netSavings: number;
  isEconomicallyViable: boolean;
  googleMapsUrl: string;
  wazeUrl: string;
}

export interface PricePoint {
  supermarketId: string;
  supermarketName: string;
  price: number;
  clubPrice?: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  lastUpdated: string;
  verifiedCount: number;
  inStock: boolean;
  promotionLabel?: string;
}

export interface PriceHistoryItem {
  date: string;
  price: number;
  supermarketName: string;
}

export type ProductCategory =
  | 'alimentos'
  | 'bebidas'
  | 'carnes'
  | 'hortifruti'
  | 'laticinios'
  | 'limpeza'
  | 'higiene'
  | 'padaria'
  | 'veiculos'
  | 'combustivel'
  | 'pneus_rodas'
  | 'oleos_fluidos'
  | 'baterias_eletrica'
  | 'pecas_manutencao'
  | 'farmacia'
  | 'eletronicos'
  | 'eletrodomesticos'
  | 'construcao'
  | string;

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  domain?: 'supermercado' | 'veiculos' | 'farmacia' | 'eletronicos' | 'eletrodomesticos' | 'construcao';
  ean: string;
  volumeOrWeight: string;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'un' | 'km' | 'mes' | string;
  unitValue: number; // numeric value for calculating price per unit
  imageUrl: string;
  prices: PricePoint[];
  history: PriceHistoryItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SplitOptimizationPlan {
  totalOriginalSingleStore: {
    supermarketName: string;
    total: number;
  };
  splitStores: {
    supermarket: Supermarket;
    items: {
      product: Product;
      quantity: number;
      pricePerUnit: number;
      subtotal: number;
    }[];
    subtotal: number;
  }[];
  optimizedTotal: number;
  savingsAmount: number;
  savingsPercentage: number;
}

export interface ScannedReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface ScannedReceiptResult {
  supermarketName: string;
  date: string;
  total: number;
  items: ScannedReceiptItem[];
  cnpj?: string;
  rawText?: string;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: number;
  currentLowestPrice: number;
  supermarketName: string;
  createdAt: string;
  active: boolean;
}

export interface CommunityPriceSubmission {
  id: string;
  productName: string;
  supermarketName: string;
  price: number;
  userName: string;
  date: string;
  status: 'aprovado' | 'em_analise';
}

export interface VehicleDealershipOffer {
  dealershipId: string;
  dealershipName: string;
  dealershipType: 'concessionaria_oficial' | 'auto_shopping' | 'seminovos_multimarcas' | 'revenda_premium';
  price: number;
  cashDiscountPrice?: number;
  financingEntryMin?: number;
  financingInstallment48x?: number;
  km: number;
  color: string;
  warrantyMonths: number;
  verified: boolean;
  conditionBadge: string;
  lastUpdated: string;
  distanceKm: number;
  durationMin: number;
  bestRoute: string;
  address: string;
  phone: string;
  whatsapp?: string;
  rating: number;
}

export interface VehicleListing {
  id: string;
  make: string; // Ex: Chevrolet, Toyota, Volkswagen, Hyundai, Fiat, Honda, Jeep, BYD, Nissan
  model: string; // Ex: Onix, Corolla, HB20, T-Cross, Compass, Dolphin Mini, Fastback, Creta
  version: string; // Ex: 1.0 Turbo Premier AT, 2.0 XRE Flex Direct Shift, 1.0 TGDI Comfort Plus
  year: number; // Ex: 2024 / 2025 / 2026
  modelYear: number;
  condition: 'zero_km' | 'seminovo_revisado' | 'usado_garantia';
  bodyType: 'hatch' | 'sedan' | 'suv' | 'picape' | 'eletrico' | 'hibrido' | 'moto';
  fuelType: 'flex' | 'gasolina' | 'eletrico' | 'hibrido' | 'diesel';
  transmission: 'automatico' | 'manual' | 'cvt';
  fipeCode: string;
  fipePrice: number; // Valor oficial de referência Tabela FIPE
  marketAveragePrice: number;
  minPrice: number;
  maxPrice: number;
  imageUrl: string;
  highlightTag?: string; // Ex: "R$ 4.800 abaixo da FIPE", "0km Pronta Entrega", "Taxa 0% em 24x"
  features: string[];
  dealerships: VehicleDealershipOffer[];
  history: {
    date: string;
    fipeValue: number;
    averageMarketValue: number;
  }[];
}

export interface VehicleDealership {
  id: string;
  name: string;
  tradeName: string;
  type: 'concessionaria_oficial' | 'auto_shopping' | 'seminovos_multimarcas' | 'revenda_premium';
  brands: string[];
  address: string;
  bairro: string;
  city: string;
  distanceKm: number;
  durationMin: number;
  bestRoute: string;
  rating: number;
  reviewCount: number;
  phone: string;
  whatsapp?: string;
  openingHours: string;
  features: string[];
  logoColor: string;
  verifiedBadge: boolean;
  stockCount: number;
  financingPartners: string[];
  lat: number;
  lng: number;
}

export type ApplianceSubcategory =
  | 'geladeiras'
  | 'lavadoras'
  | 'airfryer'
  | 'microondas'
  | 'fogoes'
  | 'lavaloucas'
  | 'climatizacao'
  | 'portateis';

export interface ApplianceStoreOffer {
  storeId: string;
  storeName: string;
  storeLogo?: string;
  storeType: 'marketplace' | 'varejo_fisico_online' | 'loja_oficial_marca';
  cashPrice: number;
  cashDiscountLabel?: string; // Ex: "10% no Pix"
  installmentPrice: number;
  installmentCount: number;
  installmentValue: number;
  freeShipping: boolean;
  shippingEstimateDays: number;
  couponCode?: string;
  couponDiscountValue?: number;
  cashbackPercentage?: number;
  inStock: boolean;
  productUrl: string;
  rating: number;
  reviewCount: number;
  lastUpdated: string;
}

export interface AppliancePhysicalStore {
  id: string;
  name: string;
  chain: string;
  address: string;
  bairro: string;
  city: string;
  distanceKm: number;
  durationMin: number;
  bestRoute: string;
  inStockShowroom: boolean;
  phone: string;
  whatsapp?: string;
  openingHours: string;
  lat: number;
  lng: number;
}

export interface ApplianceProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  subcategory: ApplianceSubcategory;
  capacity: string; // Ex: "375 Litros", "13 kg", "32 Litros", "5 Bocas", "4.1L", "12000 BTUs"
  voltage: '110V' | '220V' | 'Bivolt' | '110V / 220V';
  colorFinish: string; // Ex: "Inox Escovado", "Branco", "Black Inox", "Preto"
  energyRating: 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C';
  monthlyEnergyKwh: number; // Consumo mensal estimado em kWh
  imageUrl: string;
  galleryImages?: string[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  historicalLowestPrice: number;
  isHistoricLow: boolean; // Flag se está no menor preço dos últimos 40 dias
  warrantyMonths: number;
  dimensions: {
    heightCm: number;
    widthCm: number;
    depthCm: number;
    weightKg: number;
  };
  keyFeatures: string[];
  offers: ApplianceStoreOffer[];
  nearbyStores: AppliancePhysicalStore[];
  history: {
    date: string;
    lowestPrice: number;
    averagePrice: number;
  }[];
}


