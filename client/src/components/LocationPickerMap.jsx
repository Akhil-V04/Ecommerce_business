import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix standard Leaflet default icon path issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom gold-maroon delivery pin icon
const deliveryIcon = L.divIcon({
  className: 'custom-delivery-pin',
  html: `<div style="
    background: #8a1528;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    border: 2px solid #ffffff;
  "><span style="transform: rotate(45deg); font-size: 15px;">📍</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  interactive = true,
  height = '200px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const defaultLat = latitude || 17.4437; // Srinivasa Silks showroom coordinates (Moula Ali / Tarnaka)
  const defaultLng = longitude || 78.5434;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy prior map instance if any exists on this DOM node
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], {
      icon: deliveryIcon,
      draggable: interactive
    }).addTo(map);

    marker.bindPopup(`<b>Delivery Spot</b><br/>${interactive ? 'Drag to your gate or building entrance' : 'Customer Location'}`).openPopup();

    if (interactive && onLocationChange) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        onLocationChange(e.latlng.lat, e.latlng.lng);
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Timeout fix for Leaflet container size invalidation inside modals
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position if props change externally
  useEffect(() => {
    if (latitude && longitude && mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: height,
        borderRadius: '12px',
        border: '1px solid #eae7e1',
        overflow: 'hidden',
        zIndex: 1
      }}
    />
  );
}
