import { useState } from 'react';

const WA_NUMBER = '94770000000';
const BASE_URL  = 'https://unknownmovement.netlify.app';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatShareDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function formatShareTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export default function ShareSheet({ event, onClose }) {
  const [copied, setCopied] = useState(false);

  const url = `${BASE_URL}/event/${encodeURIComponent(event.id)}`;

  // Rich formatted share text
  const dateStr = formatShareDate(event.date);
  const timeStr = formatShareTime(event.time);
  const distStr = event.km && event.km !== '—' ? ` · ${event.km}km` : '';
  const paceStr = event.pace && event.pace !== '—' && !event.is_official_event ? ` · ${event.pace}` : '';
  const feeStr  = event.entry_fee ? ` · ${event.entry_fee}` : '';

  const regLink = event.is_official_event && event.registration_link ? event.registration_link : url;

  const waText = event.is_official_event
    ? `🏁 *${event.title}*\n📅 ${dateStr} at ${timeStr}${feeStr}\n📍 ${event.location || event.city}\n\nRegister: ${regLink}`
    : `🚴 *${event.title}*\n📅 ${dateStr} at ${timeStr}${distStr}${paceStr}\n📍 ${event.location || event.city}\n\nSign up: ${url}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(event.is_official_event && event.registration_link ? event.registration_link : url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`, '_blank', 'noopener');
  };

  const shareNative = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: event.title,
        text: `${dateStr} · ${event.location || event.city}${distStr}`,
        url,
      });
    } catch {}
  };

  return (
    <>
      <div className="um-sheet-backdrop" onClick={onClose} />
      <div className="um-sheet">
        <div className="um-sheet-handle" />
        <div className="um-sheet-hd">Share this {event.is_official_event ? 'event' : 'session'}</div>
        <div className="um-sheet-event-name">{event.title}</div>
        <div className="um-sheet-row">
          <button className="um-sheet-btn" onClick={copyLink}>
            <span className="um-sheet-btn-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </span>
            <span className="um-sheet-btn-lbl">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
          <button className="um-sheet-btn" onClick={shareWhatsApp}>
            <span className="um-sheet-btn-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </span>
            <span className="um-sheet-btn-lbl">WhatsApp</span>
          </button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button className="um-sheet-btn" onClick={shareNative}>
              <span className="um-sheet-btn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </span>
              <span className="um-sheet-btn-lbl">More</span>
            </button>
          )}
        </div>
        <button className="um-btn um-btn-ghost um-btn-full" style={{ marginTop: 4 }} onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}
