import { useEffect } from 'react';

function Toast({ id, message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 3800);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div className={`um-toast um-toast-${type}`}>
      <span className="um-toast-icon">
        {type === 'success' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        )}
      </span>
      <span className="um-toast-msg">{message}</span>
      <button className="um-toast-close" onClick={() => onDismiss(id)} aria-label="Dismiss">×</button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="um-toast-container" aria-live="polite">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

let _toastId = 0;
export function makeToast(message, type = 'success') {
  return { id: ++_toastId, message, type };
}
