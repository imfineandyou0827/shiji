const API = 'https://api.github.com/gists';
export const GIST_FILENAME = 'shiji-sync.json';

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

async function handle(res: Response): Promise<unknown> {
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) detail = `${res.status} ${body.message}`;
    } catch {
      // ignore
    }
    if (res.status === 401) throw new Error('Token 无效或无权限（需要 gist 权限）');
    if (res.status === 404) throw new Error('Gist 不存在（检查 Gist ID 或权限）');
    throw new Error(`GitHub API 错误：${detail}`);
  }
  return res.json();
}

interface GistFile {
  content?: string;
  truncated?: boolean;
  raw_url?: string;
}

interface GistResponse {
  id: string;
  files: Record<string, GistFile>;
}

async function readFileContent(file: GistFile): Promise<string | null> {
  if (file.truncated && file.raw_url) {
    const res = await fetch(file.raw_url);
    if (!res.ok) return null;
    return res.text();
  }
  return file.content ?? null;
}

export async function fetchGist(token: string, gistId: string): Promise<string | null> {
  const res = await fetch(`${API}/${gistId}`, { headers: headers(token) });
  const data = (await handle(res)) as GistResponse;
  const file = data.files?.[GIST_FILENAME];
  if (!file) return null;
  return readFileContent(file);
}

export async function createGist(token: string, content: string): Promise<string> {
  const res = await fetch(API, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      description: '拾集 · 加密同步数据',
      public: false,
      files: { [GIST_FILENAME]: { content } },
    }),
  });
  const data = (await handle(res)) as GistResponse;
  return data.id;
}

export async function updateGist(token: string, gistId: string, content: string): Promise<void> {
  const res = await fetch(`${API}/${gistId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content } } }),
  });
  await handle(res);
}

export async function verifyToken(token: string): Promise<string> {
  const res = await fetch('https://api.github.com/user', { headers: headers(token) });
  const data = (await handle(res)) as { login?: string };
  return data.login ?? '未知用户';
}
