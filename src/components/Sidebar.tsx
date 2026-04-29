import React, { useState } from 'react';
import { Plus, Search, FolderGit2, LogOut, Moon, Sun, X } from 'lucide-react';

interface SidebarProps {
  repos: any[];
  user: any;
  loading: boolean;
  selectedRepo: any | null;
  onSelectRepo: (repo: any) => void;
  onCreateRepo: (name: string, description: string, isPrivate: boolean) => Promise<void>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  repos, user, loading, selectedRepo, onSelectRepo, onCreateRepo, theme, toggleTheme, onLogout 
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    setIsCreating(true);
    await onCreateRepo(newRepoName.trim(), newRepoDesc.trim(), newRepoPrivate);
    setIsCreating(false);
    setShowCreateModal(false);
    setNewRepoName('');
    setNewRepoDesc('');
    setNewRepoPrivate(false);
  };

  return (
    <div className="w-72 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-[hsl(var(--border))]" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate text-[hsl(var(--foreground))]">{user.login}</h2>
          </div>
        </div>
        <div className="flex space-x-1">
          <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onLogout} className="p-1.5 rounded-md hover:bg-[hsl(var(--destructive))] hover:bg-opacity-20 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-[hsl(var(--border))] space-y-3">
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-2" />
          New Repository
        </button>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[hsl(var(--muted-foreground))]" />
          <input 
            type="text" 
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading...</div>
        ) : filteredRepos.length === 0 ? (
          <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">No repositories found.</div>
        ) : (
          <div className="pt-2">
            <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-bold px-2 mb-2">Repositories</div>
            <ul className="space-y-1">
              {filteredRepos.map(repo => (
                <li key={repo.id}>
                  <button
                    onClick={() => onSelectRepo(repo)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center space-x-2 transition-colors ${
                      selectedRepo?.id === repo.id 
                        ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]' 
                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--background))] hover:text-[hsl(var(--foreground))]'
                    }`}
                  >
                    <FolderGit2 size={16} className={selectedRepo?.id === repo.id ? "text-[hsl(var(--foreground))]" : ""} />
                    <span className="truncate flex-1 font-medium">{repo.name}</span>
                    {repo.private && <span className="text-[10px] bg-[hsl(var(--ring))] px-1.5 py-0.5 rounded leading-none">Private</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-[hsl(var(--border))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Create Repository</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newRepoName}
                  onChange={e => setNewRepoName(e.target.value)}
                  className="w-full p-2 bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-md text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                  placeholder="awesome-project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Description (optional)</label>
                <input 
                  type="text" 
                  value={newRepoDesc}
                  onChange={e => setNewRepoDesc(e.target.value)}
                  className="w-full p-2 bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-md text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                  placeholder="My awesome new project"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="private-repo"
                  checked={newRepoPrivate}
                  onChange={e => setNewRepoPrivate(e.target.checked)}
                  className="rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
                />
                <label htmlFor="private-repo" className="text-sm text-[hsl(var(--foreground))]">Make repository private</label>
              </div>
              <div className="pt-4 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md text-[hsl(var(--foreground))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium rounded-md text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-opacity-90 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Repo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
