/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { initGitHub, getCurrentUser } from './lib/github';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Make sure body has correct colors from our vars
  useEffect(() => {
    document.body.className = "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors duration-200";
  }, []);

  useEffect(() => {
    const authenticate = async () => {
      if (token) {
        try {
          const userData = await initGitHub(token);
          setUser(userData);
          localStorage.setItem('github_token', token);
        } catch (error) {
          console.error("Authentication failed", error);
          setToken(null);
          localStorage.removeItem('github_token');
        }
      }
      setLoading(false);
    };
    authenticate();
  }, [token]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('github_token');
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading GitWeb Client...</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden overscroll-none fixed inset-0">
      {!user ? (
        <Login onLogin={setToken} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <Dashboard 
          user={user} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}
