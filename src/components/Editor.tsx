import React, { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Save, Trash2, X } from 'lucide-react';
import { getRepoContent, decodeContent, saveFileContent, deleteFile } from '../lib/github';

interface EditorProps {
  repo: any;
  branch: string;
  file: any;
  onClose: () => void;
  onSaved: (newSha: string) => void;
  onDeleted: () => void;
}

export default function Editor({ repo, branch, file, onClose, onSaved, onDeleted }: EditorProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [commitMessage, setCommitMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchFileContent = async () => {
      setLoading(true);
      try {
        const data = await getRepoContent(repo.owner.login, repo.name, file.path, branch);
        if (Array.isArray(data)) throw new Error("Expected a file");
        
        let textContent = '';
        if (data.content !== undefined) {
          textContent = decodeContent(data.content);
        } else if (data.download_url) {
          // Fallback to fetching raw file
          const res = await fetch(data.download_url);
          textContent = await res.text();
        }
        setContent(textContent);
        setOriginalContent(textContent);
        setCommitMessage(`Update ${file.name}`);
      } catch (err) {
        console.error("Failed to load file content", err);
        setContent(`// Error loading file content`);
      }
      setLoading(false);
    };

    fetchFileContent();
  }, [repo.owner.login, repo.name, file.path, branch]);

  const hasChanges = content !== originalContent;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = await saveFileContent(
        repo.owner.login,
        repo.name,
        file.path,
        content,
        commitMessage,
        branch,
        file.sha
      );
      
      setOriginalContent(content);
      onSaved(data.content?.sha || file.sha);
      setShowSaveModal(false);
    } catch (err) {
      alert("Error saving file: " + (err as any).message);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${file.path}?`)) {
      setIsDeleting(true);
      try {
        const msg = prompt("Commit message for deletion:", `Delete ${file.name}`);
        if (msg === null) {
          setIsDeleting(false);
          return; // cancelled
        }
        await deleteFile(
          repo.owner.login,
          repo.name,
          file.path,
          msg || `Delete ${file.name}`,
          file.sha,
          branch
        );
        onDeleted();
      } catch (err) {
        alert("Error deleting file: " + (err as any).message);
        setIsDeleting(false);
      }
    }
  };

  // Basic language detection
  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      'js': 'javascript', 'jsx': 'javascript',
      'ts': 'typescript', 'tsx': 'typescript',
      'json': 'json', 'html': 'html', 'css': 'css',
      'md': 'markdown', 'py': 'python',
      'java': 'java', 'go': 'go', 'rs': 'rust',
      'c': 'c', 'cpp': 'cpp', 'sh': 'shell'
    };
    return map[ext || ''] || 'plaintext';
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="flex flex-col h-full relative bg-[hsl(var(--background))]">
      <div className="flex items-center justify-between p-2 lg:p-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm z-10">
        <div className="flex items-center space-x-2 overflow-hidden mr-4">
          <span className="font-mono text-sm truncate text-[hsl(var(--foreground))] bg-[hsl(var(--accent))] px-2 py-0.5 rounded">
            {file.path}
          </span>
          {hasChanges && <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] shrink-0" title="Unsaved changes"></span>}
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={handleDelete}
            disabled={loading || isDeleting}
            className="flex items-center px-2 py-1.5 text-xs font-medium rounded text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} className="md:mr-1" />
            <span className="hidden md:inline">{isDeleting ? '...' : 'Delete'}</span>
          </button>
          
          <button 
            onClick={() => setShowSaveModal(true)}
            disabled={!hasChanges || loading}
            className="flex items-center px-3 py-1.5 text-xs font-medium rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            <Save size={14} className="md:mr-1" />
            <span className="hidden md:inline">Commit</span>
          </button>
          
          <div className="w-px h-4 bg-[hsl(var(--border))] mx-1"></div>
          
          <button onClick={onClose} className="p-1 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative z-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-[hsl(var(--muted-foreground))] bg-[hsl(var(--background))]">
            Loading editor...
          </div>
        ) : (
          <MonacoEditor
            height="100%"
            language={getLanguage(file.name)}
            theme={isDarkMode ? 'vs-dark' : 'light'}
            value={content}
            onChange={(val) => setContent(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: '"JetBrains Mono", monospace',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16 }
            }}
          />
        )}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl w-full max-w-md animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-[hsl(var(--border))]">
              <h3 className="font-semibold text-[hsl(var(--foreground))]">Commit Changes</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--background))] p-2 rounded border border-[hsl(var(--border))] break-all">
                {file.path}
              </p>
              <div>
                <label className="block text-sm font-medium mb-1 text-[hsl(var(--foreground))]">Commit Message</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  className="w-full p-2 bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] text-[hsl(var(--foreground))]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowSaveModal(false)} className="px-3 py-1.5 rounded text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-3 py-1.5 rounded text-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center">
                  {isSaving ? 'Committing...' : 'Commit to ' + branch}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
