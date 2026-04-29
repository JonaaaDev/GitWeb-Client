import React, { useState, useEffect } from 'react';
import { listRepos, createRepo, deleteRepo, updateRepo } from '../lib/github';
import Sidebar from './Sidebar';
import RepoView from './RepoView';

interface DashboardProps {
  user: any;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onLogout: () => void;
}

export default function Dashboard({ user, theme, toggleTheme, onLogout }: DashboardProps) {
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const data = await listRepos();
      setRepos(data);
    } catch (error) {
      console.error("Failed to load repos", error);
    }
    setIsLoadingRepos(false);
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  useEffect(() => {
    // Hide sidebar on mobile when a repo is selected
    if (selectedRepo && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [selectedRepo]);

  const handleCreateRepo = async (name: string, description: string, isPrivate: boolean) => {
    try {
      const newRepo = await createRepo(name, description, isPrivate);
      await fetchRepos();
      setSelectedRepo(newRepo); // select the new repo
    } catch (error) {
      alert("Failed to create repository: " + (error as any).message);
    }
  };

  const handleDeleteRepo = async (owner: string, repoName: string) => {
    try {
      await deleteRepo(owner, repoName);
      setSelectedRepo(null);
      setIsSidebarOpen(true);
      await fetchRepos();
    } catch (error) {
      alert("Failed to delete repository (Make sure your PAT has the 'delete_repo' scope): " + (error as any).message);
    }
  };
  
  const handleUpdateRepoInfo = async (owner: string, repo: string, newName?: string, newDesc?: string) => {
    try {
      const updated = await updateRepo(owner, repo, newName, newDesc);
      await fetchRepos();
      if (selectedRepo && selectedRepo.name === repo) {
        setSelectedRepo(updated); // Update selected ref
      }
    } catch (error) {
       alert("Failed to update repository: " + (error as any).message);
    }
  };

  return (
    <div className="flex w-full h-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] fixed inset-0">
      {/* Sidebar - hidden on mobile if not open */}
      <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex absolute md:relative z-20 w-full md:w-72 h-full bg-[hsl(var(--card))]`}>
        <Sidebar 
          repos={repos} 
          user={user} 
          loading={isLoadingRepos}
          selectedRepo={selectedRepo}
          onSelectRepo={setSelectedRepo}
          onCreateRepo={handleCreateRepo}
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content Area */}
      <div className={`${!isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-1 overflow-hidden relative w-full bg-[hsl(var(--background))]`}>
        {selectedRepo ? (
          <RepoView 
            repo={selectedRepo} 
            onDelete={handleDeleteRepo} 
            onUpdateRepo={handleUpdateRepoInfo}
            user={user}
            onSelectRepo={setSelectedRepo} // for re-selecting if name changes
            onBack={() => setIsSidebarOpen(true)}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
            <div className="text-center">
              <div className="w-16 h-16 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">Welcome to GitWeb Client</h2>
              <p>Select a repository from the sidebar or create a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
