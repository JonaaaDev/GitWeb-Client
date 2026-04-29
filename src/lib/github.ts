import { Octokit } from '@octokit/rest';

let octokit: Octokit | null = null;
let currentUser: any = null;

export const initGitHub = async (token: string) => {
  octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.users.getAuthenticated();
  currentUser = data;
  return data;
};

export const getOctokit = () => {
  if (!octokit) throw new Error("GitHub user not authenticated");
  return octokit;
};

export const getCurrentUser = () => currentUser;

// Repositories
export const listRepos = async () => {
  const o = getOctokit();
  // list repos for authenticated user, sorted by updated
  const { data } = await o.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100
  });
  return data;
};

export const createRepo = async (name: string, description: string, isPrivate: boolean) => {
  const o = getOctokit();
  const { data } = await o.rest.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate,
    auto_init: true // create with initial commit so we can branch/add files immediately
  });
  return data;
};

export const deleteRepo = async (owner: string, repo: string) => {
  const o = getOctokit();
  await o.rest.repos.delete({ owner, repo });
};

export const updateRepo = async (owner: string, repo: string, newName?: string, newDesc?: string) => {
  const o = getOctokit();
  const args: any = { owner, repo };
  if (newName) args.name = newName;
  // GitHub API allows empty description
  if (newDesc !== undefined) args.description = newDesc; 
  
  const { data } = await o.rest.repos.update(args);
  return data;
};

export const forkRepo = async (owner: string, repo: string, newName?: string) => {
  const o = getOctokit();
  const { data } = await o.rest.repos.createFork({ owner, repo, name: newName });
  return data;
};

// Branches
export const listBranches = async (owner: string, repo: string) => {
  const o = getOctokit();
  const { data } = await o.rest.repos.listBranches({ owner, repo });
  return data;
};

export const createBranch = async (owner: string, repo: string, newBranchName: string, fromBranchSha: string) => {
  const o = getOctokit();
  const { data } = await o.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranchName}`,
    sha: fromBranchSha
  });
  return data;
};

export const getBranch = async (owner: string, repo: string, branch: string) => {
  const o = getOctokit();
  const { data } = await o.rest.repos.getBranch({ owner, repo, branch });
  return data;
}

// Files & Contents
export const getRepoContent = async (owner: string, repo: string, path: string, ref?: string) => {
  const o = getOctokit();
  const { data } = await o.rest.repos.getContent({ owner, repo, path, ref });
  return data;
};

export const decodeContent = (base64Content: string) => {
  // Fix decoding for UTF-8 characters that atob handles poorly
  const binString = atob(base64Content);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

export const encodeContent = (content: string) => {
  const bytes = new TextEncoder().encode(content);
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
};

export const saveFileContent = async (
  owner: string, 
  repo: string, 
  path: string, 
  content: string, 
  message: string, 
  branch: string,
  sha?: string
) => {
  const o = getOctokit();
  const encoded = encodeContent(content);
  const params: any = {
    owner,
    repo,
    path,
    message,
    content: encoded,
    branch
  };
  if (sha) params.sha = sha;
  
  const { data } = await o.rest.repos.createOrUpdateFileContents(params);
  return data;
};

export const deleteFile = async (owner: string, repo: string, path: string, message: string, sha: string, branch: string) => {
  const o = getOctokit();
  await o.rest.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
    branch
  });
};

// Commits
export const listCommits = async (owner: string, repo: string, sha?: string) => {
  const o = getOctokit();
  const { data } = await o.rest.repos.listCommits({ owner, repo, sha, per_page: 50 });
  return data;
};

export const downloadArchiveUrl = (owner: string, repo: string, ref: string) => {
  // Returns URL for downloading repo as ZIP
  return `https://github.com/${owner}/${repo}/archive/refs/heads/${ref}.zip`;
}
