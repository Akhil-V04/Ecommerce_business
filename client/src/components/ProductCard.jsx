import React, { useState } from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';

export default function ProductCard({ product, onSelectProduct, onAddToCart }) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="product-card" onClick={() => onSelectProduct(product)}>
      <div className="product-image-container">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.src = '/products/kanchipuram_saree.jpg';
          }}
        />
        <span className="product-badge-category">{product.category}</span>
        
        {product.inStock ? (
          <span className="product-badge-stock">In Stock</span>
        ) : (
          <span className="product-badge-stock out">Out of Stock</span>
        )}

        {discountPercent && (
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              background: '#8a1528',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '9999px',
              letterSpacing: '0.04em'
            }}
          >
            {discountPercent}% OFF
          </span>
        )}
      </div>

      <div className="product-content">
        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>

        {product.fabric && (
          <div className="product-fabric" title={product.fabric}>
            🧵 {product.fabric}
          </div>
        )}

        {product.colors && product.colors.length > 0 && (
          <div className="product-colors-preview">
            <span className="product-colors-label">Colors:</span>
            <span style={{ fontSize: '12px', color: '#68645e', fontWeight: 500 }}>
              {product.colors.slice(0, 3).join(', ')}
              {product.colors.length > 3 ? ` +${product.colors.length - 3} more` : ''}
            </span>
          </div>
        )}

        <div className="product-card-footer">
          <div className="price-box">
            <span className="current-price">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>

          <button
            className={`add-to-cart-btn ${isAdded ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={!product.inStock}
          >
            {isAdded ? (
              <>
                <Check size={14} /> Added
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> Add to Bag
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
