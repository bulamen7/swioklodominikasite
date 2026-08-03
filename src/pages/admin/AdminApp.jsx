import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import PatientDashboard from './PatientDashboard';

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    console.log('fetchRole result:', { data, error, userId });
    setRole(data?.role || 'patient');
    setLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Ładowanie...</div>;
  }

  if (!session) {
    if (showRegister) {
      return <Register onSwitch={() => setShowRegister(false)} />;
    }
    return <Login onLogin={() => {}} onSwitch={() => setShowRegister(true)} />;
  }

  if (role === 'admin') {
    return <Dashboard onLogout={() => setSession(null)} />;
  }

  return <PatientDashboard user={session.user} onLogout={() => setSession(null)} />;
}
