import { useState, useEffect } from "react";
import exams from "./data/exams";
import comparisonTables from "./data/comparison";
import Sidebar from "./components/Sidebar";
import ExamViewer from "./components/ExamViewer";
import MyManual from "./components/MyManual";
import ComparisonViewer from "./components/ComparisonViewer";
import SyncPanel from "./components/SyncPanel";

function loadBookmarks() {
  try {
    const data = localStorage.getItem("wb_bookmarks");
    if (!data) return {};
    const parsed = JSON.parse(data);
    // 将数组还原为 Set（Set 无法被 JSON 直接序列化）
    const result = {};
    for (const [k, v] of Object.entries(parsed)) {
      result[k] = new Set(Array.isArray(v) ? v : []);
    }
    return result;
  } catch { return {}; }
}

function saveBookmarks(bookmarks) {
  try {
    const serialized = {};
    for (const [k, v] of Object.entries(bookmarks)) {
      serialized[k] = [...v];
    }
    localStorage.setItem("wb_bookmarks", JSON.stringify(serialized));
  } catch {}
}

function loadHighlights() {
  try {
    const data = localStorage.getItem("wb_highlights");
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveHighlights(highlights) {
  try { localStorage.setItem("wb_highlights", JSON.stringify(highlights)); } catch {}
}

export default function App() {
  const [activeNav, setActiveNav] = useState("CT");
  const [modalityFilter, setModalityFilter] = useState("CT");
  const [manualModality, setManualModality] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());
  const [highlights, setHighlights] = useState(() => loadHighlights());
  const [showSync, setShowSync] = useState(false);

  useEffect(() => { saveBookmarks(bookmarks); }, [bookmarks]);
  useEffect(() => { saveHighlights(highlights); }, [highlights]);

  const filteredExams = exams.filter((e) => e.modality === modalityFilter);
  const currentExam = selectedExam || filteredExams[0] || null;

  const toggleBookmark = (examId, itemId) => {
    setBookmarks((prev) => {
      const s = new Set(prev[examId] || []);
      s.has(itemId) ? s.delete(itemId) : s.add(itemId);
      return { ...prev, [examId]: s };
    });
  };

  const addHighlight = (itemId, color, text) => {
    setHighlights((prev) => ({
      ...prev, [itemId]: [...(prev[itemId] || []), { color, text, id: Date.now(), note: "" }],
    }));
  };

  const removeHighlight = (itemId, hlId) => {
    setHighlights((prev) => {
      const arr = (prev[itemId] || []).filter((h) => h.id !== hlId);
      if (arr.length === 0) { const { [itemId]: _, ...rest } = prev; return rest; }
      return { ...prev, [itemId]: arr };
    });
  };

  const setHighlightNote = (itemId, hlId, note) => {
    setHighlights((prev) => {
      const arr = (prev[itemId] || []).map((h) =>
        h.id === hlId ? { ...h, note: note || "" } : h
      );
      return { ...prev, [itemId]: arr };
    });
  };

  const handleMergeSync = (mergedBookmarks, mergedHighlights) => {
    setBookmarks(mergedBookmarks);
    setHighlights(mergedHighlights);
  };

  const handleNavChange = (nav) => {
    setActiveNav(nav);
    if (["CT", "DR", "MRI"].includes(nav)) {
      setModalityFilter(nav);
      const first = exams.find((e) => e.modality === nav);
      setSelectedExam(first || null);
    }
    if (nav?.startsWith("manual-")) {
      const mod = nav.replace("manual-", "");
      setManualModality(mod);
      setModalityFilter(mod);
    }
  };

  const renderMain = () => {
    if (["CT", "DR", "MRI"].includes(activeNav)) {
      if (!currentExam) return <div className="empty-state"><p>该检查类型暂无数据</p></div>;
      return (
        <ExamViewer exam={currentExam}
          bookmarks={bookmarks[currentExam.id] || new Set()}
          onToggleBookmark={(itemId) => toggleBookmark(currentExam.id, itemId)}
        />
      );
    }
    if (activeNav === "compare") return <ComparisonViewer tables={comparisonTables} />;
    if (activeNav?.startsWith("manual-")) {
      return (
        <MyManual exams={exams} bookmarks={bookmarks}
          modalityFilter={activeNav.replace("manual-", "") || manualModality}
          onToggleBookmark={toggleBookmark}
          highlights={highlights} onAddHighlight={addHighlight} onRemoveHighlight={removeHighlight}
          onSetHighlightNote={setHighlightNote}
          onNavigateToExam={(exam) => {
            setSelectedExam(exam); setModalityFilter(exam.modality); setActiveNav(exam.modality);
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="app">
      <Sidebar activeNav={activeNav} onNavChange={handleNavChange}
        exams={exams} modalityFilter={modalityFilter}
        selectedExamId={currentExam?.id}
        onExamSelect={(exam) => { setSelectedExam(exam); setModalityFilter(exam.modality); setActiveNav(exam.modality); }}
        bookmarkCount={Object.values(bookmarks).reduce((s, v) => s + v.size, 0)}
        bookmarks={bookmarks}
      />
      <main className="main-content">{renderMain()}</main>

      {/* 同步按钮 */}
      <button className="sync-fab" onClick={() => setShowSync(true)} title="GitHub 云同步">
        ☁️
      </button>

      {showSync && (
        <SyncPanel
          bookmarks={bookmarks}
          highlights={highlights}
          onMergeData={handleMergeSync}
          onClose={() => setShowSync(false)}
        />
      )}
    </div>
  );
}
