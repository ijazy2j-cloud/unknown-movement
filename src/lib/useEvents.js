import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { EVENTS } from '../data/events';

const DEFAULT_IMG = '/9cfe853c44722834d35684daba4c955b.jpg';
const TYPE_MAP = { ride: 'Ride', run: 'Run', triathlon: 'Triathlon' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

function normalizeDbEvent(row, joinCount = 0) {
  const name = row.organiser_name || 'Organiser';
  const initials = name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  return {
    id: row.id,
    title: row.title || 'Untitled',
    type: TYPE_MAP[row.type] || cap(row.type) || 'Ride',
    date: row.date,
    time: row.time || '06:00',
    location: row.start_location_name || row.city || '',
    city: row.city || '',
    km: row.distance_km != null ? String(row.distance_km) : '—',
    elevation: row.elevation_m != null ? String(row.elevation_m) : '0',
    pace: row.pace || '—',
    paceUnit: row.type === 'run' ? '/km' : 'km/h',
    difficulty: cap(row.difficulty) || 'Social',
    joining: joinCount,
    organizer: { name, initials, sub: '', bg: 'oklch(36% 0.08 42)' },
    tags: Array.isArray(row.tags) ? row.tags : [],
    lat: row.start_location_lat || null,
    lng: row.start_location_lng || null,
    image: row.cover_image_url || DEFAULT_IMG,
    attendees: [],
    description: row.description || '',
    safety: row.safety_notes ? row.safety_notes.split('\n').filter(Boolean) : [],
    // Official event fields
    is_official_event:    !!row.is_official_event,
    flyer_image_url:      row.flyer_image_url      || null,
    registration_link:    row.registration_link    || null,
    registration_deadline:row.registration_deadline|| null,
    entry_fee:            row.entry_fee            || null,
    event_website:        row.event_website        || null,
    _fromDb: true,
  };
}

export function useAllEvents() {
  const [events, setEvents] = useState(EVENTS);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;

    (async () => {
      const [evRes, cntRes] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .eq('visibility', 'public')
          .neq('status', 'cancelled')
          .order('date', { ascending: true })
          .order('time', { ascending: true }),
        supabase.from('enrolments').select('event_id'),
      ]);

      if (evRes.error) { setLoading(false); return; }

      const cntMap = {};
      for (const r of (cntRes.data || [])) {
        cntMap[r.event_id] = (cntMap[r.event_id] || 0) + 1;
      }

      const dbEvents = (evRes.data || []).map(r => normalizeDbEvent(r, cntMap[r.id] || 0));
      const dbIds = new Set(dbEvents.map(e => e.id));
      const seeds = EVENTS.filter(e => !dbIds.has(e.id));

      const merged = [...dbEvents, ...seeds].sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 :
        (a.time || '').localeCompare(b.time || '')
      );

      setEvents(merged);
      setLoading(false);
    })();
  }, []);

  return { events, loading };
}

export function useEventById(id) {
  const isUuid = UUID_RE.test(id || '');
  const seed = !isUuid ? (EVENTS.find(e => e.id === id) ?? null) : null;

  const [dbEvent, setDbEvent] = useState(null);
  const [loading, setLoading] = useState(isUuid && !!supabase);

  useEffect(() => {
    if (!isUuid || !supabase) { setLoading(false); return; }

    Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('enrolments').select('event_id').eq('event_id', id),
    ]).then(([evRes, cntRes]) => {
      if (evRes.data) {
        setDbEvent(normalizeDbEvent(evRes.data, cntRes.data?.length ?? 0));
      }
      setLoading(false);
    });
  }, [id, isUuid]);

  return { event: dbEvent ?? seed, loading };
}
