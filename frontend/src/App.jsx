import { useState, useCallback, useEffect } from "react";

const SAMPLE_DATA = {
  data: [
    "A->B", "A->C", "B->D", "C->E", "B->F",
    "G->H", "G->I", "H->J", "A->B", "D->A",
    "X->", "C->K", "L->M", "M->N", "N->O"
  ]
};

const API_URL = "https://bfhl-hierarchy-intelligence-platform.onrender.com/bfhl";

/**
 * Recursive Tree Node Component
 */
function VisualTree({ treeObj, depth = 0 }) {
  if (!treeObj) return null;
  const nodeName = Object.keys(treeObj)[0];
  const childrenObj = treeObj[nodeName];
  const childrenNames = Object.keys(childrenObj).sort();
  
  return (
    <div className="tree-node">
      <div className="tree-node__content">
        <div className="tree-node__dot" style={{ background: `var(--accent-emerald)` }}></div>
        <span className="tree-node__label">{nodeName}</span>
      </div>
      {childrenNames.length > 0 && (
        <div className="tree-node__children">
          {childrenNames.map((childName, idx) => (
            <VisualTree key={`${childName}-${idx}`} treeObj={{ [childName]: childrenObj[childName] }} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Analytics Stat Card
 */
function StatCard({ label, value, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value ?? 0}</div>
    </div>
  );
}

/**
 * Main Application Component
 */
function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyStatus, setCopyStatus] = useState("Copy JSON Response");

  // Initial population
  useEffect(() => {
    if (!input) setInput(JSON.stringify(SAMPLE_DATA, null, 2));
  }, []);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let body;
      try {
        body = JSON.parse(input);
      } catch (e) {
        throw new Error("Invalid payload: JSON syntax error detected.");
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Intelligence Engine Communication Failure");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopyStatus("Clipboard Updated");
    setTimeout(() => setCopyStatus("Copy JSON Response"), 2000);
  };

  const handleSample = () => setInput(JSON.stringify(SAMPLE_DATA, null, 2));
  const handleClear = () => {
    setInput(JSON.stringify({ data: [] }, null, 2));
    setResult(null);
  };

  return (
    <div className="app">
      <div className="app-container">
        
        {/* Header Section */}
        <header className="hero">
          <div className="hero__badge">
            <span>Research & Analysis Phase</span>
          </div>
          <h1 className="hero__title">BFHL Hierarchy Intelligence Platform</h1>
          <p className="hero__subtitle">
            Enterprise-grade recursive analysis for structural discovery, cycle prevention, and hierarchical resolution.
          </p>
        </header>

        {/* Platform Identity */}
        <div className="platform-meta">
          <div className="meta-pill">
            <span className="meta-pill__label">User Identification</span>
            <span className="meta-pill__value">shivamkumarjha_22092003</span>
          </div>
          <div className="meta-pill">
            <span className="meta-pill__label">Registry Email</span>
            <span className="meta-pill__value">sj5873@srmist.edu.in</span>
          </div>
          <div className="meta-pill">
            <span className="meta-pill__label">System Roll</span>
            <span className="meta-pill__value">RA23110260101678</span>
          </div>
        </div>

        {/* Intelligence Workspace */}
        <div className="workspace">
          <textarea 
            className="workspace__editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck="false"
          />
          <div className="workspace__actions">
            <button className="btn btn--primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? "Processing Signals..." : "Run Intelligence Analysis"}
            </button>
            <button className="btn btn--secondary" onClick={handleSample}>
              Load Sample Case
            </button>
            <button className="btn btn--ghost" onClick={handleClear}>
              Clear Buffer
            </button>
          </div>
        </div>

        {/* Transition States */}
        {error && (
          <div className="cycle-alert" style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--accent-rose)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Signal Error</div>
              <div style={{ color: 'var(--on-surface)', marginTop: '4px' }}>{error}</div>
            </div>
          </div>
        )}

        {loading && (
          <div className="analytics">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '120px' }}></div>)}
          </div>
        )}

        {/* Analysis Visualizations */}
        {result && !loading && (
          <>
            {/* Analytics Surface */}
            <div className="analytics">
              <StatCard label="Total Trees" value={result.summary?.total_trees} colorClass="stat-card--blue" />
              <StatCard label="Total Cycles" value={result.summary?.total_cycles} colorClass="stat-card--rose" />
              <StatCard label="Largest Tree Root" value={result.summary?.largest_tree_root || "None"} colorClass="stat-card--emerald" />
              <StatCard label="Invalid Entries" value={result.invalid_entries?.length} colorClass="stat-card--amber" />
              <StatCard label="Duplicate Vectors" value={result.duplicate_edges?.length} colorClass="stat-card--purple" />
            </div>

            {/* Hierarchies Layout */}
            <div className="hierarchies">
              <div className="section-head">
                <span className="label-sm">Structural Components</span>
                <h2>Hierarchical Identifications</h2>
              </div>

              <div className="hierarchy-grid">
                {result.hierarchies?.map((h, idx) => (
                  <div key={idx} className="h-card">
                    <div className="h-card__header">
                      <div className="h-card__info">
                        <span className="h-card__root-label">Entry Point</span>
                        <span className="h-card__root-name">{h.root}</span>
                      </div>
                      <div className={`h-card__badge ${h.has_cycle ? "h-card__badge--cycle" : "h-card__badge--tree"}`}>
                        {h.has_cycle ? "Cycle Detected" : "Acyclic Structure"}
                      </div>
                    </div>
                    <div className="h-card__body">
                      {h.has_cycle ? (
                        <div className="cycle-alert">
                          <div>
                            <div style={{ color: 'var(--accent-rose)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Recursive Loop Detected</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                              This component contains a circular dependency. Tree resolution is suspended for this path.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="h-card__depth">
                            <span className="h-card__depth-val">{h.depth}</span>
                            <span className="h-card__depth-label">Max Hierarchy Depth</span>
                          </div>
                          <div className="visual-tree">
                            <VisualTree treeObj={h.tree} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Constraint Panels */}
            <div className="issue-panel">
              <div className="issue-card">
                <div className="issue-card__header">
                  <h2>Invalid Vector Map</h2>
                  <div className="issue-card__tag">FILTERED</div>
                </div>
                <div className="issue-list">
                  {result.invalid_entries?.length > 0 ? (
                    result.invalid_entries.map((item, i) => (
                      <div key={i} className="issue-row">
                        <div className="issue-row__entry">{item.entry || "NULL"}</div>
                        <div className="issue-row__reason">{item.reason}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>No filtered entries detected.</div>
                  )}
                </div>
              </div>

              <div className="issue-card">
                <div className="issue-card__header">
                  <h2>Redundant Vectors</h2>
                  <div className="issue-card__tag">DEDUPLICATED</div>
                </div>
                <div className="issue-list">
                  {result.duplicate_edges?.length > 0 ? (
                    result.duplicate_edges.map((edge, i) => (
                      <div key={i} className="issue-row">
                        <div className="issue-row__entry">{edge}</div>
                        <div className="issue-row__reason">Duplicate Record</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>No redundant vectors found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Raw Intelligence Vault */}
            <div className="viewer-container">
              <div className="section-head">
                <span className="label-sm">System Storage</span>
                <h2>Intelligence JSON Vault</h2>
              </div>
              <div className="viewer">
                <div className="viewer__header">
                  <div className="viewer__title">Response Buffer</div>
                  <button className="btn btn--secondary" style={{ padding: '6px 16px', fontSize: '0.7rem' }} onClick={handleCopy}>
                    {copyStatus}
                  </button>
                </div>
                <div className="viewer__pre">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer Surface */}
        <footer style={{ marginTop: '60px', padding: '40px 0', borderTop: '1px solid var(--surface-container-high)', textAlign: 'center' }}>
          <div className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Built for Bajaj Finserv Health Lab Intelligence Phase · SRM Institute of Science and Technology
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            © 2026 RA23110260101678
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
