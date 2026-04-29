import React, { useState } from 'react';
import { Github, KeyIcon, Moon, Sun, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Login({ onLogin, theme, toggleTheme }: LoginProps) {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onLogin(token.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[hsl(var(--background))]">
      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md p-8 space-y-8 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-sm">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Github size={48} className="text-[hsl(var(--foreground))]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">GitWeb Client</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            by Jonathan Gimenez
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="token" className="block text-sm font-medium text-[hsl(var(--foreground))]">
              Personal Access Token
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon size={18} className="text-[hsl(var(--muted-foreground))]" />
              </div>
              <input
                type="password"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-[hsl(var(--input))] rounded-md leading-5 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--ring))] sm:text-sm"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--ring))]"
          >
            Connect to GitHub
            <ArrowRight size={16} className="ml-2" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-[hsl(var(--border))]">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Need a token? <br/>
            <a 
              href="https://github.com/settings/tokens/new?scopes=repo,delete_repo,workflow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create one quickly on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
