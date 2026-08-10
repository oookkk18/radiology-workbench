import { useState } from "react";
import {
  getToken, setToken, hasToken,
  pullFromGitHub, pushToGitHub, mergeData, serializeBookmarks,
} from "../sync";

const GITHUB_OWNER = "oookkk18";
const GITHUB_REPO = "radiology-workbench";

export default function SyncPanel({ bookmarks, highlights, onMergeData, onClose }) {
  const [token, setTokenState] = useState(getToken());
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const isConfigured = !!token;

  const handleSaveToken = () => {
    setToken(token.trim());
    setStatus({ type: "success", text: "Token 已保存到本地" });
  };

  const handlePush = async () => {
    setLoading(true);
    setStatus(null);
    try {
      // 序列化本地数据
      const localData = {
        bookmarks: serializeBookmarks(bookmarks),
        highlights,
        lastModified: new Date().toISOString(),
      };
      // 先拉取获取最新 sha
      let sha = null;
      try {
        const pullResult = await pullFromGitHub(GITHUB_OWNER, GITHUB_REPO);
        if (pullResult.sha) sha = pullResult.sha;
      } catch (e) { /* 远程文件不存在，使用 create */ }

      await pushToGitHub(GITHUB_OWNER, GITHUB_REPO, localData, sha);
      setStatus({ type: "success", text: "✅ 数据已推送到 GitHub" });
    } catch (e) {
      setStatus({ type: "error", text: `推送失败: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const pullResult = await pullFromGitHub(GITHUB_OWNER, GITHUB_REPO);
      if (!pullResult.data) {
        setStatus({ type: "info", text: "远程尚无数据" });
        return;
      }
      const localData = {
        bookmarks: serializeBookmarks(bookmarks),
        highlights,
      };
      const merged = mergeData(localData, pullResult.data);

      // 还原 bookmarks 中的 array 为 Set
      const restoredBookmarks = {};
      for (const [k, v] of Object.entries(merged.bookmarks)) {
        restoredBookmarks[k] = new Set(Array.isArray(v) ? v : []);
      }

      onMergeData(restoredBookmarks, merged.highlights);

      // 合并后自动推送回 GitHub
      const syncData = {
        bookmarks: merged.bookmarks,
        highlights: merged.highlights,
        lastModified: new Date().toISOString(),
      };
      await pushToGitHub(GITHUB_OWNER, GITHUB_REPO, syncData, pullResult.sha);

      setStatus({ type: "success", text: "✅ 同步完成，已与 GitHub 双向合并" });
    } catch (e) {
      setStatus({ type: "error", text: `拉取失败: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sync-overlay" onClick={onClose}>
      <div className="sync-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sync-header">
          <h3>☁️ GitHub 云同步</h3>
          <button className="sync-close" onClick={onClose}>✕</button>
        </div>

        <div className="sync-body">
          <p className="sync-desc">
            将收藏、高亮和注释同步到 GitHub 仓库，实现电脑与手机之间的数据互通。
          </p>

          {/* Token 配置 */}
          <div className="sync-section">
            <label className="sync-label">GitHub Personal Access Token</label>
            <div className="sync-input-row">
              <input
                type="password"
                className="sync-input"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setTokenState(e.target.value)}
              />
              <button className="sync-btn sync-btn-sm" onClick={handleSaveToken} disabled={!token.trim()}>
                保存
              </button>
            </div>
            <p className="sync-hint">
              需要 <code>repo</code> 权限。
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=Radiology%20Workbench%20Sync" target="_blank" rel="noopener">
                点击创建 Token →
              </a>
            </p>
          </div>

          {/* 同步操作 */}
          {isConfigured && (
            <div className="sync-section sync-actions">
              <button className="sync-btn sync-btn-primary" onClick={handlePush} disabled={loading}>
                {loading ? "同步中..." : "📤 上传本地数据"}
              </button>
              <button className="sync-btn sync-btn-secondary" onClick={handlePull} disabled={loading}>
                {loading ? "同步中..." : "📥 下载并合并"}
              </button>
            </div>
          )}

          {/* 状态提示 */}
          {status && (
            <div className={`sync-status sync-status-${status.type}`}>
              {status.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
