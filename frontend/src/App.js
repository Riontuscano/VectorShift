import { useState, useEffect } from 'react';
import { useStore } from './store';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { AnimatedThemeToggler } from './components/AnimatedThemeToggler';

/* ── Sidebar field styles ── */
const sInput = {
  padding: '9px 12px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  fontFamily: "'Smooch Sans', sans-serif",
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 150ms',
};
const sSelect = { ...sInput, cursor: 'pointer' };
const sTextarea = { ...sInput, resize: 'vertical', fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '12px', lineHeight: '1.5' };
const sLabel = { fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' };

const nodeColors = {
  customInput: '#16a34a', customOutput: '#e11d48', llm: '#7c3aed', text: '#ca8a04',
  api: '#2563eb', db: '#0891b2', router: '#ea580c', delay: '#db2777', json: '#0d9488',
};
const nodeLabels = {
  customInput: 'Input', customOutput: 'Output', llm: 'LLM', text: 'Text',
  api: 'API', db: 'Database', router: 'Router', delay: 'Delay', json: 'JSON',
};

/* ── Properties Panel ── */
const renderProps = (node, update) => {
  const d = node.data || {};
  const gap = { marginBottom: '16px' };
  switch (node.type) {
    case 'customInput': return (<>
      <div style={gap}><label style={sLabel}>Input Name</label><input type="text" value={d.inputName || node.id.replace('customInput-', 'input_')} onChange={e => update(node.id, 'inputName', e.target.value)} style={sInput}/></div>
      <div><label style={sLabel}>Input Type</label><select value={d.inputType || 'Text'} onChange={e => update(node.id, 'inputType', e.target.value)} style={sSelect}><option value="Text">Text</option><option value="File">File</option></select></div>
    </>);
    case 'customOutput': return (<>
      <div style={gap}><label style={sLabel}>Output Name</label><input type="text" value={d.outputName || node.id.replace('customOutput-', 'output_')} onChange={e => update(node.id, 'outputName', e.target.value)} style={sInput}/></div>
      <div><label style={sLabel}>Output Type</label><select value={d.outputType || 'Text'} onChange={e => update(node.id, 'outputType', e.target.value)} style={sSelect}><option value="Text">Text</option><option value="File">Image</option></select></div>
    </>);
    case 'llm': return <div style={{ fontSize: '14px', color: '#6B6560', lineHeight: '1.6' }}>Connect system instructions and a user prompt to generate AI responses.</div>;
    case 'text': return (<div><label style={sLabel}>Text Template</label><textarea value={d.text || '{{input}}'} onChange={e => update(node.id, 'text', e.target.value)} rows="5" style={sTextarea}/></div>);
    case 'api': return (<>
      <div style={gap}><label style={sLabel}>Endpoint URL</label><input type="text" value={d.url || 'https://api.example.com/data'} onChange={e => update(node.id, 'url', e.target.value)} style={sInput}/></div>
      <div><label style={sLabel}>HTTP Method</label><select value={d.method || 'GET'} onChange={e => update(node.id, 'method', e.target.value)} style={sSelect}><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select></div>
    </>);
    case 'db': return (<>
      <div style={gap}><label style={sLabel}>Database</label><select value={d.dbType || 'PostgreSQL'} onChange={e => update(node.id, 'dbType', e.target.value)} style={sSelect}><option>PostgreSQL</option><option>MySQL</option><option>MongoDB</option><option>Redis</option></select></div>
      <div><label style={sLabel}>Query</label><textarea value={d.query || 'SELECT * FROM users LIMIT 10;'} onChange={e => update(node.id, 'query', e.target.value)} rows="4" style={sTextarea}/></div>
    </>);
    case 'router': return (<>
      <div style={gap}><label style={sLabel}>Condition</label><select value={d.condition || 'contains'} onChange={e => update(node.id, 'condition', e.target.value)} style={sSelect}><option value="equals">Equals</option><option value="contains">Contains</option><option value="startsWith">Starts With</option><option value="greaterThan">Greater Than</option></select></div>
      <div><label style={sLabel}>Target Value</label><input type="text" value={d.value || 'admin'} onChange={e => update(node.id, 'value', e.target.value)} style={sInput}/></div>
    </>);
    case 'delay': return (<div><label style={sLabel}>Duration (ms)</label><input type="number" value={d.delayMs || 1000} onChange={e => update(node.id, 'delayMs', Number(e.target.value))} min="0" step="100" style={sInput}/></div>);
    case 'json': return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input type="checkbox" checked={d.beautify !== false} onChange={e => update(node.id, 'beautify', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0d9488', cursor: 'pointer' }}/>
        <span style={{ fontSize: '14px', color: '#6B6560' }}>Beautify output</span>
      </div>
    );
    default: return <div style={{ fontSize: '14px', color: '#9B9590', fontStyle: 'italic' }}>No configurable settings.</div>;
  }
};

/* ── Toggle Button ── */
const ToggleBtn = ({ onClick, direction }) => (
  <button onClick={onClick} style={{
    width: '28px', height: '28px', borderRadius: '6px', background: 'var(--bg-card)',
    border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 150ms', flexShrink: 0,
    boxShadow: 'var(--shadow-sm)',
  }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 6 15 12 9 18"/>}
    </svg>
  </button>
);

function App() {
  const nodes = useStore(s => s.nodes);
  const updateNodeField = useStore(s => s.updateNodeField);
  const selectedNode = nodes.find(n => n.selected);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDark);
  }, [isDark]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-canvas)', fontFamily: "'Smooch Sans', sans-serif" }}>

      {/* ════ LEFT SIDEBAR ════ */}
      <div style={{
        width: leftOpen ? '260px' : '0px',
        minWidth: leftOpen ? '260px' : '0px',
        background: 'var(--bg-sidebar)',
        borderRight: leftOpen ? '1px solid var(--border-default)' : 'none',
        display: 'flex', flexDirection: 'column',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden', zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bg-card)" strokeWidth="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>VectorShift</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{nodes.length} node{nodes.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <ToggleBtn onClick={() => setLeftOpen(false)} direction="left" />
        </div>

        {/* Nodes List */}
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
          <PipelineToolbar />
        </div>
      </div>

      {/* Left toggle (when collapsed) */}
      {!leftOpen && (
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 20 }}>
          <ToggleBtn onClick={() => setLeftOpen(true)} direction="right" />
        </div>
      )}

      {/* ════ CENTER CANVAS ════ */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Top bar */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 10,
          display: 'flex', gap: '8px', alignItems: 'center',
        }}>
          <AnimatedThemeToggler isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          <button style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '10px',
            color: 'var(--text-secondary)', padding: '8px 16px', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 150ms', outline: 'none', fontFamily: "'Smooch Sans', sans-serif",
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
          <SubmitButton />
        </div>
        <PipelineUI />
      </div>

      {/* Right toggle (when collapsed) */}
      {!rightOpen && (
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 20 }}>
          <ToggleBtn onClick={() => setRightOpen(true)} direction="left" />
        </div>
      )}

      {/* ════ RIGHT SIDEBAR ════ */}
      <div style={{
        width: rightOpen ? '280px' : '0px',
        minWidth: rightOpen ? '280px' : '0px',
        background: 'var(--bg-sidebar)',
        borderLeft: rightOpen ? '1px solid var(--border-default)' : 'none',
        display: 'flex', flexDirection: 'column',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden', zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ padding: '18px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {selectedNode ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: nodeColors[selectedNode.type] || 'var(--accent)', display: 'inline-block' }}/>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {nodeLabels[selectedNode.type] || selectedNode.type}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>{selectedNode.id}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Properties</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Select a node</div>
              </>
            )}
          </div>
          <ToggleBtn onClick={() => setRightOpen(false)} direction="right" />
        </div>

        {/* Content */}
        {selectedNode ? (
          <div style={{ padding: '20px 18px', overflowY: 'auto', flex: 1 }}>
            {renderProps(selectedNode, updateNodeField)}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '14px',
            padding: '20px', textAlign: 'center', lineHeight: '1.6',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '10px', color: 'var(--border-hover)' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Click a node to<br/>configure its properties
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
