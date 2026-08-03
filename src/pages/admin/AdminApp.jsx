import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './Dashboard';
import PatientDashboard from './PatientDashboard';

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); // login, register, forgot
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check if URL contains recovery token (from password reset email)
    const fullHash = window.location.href;
    if (fullHash.includes('type=recovery')) {
      localStorage.setItem('password_recovery', 'true');
      setIsRecovery(true);
    }
    if (localStorage.getItem('password_recovery') === 'true') {
      setIsRecovery(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && !isRecovery) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        localStorage.setItem('password_recovery', 'true');
        setIsRecovery(true);
        setSession(session);
        setLoading(false);
        return;
      }
      setSession(session);
      if (session && !isRecovery) fetchRole(session.user.id);
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

  // Show reset password form after clicking email link
  if (isRecovery && session) {
    return <ResetPassword />;
  }

  if (!session) {
    if (view === 'register') {
      return <Register onSwitch={() => setView('login')} />;
    }
    if (view === 'forgot') {
      return <ForgotPassword onSwitch={() => setView('login')} />;
    }
    return <Login onLogin={() => {}} onSwitch={() => setView('register')} onForgotPassword={() => setView('forgot')} />;
  }

  if (role === 'admin') {
    return <Dashboard onLogout={() => setSession(null)} />;
  }

  return <PatientDashboard user={session.user} onLogout={() => setSession(null)} />;
}
