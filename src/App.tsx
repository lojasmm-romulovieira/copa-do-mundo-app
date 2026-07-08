import { useState, useEffect } from 'react';
import PublicView from './components/PublicView';
import LoginView from './components/LoginView';
import AdminView from './components/AdminView';

type View = 'public' | 'login' | 'admin';

const STORAGE_KEY = 'copa_mundo_admin_session';

export default function App() {
  const [view, setView] = useState<View>('public');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '1') {
      setView('admin');
    }
  }, []);

  function handleLogin() {
    localStorage.setItem(STORAGE_KEY, '1');
    setView('admin');
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setView('public');
  }

  return (
    <>
      {view === 'public' && (
        <PublicView onAdminClick={() => setView('login')} />
      )}
      {view === 'login' && (
        <LoginView
          onLogin={handleLogin}
          onBack={() => setView('public')}
        />
      )}
      {view === 'admin' && (
        <AdminView
          onBack={() => setView('public')}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
