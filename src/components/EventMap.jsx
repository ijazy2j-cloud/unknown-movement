import { useEffect, useRef, useState } from 'react';

/* Lazy-load Leaflet only in the browser to avoid SSR issues */
let L = null;

function loadLeaflet() {
  if (L) return Promise.resolve(L);
  return import('leaflet').then(mod => {
    L = mod.default || mod;
    // Fix default icon paths broken by bundlers
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    return L;
  });
}

function formatDuration(km) {
  if (!km || km === '—') return '—';
  const dist = parseFloat(km);
  if (isNaN(dist)) return '—';
  // Rough estimate: ~15 km/h avg (includes stops, social pace)
  const hrs = dist / 15;
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  if (h === 0) return `~${m}min`;
  if (m === 0) return `~${h}h`;
  return `~${h}h ${m}m`;
}

function getTerrainLabel(type) {
  if (!type) return 'Road';
  const t = type.toLowerCase();
  if (t === 'run') return 'Pavement';
  return 'Road';
}

export default function EventMap({ event }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const lat = event?.lat;
  const lng = event?.lng;
  const hasCoords = lat && lng && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (!hasCoords) { setStatus('error'); return; }

    let map;
    let cancelled = false;

    loadLeaflet().then(Leaflet => {
      if (cancelled || !mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      map = Leaflet.map(mapContainerRef.current, {
        center:          [lat, lng],
        zoom:            14,
        zoomControl:     false,
        attributionControl: true,
        scrollWheelZoom: false,
        dragging:        true,
        tap:             true,
      });

      Leaflet.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>' }
      ).addTo(map);

      Leaflet.control.zoom({ position: 'bottomright' }).addTo(map);

      // Orange accent custom marker
      const orangeIcon = Leaflet.divIcon({
        className: '',
        html: `<div style="
          width:34px;height:34px;
          background:linear-gradient(135deg,#FC4C02,#e03a00);
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 3px 12px rgba(252,76,2,0.5);
        "></div>`,
        iconSize:   [34, 34],
        iconAnchor: [17, 34],
        popupAnchor:[0, -38],
      });

      const locationName = event.location || event.city || 'Start location';
      const marker = Leaflet.marker([lat, lng], { icon: orangeIcon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:'Inter',system-ui,sans-serif;padding:2px 0">
          <div style="font-size:12px;font-weight:600;color:#0F0F12;margin-bottom:3px">${event.title || 'Event'}</div>
          <div style="font-size:11px;color:#44444E">${locationName}</div>
        </div>`,
        { maxWidth: 200 }
      );

      // Draw a translucent radius circle showing approximate area
      const km = parseFloat(event.km);
      if (km && km > 0) {
        const radiusMeters = Math.min(km * 200, 8000); // proportional but capped
        Leaflet.circle([lat, lng], {
          radius:      radiusMeters,
          color:       '#FC4C02',
          weight:      2,
          opacity:     0.6,
          fillColor:   '#FC4C02',
          fillOpacity: 0.07,
          dashArray:   '6 4',
        }).addTo(map);
      }

      mapInstanceRef.current = map;
      setStatus('ready');
    }).catch(() => setStatus('error'));

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, event?.title]);

  if (!hasCoords || status === 'error') {
    return (
      <div style={{
        height: 200, borderRadius: 10, background: 'var(--um-bg2)',
        border: '1px solid var(--um-border-lt)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 8, color: 'var(--um-text-4)',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: 13 }}>Map not available</span>
      </div>
    );
  }

  return (
    <div>
      {/* Map container */}
      <div className="um-map-wrap">
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--um-bg2)', borderRadius: 10, zIndex: 1,
          }}>
            <div className="um-skeleton" style={{ width: '100%', height: '100%', borderRadius: 10 }} />
          </div>
        )}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Route info strip */}
      <div className="um-route-strip">
        <div className="um-route-stat">
          <div className="um-route-stat-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="um-route-stat-val">{event.km !== '—' ? `${event.km} km` : '—'}</div>
          <div className="um-route-stat-lbl">Distance</div>
        </div>
        <div className="um-route-stat">
          <div className="um-route-stat-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div className="um-route-stat-val">{event.elevation && event.elevation !== '0' ? `${event.elevation}m` : '—'}</div>
          <div className="um-route-stat-lbl">Elevation</div>
        </div>
        <div className="um-route-stat">
          <div className="um-route-stat-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="um-route-stat-val">{formatDuration(event.km)}</div>
          <div className="um-route-stat-lbl">Est. time</div>
        </div>
        <div className="um-route-stat">
          <div className="um-route-stat-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
            </svg>
          </div>
          <div className="um-route-stat-val">{getTerrainLabel(event.type)}</div>
          <div className="um-route-stat-lbl">Terrain</div>
        </div>
      </div>

      {/* Actions */}
      <div className="um-map-actions">
        {lat && lng && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="um-btn um-btn-outline um-btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Open in Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
