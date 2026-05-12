import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ToastContainer, makeToast } from '../components/Toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function exportCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h] == null ? '' : String(r[h]);
        return `"${v.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function logAdminAction(adminId, actionType, targetType, targetId, details = {}) {
  if (!supabase) return;
  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action_type: actionType,
    target_type: targetType,
    target_id: String(targetId || ''),
    details,
  });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel, loading }) {
  return (
    <div className="um-admin-modal-overlay" onClick={onCancel}>
      <div className="um-admin-modal" onClick={e => e.stopPropagation()}>
        <div className="um-admin-modal-title">{title}</div>
        <div className="um-admin-modal-msg">{message}</div>
        <div className="um-admin-modal-btns">
          <button className="um-admin-btn" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className={`um-admin-btn ${danger ? 'um-admin-btn-danger' : 'um-admin-btn-accent'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let step = 0;
    const steps = 24;
    const t = setInterval(() => {
      step++;
      setDisplay(Math.round(value * (1 - Math.pow(1 - step / steps, 2))));
      if (step >= steps) { clearInterval(t); setDisplay(value); }
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return (
    <div className="um-admin-stat-card">
      {icon && <div className="um-admin-stat-icon">{icon}</div>}
      <div className="um-admin-stat-label">{label}</div>
      <div className="um-admin-stat-value">{display.toLocaleString()}</div>
      {sub && <div className="um-admin-stat-sub">{sub}</div>}
    </div>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────
function DashboardTab({ user }) {
  const [stats, setStats] = useState({ events: 0, users: 0, enrolments: 0, photos: 0, weekEvents: 0, weekUsers: 0 });
  const [popular, setPopular] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [evRes, usrRes, enrRes, phoRes, wkEvRes, wkUsrRes, popRes, feedRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('enrolments').select('id', { count: 'exact', head: true }),
        supabase.from('event_photos').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('enrolments').select('event_id, events(title)').limit(500),
        supabase.from('admin_audit_log').select('action_type, target_type, details, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(10),
      ]);
      setStats({
        events: evRes.count || 0,
        users: usrRes.count || 0,
        enrolments: enrRes.count || 0,
        photos: phoRes.count || 0,
        weekEvents: wkEvRes.count || 0,
        weekUsers: wkUsrRes.count || 0,
      });
      // Most popular event by enrolment count
      if (popRes.data?.length) {
        const counts = {};
        popRes.data.forEach(r => {
          const key = r.event_id;
          counts[key] = counts[key] || { title: r.events?.title || r.event_id, count: 0 };
          counts[key].count++;
        });
        const top = Object.values(counts).sort((a, b) => b.count - a.count)[0];
        setPopular(top);
      }
      setFeed(feedRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const icons = {
    events: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    enrolments: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    photos: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  };

  if (loading) return <div className="um-admin-empty">Loading dashboard…</div>;

  return (
    <div>
      <div className="um-admin-stats">
        <StatCard label="Total events" value={stats.events} sub={`+${stats.weekEvents} this week`} icon={icons.events} />
        <StatCard label="Total users" value={stats.users} sub={`+${stats.weekUsers} this week`} icon={icons.users} />
        <StatCard label="Enrolments" value={stats.enrolments} icon={icons.enrolments} />
        <StatCard label="Photos" value={stats.photos} icon={icons.photos} />
      </div>

      {popular && (
        <div className="um-admin-section" style={{ marginBottom: 20 }}>
          <div className="um-admin-section-hd">
            <span className="um-admin-section-title">Most popular event</span>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--um-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--um-text)' }}>{popular.title}</div>
              <div style={{ fontSize: 11, color: 'var(--um-text-4)', marginTop: 2 }}>{popular.count} enrolments</div>
            </div>
          </div>
        </div>
      )}

      <div className="um-admin-section">
        <div className="um-admin-section-hd">
          <span className="um-admin-section-title">Recent admin activity</span>
        </div>
        {feed.length === 0 ? (
          <div className="um-admin-empty">No admin actions logged yet.</div>
        ) : (
          <div className="um-admin-feed">
            {feed.map((item, i) => (
              <div key={i} className="um-admin-feed-item">
                <div className="um-admin-feed-dot" />
                <div className="um-admin-feed-text">
                  <strong>{item.action_type}</strong>
                  {item.target_type ? ` — ${item.target_type}` : ''}
                  {item.details?.title ? `: ${item.details.title}` : ''}
                  {item.details?.email ? ` (${item.details.email})` : ''}
                </div>
                <div className="um-admin-feed-time">{timeAgo(item.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Events tab ────────────────────────────────────────────────────────────────
function EventsTab({ user, addToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('id, title, type, date, city, status, organiser_name, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    // Fetch enrolment counts separately
    const { data: enrData } = await supabase
      .from('enrolments')
      .select('event_id');
    const enrCounts = {};
    (enrData || []).forEach(r => { enrCounts[r.event_id] = (enrCounts[r.event_id] || 0) + 1; });
    setEvents((data || []).map(e => ({ ...e, enrolments: enrCounts[e.id] || 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = events.filter(e => {
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterType && e.type !== filterType) return false;
    if (search && !e.title?.toLowerCase().includes(search.toLowerCase()) && !e.organiser_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleAction(action, eventId, extra = {}) {
    if (!supabase) return;
    setWorking(true);
    if (action === 'delete') {
      await supabase.from('enrolments').delete().eq('event_id', eventId);
      await supabase.from('event_photos').delete().eq('event_id', eventId);
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) { addToast('Delete failed: ' + error.message, 'error'); }
      else {
        await logAdminAction(user.id, 'DELETE_EVENT', 'event', eventId, extra);
        addToast('Event deleted.', 'success');
        setEvents(ev => ev.filter(e => e.id !== eventId));
      }
    } else if (action === 'cancel') {
      const { error } = await supabase.from('events').update({ status: 'cancelled' }).eq('id', eventId);
      if (error) { addToast('Cancel failed: ' + error.message, 'error'); }
      else {
        await logAdminAction(user.id, 'CANCEL_EVENT', 'event', eventId, extra);
        addToast('Event cancelled.', 'success');
        setEvents(ev => ev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e));
      }
    }
    setWorking(false);
    setConfirm(null);
    setSelected(new Set());
  }

  async function bulkAction(action) {
    if (!selected.size) return;
    setWorking(true);
    for (const id of selected) {
      await handleAction(action, id, { bulk: true });
    }
    setSelected(new Set());
    setConfirm(null);
    setWorking(false);
  }

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(e => e.id)));
  }

  return (
    <div>
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.label}
          danger={confirm.danger !== false}
          loading={working}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div className="um-admin-section">
        <div className="um-admin-section-hd">
          <span className="um-admin-section-title">{filtered.length} events</span>
          <div className="um-admin-filters">
            <input
              className="um-admin-search"
              placeholder="Search title or organiser…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="um-admin-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="um-admin-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All types</option>
              <option value="ride">Ride</option>
              <option value="run">Run</option>
              <option value="triathlon">Triathlon</option>
            </select>
            <button
              className="um-admin-btn"
              onClick={() => exportCSV(filtered.map(e => ({
                ID: e.id, Title: e.title, Type: e.type, Date: e.date,
                City: e.city, Status: e.status, Organiser: e.organiser_name,
                Enrolments: e.enrolments, Created: fmtDate(e.created_at),
              })), 'events.csv')}
            >
              Export CSV
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="um-admin-bulk-bar">
            <span className="um-admin-bulk-count">{selected.size} selected</span>
            <button className="um-admin-btn um-admin-btn-warn" onClick={() => setConfirm({ title: 'Bulk cancel', message: `Cancel ${selected.size} events?`, label: 'Cancel events', danger: false, onConfirm: () => bulkAction('cancel') })}>Bulk Cancel</button>
            <button className="um-admin-btn um-admin-btn-danger" onClick={() => setConfirm({ title: 'Bulk delete', message: `Permanently delete ${selected.size} events? This cannot be undone.`, label: 'Delete all', onConfirm: () => bulkAction('delete') })}>Bulk Delete</button>
            <button className="um-admin-btn" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}

        <div className="um-admin-table-wrap">
          {loading ? (
            <div className="um-admin-empty">Loading events…</div>
          ) : filtered.length === 0 ? (
            <div className="um-admin-empty">No events found.</div>
          ) : (
            <table className="um-admin-table">
              <thead>
                <tr>
                  <th className="um-admin-table-check">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                  </th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Organiser</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Enrolments</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => (
                  <tr key={ev.id}>
                    <td><input type="checkbox" checked={selected.has(ev.id)} onChange={() => toggleSelect(ev.id)} /></td>
                    <td style={{ fontWeight: 600, color: 'var(--um-text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{ev.type}</td>
                    <td>{ev.date}</td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.organiser_name || '—'}</td>
                    <td>{ev.city}</td>
                    <td><span className={`um-admin-status um-admin-status-${ev.status || 'upcoming'}`}>{ev.status || 'upcoming'}</span></td>
                    <td style={{ color: 'var(--um-accent)', fontWeight: 600 }}>{ev.enrolments}</td>
                    <td>{fmtDate(ev.created_at)}</td>
                    <td>
                      <div className="um-admin-table-actions">
                        {ev.status !== 'cancelled' && (
                          <button className="um-admin-btn um-admin-btn-warn" onClick={() => setConfirm({ title: 'Cancel event', message: `Cancel "${ev.title}"? Enrolees will no longer see it as upcoming.`, label: 'Cancel event', danger: false, onConfirm: () => handleAction('cancel', ev.id, { title: ev.title }) })}>Cancel</button>
                        )}
                        <button className="um-admin-btn um-admin-btn-danger" onClick={() => setConfirm({ title: 'Delete event', message: `Permanently delete "${ev.title}" and all its enrolments and photos? This cannot be undone.`, label: 'Delete', onConfirm: () => handleAction('delete', ev.id, { title: ev.title }) })}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab({ user: adminUser, addToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at, is_admin, suspended, avatar_url')
      .order('created_at', { ascending: false })
      .limit(500);
    // Count events and enrolments per user
    const { data: evData } = await supabase.from('events').select('organiser_id');
    const { data: enrData } = await supabase.from('enrolments').select('user_id');
    const evCounts = {}, enrCounts = {};
    (evData || []).forEach(r => { evCounts[r.organiser_id] = (evCounts[r.organiser_id] || 0) + 1; });
    (enrData || []).forEach(r => { enrCounts[r.user_id] = (enrCounts[r.user_id] || 0) + 1; });
    setUsers((data || []).map(u => ({ ...u, eventsCount: evCounts[u.id] || 0, enrolmentsCount: enrCounts[u.id] || 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    if (filterAdmin === 'admin' && !u.is_admin) return false;
    if (filterAdmin === 'regular' && u.is_admin) return false;
    if (filterAdmin === 'suspended' && !u.suspended) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!u.full_name?.toLowerCase().includes(s) && !u.email?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  async function toggleAdmin(u) {
    if (!supabase) return;
    const newVal = !u.is_admin;
    const { error } = await supabase.from('profiles').update({ is_admin: newVal }).eq('id', u.id);
    if (error) { addToast('Failed: ' + error.message, 'error'); return; }
    await logAdminAction(adminUser.id, newVal ? 'GRANT_ADMIN' : 'REVOKE_ADMIN', 'user', u.id, { email: u.email });
    addToast(`${newVal ? 'Admin granted' : 'Admin removed'} for ${u.email || u.full_name}.`, 'success');
    setUsers(us => us.map(x => x.id === u.id ? { ...x, is_admin: newVal } : x));
    setConfirm(null);
  }

  async function toggleSuspend(u) {
    if (!supabase) return;
    const newVal = !u.suspended;
    const { error } = await supabase.from('profiles').update({ suspended: newVal }).eq('id', u.id);
    if (error) { addToast('Failed: ' + error.message, 'error'); return; }
    await logAdminAction(adminUser.id, newVal ? 'SUSPEND_USER' : 'UNSUSPEND_USER', 'user', u.id, { email: u.email });
    addToast(`User ${newVal ? 'suspended' : 'reinstated'}.`, 'success');
    setUsers(us => us.map(x => x.id === u.id ? { ...x, suspended: newVal } : x));
    setConfirm(null);
  }

  async function deleteUser(u) {
    if (!supabase) return;
    setWorking(true);
    await supabase.from('saves').delete().eq('user_id', u.id);
    await supabase.from('follows').delete().eq('follower_id', u.id);
    await supabase.from('enrolments').delete().eq('user_id', u.id);
    const { error } = await supabase.from('profiles').delete().eq('id', u.id);
    if (error) { addToast('Delete failed: ' + error.message, 'error'); setWorking(false); return; }
    await logAdminAction(adminUser.id, 'DELETE_USER', 'user', u.id, { email: u.email });
    addToast('User profile deleted.', 'success');
    setUsers(us => us.filter(x => x.id !== u.id));
    setConfirm(null);
    setWorking(false);
  }

  const initials = (u) => (u.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || u.email?.slice(0, 2) || '?').toUpperCase();

  return (
    <div>
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.label}
          danger={confirm.danger !== false}
          loading={working}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {detailUser && (
        <div className="um-admin-modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="um-admin-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--um-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{initials(detailUser)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--um-text)' }}>{detailUser.full_name || 'No name'}</div>
                <div style={{ fontSize: 12, color: 'var(--um-text-4)' }}>{detailUser.email}</div>
              </div>
            </div>
            {[
              ['User ID', detailUser.id],
              ['Joined', fmtDate(detailUser.created_at)],
              ['Events organised', detailUser.eventsCount],
              ['Events enrolled', detailUser.enrolmentsCount],
              ['Admin', detailUser.is_admin ? 'Yes' : 'No'],
              ['Suspended', detailUser.suspended ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--um-border-lt)', fontSize: 12 }}>
                <span style={{ color: 'var(--um-text-4)' }}>{k}</span>
                <span style={{ color: 'var(--um-text-2)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div className="um-admin-modal-btns" style={{ marginTop: 16 }}>
              <button className="um-admin-btn" onClick={() => setDetailUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="um-admin-section">
        <div className="um-admin-section-hd">
          <span className="um-admin-section-title">{filtered.length} users</span>
          <div className="um-admin-filters">
            <input className="um-admin-search" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="um-admin-filter-select" value={filterAdmin} onChange={e => setFilterAdmin(e.target.value)}>
              <option value="">All users</option>
              <option value="admin">Admins only</option>
              <option value="regular">Non-admins</option>
              <option value="suspended">Suspended</option>
            </select>
            <button className="um-admin-btn" onClick={() => exportCSV(filtered.map(u => ({ ID: u.id, Name: u.full_name, Email: u.email, Joined: fmtDate(u.created_at), Admin: u.is_admin, Suspended: u.suspended, Events: u.eventsCount, Enrolments: u.enrolmentsCount })), 'users.csv')}>Export CSV</button>
          </div>
        </div>
        <div className="um-admin-table-wrap">
          {loading ? <div className="um-admin-empty">Loading users…</div> : filtered.length === 0 ? <div className="um-admin-empty">No users found.</div> : (
            <table className="um-admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Name / Email</th>
                  <th>Joined</th>
                  <th>Events</th>
                  <th>Enrolled</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ opacity: u.suspended ? 0.5 : 1 }}>
                    <td>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--um-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>
                        {initials(u)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--um-text)', fontSize: 12 }}>{u.full_name || '—'}</div>
                      <div style={{ color: 'var(--um-text-4)', fontSize: 11 }}>{u.email}</div>
                    </td>
                    <td>{fmtDate(u.created_at)}</td>
                    <td style={{ color: 'var(--um-accent)', fontWeight: 600 }}>{u.eventsCount}</td>
                    <td>{u.enrolmentsCount}</td>
                    <td>
                      {u.is_admin ? <span className="um-admin-status" style={{ background: 'oklch(26% 0.07 42)', color: 'oklch(75% 0.14 42)' }}>Admin</span>
                        : u.suspended ? <span className="um-admin-status um-admin-status-cancelled">Suspended</span>
                        : <span style={{ color: 'var(--um-text-4)', fontSize: 11 }}>User</span>}
                    </td>
                    <td>
                      <div className="um-admin-table-actions">
                        <button className="um-admin-btn" onClick={() => setDetailUser(u)}>View</button>
                        {u.id !== adminUser.id && (
                          <>
                            <button className="um-admin-btn um-admin-btn-accent" onClick={() => setConfirm({ title: u.is_admin ? 'Remove admin' : 'Grant admin', message: `${u.is_admin ? 'Remove admin access from' : 'Grant admin access to'} ${u.email || u.full_name}?`, label: u.is_admin ? 'Remove admin' : 'Grant admin', danger: u.is_admin, onConfirm: () => toggleAdmin(u) })}>
                              {u.is_admin ? 'Remove admin' : 'Make admin'}
                            </button>
                            <button className={`um-admin-btn ${u.suspended ? 'um-admin-btn-accent' : 'um-admin-btn-warn'}`} onClick={() => setConfirm({ title: u.suspended ? 'Reinstate user' : 'Suspend user', message: `${u.suspended ? 'Reinstate' : 'Suspend'} account for ${u.email || u.full_name}?`, label: u.suspended ? 'Reinstate' : 'Suspend', danger: !u.suspended, onConfirm: () => toggleSuspend(u) })}>
                              {u.suspended ? 'Reinstate' : 'Suspend'}
                            </button>
                            <button className="um-admin-btn um-admin-btn-danger" onClick={() => setConfirm({ title: 'Delete user', message: `Delete profile for ${u.email}? Their events will remain but the profile will be removed.`, label: 'Delete profile', onConfirm: () => deleteUser(u) })}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Enrolments tab ────────────────────────────────────────────────────────────
function EnrolmentsTab({ user: adminUser, addToast }) {
  const [enrolments, setEnrolments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase
        .from('enrolments')
        .select('id, user_id, user_email, event_id, created_at, events(title, date, type, city)')
        .order('created_at', { ascending: false })
        .limit(500);
      setEnrolments(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function removeEnrolment(enr) {
    if (!supabase) return;
    const { error } = await supabase.from('enrolments').delete().eq('id', enr.id);
    if (error) { addToast('Failed: ' + error.message, 'error'); return; }
    await logAdminAction(adminUser.id, 'REMOVE_ENROLMENT', 'enrolment', enr.id, { user_email: enr.user_email, event_id: enr.event_id });
    addToast('Enrolment removed.', 'success');
    setEnrolments(e => e.filter(x => x.id !== enr.id));
    setConfirm(null);
  }

  const filtered = enrolments.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.user_email?.toLowerCase().includes(s) || e.events?.title?.toLowerCase().includes(s);
  });

  return (
    <div>
      {confirm && <ConfirmModal title={confirm.title} message={confirm.message} confirmLabel="Remove" onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <div className="um-admin-section">
        <div className="um-admin-section-hd">
          <span className="um-admin-section-title">{filtered.length} enrolments</span>
          <div className="um-admin-filters">
            <input className="um-admin-search" placeholder="Search user or event…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="um-admin-btn" onClick={() => exportCSV(filtered.map(e => ({ ID: e.id, User: e.user_email, Event: e.events?.title, Date: e.events?.date, EnrolledAt: fmtDateTime(e.created_at) })), 'enrolments.csv')}>Export CSV</button>
          </div>
        </div>
        <div className="um-admin-table-wrap">
          {loading ? <div className="um-admin-empty">Loading enrolments…</div> : filtered.length === 0 ? <div className="um-admin-empty">No enrolments found.</div> : (
            <table className="um-admin-table">
              <thead>
                <tr><th>User email</th><th>Event</th><th>Type</th><th>Event date</th><th>Enrolled at</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(enr => (
                  <tr key={enr.id}>
                    <td style={{ color: 'var(--um-text)', fontWeight: 500 }}>{enr.user_email || enr.user_id?.slice(0, 8) + '…'}</td>
                    <td>{enr.events?.title || enr.event_id}</td>
                    <td style={{ textTransform: 'capitalize' }}>{enr.events?.type}</td>
                    <td>{enr.events?.date}</td>
                    <td>{fmtDateTime(enr.created_at)}</td>
                    <td>
                      <button className="um-admin-btn um-admin-btn-danger" onClick={() => setConfirm({ title: 'Remove enrolment', message: `Remove ${enr.user_email}'s enrolment from "${enr.events?.title}"?`, onConfirm: () => removeEnrolment(enr) })}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Photos tab ────────────────────────────────────────────────────────────────
function PhotosTab({ user: adminUser, addToast }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase
        .from('event_photos')
        .select('id, url, event_id, uploaded_by, created_at, events(title)')
        .order('created_at', { ascending: false })
        .limit(200);
      setPhotos(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function removePhoto(photo) {
    if (!supabase) return;
    if (photo.url) {
      const path = photo.url.split('/storage/v1/object/public/event-photos/')[1];
      if (path) await supabase.storage.from('event-photos').remove([path]);
    }
    await supabase.from('event_photos').delete().eq('id', photo.id);
    await logAdminAction(adminUser.id, 'REMOVE_PHOTO', 'photo', photo.id, { event_id: photo.event_id });
    addToast('Photo removed.', 'success');
    setPhotos(p => p.filter(x => x.id !== photo.id));
    setConfirm(null);
  }

  async function bulkRemove() {
    for (const id of selected) {
      const photo = photos.find(p => p.id === id);
      if (photo) await removePhoto(photo);
    }
    setSelected(new Set());
    setConfirm(null);
  }

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div>
      {confirm && <ConfirmModal title={confirm.title} message={confirm.message} confirmLabel="Remove" onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      {lightbox && (
        <div className="um-lightbox" onClick={() => setLightbox(null)}>
          <button className="um-lightbox-close" onClick={() => setLightbox(null)}>×</button>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <img src={lightbox.url} alt="Event photo" style={{ maxWidth: 'min(90vw, 800px)', maxHeight: '70vh', borderRadius: 8 }} />
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' }}>
              {lightbox.events?.title} · uploaded {fmtDate(lightbox.created_at)}
            </div>
            <button className="um-admin-btn um-admin-btn-danger" onClick={() => { setLightbox(null); setConfirm({ title: 'Remove photo', message: 'Remove this photo permanently?', onConfirm: () => removePhoto(lightbox) }); }}>Remove photo</button>
          </div>
        </div>
      )}

      <div className="um-admin-section">
        <div className="um-admin-section-hd">
          <span className="um-admin-section-title">{photos.length} photos</span>
          <div className="um-admin-filters">
            {selected.size > 0 && (
              <button className="um-admin-btn um-admin-btn-danger" onClick={() => setConfirm({ title: 'Remove selected', message: `Remove ${selected.size} photos permanently?`, onConfirm: bulkRemove })}>Remove {selected.size} selected</button>
            )}
            {selected.size > 0 && <button className="um-admin-btn" onClick={() => setSelected(new Set())}>Clear</button>}
          </div>
        </div>
        {loading ? (
          <div className="um-admin-empty">Loading photos…</div>
        ) : photos.length === 0 ? (
          <div className="um-admin-empty">No photos uploaded yet.</div>
        ) : (
          <div className="um-admin-photo-grid">
            {photos.map(photo => (
              <div key={photo.id} className="um-admin-photo-item" style={{ outline: selected.has(photo.id) ? '2px solid var(--um-accent)' : 'none' }}>
                <img src={photo.url} alt="Event photo" onClick={() => setLightbox(photo)} />
                <div className="um-admin-photo-meta">
                  <div className="um-admin-photo-title">{photo.events?.title || photo.event_id}</div>
                  <div className="um-admin-photo-sub">{fmtDate(photo.created_at)}</div>
                </div>
                <div className="um-admin-photo-actions">
                  <input type="checkbox" checked={selected.has(photo.id)} onChange={() => toggleSelect(photo.id)} style={{ marginRight: 4 }} />
                  <button className="um-admin-btn um-admin-btn-danger" style={{ flex: 1 }} onClick={() => setConfirm({ title: 'Remove photo', message: 'Remove this photo permanently?', onConfirm: () => removePhoto(photo) })}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Clubs tab ─────────────────────────────────────────────────────────────────
function ClubsTab({ user: adminUser, addToast }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase
        .from('clubs')
        .select('id, name, owner_id, created_at, featured, is_verified, logo_url, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(200);
      setClubs(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleFeatured(club) {
    if (!supabase) return;
    const { error } = await supabase.from('clubs').update({ featured: !club.featured }).eq('id', club.id);
    if (error) { addToast('Failed: ' + error.message, 'error'); return; }
    await logAdminAction(adminUser.id, club.featured ? 'UNFEATURE_CLUB' : 'FEATURE_CLUB', 'club', club.id, { name: club.name });
    addToast(`Club ${club.featured ? 'unfeatured' : 'featured'}.`, 'success');
    setClubs(c => c.map(x => x.id === club.id ? { ...x, featured: !club.featured } : x));
  }

  async function toggleVerified(club) {
    if (!supabase) return;
    const { error } = await supabase.from('clubs').update({ is_verified: !club.is_verified }).eq('id', club.id);
    if (error) { addToast('Failed: ' + error.message, 'error'); return; }
    await logAdminAction(adminUser.id, club.is_verified ? 'UNVERIFY_CLUB' : 'VERIFY_CLUB', 'club', club.id, { name: club.name });
    addToast(`Club ${club.is_verified ? 'unverified' : 'verified'}.`, 'success');
    setClubs(c => c.map(x => x.id === club.id ? { ...x, is_verified: !club.is_verified } : x));
  }

  async function deleteClub(club) {
    if (!supabase) return;
    const { error } = await supabase.from('clubs').delete().eq('id', club.id);
    if (error) { addToast('Delete failed: ' + error.message, 'error'); return; }
    await logAdminAction(adminUser.id, 'DELETE_CLUB', 'club', club.id, { name: club.name });
    addToast('Club deleted.', 'success');
    setClubs(c => c.filter(x => x.id !== club.id));
    setConfirm(null);
  }

  return (
    <div>
      {confirm && <ConfirmModal title={confirm.title} message={confirm.message} confirmLabel="Delete" onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <div className="um-admin-section">
        <div className="um-admin-section-hd">
          <span className="um-admin-section-title">{clubs.length} clubs</span>
        </div>
        <div className="um-admin-table-wrap">
          {loading ? <div className="um-admin-empty">Loading clubs…</div> : clubs.length === 0 ? <div className="um-admin-empty">No clubs yet.</div> : (
            <table className="um-admin-table">
              <thead><tr><th>Name</th><th>Owner</th><th>Created</th><th>Featured</th><th>Verified</th><th>Actions</th></tr></thead>
              <tbody>
                {clubs.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--um-text)' }}>{c.name}</td>
                    <td style={{ fontSize: 11 }}>{c.profiles?.full_name || c.profiles?.email || c.owner_id?.slice(0, 8)}</td>
                    <td>{fmtDate(c.created_at)}</td>
                    <td>{c.featured ? <span className="um-admin-status um-admin-status-upcoming">Featured</span> : '—'}</td>
                    <td>{c.is_verified ? <span className="um-admin-status um-admin-status-completed">Verified</span> : '—'}</td>
                    <td>
                      <div className="um-admin-table-actions">
                        <button className="um-admin-btn um-admin-btn-accent" onClick={() => toggleFeatured(c)}>{c.featured ? 'Unfeature' : 'Feature'}</button>
                        <button className="um-admin-btn um-admin-btn-accent" onClick={() => toggleVerified(c)}>{c.is_verified ? 'Unverify' : 'Verify'}</button>
                        <button className="um-admin-btn um-admin-btn-danger" onClick={() => setConfirm({ title: 'Delete club', message: `Delete "${c.name}" permanently?`, onConfirm: () => deleteClub(c) })}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────────────────────
const CHART_COLORS = ['#FC4C02', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

function ReportsTab() {
  const [eventsOverTime, setEventsOverTime] = useState([]);
  const [usersOverTime, setUsersOverTime] = useState([]);
  const [byCity, setByCity] = useState([]);
  const [byType, setByType] = useState([]);
  const [topOrgs, setTopOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [evRes, usrRes, cityRes, typeRes, orgRes] = await Promise.all([
        supabase.from('events').select('created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from('profiles').select('created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from('events').select('city'),
        supabase.from('events').select('type'),
        supabase.from('events').select('organiser_name, organiser_id').limit(500),
      ]);
      // Group by day
      const groupByDay = (rows, field = 'created_at') => {
        const map = {};
        rows.forEach(r => {
          const d = r[field]?.slice(0, 10);
          if (d) map[d] = (map[d] || 0) + 1;
        });
        return Object.entries(map).sort().map(([date, count]) => ({ date: date.slice(5), count }));
      };
      setEventsOverTime(groupByDay(evRes.data || []));
      setUsersOverTime(groupByDay(usrRes.data || []));
      // By city
      const cities = {};
      (cityRes.data || []).forEach(r => { if (r.city) cities[r.city] = (cities[r.city] || 0) + 1; });
      setByCity(Object.entries(cities).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([city, count]) => ({ city, count })));
      // By type
      const types = {};
      (typeRes.data || []).forEach(r => { if (r.type) types[r.type] = (types[r.type] || 0) + 1; });
      setByType(Object.entries(types).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));
      // Top organisers
      const orgs = {};
      (orgRes.data || []).forEach(r => {
        const key = r.organiser_name || r.organiser_id?.slice(0, 8);
        if (key) orgs[key] = (orgs[key] || 0) + 1;
      });
      setTopOrgs(Object.entries(orgs).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([name, count]) => ({ name, count })));
      setLoading(false);
    }
    load();
  }, []);

  const textColor = 'var(--um-text-4)';
  const gridColor = 'var(--um-border-lt)';

  if (loading) return <div className="um-admin-empty">Loading reports…</div>;

  return (
    <div>
      <div className="um-admin-chart-grid">
        <div className="um-admin-chart-card">
          <div className="um-admin-chart-title">Events created — last 30 days</div>
          <div className="um-admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eventsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: textColor }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: textColor }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--um-surface)', border: '1px solid var(--um-border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#FC4C02" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="um-admin-chart-card">
          <div className="um-admin-chart-title">User sign-ups — last 30 days</div>
          <div className="um-admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: textColor }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: textColor }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--um-surface)', border: '1px solid var(--um-border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="um-admin-chart-card">
          <div className="um-admin-chart-title">Events by city</div>
          <div className="um-admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: textColor }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="city" type="category" tick={{ fontSize: 10, fill: textColor }} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={{ background: 'var(--um-surface)', border: '1px solid var(--um-border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#FC4C02" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="um-admin-chart-card">
          <div className="um-admin-chart-title">Events by type</div>
          <div className="um-admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--um-surface)', border: '1px solid var(--um-border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="um-admin-section">
        <div className="um-admin-section-hd"><span className="um-admin-section-title">Top organisers</span></div>
        <table className="um-admin-table">
          <thead><tr><th>#</th><th>Organiser</th><th>Events submitted</th></tr></thead>
          <tbody>
            {topOrgs.map((o, i) => (
              <tr key={i}>
                <td style={{ color: i < 3 ? 'var(--um-accent)' : 'var(--um-text-4)', fontWeight: 700 }}>{i + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--um-text)' }}>{o.name}</td>
                <td style={{ color: 'var(--um-accent)', fontWeight: 600 }}>{o.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Audit log tab ─────────────────────────────────────────────────────────────
function AuditTab() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data } = await supabase
        .from('admin_audit_log')
        .select('id, action_type, target_type, target_id, details, created_at, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(200);
      setLog(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const actionTypes = [...new Set(log.map(l => l.action_type))];
  const filtered = filterType ? log.filter(l => l.action_type === filterType) : log;

  return (
    <div>
      <div className="um-admin-section">
        <div className="um-admin-section-hd">
          <span className="um-admin-section-title">{filtered.length} log entries</span>
          <div className="um-admin-filters">
            <select className="um-admin-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All actions</option>
              {actionTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="um-admin-btn" onClick={() => exportCSV(filtered.map(l => ({ Action: l.action_type, Type: l.target_type, TargetID: l.target_id, Admin: l.profiles?.email, Details: JSON.stringify(l.details), At: fmtDateTime(l.created_at) })), 'audit-log.csv')}>Export CSV</button>
          </div>
        </div>
        <div className="um-admin-table-wrap">
          {loading ? <div className="um-admin-empty">Loading log…</div> : filtered.length === 0 ? <div className="um-admin-empty">No actions logged yet.</div> : (
            <table className="um-admin-table">
              <thead><tr><th>Action</th><th>Target type</th><th>Target ID</th><th>Details</th><th>Admin</th><th>Time</th></tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600, color: 'var(--um-text)', whiteSpace: 'nowrap' }}>{l.action_type}</td>
                    <td style={{ textTransform: 'capitalize' }}>{l.target_type || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--um-text-4)' }}>{l.target_id?.slice(0, 16)}…</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.details ? Object.entries(l.details).map(([k, v]) => `${k}: ${v}`).join(', ') : '—'}
                    </td>
                    <td style={{ fontSize: 11 }}>{l.profiles?.email || l.profiles?.full_name || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main AdminScreen ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { id: 'events',    label: 'Events',    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'users',     label: 'Users',     icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'enrolments',label: 'Enrolments',icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
  { id: 'photos',    label: 'Photos',    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { id: 'clubs',     label: 'Clubs',     icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg> },
  { id: 'reports',   label: 'Reports',   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: 'audit',     label: 'Audit log', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
];

export default function AdminScreen({ onNavigate, goBack, user, isAdmin, darkMode, onToggleDark }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    setToasts(t => [...t, makeToast(message, type)]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  // Access guard
  if (!user) {
    return (
      <div className="um-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--um-text)' }}>Sign in required</div>
        <div style={{ fontSize: 13, color: 'var(--um-text-4)' }}>You must be signed in to access the admin panel.</div>
        <button className="um-btn um-btn-accent" onClick={() => onNavigate('home')}>Back to homepage</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="um-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--um-text-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--um-text)' }}>Access denied</div>
        <div style={{ fontSize: 13, color: 'var(--um-text-4)', textAlign: 'center', maxWidth: 280 }}>You don't have admin access. Contact the site owner if you think this is a mistake.</div>
        <button className="um-btn um-btn-accent" onClick={() => onNavigate('home')}>Back to homepage</button>
      </div>
    );
  }

  return (
    <div className="um-admin">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top bar */}
      <div className="um-admin-topbar">
        <div className="um-admin-brand">
          <button className="um-admin-logo" onClick={() => onNavigate('home')}>Unknown Movement</button>
          <span className="um-admin-badge">Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--um-text-4)' }}>{user.email}</span>
          <button className="um-admin-btn" onClick={() => onNavigate('home')}>← Exit admin</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="um-admin-tabs-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`um-admin-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="um-admin-body">
        {activeTab === 'dashboard'   && <DashboardTab user={user} />}
        {activeTab === 'events'      && <EventsTab user={user} addToast={addToast} />}
        {activeTab === 'users'       && <UsersTab user={user} addToast={addToast} />}
        {activeTab === 'enrolments'  && <EnrolmentsTab user={user} addToast={addToast} />}
        {activeTab === 'photos'      && <PhotosTab user={user} addToast={addToast} />}
        {activeTab === 'clubs'       && <ClubsTab user={user} addToast={addToast} />}
        {activeTab === 'reports'     && <ReportsTab />}
        {activeTab === 'audit'       && <AuditTab />}
      </div>
    </div>
  );
}
