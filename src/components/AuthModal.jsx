import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div className="um-modal-backdrop" onClick={onClose}>
      <div className="um-modal" onClick={e => e.stopPropagation()}>
        <button className="um-modal-close" onClick={onClose} aria-label="Close">×</button>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '28px 0 12px' }}>
            <div style={{ fontSize: 38, marginBottom: 14, lineHeight: 1 }}>📬</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--um-text)' }}>
              Check your inbox
            </div>
            <div style={{ fontSize: 13, color: 'var(--um-text-3)', lineHeight: 1.6 }}>
              We sent a sign-in link to<br /><strong style={{ color: 'var(--um-text-2)' }}>{email}</strong>
            </div>
          </div>
        ) : (
          <>
            <div className="um-modal-title">Sign in</div>
            <div className="um-modal-sub">
              Save sessions, track your events, and follow clubs.
            </div>
            <form onSubmit={handleMagicLink} style={{ marginTop: 20 }}>
              <input
                className="um-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ marginBottom: error ? 6 : 10 }}
                autoFocus
              />
              {error && <div className="um-form-error">{error}</div>}
              <button
                className="um-btn um-btn-accent um-btn-full"
                type="submit"
                disabled={loading}
                style={{ marginTop: error ? 10 : 0 }}
              >
                {loading ? 'Sending…' : 'Continue with email'}
              </button>
            </form>
            <div className="um-divider-or"><span>or</span></div>
            <button className="um-btn um-btn-outline um-btn-full um-btn-google" onClick={handleGoogle}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
