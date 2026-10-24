import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import { Truck, Store, ShieldCheck, Sparkles, Phone, MapPin, ArrowRight, ShoppingBag } from 'lucide-react';

export default function App() {
  // URL-only Admin Detection Helper (strictly accessed by typing /admin in browser address bar)
  const checkIsAdminPath = () => {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const hash = window.location.hash.toLowerCase();
    return path === '/admin' || path.startsWith('/admin') || hash === '#admin';
  };

  // Navigation / Route state: 'store' | 'admin'
  const [currentView, setCurrentView] = useState(() => checkIsAdminPath() ? 'admin' : 'store');

  // Listen to browser navigation, URL changes, and popstate
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentView(checkIsAdminPath() ? 'admin' : 'store');
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Sync view changes to browser URL address bar
  const handleNavigate = (view) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Products and loading
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals and Drawer
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Cart state persisted in localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('srinivasa_silks_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('srinivasa_silks_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // Fetch products from server
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cart Handlers
  const handleAddToCart = (productToAdd) => {
    setCartItems((prev) => {
      const color = productToAdd.selectedColor || (productToAdd.colors && productToAdd.colors[0]) || 'Standard';
      const existingIndex = prev.findIndex(
        (item) => item.id === productToAdd.id && item.selectedColor === color
      );

      const qtyToAdd = productToAdd.quantity || 1;

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qtyToAdd;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: productToAdd.id,
            name: productToAdd.name,
            category: productToAdd.category,
            price: productToAdd.price,
            selectedColor: color,
            imageUrl: productToAdd.imageUrl,
            quantity: qtyToAdd
          }
        ];
      }
    });
  };

  const handleUpdateCartQty = (id, selectedColor, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(id, selectedColor);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.selectedColor === selectedColor
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const handleRemoveCartItem = (id, selectedColor) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === id && item.selectedColor === selectedColor))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.fabric && p.fabric.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (currentView !== 'store') setCurrentView('store');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      {currentView === 'admin' ? (
        <AdminPanel onBackToStore={() => handleNavigate('store')} />
      ) : (
        <main style={{ flex: 1 }}>
          {/* Hero Banner Section */}
          <section className="hero-banner">
            <div className="hero-inner">
              <div>
                <div className="hero-tag">
                  <Sparkles size={14} /> Hyderabad's Premier Bridal Silk House
                </div>

                <h2 className="hero-title">
                  Grace & Grandeur in Every Thread
                </h2>

                <p className="hero-subtitle">
                  Explore exquisite Kanchipuram bridal pattu, regal Banarasi brocades, premium 2x2 cotton blouse linings, raw silks, and tailored petticoats. Order online for instant Hyderabad delivery via Rapido / Porter, or visit our Secunderabad showroom.
                </p>

                <div className="hero-features">
                  <div className="hero-feature-item">
                    <div className="hero-feature-icon">🛵</div>
                    <div>
                      <div>Hyderabad Delivery</div>
                      <span style={{ fontSize: '11.5px', color: '#777', fontWeight: 400 }}>Via Rapido / Porter</span>
                    </div>
                  </div>

                  <div className="hero-feature-item">
                    <div className="hero-feature-icon">🏪</div>
                    <div>
                      <div>Store Pick-up</div>
                      <span style={{ fontSize: '11.5px', color: '#777', fontWeight: 400 }}>Lalapet, Secunderabad</span>
                    </div>
                  </div>

                  <div className="hero-feature-item">
                    <div className="hero-feature-icon">✨</div>
                    <div>
                      <div>Guest Ordering</div>
                      <span style={{ fontSize: '11.5px', color: '#777', fontWeight: 400 }}>No Login Required</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Showroom & Quick Order Highlights Card */}
              <div className="hero-location-card">
                <div className="location-card-header">
                  <span className="location-badge">● Open Today 10:30 AM - 9:30 PM</span>
                  <span style={{ fontSize: '12px', color: '#966708', fontWeight: 700 }}>Secunderabad / Hyd</span>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
                  Srinivasa Silks Showroom
                </h3>
                <p style={{ fontSize: '13px', color: '#555', marginBottom: '14px', lineHeight: 1.5 }}>
                  Prashanti Nagar, Moula Ali, Ward 143 Tarnaka, Hyderabad, Telangana - 500017.
                </p>

                <div style={{ background: '#fdfbf7', border: '1px solid #eee8d5', padding: '12px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                  <strong style={{ color: '#8a1528' }}>🛵 Hyderabad Delivery Service:</strong>
                  <div style={{ color: '#555', marginTop: '2px' }}>
                    Need urgent sarees, linings, or petticoats? Place your order with live GPS location and we dispatch via Porter or Rapido directly to your doorstep.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <a
                    href="https://maps.app.goo.gl/6i7ESPtwhNTuSAEX8"
                    target="_blank"
                    rel="noreferrer"
                    className="contact-pill"
                    style={{ justifyContent: 'center', background: '#fdf8ed', borderColor: '#ecdcb9', color: '#966708' }}
                  >
                    <MapPin size={14} /> Open in Google Maps ↗
                  </a>
                  <a
                    href="tel:+917013311862"
                    className="contact-pill"
                    style={{ justifyContent: 'center' }}
                  >
                    <Phone size={14} /> Call Showroom
                  </a>
                </div>

                <a
                  href="https://wa.me/917013311862?text=Hello%20Srinivasa%20Silks,%20I%20am%20looking%20for%20sarees%20and%20linings"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-pill"
                  style={{ justifyContent: 'center', width: '100%' }}
                >
                  <span>💬 Chat on WhatsApp (7013311862)</span>
                </a>
              </div>
            </div>
          </section>

          {/* Product Grid Section */}
          <section className="products-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  {selectedCategory === 'All' ? 'Curated Collections' : `${selectedCategory} Collection`}
                </h2>
                <p className="section-desc">
                  Authentic handlooms & bespoke tailoring essentials • Showing {filteredProducts.length} items
                </p>
              </div>

              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  style={{ background: 'none', border: 'none', color: '#b8860b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  View All Collections
                </button>
              )}
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✨</div>
                <div>Loading Srinivasa Silks inventory...</div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#faf9f7', borderRadius: '16px', border: '1px solid #eae7e1' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
                <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '6px' }}>No items match your search</h3>
                <p style={{ fontSize: '13px', color: '#777', marginBottom: '16px' }}>
                  Try adjusting your keywords or category filters.
                </p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                  className="add-to-cart-btn"
                  style={{ margin: '0 auto' }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const inBagCount = cartItems
                    .filter((item) => item.id === product.id)
                    .reduce((acc, it) => acc + it.quantity, 0);

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      inBagCount={inBagCount}
                      onSelectProduct={setSelectedProduct}
                      onAddToCart={handleAddToCart}
                      onOpenCart={() => setIsCartOpen(true)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          inBagCount={cartItems
            .filter((item) => item.id === selectedProduct.id)
            .reduce((acc, it) => acc + it.quantity, 0)}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onOpenCart={() => {
            setSelectedProduct(null);
            setIsCartOpen(true);
          }}
          onBuyNow={() => {
            setSelectedProduct(null);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout & Location Booking Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onClearCart={handleClearCart}
      />

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (currentView !== 'store') setCurrentView('store');
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
        onNavigate={handleNavigate}
      />

      {/* Floating Bag Button (Bottom Right) */}
      {currentView === 'store' && !isCartOpen && !isCheckoutOpen && (
        <button
          className="floating-bag-button"
          onClick={() => setIsCartOpen(true)}
          aria-label="Shopping Bag"
        >
          <div className="floating-bag-icon-wrap">
            <ShoppingBag size={22} />
            {totalCartCount > 0 && (
              <span className="floating-bag-badge">{totalCartCount}</span>
            )}
          </div>
          {totalCartCount > 0 ? (
            <div className="floating-bag-text">
              <span className="floating-bag-label">VIEW BAG</span>
              <span className="floating-bag-amount">₹{totalCartAmount.toLocaleString('en-IN')}</span>
            </div>
          ) : (
            <div className="floating-bag-text">
              <span className="floating-bag-label">BAG</span>
              <span className="floating-bag-amount" style={{ fontSize: '11px', opacity: 0.8 }}>Empty</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}
