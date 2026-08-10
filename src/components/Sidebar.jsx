import { useState } from "react";

const CATEGORY_ORDER = ["头部", "颈部", "胸部", "腹部", "脊柱", "四肢"];
const ENCYCLOPEDIA_MODALITIES = [
  { key: "CT", label: "CT 检查技术", icon: "🟦" },
  { key: "DR", label: "DR 检查技术", icon: "🟩" },
  { key: "MRI", label: "MRI 检查技术", icon: "🟪" },
];

export default function Sidebar({
  activeNav,
  onNavChange,
  exams,
  modalityFilter,
  selectedExamId,
  onExamSelect,
  bookmarkCount,
  bookmarks,
}) {
  const [encyclopediaOpen, setEncyclopediaOpen] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState(() => new Set());
  const isEncyclopedia = ["CT", "DR", "MRI"].includes(activeNav);
  const isManual = activeNav?.startsWith("manual-");

  const toggleCategory = (cat) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // 计算各 modality 的收藏数
  const modBookmarkCount = (mod) => {
    let count = 0;
    exams.forEach((exam) => {
      if (exam.modality !== mod) return;
      const bm = bookmarks[exam.id];
      if (bm) count += bm.size;
    });
    return count;
  };

  // 按部位分组，且只显示当前 modality 的
  const filteredExams = exams.filter((e) => e.modality === modalityFilter);
  const groupedExams = {};
  filteredExams.forEach((exam) => {
    if (!groupedExams[exam.category]) groupedExams[exam.category] = [];
    groupedExams[exam.category].push(exam);
  });
  const orderedCategories = CATEGORY_ORDER.filter((c) => groupedExams[c]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">影像技术工作台</h1>
      </div>

      <nav className="nav-primary">
        {/* 百科 - 二级菜单 */}
        <div className="nav-group">
          <button
            className={`nav-item nav-parent ${isEncyclopedia ? "active-parent" : ""}`}
            onClick={() => {
              setEncyclopediaOpen(!encyclopediaOpen);
              if (!isEncyclopedia) onNavChange("CT");
            }}
          >
            <span className="nav-icon">📖</span>
            <span className="nav-label">放射技术百科全书</span>
            <span className="nav-expand">{encyclopediaOpen ? "▾" : "▸"}</span>
          </button>
          {encyclopediaOpen && (
            <div className="nav-sub">
              {ENCYCLOPEDIA_MODALITIES.map((mod) => (
                <button key={mod.key}
                  className={`nav-item nav-sub-item ${activeNav === mod.key ? "active" : ""}`}
                  onClick={() => onNavChange(mod.key)}
                >
                  <span className="nav-sub-icon">{mod.icon}</span>
                  <span className="nav-label">{mod.label}</span>
                  <span className="nav-sub-count">{exams.filter((e) => e.modality === mod.key).length}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className={`nav-item ${activeNav === "compare" ? "active" : ""}`}
          onClick={() => onNavChange("compare")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">参数对比</span>
        </button>

        {/* 我的手册 - 二级菜单 */}
        <div className="nav-group">
          <button
            className={`nav-item nav-parent ${isManual ? "active-parent" : ""}`}
            onClick={() => {
              setManualOpen(!manualOpen);
              if (!isManual) onNavChange("manual-CT");
            }}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">我的手册</span>
            {!!bookmarkCount && <span className="nav-badge">{bookmarkCount}</span>}
            <span className="nav-expand">{manualOpen ? "▾" : "▸"}</span>
          </button>
          {manualOpen && (
            <div className="nav-sub">
              {ENCYCLOPEDIA_MODALITIES.map((mod) => (
                <button key={mod.key}
                  className={`nav-item nav-sub-item ${activeNav === `manual-${mod.key}` ? "active" : ""}`}
                  onClick={() => onNavChange(`manual-${mod.key}`)}
                >
                  <span className="nav-sub-icon">{mod.icon}</span>
                  <span className="nav-label">{mod.label}</span>
                  <span className="nav-sub-count">{modBookmarkCount(mod.key)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* 百科+手册 检查目录 */}
      {(encyclopediaOpen && (isEncyclopedia || isManual)) && (
        <div className="exam-list">
          <div className="exam-list-header">{modalityFilter} 检查目录</div>
          {orderedCategories.map((category) => (
            <div key={category} className="exam-category-group">
              <button className="exam-category-toggle" onClick={() => toggleCategory(category)}>
                <span className="toggle-arrow-sm">{openCategories.has(category) ? "▾" : "▸"}</span>
                <span className="exam-category-label">{category}</span>
                <span className="exam-category-count">{groupedExams[category].length}</span>
              </button>
              {openCategories.has(category) && (
                <div className="exam-category-items">
                  {groupedExams[category].map((exam) => (
                    <button key={exam.id}
                      className={`exam-list-item ${selectedExamId === exam.id ? "active" : ""}`}
                      onClick={() => onExamSelect(exam)}
                    >
                      <span className="exam-name">{exam.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        <span className="version">v1.3</span>
      </div>
    </aside>
  );
}
