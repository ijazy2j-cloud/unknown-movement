import { useEffect, useRef, useState } from 'react';

let L = null;
function loadLeaflet() {
  if (L) return Promise.resolve(L);
  return import('leaflet').then(mod => {
    L = mod.default || mod;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    return L;
  });
}

const SRI_LANKA_CENTER = [7.8731, 80.7718];
const SRI_LANKA_ZOOM   = 7;

export default function ExploreMap({ events, onNavigate, enrolments = [] }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadLeaflet().then(Leaflet => {
      if (cancelled || !containerRef.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = Leaflet.map(containerRef.current, {
        center:          SRI_LANKA_CENTER,
        zoom:            SRI_LANKA_ZOOM,
        zoomControl:     false,
        scrollWheelZoom: true,
      });

      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      Leaflet.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      setReady(true);
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Add/update markers when events or map changes
  useEffect(() => {
    if (!ready || !mapRef.current || !L) return;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validEvents = events.filter(e => e.lat && e.lng && !isNaN(e.lat) && !isNaN(e.lng));

    validEvents.forEach(ev => {
      const isEnrolled = (enrolments || []).includes(ev.id);
      const color = isEnrolled ? '#22c55e' : '#FC4C02';
      const typeLabel = ev.type === 'Run' ? 'RUN' : ev.type === 'Ride' ? 'RIDE' : ev.type.toUpperCase().slice(0, 3);

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:${color};
          color:white;
          font-size:8px;
          font-weight:700;
          font-family:'Inter',system-ui,sans-serif;
          letter-spacing:0.04em;
          padding:3px 6px;
          border-radius:4px;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          border:1.5px solid white;
          cursor:pointer;
          position:relative;
        ">${typeLabel}<div style="
          position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:4px solid transparent;
          border-right:4px solid transparent;
          border-top:5px solid ${color};
        "></div></div>`,
        iconSize:   [null, null],
        iconAnchor: [24, 28],
        popupAnchor:[0, -32],
      });

      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const [,m,d] = (ev.date || '').split('-');
      const dateStr = m && d ? `${parseInt(d)} ${months[parseInt(m)-1]}` : ev.date || '';

      const marker = L.marker([ev.lat, ev.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="um-map-event-popup">
            <div class="um-map-event-popup-title">${ev.title}</div>
            <div class="um-map-event-popup-meta">${dateStr} · ${ev.time || ''}<br>${ev.location || ev.city || ''}</div>
            <button class="um-map-event-popup-btn" data-id="${ev.id}">View details →</button>
          </div>`, { maxWidth: 240, className: 'um-leaflet-popup' }
        );

      marker.on('popupopen', () => {
        const btn = document.querySelector(`.um-leaflet-popup [data-id="${ev.id}"]`);
        if (btn) btn.addEventListener('click', () => onNavigate('detail', ev.id));
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (validEvents.length > 0 && validEvents.length < 30) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 13 });
    }
  }, [ready, events, enrolments]);

  return (
    <div className="um-explore-map-wrap">
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--um-bg2)',
        }}>
          <div className="um-skeleton" style={{ width: '100%', height: '100%' }} />
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
