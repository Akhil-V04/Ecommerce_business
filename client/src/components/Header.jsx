import React from 'react';
import { ShoppingBag, Search, Phone, MapPin, Sparkles, ShieldCheck } from 'lucide-react';

export default function Header({
  cartCount,
  onOpenCart,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  currentView,
  onNavigate
}) {
  const categories = [
    { id: 'All', label: 'All Collections', icon: '✨' },
    { id: 'Sarees', label: 'Pure Sarees', icon: '🥻' },
    { id: 'Linings', label: 'Cotton Linings', icon: '🧵' },
    { id: 'Silks', label: 'Raw Silks', icon: '✨' },
    { id: 'Petticoats', label: 'Petticoats', icon: '👗' },
  ];

  return (
    <header className="main-header">
      {/* Top Banner */}
      <div className="top-announcement-bar">
        <div className="top-announcement-text">
          <span className="top-badge-hyd">Hyderabad Only</span>
          <span>Fast Doorstep Delivery via <strong>Rapido / Porter</strong> or Free <strong>Store Pickup</strong></span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>No Login Required to Order!</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a
            href="tel:+917013311862"
            style={{ color: '#ffd700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            <Phone size={13} /> +91 70133 11862
          </a>
          {currentView === 'admin' && (
            <button
              onClick={() => onNavigate('store')}
              style={{
                background: '#ffd700',
                color: '#000000',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ← Back to Store
            </button>
          )}
        </div>
      </div>

      {/* Main Header Inner */}
      <div className="header-inner">
        {/* Brand Logo */}
        <div className="brand-wrapper" onClick={() => onNavigate('store')}>
          <div className="brand-emblem">
            <span>శ్రీ</span>
          </div>
          <div className="brand-text">
            <h1>SRINIVASA SILKS</h1>
            <p>Pure Kanchipuram • Silks • Linings • Petticoats</p>
          </div>
        </div>

        {/* Search Bar */}
        {currentView === 'store' && (
          <div className="header-search">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search Kanchipuram sarees, 2x2 linings, raw silks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {/* Right Actions */}
        <div className="header-actions">
          <a
            href="https://wa.me/917013311862?text=Hello%20Srinivasa%20Silks,%20I%20am%20inquiring%20about%20sarees%20and%20linings"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-pill"
          >
            <span style={{ color: '#25D366', fontSize: '15px' }}>💬</span>
            <span className="contact-pill-text">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Category Pills Navigation (Visible on Store View) */}
      {currentView === 'store' && (
        <div className="category-nav-bar">
          <div className="category-nav-inner">
            <div className="category-pill-group">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => onSelectCategory(cat.id)}
                >
                  <span className="category-icon-tag">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <a
              href="https://maps.app.goo.gl/6i7ESPtwhNTuSAEX8"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12.5px', color: '#6b665f', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              title="Open Srinivasa Silks Location in Google Maps"
            >
              <MapPin size={14} style={{ color: '#b8860b' }} />
              <span>Prashanti Nagar, Moula Ali, Hyderabad</span>
              <span style={{ fontSize: '11px', color: '#b8860b', fontWeight: 600 }}>[Maps ↗]</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
