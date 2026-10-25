import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout
}) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} style={{ color: '#b8860b' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Your Shopping Bag</h3>
            <span style={{ fontSize: '12px', background: '#f5f3ef', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Items List */}
        <div className="cart-drawer-items">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#888' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>🛍️</div>
              <h4 style={{ fontSize: '17px', color: '#333', marginBottom: '6px' }}>Your bag is empty</h4>
              <p style={{ fontSize: '13px' }}>Explore our Kanchipuram sarees, pure silks, linings and petticoats.</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={`${item.id}-${item.selectedColor || idx}`} className="cart-item-card">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="cart-item-thumb"
                  onError={(e) => {
                    e.target.src = '/products/kanchipuram_saree.jpg';
                  }}
                />
                <div className="cart-item-details">
                  <div>
                    <h4 className="cart-item-title">{item.name}</h4>
                    {item.selectedColor && (
                      <span className="cart-item-meta">Color: {item.selectedColor}</span>
                    )}
                  </div>

                  <div className="cart-item-qty-row">
                    <div className="qty-counter">
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQty(item.id, item.selectedColor, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQty(item.id, item.selectedColor, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.id, item.selectedColor)}
                        style={{ background: 'transparent', border: 'none', color: '#b23b3b', cursor: 'pointer', padding: '4px' }}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div style={{ background: '#fdfbf7', border: '1px solid #eee8d5', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: '#b8860b', flexShrink: 0 }} />
              <div>
                <strong>Hyderabad Delivery or Store Pickup</strong>
                <div style={{ color: '#666' }}>We deliver in Hyderabad via Rapido/Porter (delivery charges may apply) or you can collect at shop.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Subtotal:</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#181716' }}>
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              className="checkout-btn"
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
            >
              <span>Place Order (No Login Required)</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
