import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProductSearchTab } from './components/ProductSearchTab';
import { SmartCartTab } from './components/SmartCartTab';
import { ReceiptScannerTab } from './components/ReceiptScannerTab';
import { AiSearchResultModal } from './components/AiSearchResultModal';
import { DealsCommunityTab } from './components/DealsCommunityTab';
import { SupermarketRoutesTab } from './components/SupermarketRoutesTab';
import { VehiclesTab } from './components/VehiclesTab';
import { AppliancesTab } from './components/AppliancesTab';
import { ProductHistoryModal } from './components/ProductHistoryModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { INITIAL_PRODUCTS, INITIAL_SUPERMARKETS } from './data/mockProducts';
import { Product, Supermarket, CartItem, PriceAlert } from './types';
import { UserCoordinates, requestBrowserGeolocation } from './utils/geolocation';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('search');
  const [selectedCity, setSelectedCity] = useState<string>('São Paulo, SP');
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load products from localStorage or defaults
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('buscapreco_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [supermarkets, setSupermarkets] = useState<Supermarket[]>(INITIAL_SUPERMARKETS);

  // Load cart from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('buscapreco_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Pre-populate with a few initial items so cart immediately showcases savings
    return [
      { product: INITIAL_PRODUCTS[0], quantity: 1 }, // Arroz Camil 5kg
      { product: INITIAL_PRODUCTS[1], quantity: 2 }, // Feijão Camil 1kg
      { product: INITIAL_PRODUCTS[3], quantity: 4 }, // Leite Italac 1L
      { product: INITIAL_PRODUCTS[5], quantity: 1 }, // Picanha Friboi kg
    ];
  });

  const [aiModalQuery, setAiModalQuery] = useState<string | null>(null);
  const [historyModalProduct, setHistoryModalProduct] = useState<Product | null>(null);
  const [alertModalProduct, setAlertModalProduct] = useState<Product | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('buscapreco_cart', JSON.stringify(cart));
  }, [cart]);

  // Save products to localStorage
  useEffect(() => {
    localStorage.setItem('buscapreco_products', JSON.stringify(products));
  }, [products]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Request real user GPS position
  const handleRequestLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await requestBrowserGeolocation();
      setUserCoordinates(coords);
      if (coords.cityName) {
        setSelectedCity(coords.cityName);
      }
      showToast('📍 Localização GPS obtida com sucesso! Distâncias e rotas atualizadas.');
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      setLocationError(err.message || 'Não foi possível acessar a localização.');
      showToast('Não foi possível obter o GPS. Usando cidade padrão.');
    } finally {
      setIsLocating(false);
    }
  };

  // Cart Quantities map for fast lookup
  const cartQuantities = cart.reduce((acc, item) => {
    acc[item.product.id] = item.quantity;
    return acc;
  }, {} as { [productId: string]: number });

  // Add / Update item in Cart
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (quantity <= 0) {
        return prev.filter((i) => i.product.id !== product.id);
      }
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity = quantity;
        return updated;
      }
      return [...prev, { product, quantity }];
    });
    showToast(`"${product.name}" adicionado à lista!`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleClearCart = (productId?: string) => {
    if (productId) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart([]);
      showToast('Lista de compras esvaziada.');
    }
  };

  // Import items from Receipt Scanner
  const handleImportItemsToCart = (
    scannedItems: { name: string; quantity: number; price: number }[]
  ) => {
    scannedItems.forEach((item) => {
      // Find matching or create new product
      let matching = products.find(
        (p) =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (!matching) {
        matching = {
          id: `scanned-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: item.name,
          brand: 'Item da Nota',
          category: 'alimentos',
          ean: '7890000000000',
          volumeOrWeight: '1 un',
          unit: 'un',
          unitValue: 1,
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
          prices: [
            {
              supermarketId: 'assai',
              supermarketName: 'Supermercado Escaneado',
              price: item.price,
              lastUpdated: 'Hoje (Scan)',
              verifiedCount: 1,
              inStock: true,
            },
          ],
          history: [{ date: 'Hoje', price: item.price, supermarketName: 'Nota Fiscal' }],
        };
        setProducts((prev) => [matching!, ...prev]);
      }

      handleAddToCart(matching, item.quantity || 1);
    });

    showToast(`${scannedItems.length} itens do cupom importados com sucesso!`);
    setActiveTab('cart');
  };

  // Contribute prices to catalog from scanner
  const handleContributePrices = (items: any[], supermarketName: string) => {
    items.forEach((item) => {
      handleContributeManualPrice(item.name, supermarketName, item.unitPrice);
    });
    showToast('Obrigado! Os preços foram enviados para a base colaborativa.');
  };

  // Contribute manual price
  const handleContributeManualPrice = (
    productName: string,
    supermarketName: string,
    price: number
  ) => {
    setProducts((prev) => {
      const existing = prev.find(
        (p) => p.name.toLowerCase() === productName.toLowerCase()
      );
      if (existing) {
        const updatedPrices = existing.prices.map((pr) =>
          pr.supermarketName.toLowerCase() === supermarketName.toLowerCase()
            ? { ...pr, price, lastUpdated: 'Agora mesmo', verifiedCount: pr.verifiedCount + 1 }
            : pr
        );
        const hasMarket = existing.prices.some(
          (pr) => pr.supermarketName.toLowerCase() === supermarketName.toLowerCase()
        );
        if (!hasMarket) {
          updatedPrices.push({
            supermarketId: `custom-${Date.now()}`,
            supermarketName,
            price,
            lastUpdated: 'Agora mesmo',
            verifiedCount: 1,
            inStock: true,
          });
        }
        return prev.map((p) => (p.id === existing.id ? { ...p, prices: updatedPrices } : p));
      } else {
        const newProd: Product = {
          id: `user-prod-${Date.now()}`,
          name: productName,
          brand: 'Colaborativo',
          category: 'alimentos',
          ean: '7899999999999',
          volumeOrWeight: '1 un',
          unit: 'un',
          unitValue: 1,
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
          prices: [
            {
              supermarketId: `custom-${Date.now()}`,
              supermarketName,
              price,
              lastUpdated: 'Agora mesmo',
              verifiedCount: 1,
              inStock: true,
            },
          ],
          history: [{ date: 'Hoje', price, supermarketName }],
        };
        return [newProd, ...prev];
      }
    });
  };

  // Add custom product from AI Search
  const handleAddCustomProduct = (productData: any) => {
    const newProd: Product = {
      id: `ai-prod-${Date.now()}`,
      name: productData.name,
      brand: productData.brand || 'Marca Líder',
      category: productData.category || 'alimentos',
      ean: '7891234567899',
      volumeOrWeight: productData.volumeOrWeight || '1 un',
      unit: 'un',
      unitValue: 1,
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
      prices: productData.prices.length > 0 ? productData.prices : [
        {
          supermarketId: 'assai',
          supermarketName: 'Assaí Atacadista',
          price: 18.50,
          lastUpdated: 'Hoje (IA)',
          verifiedCount: 5,
          inStock: true,
        },
      ],
      history: [{ date: 'Hoje', price: productData.prices[0]?.price || 18.50, supermarketName: 'Pesquisa IA' }],
    };

    setProducts((prev) => [newProd, ...prev]);
    handleAddToCart(newProd, 1);
    showToast(`"${newProd.name}" adicionado com sucesso!`);
  };

  const handleNavigateToAiSearch = (query: string) => {
    setAiModalQuery(query);
  };

  const handleSaveAlert = (
    productId: string,
    productName: string,
    targetPrice: number,
    currentLowest: number
  ) => {
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      productId,
      productName,
      targetPrice,
      currentLowestPrice: currentLowest,
      supermarketName: 'Qualquer Supermercado',
      createdAt: 'Hoje',
      active: true,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    showToast(`Alerta de R$ ${targetPrice.toFixed(2)} criado para ${productName}!`);
  };

  const cartTotalItems = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartTotalItems}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        userCoordinates={userCoordinates}
        onRequestLocation={handleRequestLocation}
        isLocating={isLocating}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'search' && (
          <ProductSearchTab
            products={products}
            supermarkets={supermarkets}
            onAddToCart={handleAddToCart}
            cartQuantities={cartQuantities}
            onOpenHistory={(p) => setHistoryModalProduct(p)}
            onOpenAlert={(p) => setAlertModalProduct(p)}
            onNavigateToAiSearch={handleNavigateToAiSearch}
            selectedCity={selectedCity}
            onNavigateToRoutes={() => setActiveTab('routes')}
            onNavigateToVehicles={() => setActiveTab('vehicles')}
            onNavigateToAppliances={() => setActiveTab('appliances')}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiclesTab
            selectedCity={selectedCity}
            onNavigateToAiSearch={handleNavigateToAiSearch}
            onNavigateToRoutes={() => setActiveTab('routes')}
            userCoordinates={userCoordinates}
          />
        )}

        {activeTab === 'appliances' && (
          <AppliancesTab
            selectedCity={selectedCity}
            onAddToCart={handleAddToCart}
            onNavigateToAiSearch={handleNavigateToAiSearch}
            onNavigateToRoutes={() => setActiveTab('routes')}
            userCoordinates={userCoordinates}
          />
        )}

        {activeTab === 'cart' && (
          <SmartCartTab
            cart={cart}
            supermarkets={supermarkets}
            onUpdateQuantity={handleUpdateCartQuantity}
            onClearCart={handleClearCart}
            onNavigateToSearch={() => setActiveTab('search')}
            onNavigateToRoutes={() => setActiveTab('routes')}
          />
        )}

        {activeTab === 'routes' && (
          <SupermarketRoutesTab
            supermarkets={supermarkets}
            cart={cart}
            selectedCity={selectedCity}
            onNavigateToCart={() => setActiveTab('cart')}
            onNavigateToSearch={() => setActiveTab('search')}
            userCoordinates={userCoordinates}
            onRequestLocation={handleRequestLocation}
            isLocating={isLocating}
            locationError={locationError}
          />
        )}

        {activeTab === 'scanner' && (
          <ReceiptScannerTab
            onImportItemsToCart={handleImportItemsToCart}
            onContributePrices={handleContributePrices}
            onNavigateHome={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'deals' && (
          <DealsCommunityTab
            products={products}
            supermarkets={supermarkets}
            onAddToCart={handleAddToCart}
            onContributeManualPrice={handleContributeManualPrice}
            onNavigateHome={() => setActiveTab('search')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-12 py-6 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">
              {activeTab === 'vehicles'
                ? 'BuscaPreço Veículos & Tabela FIPE'
                : activeTab === 'routes'
                ? 'BuscaPreço Rotas & Navegação'
                : activeTab === 'scanner'
                ? 'BuscaPreço OCR Scanner'
                : 'BuscaPreço Supermercados & Atacarejos'}
            </span>
            <span>•</span>
            <span>
              {activeTab === 'vehicles'
                ? 'Cotações FIPE e estoque de concessionárias'
                : 'Comparador Inteligente de Preços com IA'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Dados e cotações atualizados diariamente</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {historyModalProduct && (
        <ProductHistoryModal
          product={historyModalProduct}
          onClose={() => setHistoryModalProduct(null)}
        />
      )}

      {alertModalProduct && (
        <PriceAlertModal
          product={alertModalProduct}
          onClose={() => setAlertModalProduct(null)}
          onSaveAlert={handleSaveAlert}
        />
      )}

      {/* Modal de resultado da Pesquisa com IA, aberto a partir de qualquer aba */}
      <AiSearchResultModal
        query={aiModalQuery}
        selectedCity={selectedCity}
        onClose={() => setAiModalQuery(null)}
        onAddCustomProduct={handleAddCustomProduct}
        onNavigateToRoutes={() => setActiveTab('routes')}
      />
    </div>
  );
}
