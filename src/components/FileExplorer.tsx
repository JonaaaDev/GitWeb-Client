import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, File, ChevronLeft, FilePlus, FolderPlus, UploadCloud, Download
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { getRepoContent, saveFileContent } from '../lib/github';

interface FileExplorerProps {
  repo: any;
  branch: string;
  currentPath: string;
  onPathChange: (path: string) => void;
  onFileSelect: (file: any) => void;
  selectedFile: any | null;
}

export default function FileExplorer({ 
  repo, branch, currentPath, onPathChange, onFileSelect, selectedFile 
}: FileExplorerProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRepoContent(repo.owner.login, repo.name, currentPath, branch);
      let contentArray = Array.isArray(data) ? data : [data];
      // Sort: folders first
      contentArray.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });
      setItems(contentArray);
    } catch (e) {
      console.error(e);
      // If error, might be empty repo or 404
      setItems([]);
    }
    setLoading(false);
  }, [repo.owner.login, repo.name, currentPath, branch]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    onPathChange(parts.join('/'));
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    // `.env` protection
    if (newFileName.includes('.env')) {
      if (!window.confirm("Warning: You are trying to upload a .env file. This is generally unsafe for public repos. Continue?")) {
        return;
      }
    }

    const fullPath = currentPath ? `${currentPath}/${newFileName}` : newFileName;
    setIsCreating(true);
    try {
      // Create empty file 
      await saveFileContent(repo.owner.login, repo.name, fullPath, "", `Create ${newFileName}`, branch);
      await fetchContent();
      setShowNewFile(false);
      setNewFileName('');
    } catch (err) {
      alert("Error creating file: " + (err as any).message);
    }
    setIsCreating(false);
  };

  // Drag and drop handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    let ignoredCount = 0;
    
    for (const file of acceptedFiles) {
      if (file.name.includes('.env') || file.name.endsWith('.exe')) {
        const confirm = window.confirm(`File ${file.name} might be unsafe or ignored (.env / .exe). Upload anyway?`);
        if (!confirm) {
          ignoredCount++;
          continue;
        }
      }

      console.log("Uploading file", file.name);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string; // Data URL
        try {
          const contentStr = result.split(',')[1];
          // react-dropzone adds a non-standard 'path' property to File which preserves directory structure
          // native webkitdirectory input adds webkitRelativePath
          const relativeDropPath = (file as any).path || (file as any).webkitRelativePath || file.name;
          // Clean leading slash or './' if any
          let cleanDropPath = relativeDropPath;
          if (cleanDropPath.startsWith('./')) {
            cleanDropPath = cleanDropPath.substring(2);
          }
          if (cleanDropPath.startsWith('/')) {
            cleanDropPath = cleanDropPath.substring(1);
          }
          
          const fullPath = currentPath ? `${currentPath}/${cleanDropPath}` : cleanDropPath;
          
          await saveFileContent(
            repo.owner.login, 
            repo.name, 
            fullPath, 
            atob(contentStr), // Decode base64 to string before our helper re-encodes it. Actually, our helper takes plain text. But for binary, it's tricky.
            // Wait, saveFileContent takes plain text and encodes it. 
            // If we have b64 from FileReader, we can just decode it to string (if it's text).
            // Let's assume text files for now to match plain text editor context.
            decodeURIComponent(escape(atob(contentStr))),
            `Upload ${file.name}`, 
            branch
          );
          fetchContent();
        } catch (error) {
          console.error("Upload error", error);
        }
      };
      reader.readAsDataURL(file);
    }
    
    if (ignoredCount > 0) {
      alert(`${ignoredCount} files were ignored (like .env or .exe files based on strict rules).`);
    }

  }, [currentPath, repo, branch, fetchContent]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  const handleNativeDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onDrop(Array.from(e.target.files));
      // Reset the inputs so the same file/folder can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--card))]" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Hidden inputs for explicit file/folder selection via buttons */}
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleNativeDrop} 
        className="hidden" 
      />
      <input 
        type="file" 
        multiple 
        ref={folderInputRef} 
        onChange={handleNativeDrop} 
        {...{ webkitdirectory: "true", directory: "true" } as any}
        className="hidden" 
      />

      {isDragActive && (
        <div className="absolute inset-0 bg-[hsl(var(--primary))]/20 z-10 flex items-center justify-center border-2 border-dashed border-[hsl(var(--primary))] m-2 rounded-lg">
          <div className="bg-[hsl(var(--card))] p-4 rounded shadow-lg text-center font-semibold text-[hsl(var(--foreground))]">
            <UploadCloud className="mx-auto mb-2 text-[hsl(var(--primary))]" size={32} />
            Drop files to upload to <br/><span className="text-sm font-mono text-[hsl(var(--muted-foreground))]">/{currentPath}</span>
          </div>
        </div>
      )}

      <div className="p-3 border-b border-[hsl(var(--border))] flex items-center justify-between sticky top-0 bg-[hsl(var(--card))] z-0 shadow-sm">
        <div className="flex items-center space-x-2 truncate font-mono text-sm max-w-[70%] text-[hsl(var(--foreground))]">
          {currentPath ? (
            <button onClick={navigateUp} className="p-1 hover:bg-[hsl(var(--accent))] rounded" title="Go up">
              <ChevronLeft size={16} />
            </button>
          ) : (
            <Folder size={16} className="text-[hsl(var(--muted-foreground))] flex-shrink-0" />
          )}
          <span className="truncate">/{currentPath}</span>
        </div>
        <div className="flex space-x-1">
          <button 
            onClick={() => folderInputRef.current?.click()}
            className="p-1.5 hover:bg-[hsl(var(--accent))] rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            title="Import Folder"
          >
            <FolderPlus size={16} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:bg-[hsl(var(--accent))] rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            title="Import Files"
          >
            <UploadCloud size={16} />
          </button>
          <button 
            onClick={() => setShowNewFile(!showNewFile)}
            className="p-1.5 hover:bg-[hsl(var(--accent))] rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {showNewFile && (
          <form onSubmit={handleCreateFile} className="mb-2 p-2 bg-[hsl(var(--muted))] rounded border border-[hsl(var(--border))] animate-in fade-in">
            <input
              autoFocus
              className="w-full text-sm bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded px-2 py-1 mb-2 focus:outline-none focus:border-[hsl(var(--primary))] text-[hsl(var(--foreground))]"
              placeholder="filename.ext"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              required
            />
            <div className="flex justify-end space-x-1">
              <button type="button" onClick={() => setShowNewFile(false)} className="text-xs px-2 py-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">Cancel</button>
              <button type="submit" disabled={isCreating} className="text-xs px-2 py-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:bg-opacity-90 transition-colors disabled:opacity-50">
                {isCreating ? '...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center p-4 text-sm text-[hsl(var(--muted-foreground))]">Loading folder...</div>
        ) : items.length === 0 ? (
          <div className="text-center p-8 text-[hsl(var(--muted-foreground))]">
            <p className="text-sm">Folder is empty</p>
            <p className="text-xs mt-2 opacity-60">Drag & drop files here to upload</p>
          </div>
        ) : (
          <div className="pt-2">
            <div className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] px-2 mb-2 tracking-widest">Files</div>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.sha}>
                  {item.type === 'dir' ? (
                    <button
                      onClick={() => onPathChange(item.path)}
                      className="w-full text-left flex items-center px-2 py-1.5 hover:bg-[hsl(var(--accent))] rounded text-sm text-[hsl(var(--foreground))] transition-colors"
                    >
                      <Folder size={14} className="text-blue-400 mr-2 flex-shrink-0" fill="currentColor" fillOpacity={0.2} />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onFileSelect({ ...item, actualPath: item.path })}
                      className={`w-full text-left flex items-center px-2 py-1.5 rounded text-sm transition-colors group ${
                        selectedFile?.path === item.path 
                          ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]' 
                          : 'hover:bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                      }`}
                    >
                      <File size={14} className="mr-2 flex-shrink-0 opacity-70" />
                      <span className="truncate flex-1">{item.name}</span>
                      <a 
                        href={item.download_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[hsl(var(--secondary))] rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all"
                        title="Download File"
                        onClick={e => e.stopPropagation()}
                      >
                        <Download size={12} />
                      </a>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="p-3 text-[10px] text-center text-[hsl(var(--muted-foreground))] border-t border-[hsl(var(--border))]">
        Support Drag & Drop
      </div>
    </div>
  );
}
