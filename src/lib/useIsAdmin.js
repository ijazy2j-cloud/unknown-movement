import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useIsAdmin(user) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(!!data?.is_admin);
        setLoading(false);
      });
  }, [user?.id]);

  return { isAdmin, loading };
}
