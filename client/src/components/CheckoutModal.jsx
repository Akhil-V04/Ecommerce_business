import React, { useState } from 'react';
import { X, MapPin, Store, Truck, Phone, User, CheckCircle2, Navigation, AlertCircle, Copy, ExternalLink, ArrowRight, Check, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import LocationPickerMap from './LocationPickerMap';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onClearCart
}) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Form states
  const [fulfillmentType, setFulfillmentType] = useState('hyderabad_delivery'); // 'hyderabad_delivery' or 'store_pickup'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAltPhone, setCustomerAltPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [pinCode, setPinCode] = useState('500003');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi_qr'); // 'upi_qr' (Instant Dynamic UPI) or 'pay_on_delivery'
  const [upiUtr, setUpiUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const storeUpiId = '7013311862@ybl';
  const upiUri = `upi://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent('Srinivasa Silks')}&am=${encodeURIComponent(subtotal)}&cu=INR&tn=${encodeURIComponent('Srinivasa Silks Order')}`;

  const handleCopyUpiId = () => {
    try {
      navigator.clipboard.writeText(storeUpiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch (e) {
      // fallback
    }
  };

  // Live Location state
  const [isLocating, setIsLocating] = useState(false);
  const [liveLocation, setLiveLocation] = useState({
    latitude: 17.4437,
    longitude: 78.5434,
    accuracy: null,
    isCaptured: false
  });
  const [locationError, setLocationError] = useState('');

  // Submission & Success state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [formError, setFormError] = useState('');

  // Handle Geolocation capture
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLiveLocation({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          isCaptured: true
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(`Location permission denied or unavailable (${err.message}). You can still type your address.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleMapPinChange = (lat, lng) => {
    setLiveLocation((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      isCaptured: true
    }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!customerPhone || customerPhone.trim().length < 10) {
      setFormError('Please enter a valid 10-digit mobile number for order and delivery coordination.');
      return;
    }

    if (fulfillmentType === 'hyderabad_delivery' && !deliveryAddress.trim() && !liveLocation.isCaptured) {
      setFormError('Please enter your Hyderabad delivery address or capture your live GPS location.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim() || 'Customer',
        customerPhone: customerPhone.trim(),
        customerAltPhone: customerAltPhone.trim(),
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'store_pickup'
          ? 'Store Pickup at Srinivasa Silks Showroom, Prashanti Nagar, Moula Ali, Hyderabad - 500017'
          : deliveryAddress.trim(),
        deliveryLandmark: deliveryLandmark.trim(),
        pinCode: pinCode.trim(),
        liveLocation: liveLocation.isCaptured ? {
          latitude: liveLocation.latitude,
          longitude: liveLocation.longitude,
          accuracy: liveLocation.accuracy,
          mapsUrl: `https://maps.google.com/?q=${liveLocation.latitude},${liveLocation.longitude}`
        } : null,
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor || '',
          imageUrl: item.imageUrl
        })),
        subtotal,
        deliveryFee: fulfillmentType === 'store_pickup' ? 0 : 0, // Delivery fee to be paid to Rapido/Porter
        totalAmount: subtotal,
        paymentMethod: fulfillmentType === 'store_pickup' ? 'pay_at_store' : paymentMethod,
        paymentStatus: paymentMethod === 'pay_on_delivery' ? 'Pending' : (upiUtr.trim() ? 'Paid (UTR Provided)' : 'Pending Verification'),
        upiUtr: upiUtr.trim(),
        deliveryNotes: deliveryNotes.trim()
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const data = await res.json();
      setPlacedOrder(data.order);
      onClearCart();

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore confetti error if blocked
      }
    } catch (err) {
      setFormError(err.message || 'Something went wrong while placing your order. Please call or WhatsApp us.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!placedOrder) return '';
    const itemsList = placedOrder.items
      .map((it) => `• ${it.name} (${it.selectedColor || 'Standard'}) x ${it.quantity} - ₹${it.price * it.quantity}`)
      .join('\n');

    const locationText = placedOrder.liveLocation
      ? `\n📍 Live Location (Google Maps): ${placedOrder.liveLocation.mapsUrl}`
      : '';

    const paymentDetails = placedOrder.paymentMethod === 'upi_qr'
      ? `*Payment:* ⚡ Instant UPI QR (Amount: ₹${placedOrder.totalAmount})${placedOrder.upiUtr ? `\n*UPI Ref / UTR:* ${placedOrder.upiUtr}` : ''}\n(Attaching screenshot below)`
      : `*Payment:* 💵 Pay on Delivery (${placedOrder.fulfillmentType === 'store_pickup' ? 'At Showroom Counter' : 'Cash/UPI to Rider'})`;

    const text = `*New Order Placed at Srinivasa Silks!*
*Order ID:* ${placedOrder.id}
*Customer:* ${placedOrder.customerName} (${placedOrder.customerPhone})
*Fulfillment:* ${placedOrder.fulfillmentType === 'store_pickup' ? '🏪 Store Pickup at Secunderabad' : '🛵 Hyderabad Delivery via Rapido/Porter'}
${placedOrder.fulfillmentType === 'hyderabad_delivery' ? `*Address:* ${placedOrder.deliveryAddress}\n*Landmark:* ${placedOrder.deliveryLandmark || 'N/A'}${locationText}\n` : ''}
*Total Items Amount:* ₹${placedOrder.totalAmount}
${paymentDetails}

*Items:*
${itemsList}

Please confirm my order and share dispatch timing!`;

    return encodeURIComponent(text);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-bar">
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#181716' }}>
              {placedOrder ? '🎉 Order Confirmed!' : 'Order Summary & Checkout'}
            </h3>
            <p style={{ fontSize: '12px', color: '#68645e' }}>
              {placedOrder ? 'Srinivasa Silks, Hyderabad' : 'No account or login required • Instant Booking'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-scrollable">
          {placedOrder ? (
            /* SUCCESS VIEW */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: '64px', height: '64px', background: '#eef8f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#12793b' }}>
                <CheckCircle2 size={38} />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#181716', marginBottom: '8px' }}>
                Thank You for Choosing Srinivasa Silks!
              </h2>

              <div style={{ background: '#fdfbf7', border: '1.5px solid #eedec3', borderRadius: '12px', padding: '16px', margin: '20px 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ebd9b8', paddingBottom: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#68645e' }}>Order Reference:</span>
                  <strong style={{ fontSize: '16px', color: '#966708', letterSpacing: '0.05em' }}>{placedOrder.id}</strong>
                </div>

                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Customer:</strong> {placedOrder.customerName} ({placedOrder.customerPhone})</div>
                  <div>
                    <strong>Fulfillment:</strong>{' '}
                    {placedOrder.fulfillmentType === 'store_pickup' ? (
                      <span style={{ color: '#1f7a3f', fontWeight: 600 }}>🏪 Store Pick-up at Lalapet, Secunderabad</span>
                    ) : (
                      <span style={{ color: '#8a1528', fontWeight: 600 }}>🛵 Doorstep Delivery in Hyderabad via Rapido / Porter</span>
                    )}
                  </div>
                  {placedOrder.fulfillmentType === 'hyderabad_delivery' && (
                    <div><strong>Address:</strong> {placedOrder.deliveryAddress}</div>
                  )}
                  {placedOrder.liveLocation && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#12793b', fontWeight: 600 }}>
                      <MapPin size={14} /> Live GPS Location pinned for rider navigation
                    </div>
                  )}
                  <div><strong>Total Amount:</strong> ₹{placedOrder.totalAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {placedOrder.fulfillmentType === 'hyderabad_delivery' ? (
                <div style={{ background: '#eef5fc', border: '1px solid #c7e0fa', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#0d47a1', marginBottom: '20px', textAlign: 'left' }}>
                  <strong>🛵 Hyderabad Delivery Note:</strong> Our showroom team will pack your sarees carefully. We will book a <strong>Rapido / Porter</strong> rider to your address/location. The rider delivery charge (usually ₹60-₹160 depending on your distance from Secunderabad) can be paid directly to the rider upon arrival.
                </div>
              ) : (
                <div style={{ background: '#eef8f2', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#1b5e20', marginBottom: '20px', textAlign: 'left' }}>
                  <strong>🏪 Showroom Pickup Address:</strong> Srinivasa Silks Showroom, Lalapet, Secunderabad, Hyderabad - 500017. Timings: 10:30 AM to 9:30 PM.
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={`https://wa.me/917013311862?text=${generateWhatsAppMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="checkout-btn"
                  style={{ background: '#25D366', textDecoration: 'none' }}
                >
                  <span>💬 Notify Store on WhatsApp (7013311862)</span>
                </a>

                <button
                  onClick={onClose}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #dcd8cf',
                    padding: '12px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM VIEW */
            <form onSubmit={handleSubmitOrder}>
              {/* Step 1: Fulfillment Type Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '14px', marginBottom: '10px' }}>
                  Choose How You Want to Receive Your Order:
                </label>

                <div className="fulfillment-tabs">
                  <div
                    className={`fulfillment-card ${fulfillmentType === 'hyderabad_delivery' ? 'active' : ''}`}
                    onClick={() => setFulfillmentType('hyderabad_delivery')}
                  >
                    <div className="fulfillment-card-title">
                      <Truck size={18} style={{ color: '#8a1528' }} />
                      <span>Order Online (Hyderabad Only)</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                      Delivered via <strong>Rapido / Porter</strong> bike or auto directly to your doorstep in Hyderabad.
                    </p>
                    <span style={{ fontSize: '11px', color: '#966708', fontWeight: 700, marginTop: '4px' }}>
                      ⚡ Rapido / Porter on-demand delivery
                    </span>
                  </div>

                  <div
                    className={`fulfillment-card ${fulfillmentType === 'store_pickup' ? 'active' : ''}`}
                    onClick={() => setFulfillmentType('store_pickup')}
                  >
                    <div className="fulfillment-card-title">
                      <Store size={18} style={{ color: '#1f7a3f' }} />
                      <span>Go to Shop & Take (Store Pickup)</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                      Pick up directly at our <strong>Secunderabad Showroom</strong>. Inspect silk quality & zero delivery fee.
                    </p>
                    <span style={{ fontSize: '11px', color: '#1f7a3f', fontWeight: 700, marginTop: '4px' }}>
                      ✓ FREE • Ready for pickup
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div style={{ background: '#fdfbf7', border: '1px solid #eae5d9', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} style={{ color: '#b8860b' }} /> Customer Contact Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Radhika Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Mobile Number (Required)</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 9849012345"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                  <label className="form-label">Alternate Mobile / WhatsApp (Optional)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9440054321"
                    value={customerAltPhone}
                    onChange={(e) => setCustomerAltPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Delivery Address or Store Pick-up Details */}
              {fulfillmentType === 'hyderabad_delivery' ? (
                <div>
                  {/* Live Location Box */}
                  <div className="live-location-box">
                    <div className="live-location-header">
                      <div>
                        <strong style={{ fontSize: '13.5px', color: '#181716', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Navigation size={16} style={{ color: '#8a1528' }} /> Pin Exact Live Location (Hyderabad)
                        </strong>
                        <p style={{ fontSize: '12px', color: '#68645e', marginTop: '2px' }}>
                          Helps the Rapido / Porter delivery rider navigate straight to your gate without calling multiple times.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="locate-me-btn"
                        onClick={handleGetLiveLocation}
                        disabled={isLocating}
                      >
                        {isLocating ? 'Capturing GPS...' : '📍 Use Live GPS'}
                      </button>
                    </div>

                    {locationError && (
                      <div style={{ fontSize: '12px', color: '#d32f2f', marginBottom: '8px' }}>
                        ⚠️ {locationError}
                      </div>
                    )}

                    {liveLocation.isCaptured && (
                      <div style={{ background: '#eef8f2', border: '1px solid #c8e6c9', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#1b5e20', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          ✓ GPS Pinned: {liveLocation.latitude.toFixed(4)}, {liveLocation.longitude.toFixed(4)}
                          {liveLocation.accuracy ? ` (Accurate within ${liveLocation.accuracy}m)` : ''}
                        </span>
                        <a
                          href={`https://maps.google.com/?q=${liveLocation.latitude},${liveLocation.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#12793b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                          View Map <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {/* Interactive Leaflet Map for Customer */}
                    <div style={{ marginTop: '8px' }}>
                      <LocationPickerMap
                        latitude={liveLocation.latitude}
                        longitude={liveLocation.longitude}
                        onLocationChange={handleMapPinChange}
                        interactive={true}
                        height="180px"
                      />
                      <span style={{ fontSize: '11px', color: '#888', marginTop: '4px', display: 'block' }}>
                        💡 Tip: You can drag the red pin directly to your exact apartment gate or house.
                      </span>
                    </div>
                  </div>

                  {/* Text Address */}
                  <div className="form-group">
                    <label className="form-label">Street Address / Flat / Building Name in Hyderabad</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      placeholder="e.g. Flat 301, Sri Sai Residency, Street No. 4, Tarnaka / Banjara Hills"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required={!liveLocation.isCaptured}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Landmark in Hyderabad</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Near Metro Station / Temple"
                        value={deliveryLandmark}
                        onChange={(e) => setDeliveryLandmark(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hyderabad Pincode</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="500003"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Hyderabad Rapido / Porter Note */}
                  <div style={{ background: '#fff9e6', border: '1px solid #ffe299', borderRadius: '10px', padding: '12px 14px', fontSize: '12.5px', color: '#8a6200', marginBottom: '20px' }}>
                    <strong>🛵 Important Delivery Terms:</strong>
                    <ul style={{ paddingLeft: '18px', marginTop: '4px', lineHeight: 1.5 }}>
                      <li>We deliver exclusively within the <strong>Hyderabad & Secunderabad</strong> city limits.</li>
                      <li>We use on-demand delivery apps (<strong>Rapido Bike / Porter Auto / Tempo</strong>) for fast direct dispatch.</li>
                      <li>Estimated delivery fare (₹60 - ₹180 based on distance from our Secunderabad shop) is paid to the rider or added upon dispatch.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* Store Pick-up Details */
                <div style={{ background: '#f5faf7', border: '1px solid #d0ebd8', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1b5e20', fontWeight: 700 }}>
                      <Store size={18} /> Showroom Address for Order Pick-up:
                    </div>
                    <a
                      href="https://maps.app.goo.gl/6i7ESPtwhNTuSAEX8"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', color: '#1b5e20', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <MapPin size={13} /> Open Google Maps ↗
                    </a>
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#2d3748', lineHeight: 1.5 }}>
                    <strong>Srinivasa Silks Showroom</strong><br />
                    Prashanti Nagar, Moula Ali, Ward 143 Tarnaka,<br />
                    Hyderabad, Telangana - 500017.<br />
                    <em>Landmark: Near Moula Ali / Tarnaka main road</em>
                  </p>
                  <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#4a5568' }}>
                    🕒 <strong>Timings:</strong> 10:30 AM to 9:30 PM (All days)<br />
                    📞 <strong>Store Contact / WhatsApp:</strong> +91 70133 11862
                  </div>
                </div>
              )}

              {/* Payment Method - Dynamic UPI QR Option */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <label
                    style={{
                      border: `1.5px solid ${paymentMethod === 'upi_qr' ? '#15803d' : '#e0dcd3'}`,
                      background: paymentMethod === 'upi_qr' ? '#f0fdf4' : '#ffffff',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'upi_qr'}
                        onChange={() => setPaymentMethod('upi_qr')}
                        style={{ accentColor: '#15803d' }}
                      />
                      <strong style={{ fontSize: '13px', color: paymentMethod === 'upi_qr' ? '#15803d' : '#181716' }}>
                        ⚡ Instant UPI QR (0% Fee)
                      </strong>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#555', paddingLeft: '22px' }}>
                      GPay, PhonePe, Paytm, BHIM
                    </span>
                  </label>

                  <label
                    style={{
                      border: `1.5px solid ${paymentMethod === 'pay_on_delivery' ? '#181716' : '#e0dcd3'}`,
                      background: paymentMethod === 'pay_on_delivery' ? '#fdfbf7' : '#ffffff',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'pay_on_delivery'}
                        onChange={() => setPaymentMethod('pay_on_delivery')}
                        style={{ accentColor: '#181716' }}
                      />
                      <strong style={{ fontSize: '13px' }}>
                        {fulfillmentType === 'store_pickup' ? 'Pay at Showroom' : 'Pay on Delivery'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#777', paddingLeft: '22px' }}>
                      Cash or UPI to rider / counter
                    </span>
                  </label>
                </div>

                {/* DYNAMIC UPI QR & MOBILE INTENT CONTAINER */}
                {paymentMethod === 'upi_qr' && (
                  <div style={{
                    background: '#fdfbf7',
                    border: '1.5px solid #e7decb',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px dashed #dfd5be', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                        <QrCode size={17} /> Direct UPI Payment (Zero Commission)
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#181716' }}>
                        Amount: ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Mobile 1-Tap UPI Intent Button */}
                    <a
                      href={upiUri}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#15803d',
                        color: '#ffffff',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '14px',
                        textDecoration: 'none',
                        marginBottom: '12px',
                        boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
                        textAlign: 'center'
                      }}
                    >
                      <span>📱 Tap to Pay ₹{subtotal.toLocaleString('en-IN')} in UPI App</span>
                      <ArrowRight size={16} />
                    </a>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map(app => (
                        <span key={app} style={{ fontSize: '11px', background: '#ffffff', border: '1px solid #e0dcd3', padding: '3px 8px', borderRadius: '4px', color: '#555', fontWeight: 600 }}>
                          {app}
                        </span>
                      ))}
                    </div>

                    {/* QR Code and Scan Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid #ebd9b8', padding: '12px', borderRadius: '10px', flexWrap: 'wrap' }}>
                      <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                        <QRCodeSVG
                          value={upiUri}
                          size={140}
                          bgColor="#ffffff"
                          fgColor="#181716"
                          level="M"
                          includeMargin={false}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#181716' }}>
                          Scan with PhonePe / GPay / Paytm
                        </div>
                        <div style={{ fontSize: '12px', color: '#68645e', margin: '4px 0 10px', lineHeight: 1.4 }}>
                          Scan this QR code with any UPI app on another phone to pay exact <strong>₹{subtotal.toLocaleString('en-IN')}</strong> directly to Srinivasa Silks.
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f5f3ef', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                          <span>UPI ID: <strong>{storeUpiId}</strong></span>
                          <button
                            type="button"
                            onClick={handleCopyUpiId}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #dcd8cf',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600
                            }}
                          >
                            {copiedUpi ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                            <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* UTR Input */}
                    <div style={{ marginTop: '14px' }}>
                      <label className="form-label" style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                        UPI Reference / UTR Number (Optional, 12 Digits)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 4287XXXXXXXX (from your UPI receipt)"
                        value={upiUtr}
                        onChange={(e) => setUpiUtr(e.target.value)}
                        style={{ fontSize: '12.5px', background: '#ffffff' }}
                      />
                      <span style={{ fontSize: '11px', color: '#888', marginTop: '3px', display: 'block' }}>
                        After paying, click 'Confirm & Place Order'. You can also send the payment screenshot on WhatsApp.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Special Delivery / Tailoring Instructions (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Call before coming, deliver in afternoon"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </div>

              {/* Order Summary Line */}
              <div style={{ borderTop: '1px solid #eae7e1', paddingTop: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span style={{ color: '#666' }}>Items ({cartItems.length}):</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Delivery Charge:</span>
                  <span>
                    {fulfillmentType === 'store_pickup' ? (
                      <strong style={{ color: '#1f7a3f' }}>FREE (Store Pickup)</strong>
                    ) : (
                      <span style={{ color: '#b8860b', fontSize: '13px' }}>As per Rapido/Porter meter</span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, borderTop: '1px dashed #dcd8cf', paddingTop: '10px' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: '#181716' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {formError && (
                <div style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', color: '#9b1c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="checkout-btn"
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Placing Your Order...' : `Confirm & Place Order (₹${subtotal.toLocaleString('en-IN')})`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
