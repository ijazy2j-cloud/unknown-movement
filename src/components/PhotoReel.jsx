import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function PhotoLightbox({ photo, onClose, onNavigate }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="um-lightbox" onClick={onClose} style={{ flexDirection: 'column', gap: 16 }}>
      <button className="um-lightbox-close" onClick={onClose} aria-label="Close">×</button>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 'min(90vw, 720px)', width: '100%' }}>
        <img
          src={photo.url}
          alt={photo.caption || 'Community photo'}
          style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 12, objectFit: 'contain', display: 'block' }}
        />
        <div style={{ width: '100%', background: 'rgba(13,13,16,0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
          {photo.caption && (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 10, lineHeight: 1.5 }}>{photo.caption}</p>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            {photo.uploader_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {photo.uploader_name}
              </span>
            )}
            {photo.events?.title && (
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--um-accent)', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
                onClick={() => { onClose(); onNavigate('detail', photo.events.id); }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {photo.events.title}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReelCard({ photo, onClick }) {
  return (
    <div className="um-reel-card" onClick={onClick}>
      <div className="um-reel-card-img-wrap">
        <img
          src={photo.url}
          alt={photo.caption || 'Community photo'}
          className="um-reel-card-img"
          loading="lazy"
        />
        <div className="um-reel-card-overlay" />
      </div>
      <div className="um-reel-card-footer">
        <div className="um-reel-card-name">{photo.uploader_name || 'Community member'}</div>
        {photo.events?.title && (
          <div className="um-reel-card-event">{photo.events.title}</div>
        )}
      </div>
    </div>
  );
}

function EmptyReel({ onUpload }) {
  return (
    <div className="um-reel-empty">
      <div className="um-reel-empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--um-text-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--um-text-2)' }}>Be the first to share a moment</div>
      <div style={{ fontSize: 12, color: 'var(--um-text-4)', marginTop: 4 }}>Photos shared from events will appear here.</div>
      {onUpload && (
        <button className="um-btn um-btn-outline um-btn-sm" style={{ marginTop: 12 }} onClick={onUpload}>
          Upload a photo
        </button>
      )}
    </div>
  );
}

export default function PhotoReel({ onNavigate }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from('event_photos')
      .select('id, url, caption, uploader_name, uploaded_by, event_id, created_at, events(id, title, city)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(24)
      .then(({ data }) => { setPhotos(data || []); setLoading(false); });
  }, []);

  if (loading) return null; // don't flash empty state while loading
  if (photos.length < 3) return <EmptyReel />;

  // Ensure at least 10 items for a smooth loop
  const fills = Math.ceil(10 / photos.length);
  const track = Array.from({ length: fills + 1 }, () => photos).flat();

  return (
    <section className="um-reel-section" aria-label="Community photos">
      <div className="um-reel-hd">
        <div>
          <h2 className="um-reel-title">From the community</h2>
          <p className="um-reel-sub">Real rides, real runs, real people.</p>
        </div>
        <button className="um-featured-section-link" onClick={() => onNavigate('explore')}>
          View all photos →
        </button>
      </div>

      {lightbox && <PhotoLightbox photo={lightbox} onClose={() => setLightbox(null)} onNavigate={onNavigate} />}

      <div className="um-reel-viewport">
        <div className="um-reel-track" style={{ '--reel-count': track.length }}>
          {track.map((photo, i) => (
            <ReelCard key={`${photo.id}-${i}`} photo={photo} onClick={() => setLightbox(photo)} />
          ))}
        </div>
      </div>
    </section>
  );
}
