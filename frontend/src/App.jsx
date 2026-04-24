import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

/* ── Recursive Tree Visualization ───────────────── */
function TreeNode({ name, children, depth = 0 }) {
  const childKeys = Object.keys(children || {});
  const isLeaf = childKeys.length === 0;

  return (
    <div className="tree-node" style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div className="tree-node-label">
        {depth > 0 && <span className="tree-connector">└─</span>}
        <span className={`tree-badge ${isLeaf ? 'tree-leaf' : 'tree-branch'}`}>
          {name}
        </span>
      </div>
      {childKeys.map(childName => (
        <TreeNode key={childName} name={childName} children={children[childName]} depth={depth + 1} />
      ))}
    </div>
  );
}

function HierarchyCard({ hierarchy, index }) {
  const isCycle = hierarchy.has_cycle === true;
  const rootKey = Object.keys(hierarchy.tree || {})[0];

  return (
    <div className={`hierarchy-card ${isCycle ? 'cycle-card' : ''}`}>
      <div className="hierarchy-header">
        <span className="hierarchy-title">
          {isCycle ? '⚠️ ' : '🌳 '}
          Group {index + 1} — Root: <strong>{hierarchy.root}</strong>
        </span>
        {isCycle ? (
          <span className="badge-cycle">CYCLE</span>
        ) : (
          <span className="badge-depth">Depth: {hierarchy.depth}</span>
        )}
      </div>
      <div className="hierarchy-body">
        {isCycle ? (
          <div className="cycle-warning">
            ⚠️ Cyclic dependency detected. All nodes in this group form a cycle.
          </div>
        ) : rootKey ? (
          <TreeNode name={rootKey} children={hierarchy.tree[rootKey]} />
        ) : (
          <pre className="fallback-json">{JSON.stringify(hierarchy.tree, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

/* ── Main App ───────────────────────────────────── */
function App() {
  const [inputVal, setInputVal] = useState(
    '[\n  "A->B", "A->C", "B->D", "C->E", "E->F",\n  "X->Y", "Y->Z", "Z->X",\n  "P->Q", "Q->R",\n  "G->H", "G->H", "G->I",\n  "hello", "1->2", "A->"\n]'
  );
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setResponse(null);
    let parsedData = [];
    try {
      if (inputVal.trim().startsWith('[')) {
        parsedData = JSON.parse(inputVal);
      } else {
        parsedData = inputVal.split(',').map(s => s.trim()).filter(Boolean);
      }
    } catch {
      setError('Invalid input format. Must be a JSON array or comma-separated string.');
      return;
    }

    try {
      setLoading(true);
      const host = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
      const res = await axios.post(`${host}/bfhl`, { data: parsedData });
      setResponse(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'API Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>BFHL Architecture Parser</h1>
        <p>Analyze and visualize hierarchical relationships</p>
      </div>

      {/* ── Input Card ─────────────────────────── */}
      <div className="card input-section">
        <h2>📝 Input Data</h2>
        <p className="input-hint">Enter a JSON array or comma-separated node strings like <code>"A-&gt;B"</code></p>
        <div className="textarea-wrapper">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder='["A->B", "A->C"]'
            spellCheck={false}
          />
        </div>
        <button onClick={handleSubmit} disabled={loading} id="submit-btn">
          {loading ? (
            <span className="spinner-container">
              <span className="spinner"></span> Processing…
            </span>
          ) : (
            'Submit to /bfhl'
          )}
        </button>
      </div>

      {/* ── Error Banner ───────────────────────── */}
      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button className="dismiss-btn" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* ── Results ────────────────────────────── */}
      {response && (
        <div className="card output-section">
          <h2>📊 Analysis Results</h2>
          <div className="result-container">

            {/* Info + Summary */}
            <div className="grid-2">
              <div className="result-box">
                <h3>👤 Submitter Info</h3>
                <p><strong>User ID:</strong> <span className="badge-green">{response.user_id}</span></p>
                <p><strong>Email:</strong> {response.email_id}</p>
                <p><strong>Roll No:</strong> {response.college_roll_number}</p>
              </div>
              <div className="result-box">
                <h3>📈 Stats Summary</h3>
                <p><strong>Total Trees:</strong> <span className="badge-green">{response.summary?.total_trees}</span></p>
                <p><strong>Total Cycles:</strong> <span className={response.summary?.total_cycles > 0 ? 'badge-red' : 'badge-green'}>{response.summary?.total_cycles}</span></p>
                <p><strong>Largest Tree Root:</strong> <span className="badge-blue">{response.summary?.largest_tree_root || 'N/A'}</span></p>
              </div>
            </div>

            {/* Invalid + Duplicate badges */}
            {(response.invalid_entries?.length > 0 || response.duplicate_edges?.length > 0) && (
              <div className="grid-2">
                <div className="result-box">
                  <h3>🚫 Invalid Entries <span className="count-badge">{response.invalid_entries?.length}</span></h3>
                  <div className="badge-list">
                    {response.invalid_entries?.map((e, i) => (
                      <span key={i} className="entry-badge invalid">{e || '(empty)'}</span>
                    ))}
                  </div>
                </div>
                <div className="result-box">
                  <h3>🔁 Duplicate Edges <span className="count-badge">{response.duplicate_edges?.length}</span></h3>
                  <div className="badge-list">
                    {response.duplicate_edges?.map((e, i) => (
                      <span key={i} className="entry-badge duplicate">{e}</span>
                    ))}
                    {response.duplicate_edges?.length === 0 && <span className="text-muted">None</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Hierarchy Cards */}
            <div className="hierarchies-section">
              <h3>🌲 Hierarchies</h3>
              {response.hierarchies?.map((h, i) => (
                <HierarchyCard key={i} hierarchy={h} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
