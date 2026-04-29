import React, { useState, useEffect } from 'react';
import { 
  Settings, Trash2, Edit3, Save, Download, 
  GitBranch, Plus, History, X, Copy, ChevronLeft
} from 'lucide-react';
import { 
  listBranches, createBranch, getRepoContent, 
  downloadArchiveUrl, listCommits, forkRepo
} from '../lib/github';
import FileExplorer from './FileExplorer';
import Editor from './Editor';

interface RepoViewProps {
  repo: any;
  user: any;
  onDelete: (owner: string, repo: string) => Promise<void>;
  onUpdateRepo: (owner: string, repo: string, name?: string, desc?: string) => Promise<void>;
  onSelectRepo: (repo: any) => void;
  onBack?: () => void;
}

export default function RepoView({ repo, user, onDelete, onUpdateRepo, onSelectRepo, onBack }: RepoViewProps) {
  const [branches, setBranches] = useState<any[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>(repo.default_branch || 'main');
  
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(repo.name);
  const [editDesc, setEditDesc] = useState(repo.description || '');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [commits, setCommits] = useState<any[]>([]);

  // Editor states
  const [currentPath, setCurrentPath] = useState<string>(''); // empty means root
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    // Reset state when repo changes
    setEditName(repo.name);
    setEditDesc(repo.description || '');
    setIsEditingInfo(false);
    setCurrentBranch(repo.default_branch || 'main');
    setCurrentPath('');
    setSelectedFile(null);
    fetchBranches();
  }, [repo.id]);

  useEffect(() => {
    // Also fetch branches when repo changes
    fetchBranches();
  }, [repo.name, user.login]);

  const fetchBranches = async () => {
    try {
      const data = await listBranches(repo.owner.login, repo.name);
      setBranches(data);
    } catch (e) {
      console.error("error fetching branches", e);
    }
  };

  const handleUpdateInfo = async () => {
    setIsEditingInfo(false);
    if (editName !== repo.name || editDesc !== repo.description) {
      await onUpdateRepo(repo.owner.login, repo.name, editName !== repo.name ? editName : undefined, editDesc);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText === `${repo.owner.login}/${repo.name}`) {
      setShowDeleteConfirm(false);
      await onDelete(repo.owner.login, repo.name);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find current branch sha to base new branch on
      const currentBranchData = branches.find(b => b.name === currentBranch);
      if (!currentBranchData) throw new Error("Current branch not found");
      
      await createBranch(repo.owner.login, repo.name, newBranchName, currentBranchData.commit.sha);
      await fetchBranches();
      setCurrentBranch(newBranchName);
      setShowBranchModal(false);
      setNewBranchName('');
    } catch (error) {
      alert("Error creating branch: " + (error as any).message);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await listCommits(repo.owner.login, repo.name, currentBranch);
      setCommits(data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error(error);
      alert("Failed to load history");
    }
  };

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneName.trim()) return;
    setIsCloning(true);
    try {
      // Create fork doesn't directly support newName for regular user forks easily if it already exists, 
      // but the API param allows it. We'll pass it in. If it's your own repo, forking to yourself with a new name 
      // works if the name is different, or you can fork into an organization.
      // Wait, GitHub API Create Fork: "organization" parameter and "name" parameter.
      const newRepo = await forkRepo(repo.owner.login, repo.name, cloneName.trim());
      alert(`Successfully cloned/forked to ${newRepo.full_name}`);
      setShowCloneModal(false);
      setCloneName('');
      onSelectRepo(newRepo);
    } catch (err) {
      alert("Error cloning repository: " + (err as any).message);
    }
    setIsCloning(false);
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col space-y-4 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            {isEditingInfo ? (
              <div className="flex flex-col space-y-2 mb-2 animate-in slide-in-from-top-1">
                <input 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="font-bold text-lg bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded px-2 py-1"
                />
                <input 
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="text-sm bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded px-2 py-1"
                  placeholder="No description"
                />
                <div className="flex space-x-2">
                  <button onClick={handleUpdateInfo} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1 rounded text-xs">Save</button>
                  <button onClick={() => setIsEditingInfo(false)} className="bg-[hsl(var(--secondary))] px-3 py-1 rounded text-xs text-[hsl(var(--secondary-foreground))]">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="group">
                <div className="flex items-center space-x-2">
                  {onBack && (
                    <button onClick={onBack} className="md:hidden p-1 mr-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] rounded" title="Back to repositories">
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <h1 className="text-xl font-bold truncate text-[hsl(var(--foreground))]">{repo.name}</h1>
                  <button onClick={() => setIsEditingInfo(true)} className="opacity-0 group-hover:opacity-100 p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-opacity">
                    <Edit3 size={14} />
                  </button>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 truncate">
                  {repo.description || <span className="italic">No description</span>}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCloneModal(true)}
              className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
            >
              <Copy size={14} className="mr-2" /> Clone/Duplicate
            </button>
            <a 
              href={downloadArchiveUrl(repo.owner.login, repo.name, currentBranch)}
              className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
            >
              <Download size={14} className="mr-2" /> Download
            </a>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 hover:bg-[hsl(var(--destructive))]/20 rounded-md transition-colors"
              title="Delete Repository"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-[hsl(var(--secondary))] rounded-md p-1">
            <GitBranch size={14} className="text-[hsl(var(--muted-foreground))] ml-1" />
            <select 
              value={currentBranch}
              onChange={e => {
                setCurrentBranch(e.target.value);
                setCurrentPath('');
                setSelectedFile(null);
              }}
              className="bg-transparent text-sm border-none focus:outline-none focus:ring-0 text-[hsl(var(--foreground))] py-1 pl-1 pr-6 cursor-pointer"
            >
              {branches.map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
            <button 
              onClick={() => setShowBranchModal(true)}
              className="p-1 ml-1 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              title="New branch"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <button 
            onClick={loadHistory}
            className="flex items-center px-2 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <History size={14} className="mr-1.5" /> History
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className={`w-64 border-r border-[hsl(var(--border))] flex-shrink-0 bg-[hsl(var(--card))] object-contain transition-all ${selectedFile ? 'hidden md:block' : 'w-full md:w-64'}`}>
          <FileExplorer 
            repo={repo}
            branch={currentBranch}
            currentPath={currentPath}
            onPathChange={setCurrentPath}
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
          />
        </div>
        
        {/* Editor */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selectedFile ? 'hidden md:flex' : ''}`}>
          {selectedFile ? (
            <Editor 
              repo={repo}
              branch={currentBranch}
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              onSaved={(newSha) => {
                setSelectedFile({ ...selectedFile, sha: newSha });
                // We should ideally refresh file explorer here, but relying on caching or re-fetch in explorer
              }}
              onDeleted={() => {
                setSelectedFile(null);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[hsl(var(--muted-foreground))] bg-[hsl(var(--background))]">
              <p>Select a file to view or edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--destructive))]/30 rounded-lg shadow-xl w-full max-w-md p-6 animate-in slide-in-from-bottom-2">
            <h3 className="text-xl font-bold text-[hsl(var(--destructive))] mb-4 flex items-center">
              <Trash2 className="mr-2" /> Delete Repository
            </h3>
            <p className="text-[hsl(var(--foreground))] mb-4">
              This action <strong>cannot be undone</strong>. This will permanently delete the 
              <span className="font-mono mx-1 bg-[hsl(var(--muted))] px-1 rounded">{repo.owner.login}/{repo.name}</span> 
              repository.
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
              Please type <strong>{repo.owner.login}/{repo.name}</strong> to confirm.
            </p>
            <input 
              type="text" 
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="w-full p-2 bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-md text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--destructive))]"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 font-medium rounded-md hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]">Cancel</button>
              <button 
                onClick={handleDelete}
                disabled={deleteConfirmText !== `${repo.owner.login}/${repo.name}`}
                className="px-4 py-2 font-medium rounded-md bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-[hsl(var(--destructive))]"
              >
                I understand, delete this repository
              </button>
            </div>
          </div>
        </div>
      )}

      {showBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg w-full max-w-sm p-4 animate-in zoom-in-95">
            <h3 className="text-lg font-semibold mb-4 text-[hsl(var(--foreground))]">Create Branch</h3>
            <form onSubmit={handleCreateBranch}>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                Based on <span className="font-mono font-medium">{currentBranch}</span>
              </p>
              <input 
                type="text" 
                autoFocus
                required
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                placeholder="new-feature"
                className="w-full p-2 bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-md text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] text-[hsl(var(--foreground))]"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowBranchModal(false)} className="px-3 py-1.5 text-sm rounded bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95">
            <div className="p-4 border-b border-[hsl(var(--border))] flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center text-[hsl(var(--foreground))]">
                <History className="mr-2" size={18} /> Commit History ({currentBranch})
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              <ul className="divide-y divide-[hsl(var(--border))]">
                {commits.map(commit => (
                  <li key={commit.sha} className="p-4 hover:bg-[hsl(var(--accent))] transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm text-[hsl(var(--foreground))] break-words">{commit.commit.message}</p>
                      <a href={commit.html_url} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-500 hover:underline ml-4 flex-shrink-0">
                        {commit.sha.substring(0, 7)}
                      </a>
                    </div>
                    <div className="flex items-center text-xs text-[hsl(var(--muted-foreground))]">
                      {commit.author?.avatar_url && (
                        <img src={commit.author.avatar_url} alt="" className="w-4 h-4 rounded-full mr-1.5" />
                      )}
                      <span className="font-medium mr-1">{commit.commit.author?.name}</span>
                      <span>committed on {new Date(commit.commit.author?.date).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg w-full max-w-md p-4 animate-in zoom-in-95">
            <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--foreground))] text-center">Clone / Duplicate Repository</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 text-center">
              Fork this repository across to your account (or an organization) with a new name.
            </p>
            <form onSubmit={handleClone}>
              <label className="block text-sm font-medium mb-1 text-[hsl(var(--foreground))]">New Repository Name</label>
              <input 
                type="text" 
                autoFocus
                required
                value={cloneName}
                onChange={e => setCloneName(e.target.value)}
                placeholder="new-repo-name"
                className="w-full p-2 bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-md text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] text-[hsl(var(--foreground))]"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowCloneModal(false)} className="px-3 py-1.5 text-sm rounded bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]">Cancel</button>
                <button type="submit" disabled={isCloning} className="flex items-center px-3 py-1.5 text-sm rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-50">
                  {isCloning ? 'Cloning...' : 'Clone Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
