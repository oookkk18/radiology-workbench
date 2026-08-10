import { useState } from "react";

function DataTable({ table }) {
  if (!table || !table.headers || !table.rows) return null;
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepItem({ item, bookmarks, onToggleBookmark }) {
  const hasTable = !!item.table;
  return (
    <div
      className={`step-item ${bookmarks.has(item.id) ? "bookmarked" : ""}`}
    >
      <label className="step-checkbox">
        <input
          type="checkbox"
          checked={bookmarks.has(item.id)}
          onChange={() => onToggleBookmark(item.id)}
        />
        <span className="checkmark"></span>
      </label>
      <div className="step-body">
        {item.text && <p className="step-text">{item.text}</p>}
        {hasTable && <DataTable table={item.table} />}
      </div>
    </div>
  );
}

function CollapsibleSubsection({ item, bookmarks, onToggleBookmark }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`subsection collapsible ${open ? "open" : ""}`}>
      <button
        className="subsection-toggle"
        onClick={() => setOpen(!open)}
      >
        <span className="toggle-arrow">{open ? "▾" : "▸"}</span>
        <h4 className="subsection-title">{item.subtitle}</h4>
      </button>
      {open && (
        <div className="subsection-body">
          {item.subItems.map((sub) => (
            <StepItem
              key={sub.id}
              item={sub}
              bookmarks={bookmarks}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ section, bookmarks, onToggleBookmark }) {
  const [open, setOpen] = useState(true);
  return (
    <section className={`content-section collapsible-section ${open ? "open" : ""}`}>
      <button className="section-toggle" onClick={() => setOpen(!open)}>
        <span className="toggle-arrow">{open ? "▾" : "▸"}</span>
        <h3 className="section-title">{section.title}</h3>
      </button>
      {open && (
        <div className="section-body">
          {section.items.map((item) => {
            if (item.subItems) {
              return (
                <CollapsibleSubsection
                  key={item.id}
                  item={item}
                  bookmarks={bookmarks}
                  onToggleBookmark={onToggleBookmark}
                />
              );
            }
            return (
              <StepItem
                key={item.id}
                item={item}
                bookmarks={bookmarks}
                onToggleBookmark={onToggleBookmark}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function ExamViewer({ exam, bookmarks, onToggleBookmark }) {
  if (!exam) {
    return (
      <div className="empty-state">
        <p>请从左侧目录选择一个检查项目</p>
      </div>
    );
  }

  return (
    <div className="exam-viewer">
      <div className="exam-header">
        <div className="exam-header-top">
          <span className="exam-modality-badge">{exam.modality}</span>
          <span className="exam-category-badge">{exam.category}</span>
        </div>
        <h2 className="exam-title">{exam.name}</h2>
        <div className="exam-tags">
          {exam.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="exam-body">
        {exam.sections.map((section) => (
          <CollapsibleSection
            key={section.id}
            section={section}
            bookmarks={bookmarks}
            onToggleBookmark={onToggleBookmark}
          />
        ))}
      </div>
    </div>
  );
}
