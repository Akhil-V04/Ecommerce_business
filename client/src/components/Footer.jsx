import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, Store, ExternalLink } from 'lucide-react';

export default function Footer({ onSelectCategory, onNavigate }) {
  return (
    <footer className="main-footer">
      <div className="footer-inner">
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div className="brand-emblem" style={{ width: '36px', height: '36px', fontSize: '18px' }}>
              <span>శ్రీ</span>
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-royal)', fontSize: '19px', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>
                SRINIVASA SILKS
              </h3>
              <p style={{ fontSize: '11px', color: '#b8860b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Hyderabad's Trusted Silk House
              </p>
            </div>
          </div>
          <p style={{ fontSize: '13.5px', color: '#68645e', lineHeight: 1.6, marginBottom: '16px' }}>
            Curating genuine handwoven Kanchipuram bridal pattu sarees, Banarasi brocades, premium 2x2 cotton blouse linings, pure raw silk fabrics, and ready-to-wear stitched petticoats.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#181716', fontWeight: 600 }}>
            <span>⚡ Swift Hyderabad Delivery via Rapido & Porter</span>
          </div>
        </div>

        {/* Collections */}
        <div>
          <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#181716', marginBottom: '16px' }}>
            Collections
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
            <li>
              <button
                onClick={() => onSelectCategory('Sarees')}
                style={{ background: 'none', border: 'none', color: '#57534e', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              >
                Pure Silk Sarees
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('Linings')}
                style={{ background: 'none', border: 'none', color: '#57534e', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              >
                2x2 Rubia Cotton Linings
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('Silks')}
                style={{ background: 'none', border: 'none', color: '#57534e', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              >
                Raw Silk Blouse Materials
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('Petticoats')}
                style={{ background: 'none', border: 'none', color: '#57534e', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              >
                Stitched Cotton Petticoats
              </button>
            </li>
          </ul>
        </div>

        {/* Store Timings & Delivery */}
        <div>
          <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#181716', marginBottom: '16px' }}>
            Store & Delivery
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#57534e' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Clock size={16} style={{ color: '#b8860b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Showroom Hours:</strong><br />
                10:30 AM – 9:30 PM (All 7 Days)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Truck size={16} style={{ color: '#b8860b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>City Delivery:</strong><br />
                Direct doorstep dispatch via Rapido & Porter apps in Hyderabad.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Store size={16} style={{ color: '#b8860b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Free Store Pick-up:</strong><br />
                Order online, collect at shop counter.
              </div>
            </div>
          </div>
        </div>

        {/* Showroom Address */}
        <div>
          <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#181716', marginBottom: '16px' }}>
            Hyderabad Showroom
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#57534e' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <MapPin size={16} style={{ color: '#b8860b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Srinivasa Silks Showroom</strong><br />
                Prashanti Nagar, Moula Ali, Ward 143 Tarnaka,<br />
                Hyderabad, Telangana - 500017.<br />
                <a
                  href="https://maps.app.goo.gl/6i7ESPtwhNTuSAEX8"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#b8860b', fontWeight: 600, textDecoration: 'none', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                >
                  📍 View on Google Maps ↗
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Phone size={16} style={{ color: '#b8860b', flexShrink: 0 }} />
              <div>+91 70133 11862 (WhatsApp & Call)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div>
          © {new Date().getFullYear()} <strong>Srinivasa Silks</strong>. All Rights Reserved. Crafted for Hyderabad Silk Connoisseurs.
        </div>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#999' }}>Hyderabad Delivery via Rapido / Porter</span>
        </div>
      </div>
    </footer>
  );
}
