import { useState, useRef } from "react";

const CATEGORY_ORDER = ["头部", "颈部", "胸部", "腹部", "脊柱", "四肢"];
const HIGHLIGHT_COLORS = [
  { name: "黄色", value: "#fef08a" },
  { name: "绿色", value: "#bbf7d0" },
  { name: "蓝色", value: "#bfdbfe" },
  { name: "粉色", value: "#fecdd3" },
  { name: "橙色", value: "#fed7aa" },
];

function ManualDataTable({ table }) {
  if (!table || !table.headers || !table.rows) return null;
  return (
    <div className="data-table-wrapper manual-table">
      <table className="data-table">
        <thead><tr>{table.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{table.rows.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function HighlightedText({ text, highlights, onSelect, onMarkClick }) {
  if (!highlights || highlights.length === 0) {
    return <span onMouseUp={onSelect}>{text}</span>;
  }
  let segments = [{ start: 0, end: text.length, color: null }];
  highlights.forEach((hl) => {
    const idx = text.indexOf(hl.text);
    if (idx >= 0) {
      const newSegs = [];
      segments.forEach((seg) => {
        if (seg.color) { newSegs.push(seg); return; }
        if (idx + hl.text.length <= seg.start || idx >= seg.end) {
          newSegs.push(seg);
        } else {
          if (seg.start < idx) newSegs.push({ start: seg.start, end: idx, color: null });
          newSegs.push({ start: idx, end: idx + hl.text.length, color: hl.color, hlId: hl.id });
          if (idx + hl.text.length < seg.end) newSegs.push({ start: idx + hl.text.length, end: seg.end, color: null });
        }
      });
      segments = newSegs;
    }
  });

  return (
    <span onMouseUp={onSelect}>
      {segments.map((seg, i) =>
        seg.color ? (
          <mark key={i} style={{ backgroundColor: seg.color, padding: "1px 0", borderRadius: 2, cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); onMarkClick?.(seg.hlId); }}
            title={highlights.find((h) => h.id === seg.hlId)?.note ? "点击查看注释" : "点击添加注释"}>
            {text.substring(seg.start, seg.end)}
          </mark>
        ) : (
          <span key={i}>{text.substring(seg.start, seg.end)}</span>
        )
      )}
    </span>
  );
}

function HighlightPopup({ onPick, onClose, position }) {
  return (
    <div className="highlight-popup" style={{ top: position.y, left: position.x }}>
      <div className="highlight-popup-inner">
        {HIGHLIGHT_COLORS.map((c) => (
          <button key={c.value} className="highlight-color-btn"
            style={{ backgroundColor: c.value }} title={c.name}
            onClick={() => { onPick(c.value); onClose(); }}
          />
        ))}
      </div>
      <button className="highlight-popup-close" onClick={onClose}>✕</button>
    </div>
  );
}

function AnnotationPopup({ hl, onSave, onClose }) {
  const [text, setText] = useState(hl.note || "");
  const inputRef = useRef(null);
  return (
    <div className="annotation-popup-overlay" onClick={onClose}>
      <div className="annotation-popup-box" onClick={(e) => e.stopPropagation()}>
        <div className="annotation-popup-header">
          <span className="annotation-popup-quote" style={{ backgroundColor: hl.color }}>
            "{hl.text.length > 20 ? hl.text.substring(0, 20) + "…" : hl.text}"
          </span>
          <button className="annotation-popup-close" onClick={onClose}>✕</button>
        </div>
        <textarea ref={inputRef} className="annotation-popup-input"
          placeholder="为此标记添加注释…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => onSave(text)}
          autoFocus rows={3}
        />
      </div>
    </div>
  );
}

function StepItem({ item, checked, onToggle, highlights, onAddHighlight, onRemoveHighlight, onSetHighlightNote }) {
  const [popup, setPopup] = useState(null);
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const textRef = useRef(null);

  const handleTextSelect = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
    const text = sel.toString().trim();
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setPopup({ x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 4, text });
  };

  const handleMarkClick = (hlId) => {
    setActiveAnnotation(activeAnnotation === hlId ? null : hlId);
  };

  const handleTagClick = (hlId) => {
    setActiveAnnotation(activeAnnotation === hlId ? null : hlId);
  };

  const itemHighlights = highlights[item.id] || [];

  return (
    <div className="step-item bookmarked">
      <label className="step-checkbox">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span className="checkmark"></span>
      </label>
      <div className="step-body">
        {item.text && (
          <p className="step-text" ref={textRef}>
            <HighlightedText text={item.text} highlights={itemHighlights}
              onSelect={handleTextSelect} onMarkClick={handleMarkClick} />
          </p>
        )}
        {item.table && <ManualDataTable table={item.table} />}

        {/* 高亮标签 */}
        {itemHighlights.length > 0 && (
          <div className="highlight-tags">
            {itemHighlights.map((hl) => (
              <span key={hl.id} className={`highlight-tag${activeAnnotation === hl.id ? " active" : ""}${hl.note ? " has-note" : ""}`}
                style={{ backgroundColor: hl.color }}
                onClick={(e) => { e.stopPropagation(); handleTagClick(hl.id); }}
                title={hl.note || "点击添加注释"}>
                {hl.text.length > 15 ? hl.text.substring(0, 15) + "…" : hl.text}
                {hl.note && <span className="highlight-note-dot">💬</span>}
                <button className="highlight-tag-remove" onClick={(e) => { e.stopPropagation(); onRemoveHighlight(item.id, hl.id); if (activeAnnotation === hl.id) setActiveAnnotation(null); }}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>
      {popup && (
        <HighlightPopup
          position={popup}
          onPick={(color) => onAddHighlight(item.id, color, popup.text)}
          onClose={() => setPopup(null)}
        />
      )}
      {activeAnnotation && (() => {
        const hl = itemHighlights.find((h) => h.id === activeAnnotation);
        if (!hl) return null;
        return (
          <AnnotationPopup
            hl={hl}
            onSave={(note) => { onSetHighlightNote(item.id, hl.id, note); setActiveAnnotation(null); }}
            onClose={() => setActiveAnnotation(null)}
          />
        );
      })()}
    </div>
  );
}

function CollapsibleSubsection({ subtitle, items, bookmarks, examId, onToggleBookmark, highlights, onAddHighlight, onRemoveHighlight, onSetHighlightNote }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`subsection collapsible ${open ? "open" : ""}`}>
      <button className="subsection-toggle" onClick={() => setOpen(!open)}>
        <span className="toggle-arrow">{open ? "▾" : "▸"}</span>
        <h4 className="subsection-title">{subtitle}</h4>
      </button>
      {open && (
        <div className="subsection-body">
          {items.map((item) => (
            <StepItem key={item.id} item={item}
              checked={bookmarks[examId]?.has(item.id)}
              onToggle={() => onToggleBookmark(examId, item.id)}
              highlights={highlights} onAddHighlight={onAddHighlight} onRemoveHighlight={onRemoveHighlight}
              onSetHighlightNote={onSetHighlightNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyManual({ exams, bookmarks, modalityFilter, onToggleBookmark, highlights, onAddHighlight, onRemoveHighlight, onSetHighlightNote, onNavigateToExam }) {
  const [searchText, setSearchText] = useState("");
  const examTrees = {};

  exams
    .filter((e) => !modalityFilter || e.modality === modalityFilter)
    .forEach((exam) => {
      const bm = bookmarks[exam.id];
      if (!bm || bm.size === 0) return;
      const sections = [];
      exam.sections.forEach((section) => {
        const subsections = [];
        section.items.forEach((item) => {
          if (item.subItems) {
            const subbed = item.subItems.filter((sub) => bm.has(sub.id));
            if (subbed.length) subsections.push({ subtitle: item.subtitle, items: subbed });
          } else if (bm.has(item.id)) {
            subsections.push({ subtitle: null, items: [item] });
          }
        });
        if (subsections.length) sections.push({ title: section.title, subsections });
      });
      if (sections.length) {
        if (!examTrees[exam.category]) examTrees[exam.category] = [];
        examTrees[exam.category].push({ id: exam.id, name: exam.name, modality: exam.modality, sections });
      }
    });

  const totalItems = Object.values(bookmarks).reduce((s, v) => s + v.size, 0);
  if (totalItems === 0) {
    return (
      <div className="manual-empty">
        <div className="empty-state"><span className="empty-icon">📋</span><h3>我的手册</h3>
          <p>还没有收藏任何内容。<br />在「放射技术百科全书」中勾选不熟悉的步骤，即可将其收录到这里。</p></div>
      </div>
    );
  }
  if (!modalityFilter) {
    return (
      <div className="my-manual">
        <div className="manual-header"><h2>我的手册</h2><p className="manual-subtitle">共 {totalItems} 条需要复习的内容</p></div>
        <div className="empty-state"><p>请从左侧选择 CT / DR / MRI 查看对应收藏</p></div>
      </div>
    );
  }

  return (
    <div className="my-manual">
      <div className="manual-header">
        <h2>我的手册</h2>
        <p className="manual-subtitle">共 {totalItems} 条需要复习的内容</p>
        <div className="manual-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="搜索收藏内容..." value={searchText}
            onChange={(e) => setSearchText(e.target.value)} className="search-input" />
          {searchText && <button className="search-clear" onClick={() => setSearchText("")}>✕</button>}
        </div>
      </div>
      <div className="manual-content">
        {CATEGORY_ORDER.map((cat) => {
          const examsInCat = examTrees[cat];
          if (!examsInCat) return null;
          return examsInCat.map((exam) => (
            <div key={exam.id} className="manual-group">
              <div className="manual-group-header" onClick={() => { const fullExam = exams.find((e) => e.id === exam.id); if (fullExam) onNavigateToExam(fullExam); }}>
                <span className="manual-modality-badge">{exam.modality}</span>
                <h3>{exam.name}</h3>
                <span className="manual-group-link">查看完整 →</span>
              </div>
              <div className="manual-exam-body">
                {exam.sections.map((sec, si) => (
                  <section key={si}>
                    <h3 className="manual-section-title">{sec.title}</h3>
                    {sec.subsections.map((sub, ssi) =>
                      sub.subtitle ? (
                        <CollapsibleSubsection key={ssi}
                          subtitle={sub.subtitle} items={sub.items}
                          bookmarks={bookmarks} examId={exam.id}
                          onToggleBookmark={onToggleBookmark}
                          highlights={highlights} onAddHighlight={onAddHighlight} onRemoveHighlight={onRemoveHighlight}
                          onSetHighlightNote={onSetHighlightNote}
                        />
                      ) : (
                        <div key={ssi} style={{ padding: "4px 0" }}>
                          {sub.items.map((item) => (
                            <StepItem key={item.id} item={item}
                              checked={bookmarks[exam.id]?.has(item.id)}
                              onToggle={() => onToggleBookmark(exam.id, item.id)}
                              highlights={highlights} onAddHighlight={onAddHighlight} onRemoveHighlight={onRemoveHighlight}
                              onSetHighlightNote={onSetHighlightNote}
                            />
                          ))}
                        </div>
                      )
                    )}
                  </section>
                ))}
              </div>
            </div>
          ));
        })}
      </div>
    </div>
  );
}
