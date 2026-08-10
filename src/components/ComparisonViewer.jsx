function DataTable({ table }) {
  if (!table || !table.headers || !table.rows) return null;
  return (
    <div className="data-table-wrapper compare-table">
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

export default function ComparisonViewer({ tables }) {
  return (
    <div className="comparison-viewer">
      <div className="compare-header">
        <h2 className="compare-title">参数速查对比</h2>
        <p className="compare-subtitle">
          不同部位 CT 检查关键参数横向对比，便于记忆差异
        </p>
      </div>

      <div className="compare-body">
        {tables.map((section, idx) => (
          <div key={idx} className="compare-section">
            <h3 className="compare-section-title">{section.title}</h3>
            {section.description && (
              <p className="compare-section-desc">{section.description}</p>
            )}
            <DataTable table={section.table} />
          </div>
        ))}
      </div>
    </div>
  );
}
