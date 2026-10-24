import React, { useState, useEffect } from 'react';
import {
  Package,
  ShoppingBag,
  MapPin,
  Phone,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle,
  Truck,
  Store,
  Clock,
  Copy,
  AlertCircle,
  LogOut,
  RefreshCw,
  Search,
  Upload,
  Eye,
  Check,
  Edit,
  X
} from 'lucide-react';
import LocationPickerMap from './LocationPickerMap';

export default function AdminPanel({ onBackToStore }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('srinivasa_admin_token') !== null
  );
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'add-product'

  // Data states
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Sarees',
    price: '',
    originalPrice: '',
    fabric: '',
    description: '',
    colors: 'Crimson Red, Gold Zari',
    stockQuantity: 10,
    imageUrl: '/products/kanchipuram_saree.jpg'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('/products/kanchipuram_saree.jpg');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productSubmitSuccess, setProductSubmitSuccess] = useState('');

  // Selected Order for Modal / Map Inspection
  const [inspectedOrder, setInspectedOrder] = useState(null);

  const [dbStatus, setDbStatus] = useState(null);

  // Check auth and fetch data
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchProducts();
      fetchDbStatus();
    }
  }, [isAuthenticated]);

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/db-status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('srinivasa_admin_token', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.message || 'Invalid passcode');
      }
    } catch (err) {
      setLoginError('Error connecting to backend server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('srinivasa_admin_token');
    setIsAuthenticated(false);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
        if (inspectedOrder && inspectedOrder.id === orderId) {
          setInspectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Delete order ${orderId} from the database?`)) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        if (inspectedOrder && inspectedOrder.id === orderId) {
          setInspectedOrder(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const handleClearAllOrders = async () => {
    if (!window.confirm('Are you sure you want to clear ALL orders from the database?')) return;
    try {
      const res = await fetch('/api/orders', { method: 'DELETE' });
      if (res.ok) {
        setOrders([]);
        setInspectedOrder(null);
      }
    } catch (err) {
      console.error('Failed to clear orders:', err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this item from the store?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleToggleStock = async (product) => {
    try {
      const updatedStock = !product.inStock;
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: updatedStock })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, inStock: updatedStock } : p));
      }
    } catch (err) {
      console.error('Failed to toggle stock:', err);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Upload immediately
    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setNewProduct(prev => ({ ...prev, imageUrl: data.url }));
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setProductSubmitSuccess('');

    try {
      const colorsArray = newProduct.colors
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const payload = {
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
        fabric: newProduct.fabric,
        description: newProduct.description,
        colors: colorsArray,
        stockQuantity: Number(newProduct.stockQuantity) || 10,
        imageUrl: newProduct.imageUrl || '/products/kanchipuram_saree.jpg',
        inStock: true
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        setProducts(prev => [created, ...prev]);
        setProductSubmitSuccess(`✓ "${created.name}" uploaded successfully!`);
        // Reset form
        setNewProduct({
          name: '',
          category: 'Sarees',
          price: '',
          originalPrice: '',
          fabric: '',
          description: '',
          colors: 'Crimson Red, Gold Zari',
          stockQuantity: 10,
          imageUrl: '/products/kanchipuram_saree.jpg'
        });
        setTimeout(() => {
          setActiveTab('products');
          setProductSubmitSuccess('');
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  const copyForPorter = (order) => {
    const mapsLink = order.liveLocation
      ? order.liveLocation.mapsUrl
      : `https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress + ', Hyderabad')}`;

    const textToCopy = `PORTER / RAPIDO BOOKING DETAILS:
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Drop Address: ${order.deliveryAddress}
Landmark: ${order.deliveryLandmark || 'N/A'}
Google Maps Pin: ${mapsLink}
Items: ${order.items.length} items (Total: ₹${order.totalAmount})`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Filter orders
  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter(o => o.orderStatus === statusFilter);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#fcfbf9' }}>
        <div style={{ background: '#ffffff', border: '1px solid #eae7e1', borderRadius: '16px', padding: '36px', maxWidth: '420px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', background: '#fdf8ed', border: '1.5px solid #b8860b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px', color: '#b8860b' }}>
              👑
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#181716' }}>Srinivasa Silks Admin</h2>
            <p style={{ fontSize: '13px', color: '#68645e', marginTop: '4px' }}>
              Showroom Management & Hyderabad Order Dispatch Portal
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Enter Admin Passcode</label>
              <input
                type="password"
                className="form-input"
                placeholder="Default passcode: admin123"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                required
              />
              <span style={{ fontSize: '11.5px', color: '#888', marginTop: '4px', display: 'block' }}>
                Hint: Default passcode is <code>admin123</code>
              </span>
            </div>

            {loginError && (
              <div style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', color: '#9b1c1c', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> {loginError}
              </div>
            )}

            <button type="submit" className="checkout-btn" style={{ marginTop: '8px' }}>
              Sign In to Admin Portal
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={onBackToStore}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Return to Srinivasa Silks Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', borderBottom: '1px solid #eae7e1', paddingBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="admin-badge">ADMIN CONSOLE</span>
            <span style={{ fontSize: '13px', color: '#68645e' }}>Srinivasa Silks Showroom</span>
            <span style={{ background: '#eef8f2', color: '#137333', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
              Database: Connected & Dynamic ({dbStatus?.activeDatabaseEngine?.toUpperCase() || 'LIVE'})
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#181716', marginTop: '4px' }}>
            Store Management & Orders
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => { fetchOrders(); fetchProducts(); }}
            className="contact-pill"
            style={{ cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onBackToStore}
            className="contact-pill"
            style={{ cursor: 'pointer' }}
          >
            <span>🛍️ View Storefront</span>
          </button>
          <button
            onClick={handleLogout}
            style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', color: '#9b1c1c', padding: '8px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span style={{ fontSize: '13px', color: '#68645e' }}>Total Orders</span>
          <div className="admin-stat-val">{orders.length}</div>
          <span style={{ fontSize: '12px', color: '#1f7a3f', marginTop: '4px', display: 'block' }}>
            {orders.filter(o => o.fulfillmentType === 'hyderabad_delivery').length} Hyderabad Deliveries
          </span>
        </div>

        <div className="admin-stat-card">
          <span style={{ fontSize: '13px', color: '#68645e' }}>Pending / To Dispatch</span>
          <div className="admin-stat-val" style={{ color: '#b78103' }}>
            {orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed').length}
          </div>
          <span style={{ fontSize: '12px', color: '#b8860b', marginTop: '4px', display: 'block' }}>
            Needs Porter / Rapido Rider
          </span>
        </div>

        <div className="admin-stat-card">
          <span style={{ fontSize: '13px', color: '#68645e' }}>Showroom Pickups</span>
          <div className="admin-stat-val" style={{ color: '#0d47a1' }}>
            {orders.filter(o => o.fulfillmentType === 'store_pickup').length}
          </div>
          <span style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
            At Secunderabad Shop
          </span>
        </div>

        <div className="admin-stat-card">
          <span style={{ fontSize: '13px', color: '#68645e' }}>Active Sarees & Items</span>
          <div className="admin-stat-val">{products.length}</div>
          <span style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
            Across Sarees, Linings, Silks
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #eae7e1', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: activeTab === 'orders' ? '#181716' : '#ffffff',
            color: activeTab === 'orders' ? '#ffffff' : '#444',
            border: '1.5px solid #181716',
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Package size={16} />
          <span>Customer Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          style={{
            background: activeTab === 'products' ? '#181716' : '#ffffff',
            color: activeTab === 'products' ? '#ffffff' : '#444',
            border: '1.5px solid #181716',
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShoppingBag size={16} />
          <span>Manage Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add-product')}
          style={{
            background: activeTab === 'add-product' ? '#b8860b' : '#fdf8ed',
            color: activeTab === 'add-product' ? '#ffffff' : '#966708',
            border: '1.5px solid #b8860b',
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={16} />
          <span>Upload New Saree / Item</span>
        </button>
      </div>

      {/* TAB 1: ORDERS LIST & DISPATCH */}
      {activeTab === 'orders' && (
        <div>
          {/* Status filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginRight: '6px' }}>Filter Status:</span>
            {['All', 'Pending', 'Confirmed', 'Packed', 'Ready for Pickup', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? '#181716' : '#f5f3ef',
                  color: statusFilter === st ? '#ffffff' : '#555',
                  border: 'none',
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
            {orders.length > 0 && (
              <button
                onClick={handleClearAllOrders}
                style={{
                  marginLeft: 'auto',
                  background: '#ffffff',
                  border: '1px solid #f8b4b4',
                  color: '#9b1c1c',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={12} /> Clear All Orders
              </button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #eae7e1' }}>
              <Package size={44} style={{ color: '#b8860b', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '18px', color: '#181716' }}>No Orders in Database (Clean & Dynamic)</h4>
              <p style={{ fontSize: '13px', color: '#68645e', maxWidth: '520px', margin: '6px auto 18px', lineHeight: 1.5 }}>
                All dummy seed orders have been removed. The database is actively listening. When a customer adds sarees or fabrics and clicks <strong>Confirm & Place Order</strong>, the order will dynamically appear here in real time with their address and live GPS coordinates!
              </p>
              <button
                onClick={onBackToStore}
                className="checkout-btn"
                style={{ width: 'auto', padding: '8px 22px', fontSize: '13px', margin: '0 auto' }}
              >
                Go to Storefront to Test Order →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #eae7e1',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  {/* Order Card Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f0eee9', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 800, color: '#181716' }}>{order.id}</span>
                        <span className={`order-badge-status status-${order.orderStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.orderStatus}
                        </span>
                        {order.fulfillmentType === 'hyderabad_delivery' ? (
                          <span style={{ background: '#fdf2f4', color: '#8a1528', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', border: '1px solid rgba(138,21,40,0.2)' }}>
                            🛵 Hyderabad Delivery (Rapido/Porter)
                          </span>
                        ) : (
                          <span style={{ background: '#eef8f2', color: '#1b5e20', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', border: '1px solid rgba(27,94,32,0.2)' }}>
                            🏪 Store Pick-up
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: '#888', marginTop: '4px', display: 'block' }}>
                        Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Customer Contact & Quick Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <a
                        href={`tel:${order.customerPhone}`}
                        style={{ background: '#f8f8f8', border: '1px solid #e0dcd3', padding: '6px 12px', borderRadius: '999px', fontSize: '12.5px', textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                      >
                        <Phone size={13} /> Call {order.customerPhone}
                      </a>

                      <a
                        href={`https://wa.me/91${order.customerPhone}?text=Hello%20${encodeURIComponent(order.customerName)},%20this%20is%20Srinivasa%20Silks%20regarding%20your%20order%20${order.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ background: '#e8f8ee', border: '1px solid #a3e2b9', padding: '6px 12px', borderRadius: '999px', fontSize: '12.5px', textDecoration: 'none', color: '#137333', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                      >
                        <span>💬 WhatsApp</span>
                      </a>

                      {order.fulfillmentType === 'hyderabad_delivery' && (
                        <button
                          onClick={() => copyForPorter(order)}
                          style={{
                            background: copiedOrderId === order.id ? '#1f7a3f' : '#181716',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {copiedOrderId === order.id ? (
                            <>
                              <Check size={13} /> Copied for Porter!
                            </>
                          ) : (
                            <>
                              <Copy size={13} /> Copy for Porter / Rapido
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #f8b4b4',
                          color: '#9b1c1c',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Delete this order"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {/* Customer & Address Details */}
                    <div>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Customer & Delivery Destination
                      </h4>
                      <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                        <strong>{order.customerName}</strong><br />
                        Phone: <a href={`tel:${order.customerPhone}`} style={{ color: '#0d47a1' }}>{order.customerPhone}</a>
                        {order.customerAltPhone && ` | Alt: ${order.customerAltPhone}`}
                      </div>

                      <div style={{ marginTop: '10px', background: '#fdfbf7', border: '1px solid #eee8d5', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }}>
                        <strong>📍 Address:</strong>
                        <div style={{ color: '#444', marginTop: '2px' }}>{order.deliveryAddress}</div>
                        {order.deliveryLandmark && (
                          <div style={{ color: '#666', marginTop: '2px' }}><strong>Landmark:</strong> {order.deliveryLandmark}</div>
                        )}
                        {order.pinCode && (
                          <div style={{ color: '#666', marginTop: '2px' }}><strong>Pincode:</strong> {order.pinCode}</div>
                        )}
                      </div>

                      {/* Live GPS Coordinates and Map Pin */}
                      {order.liveLocation && (
                        <div style={{ marginTop: '10px', background: '#eef8f2', border: '1px solid #c8e6c9', padding: '10px 12px', borderRadius: '10px', fontSize: '12.5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ color: '#1b5e20', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={15} /> Customer Live GPS Pin
                            </strong>
                            <a
                              href={order.liveLocation.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#137333', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              Open Google Maps <ExternalLink size={12} />
                            </a>
                          </div>
                          <div style={{ color: '#2d3748', marginTop: '4px' }}>
                            Coordinates: <code>{order.liveLocation.latitude.toFixed(5)}, {order.liveLocation.longitude.toFixed(5)}</code>
                            {order.liveLocation.accuracy && ` (within ${order.liveLocation.accuracy}m)`}
                          </div>

                          <button
                            onClick={() => setInspectedOrder(order)}
                            style={{
                              marginTop: '8px',
                              background: '#137333',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Eye size={12} /> Inspect Pin on Interactive Map
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Ordered Items List */}
                    <div>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#888', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Ordered Items ({order.items.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fcfbf9', border: '1px solid #f0eee9', padding: '8px 10px', borderRadius: '8px' }}>
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = '/products/kanchipuram_saree.jpg'; }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#181716' }}>{it.name}</div>
                              <div style={{ fontSize: '11.5px', color: '#777' }}>
                                Color: <strong>{it.selectedColor || 'Standard'}</strong> • Qty: <strong>{it.quantity}</strong>
                              </div>
                            </div>
                            <strong style={{ fontSize: '13.5px', color: '#181716' }}>
                              ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px dashed #e0dcd3', paddingTop: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#666' }}>Order Total:</span>
                        <strong style={{ fontSize: '18px', color: '#181716' }}>
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    {/* Status Management Dropdown */}
                    <div style={{ background: '#faf9f7', border: '1px solid #eae7e1', borderRadius: '12px', padding: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#181716', marginBottom: '10px' }}>
                        Update Status & Dispatch
                      </h4>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '12px' }}>Order Status</label>
                        <select
                          className="form-select"
                          value={order.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="Pending">Pending Confirmation</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Packed">Packed Ready in Showroom</option>
                          <option value="Out for Delivery (Porter/Rapido)">Out for Delivery (Porter/Rapido)</option>
                          <option value="Ready for Pickup">Ready for Showroom Pickup</option>
                          <option value="Completed">Completed / Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      {order.deliveryNotes && (
                        <div style={{ fontSize: '12px', color: '#666', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #eee' }}>
                          <strong>Notes:</strong> {order.deliveryNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Showroom Inventory & Saree Catalog</h3>
            <button
              onClick={() => setActiveTab('add-product')}
              className="checkout-btn"
              style={{ width: 'auto', padding: '8px 20px', fontSize: '13.5px' }}
            >
              <Plus size={16} /> Add New Saree / Item
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #eae7e1',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '180px', background: '#fafafa' }}>
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = '/products/kanchipuram_saree.jpg'; }}
                  />
                  <span className="product-badge-category" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    {p.category}
                  </span>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#181716', marginBottom: '6px' }}>{p.name}</h4>
                  <div style={{ fontSize: '12px', color: '#68645e', marginBottom: '8px' }}>
                    {p.fabric || 'Pure Fabric'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                    <div>
                      <strong style={{ fontSize: '18px', color: '#181716' }}>₹{p.price.toLocaleString('en-IN')}</strong>
                      {p.originalPrice && (
                        <span style={{ fontSize: '12px', color: '#888', textDecoration: 'line-through', marginLeft: '6px' }}>
                          ₹{p.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: '#888' }}>Stock: {p.stockQuantity}</span>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f0eee9' }}>
                    <button
                      onClick={() => handleToggleStock(p)}
                      style={{
                        flex: 1,
                        background: p.inStock ? '#eef8f2' : '#fdf2f2',
                        color: p.inStock ? '#12793b' : '#9b1c1c',
                        border: `1px solid ${p.inStock ? '#c8e6c9' : '#f8b4b4'}`,
                        padding: '6px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {p.inStock ? '✓ In Stock' : '✕ Out of Stock'}
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      style={{
                        background: '#ffffff',
                        color: '#d32f2f',
                        border: '1px solid #ffd0d0',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Delete Product"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD NEW SAREE / ITEM */}
      {activeTab === 'add-product' && (
        <div style={{ background: '#ffffff', border: '1px solid #eae7e1', borderRadius: '16px', padding: '32px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '24px', borderBottom: '1px solid #eae7e1', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#181716' }}>Upload New Saree / Fabric Item</h3>
            <p style={{ fontSize: '13px', color: '#68645e', marginTop: '4px' }}>
              Add new Kanchipuram sarees, linings, raw silks or petticoats directly to Srinivasa Silks catalog.
            </p>
          </div>

          {productSubmitSuccess && (
            <div style={{ background: '#eef8f2', border: '1px solid #c8e6c9', color: '#1b5e20', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
              {productSubmitSuccess}
            </div>
          )}

          <form onSubmit={handleCreateProduct}>
            <div className="form-group">
              <label className="form-label">Product / Saree Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Pure Dharmavaram Silk Wedding Saree"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  <option value="Sarees">Sarees</option>
                  <option value="Linings">Linings</option>
                  <option value="Silks">Silks</option>
                  <option value="Petticoats">Petticoats</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fabric / Material Specifications</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 100% Pure Mulberry Silk with Gold Zari"
                  value={newProduct.fabric}
                  onChange={(e) => setNewProduct({ ...newProduct, fabric: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Selling Price (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 11500"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Original MRP (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 14500 (Optional for strike)"
                  value={newProduct.originalPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={newProduct.stockQuantity}
                  onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Available Colors (Comma separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Crimson Red, Peacock Blue, Emerald Green"
                value={newProduct.colors}
                onChange={(e) => setNewProduct({ ...newProduct, colors: e.target.value })}
              />
            </div>

            {/* Saree Image Upload & Preset Selector */}
            <div className="form-group">
              <label className="form-label">Product Photo</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #dcd8cf', background: '#f5f5f5' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ fontSize: '13px' }}
                  />
                  {uploadingImage && <div style={{ fontSize: '12px', color: '#b8860b' }}>Uploading to server...</div>}
                  <span style={{ fontSize: '11.5px', color: '#888', display: 'block', marginTop: '6px' }}>
                    Or pick from high-res showroom presets:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {[
                      { name: 'Kanchipuram Red', url: '/products/kanchipuram_saree.jpg' },
                      { name: 'Banarasi Blue', url: '/products/banarasi_saree.jpg' },
                      { name: 'Cotton Linings', url: '/products/linings_fabrics.jpg' },
                      { name: 'Raw Silks', url: '/products/raw_silks_material.jpg' },
                      { name: 'Petticoats', url: '/products/petticoats_wear.jpg' },
                    ].map((pre) => (
                      <button
                        type="button"
                        key={pre.name}
                        onClick={() => {
                          setImagePreview(pre.url);
                          setNewProduct(prev => ({ ...prev, imageUrl: pre.url }));
                        }}
                        style={{
                          background: newProduct.imageUrl === pre.url ? '#181716' : '#f5f3ef',
                          color: newProduct.imageUrl === pre.url ? '#fff' : '#444',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {pre.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Draping / Care Details</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Describe weave, border motifs, blouse piece inclusion, dry clean instructions..."
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>

            <button type="submit" className="checkout-btn" style={{ marginTop: '12px' }}>
              Publish Product to Store Catalog
            </button>
          </form>
        </div>
      )}

      {/* MAP INSPECTION MODAL FOR ADMIN */}
      {inspectedOrder && (
        <div className="modal-overlay" onClick={() => setInspectedOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                  Order Location Pin: {inspectedOrder.id}
                </h3>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  Customer: {inspectedOrder.customerName} ({inspectedOrder.customerPhone})
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setInspectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px', fontSize: '13.5px' }}>
                <strong>Address:</strong> {inspectedOrder.deliveryAddress}<br />
                {inspectedOrder.deliveryLandmark && (
                  <span><strong>Landmark:</strong> {inspectedOrder.deliveryLandmark}<br /></span>
                )}
                {inspectedOrder.liveLocation && (
                  <span style={{ color: '#137333', fontWeight: 600 }}>
                    GPS: {inspectedOrder.liveLocation.latitude.toFixed(5)}, {inspectedOrder.liveLocation.longitude.toFixed(5)}
                  </span>
                )}
              </div>

              {inspectedOrder.liveLocation && (
                <LocationPickerMap
                  latitude={inspectedOrder.liveLocation.latitude}
                  longitude={inspectedOrder.liveLocation.longitude}
                  interactive={false}
                  height="280px"
                />
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                {inspectedOrder.liveLocation && (
                  <a
                    href={inspectedOrder.liveLocation.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="checkout-btn"
                    style={{ textDecoration: 'none', flex: 1, padding: '10px' }}
                  >
                    <ExternalLink size={15} /> Open in Google Maps for Rider
                  </a>
                )}

                <button
                  onClick={() => copyForPorter(inspectedOrder)}
                  className="contact-pill"
                  style={{ cursor: 'pointer', padding: '10px 16px' }}
                >
                  <Copy size={15} /> Copy Address for Porter App
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
