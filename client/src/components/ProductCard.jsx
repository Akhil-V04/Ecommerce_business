import React, { useState } from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';

export default function ProductCard({
  product,
  inBagCount = 0,
  onSelectProduct,
  onAddToCart,
  onOpenCart
}) {
  const isInBag = inBagCount > 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleOpenCart = (e) => {
    e.stopPropagation();
    if (onOpenCart) onOpenCart();
  };

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
          </div>

          {isInBag ? (
            <div className="in-bag-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="in-bag-btn"
                onClick={handleOpenCart}
                title="View in Bag"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>IN BAG {inBagCount > 1 ? `(${inBagCount})` : ''}</span>
              </button>
              <button
                className="in-bag-plus-btn"
                onClick={handleAdd}
                title="Add 1 more to Bag"
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="add-to-cart-btn"
              onClick={handleAdd}
              disabled={!product.inStock}
            >
              <ShoppingBag size={14} /> Add to Bag
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
