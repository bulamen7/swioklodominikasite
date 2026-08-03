import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import Login from './Login';
import Dashboard from './Dashboard';

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Ładowanie...</div>;
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  return <Dashboard onLogout={() => setSession(null)} />;
}
