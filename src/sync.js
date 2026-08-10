/**
 * SyncManager - 通过 GitHub API 同步书签、高亮与注释
 * 
 * 工作方式：
 * 1. GitHub 仓库中存放 data.json（包含所有设备的数据）
 * 2. 拉取 (Pull): 从 GitHub 读取 data.json，与本地合并
 * 3. 推送 (Push): 将本地数据上传到 GitHub
 * 4. Token 由用户首次配置，存入 localStorage
 */

const GITHUB_API = "https://api.github.com";
const SYNC_FILE = "sync-data.json";
const STORAGE_KEY_TOKEN = "wb_github_token";
const STORAGE_KEY_LAST_SYNC = "wb_last_sync";

/**
 * 获取用户配置的 GitHub Token
 */
export function getToken() {
  return localStorage.getItem(STORAGE_KEY_TOKEN) || "";
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function hasToken() {
  return !!getToken();
}

function getLastSync() {
  return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || "";
}

function setLastSync(time) {
  localStorage.setItem(STORAGE_KEY_LAST_SYNC, time);
}

/**
 * 从 GitHub 仓库拉取 sync-data.json
 */
export async function pullFromGitHub(owner, repo) {
  const token = getToken();
  if (!token || !owner || !repo) throw new Error("缺少 GitHub Token 或仓库信息");

  console.log("[Sync] 正在从 GitHub 拉取数据...");
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${SYNC_FILE}`;
  const resp = await fetch(url, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
  });

  if (resp.status === 404) {
    console.log("[Sync] 远程尚无数据文件，将创建新文件");
    return { bookmarks: {}, highlights: {} };
  }
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API 错误: ${resp.status}`);
  }

  const file = await resp.json();
  const content = JSON.parse(atob(file.content));
  console.log("[Sync] 拉取成功，sha:", file.sha);
  return { data: content, sha: file.sha };
}

/**
 * 推送本地数据到 GitHub
 */
export async function pushToGitHub(owner, repo, data, sha) {
  const token = getToken();
  if (!token || !owner || !repo) throw new Error("缺少 GitHub Token 或仓库信息");

  console.log("[Sync] 正在推送数据到 GitHub...");
  const body = {
    message: `sync: ${new Date().toISOString()}`,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
    ...(sha ? { sha } : {}), // 有 sha 时更新，无 sha 时创建
  };

  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${SYNC_FILE}`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `推送失败: ${resp.status}`);
  }

  const result = await resp.json();
  setLastSync(new Date().toISOString());
  console.log("[Sync] 推送成功");
  return result;
}

/**
 * 合并本地和远程数据：以时间戳较新者优先，合并不同条目
 */
export function mergeData(localData, remoteData) {
  const merged = {
    bookmarks: { ...remoteData.bookmarks },
    highlights: { ...remoteData.highlights },
  };

  // 合并书签：本地有的检查项，如果远程没有则添加
  for (const [examId, items] of Object.entries(localData.bookmarks || {})) {
    if (!merged.bookmarks[examId]) {
      merged.bookmarks[examId] = items;
    } else {
      // 合并同一个 examId 下的 itemId 集合
      const remoteSet = new Set(merged.bookmarks[examId]);
      const localArr = Array.isArray(items) ? items : [...(items || [])];
      localArr.forEach((id) => remoteSet.add(id));
      merged.bookmarks[examId] = [...remoteSet];
    }
  }

  // 合并高亮：本地与远程取并集（同 itemId 合并 highlights 数组）
  for (const [itemId, hlArr] of Object.entries(localData.highlights || {})) {
    if (!merged.highlights[itemId]) {
      merged.highlights[itemId] = hlArr;
    } else {
      const existing = merged.highlights[itemId];
      const existingIds = new Set(existing.map((h) => h.id));
      hlArr.forEach((h) => {
        if (!existingIds.has(h.id)) {
          existing.push(h);
        }
      });
      merged.highlights[itemId] = existing;
    }
  }

  return merged;
}

/**
 * 将 app state 转为纯可序列化数据（Set → Array）
 */
export function serializeBookmarks(bookmarks) {
  const result = {};
  for (const [k, v] of Object.entries(bookmarks)) {
    result[k] = [...v];
  }
  return result;
}
