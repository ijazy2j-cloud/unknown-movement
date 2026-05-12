import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const CACHE_KEY = 'um-stats-v1';
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sat = new Date(monday); sat.setDate(monday.getDate() + 5);
  const sun = new Date(monday); sun.setDate(monday.getDate() + 6);
  return {
    monStr: monday.toISOString().slice(0, 10),
    sunStr: sunday.toISOString().slice(0, 10),
    satStr: sat.toISOString().slice(0, 10),
    wkndSunStr: sun.toISOString().slice(0, 10),
  };
}

export function useStats() {
  const [stats, setStats] = useState({ weekEvents: 24, weekendEvents: 8, clubs: 6, cities: 3 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage cache
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < TTL_MS) { setStats(data); setLoaded(true); return; }
      }
    } catch {}

    if (!supabase) { setLoaded(true); return; }

    const { monStr, sunStr, satStr, wkndSunStr } = getWeekBounds();
    const today = new Date().toISOString().slice(0, 10);

    Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true })
        .gte('date', monStr).lte('date', sunStr).neq('status', 'cancelled'),
      supabase.from('events').select('date')
        .in('date', [satStr, wkndSunStr]).neq('status', 'cancelled'),
      supabase.from('clubs').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('events').select('city').gte('date', today).neq('status', 'cancelled'),
    ]).then(([wkRes, wkndRes, clubRes, cityRes]) => {
      const cities = new Set((cityRes.data || []).map(e => e.city).filter(Boolean));
      const data = {
        weekEvents:    wkRes.count    ?? 0,
        weekendEvents: wkndRes.data?.length ?? 0,
        clubs:         clubRes.count   ?? 0,
        cities:        cities.size     || 0,
      };
      setStats(data);
      setLoaded(true);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
    });
  }, []);

  return { stats, loaded };
}
