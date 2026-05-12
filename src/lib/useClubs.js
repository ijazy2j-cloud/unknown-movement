import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// All verified clubs with member counts
export function useClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('clubs')
      .select('id, name, slug, logo_url, city, is_verified, owner_id, created_at, club_members(count)')
      .order('name');
    setClubs((data || []).map(c => ({
      ...c,
      memberCount: c.club_members?.[0]?.count ?? 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { clubs, loading, reload: load };
}

// Single club by slug with full data
export function useClub(slug) {
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug || !supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('clubs')
      .select(`
        *,
        club_members(id, user_id, role, joined_at, profiles(full_name, avatar_url, email)),
        club_socials(*),
        club_key_members(*)
      `)
      .eq('slug', slug)
      .single();
    setClub(data ?? null);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);
  return { club, loading, reload: load };
}

// Clubs the current user belongs to
export function useUserClubs(userId) {
  const [clubs, setClubs] = useState([]);
  const [memberMap, setMemberMap] = useState({}); // clubId → { role, joined_at }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !supabase) return;
    setLoading(true);
    supabase
      .from('club_members')
      .select('role, joined_at, clubs(id, name, slug, logo_url, city)')
      .eq('user_id', userId)
      .then(({ data }) => {
        const cs = (data || []).map(m => m.clubs).filter(Boolean);
        const map = {};
        (data || []).forEach(m => {
          if (m.clubs?.id) map[m.clubs.id] = { role: m.role, joined_at: m.joined_at };
        });
        setClubs(cs);
        setMemberMap(map);
        setLoading(false);
      });
  }, [userId]);

  return { clubs, memberMap, loading };
}

// Join a club
export async function joinClub(clubId, userId) {
  if (!supabase) return { error: 'Not configured' };
  return supabase.from('club_members').insert({ club_id: clubId, user_id: userId, role: 'member' }).select().single();
}

// Leave a club
export async function leaveClub(clubId, userId) {
  if (!supabase) return { error: 'Not configured' };
  return supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', userId);
}
