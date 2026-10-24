import React, { useState } from 'react';
import { X, ShoppingBag, ShieldCheck, Truck, Store, Check, Sparkles } from 'lucide-react';

export default function ProductModal({ product, onClose, onAddToCart, onBuyNow }) {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0] : 'Standard'
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Companion add-ons if saree is selected
  const [includeLining, setIncludeLining] = useState(false);
  const [includePetticoat, setIncludePetticoat] = useState(false);

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAddToCart = () => {
    // Add main product
    onAddToCart({
      ...product,
      selectedColor,
      quantity
    });

    // If user checked matching lining
    if (includeLining) {
      onAddToCart({
        id: 'prod-3',
        name: `Matching 2x2 Cotton Blouse Lining (for ${product.name})`,
        category: 'Linings',
        price: 120,
        imageUrl: '/products/linings_fabrics.jpg',
        selectedColor: selectedColor,
        quantity: 1
      });
    }

    // If user checked matching petticoat
    if (includePetticoat) {
      onAddToCart({
        id: 'prod-5',
        name: `Matching Stitched Cotton Petticoat (for ${product.name})`,
        category: 'Petticoats',
        price: 280,
        imageUrl: '/products/petticoats_wear.jpg',
        selectedColor: selectedColor,
        quantity: 1
      });
    }

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      onBuyNow();
    }, 200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="product-badge-category" style={{ position: 'static' }}>
              {product.category}
            </span>
            <span style={{ fontSize: '13px', color: '#666' }}>Srinivasa Silks Collection</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-scrollable">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {/* Image Box */}
            <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #eae7e1', background: '#fafafa' }}>
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{ width: '100%', height: '100%', maxHeight: '420px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/products/kanchipuram_saree.jpg';
                }}
              />
            </div>

            {/* Details Box */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#181716', marginBottom: '8px', lineHeight: 1.25 }}>
                {product.name}
              </h2>

              {/* Price Banner */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#181716' }}>
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <span style={{ fontSize: '16px', color: '#888', textDecoration: 'line-through' }}>
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent && (
                  <span style={{ background: '#8a1528', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              {/* Fabric Specs */}
              {product.fabric && (
                <div style={{ background: '#fdfbf7', border: '1px solid #eee8d5', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13.5px' }}>
                  <strong style={{ color: '#966708' }}>Fabric & Craftsmanship:</strong>
                  <div style={{ color: '#444', marginTop: '2px' }}>{product.fabric}</div>
                </div>
              )}

              {/* Description */}
              <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                {product.description}
              </p>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Select Color / Shade: <span style={{ color: '#b8860b' }}>{selectedColor}</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        style={{
                          background: selectedColor === c ? '#181716' : '#ffffff',
                          color: selectedColor === c ? '#ffffff' : '#333333',
                          border: `1.5px solid ${selectedColor === c ? '#181716' : '#dcd8cf'}`,
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Quantity:</span>
                <div className="qty-counter">
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="qty-val">{quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: '12px', color: '#1f7a3f', fontWeight: 600 }}>
                  ✓ In Stock Ready for Dispatch
                </span>
              </div>

              {/* Matching Set Companion for Sarees */}
              {product.category === 'Sarees' && (
                <div style={{ background: '#fdfbf7', border: '1px solid #eddcc4', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#966708', marginBottom: '8px' }}>
                    <Sparkles size={15} /> Frequently Paired with this Saree:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeLining}
                        onChange={(e) => setIncludeLining(e.target.checked)}
                        style={{ accentColor: '#b8860b', width: '16px', height: '16px' }}
                      />
                      <span>Add Matching <strong>2x2 Cotton Blouse Lining</strong> (+₹120)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includePetticoat}
                        onChange={(e) => setIncludePetticoat(e.target.checked)}
                        style={{ accentColor: '#b8860b', width: '16px', height: '16px' }}
                      />
                      <span>Add Matching <strong>Stitched 7-Panel Petticoat</strong> (+₹280)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Delivery info pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                <div style={{ background: '#f8f8f8', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={16} style={{ color: '#b8860b' }} />
                  <div>
                    <strong>Hyderabad Delivery</strong>
                    <div style={{ color: '#777' }}>Via Rapido / Porter</div>
                  </div>
                </div>
                <div style={{ background: '#f8f8f8', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={16} style={{ color: '#b8860b' }} />
                  <div>
                    <strong>Store Pick-up</strong>
                    <div style={{ color: '#777' }}>General Bazaar, Secunderabad</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto' }}>
                <button
                  className="add-to-cart-btn"
                  style={{ justifyContent: 'center', padding: '12px 20px', fontSize: '14px' }}
                  onClick={handleAddToCart}
                >
                  {isAdded ? (
                    <>
                      <Check size={16} /> Added to Bag!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} /> Add to Bag
                    </>
                  )}
                </button>

                <button
                  className="checkout-btn"
                  style={{ padding: '12px 20px', fontSize: '14px' }}
                  onClick={handleBuyNow}
                >
                  Order Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
