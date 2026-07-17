import { useState, useEffect } from 'react';
import { useStore } from './store';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { AnimatedThemeToggler } from './components/ui/animated-theme-toggler';
import { showAlert, showPrompt } from './utils/alert';
import { DebuggerPanel } from './components/debuggerPanel';

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
  api: '#2563eb', db: '#0891b2', router: '#ea580c', switch: '#8b5cf6',
  codeRunner: '#10b981', notification: '#f43f5e', delay: '#db2777', json: '#0d9488',
};
const nodeLabels = {
  customInput: 'Input', customOutput: 'Output', llm: 'LLM', text: 'Text',
  api: 'API', db: 'Database', router: 'Router', switch: 'Switch',
  codeRunner: 'JS Code', notification: 'Notify', delay: 'Delay', json: 'JSON',
};

/* ── Properties Panel ── */
const renderProps = (node, update) => {
  const d = node.data || {};
  const gap = { marginBottom: '16px' };
  switch (node.type) {
    case 'customInput': return (<>
      <div style={gap}><label style={sLabel}>Input Name</label><input type="text" value={d.inputName || node.id.replace('customInput-', 'input_')} onChange={e => update(node.id, 'inputName', e.target.value)} style={sInput}/></div>
      <div style={gap}><label style={sLabel}>Input Value</label><input type="text" value={d.inputValue || ''} onChange={e => update(node.id, 'inputValue', e.target.value)} placeholder="Type input value..." style={sInput}/></div>
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
    case 'router': {
      const showTargetValue = !['isEmpty', 'isNotEmpty'].includes(d.condition || 'contains');
      return (<>
        <div style={gap}>
          <label style={sLabel}>Condition</label>
          <select value={d.condition || 'contains'} onChange={e => update(node.id, 'condition', e.target.value)} style={sSelect}>
            <option value="equals">Equals</option>
            <option value="contains">Contains</option>
            <option value="startsWith">Starts With</option>
            <option value="endsWith">Ends With</option>
            <option value="greaterThan">Greater Than</option>
            <option value="lessThan">Less Than</option>
            <option value="isEmpty">Is Empty</option>
            <option value="isNotEmpty">Is Not Empty</option>
            <option value="regex">Matches Regex</option>
          </select>
        </div>
        {showTargetValue && (
          <div>
            <label style={sLabel}>Target Value</label>
            <input type="text" value={d.value || 'admin'} onChange={e => update(node.id, 'value', e.target.value)} style={sInput}/>
          </div>
        )}
      </>);
    }
    case 'switch': {
      const cases = d.cases || ['Case 1'];
      return (<>
        <div style={gap}>
          <label style={sLabel}>Cases</label>
          {cases.map((c, index) => (
            <div key={index} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                value={c}
                onChange={e => {
                  const newCases = [...cases];
                  newCases[index] = e.target.value;
                  update(node.id, 'cases', newCases);
                }}
                style={sInput}
                placeholder={`Case ${index + 1}`}
              />
              <button
                onClick={() => {
                  const newCases = cases.filter((_, i) => i !== index);
                  update(node.id, 'cases', newCases);
                }}
                style={{
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-input)',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              update(node.id, 'cases', [...cases, `Case ${cases.length + 1}`]);
            }}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px dashed var(--border-hover)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              marginTop: '4px',
              fontFamily: "'Smooch Sans', sans-serif",
            }}
          >
            + Add Case
          </button>
        </div>
      </>);
    }
    case 'codeRunner': return (<>
      <div style={gap}>
        <label style={sLabel}>Input Ports (Comma-separated)</label>
        <input
          type="text"
          value={d.inputPorts || 'a, b'}
          onChange={e => update(node.id, 'inputPorts', e.target.value)}
          style={sInput}
          placeholder="e.g. arg1, arg2"
        />
      </div>
      <div>
        <label style={sLabel}>JavaScript Code</label>
        <textarea
          value={d.code || 'return inputs.a + inputs.b;'}
          onChange={e => update(node.id, 'code', e.target.value)}
          rows="8"
          style={sTextarea}
          placeholder="// 'inputs' holds value mapped from inputs"
        />
      </div>
    </>);
    case 'notification': return (<>
      <div style={gap}>
        <label style={sLabel}>Notification Type</label>
        <select
          value={d.notifType || 'Alert'}
          onChange={e => update(node.id, 'notifType', e.target.value)}
          style={sSelect}
        >
          <option>Alert</option>
          <option>Slack Webhook</option>
        </select>
      </div>
      {d.notifType === 'Slack Webhook' && (
        <div style={gap}>
          <label style={sLabel}>Slack Webhook URL</label>
          <input
            type="text"
            value={d.webhookUrl || ''}
            onChange={e => update(node.id, 'webhookUrl', e.target.value)}
            style={sInput}
            placeholder="https://hooks.slack.com/services/..."
          />
        </div>
      )}
      <div>
        <label style={sLabel}>Message Template</label>
        <textarea
          value={d.messageTemplate || 'Pipeline finished with value: {{input}}'}
          onChange={e => update(node.id, 'messageTemplate', e.target.value)}
          rows="4"
          style={sTextarea}
          placeholder="Use {{input}} to output inputs"
        />
      </div>
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
  const edges = useStore(s => s.edges);

  const exportPipeline = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", "pipeline-export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showAlert('Success', 'Pipeline exported successfully!', 'success');
  };

  const importPipeline = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          useStore.getState().setPipeline(data.nodes, data.edges);
          showAlert('Success', 'Pipeline imported successfully!', 'success');
        } else {
          showAlert('Invalid File', 'Invalid pipeline format. Must contain nodes and edges arrays.', 'error');
        }
      } catch (err) {
        showAlert('Error', 'Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };
  const updateNodeField = useStore(s => s.updateNodeField);
  const selectedNode = nodes.find(n => n.selected);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalResult, setModalResult] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/pipelines/list');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch session history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const saveWorkflow = async (slot) => {
    if (!slot) {
      showAlert('Validation Error', 'Invalid slot selection.', 'warning');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/pipelines/save/${encodeURIComponent(slot)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });
      if (res.ok) {
        fetchHistory();
        showAlert('Success', `Workflow "${slot}" saved successfully!`, 'success');
      }
    } catch (err) {
      showAlert('Error', 'Failed to save workflow: ' + err.message, 'error');
    }
  };

  const loadWorkflow = async (slot) => {
    try {
      const res = await fetch(`http://localhost:8000/pipelines/load/${encodeURIComponent(slot)}`);
      if (res.ok) {
        const data = await res.json();
        useStore.getState().setPipeline(data.nodes, data.edges);
        showAlert('Success', `Workflow "${slot}" loaded successfully!`, 'success');
      }
    } catch (err) {
      showAlert('Error', 'Failed to load workflow: ' + err.message, 'error');
    }
  };

  const clearWorkflow = async (slot) => {
    try {
      const res = await fetch(`http://localhost:8000/pipelines/clear/${encodeURIComponent(slot)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchHistory();
        showAlert('Cleared', `Slot ${slot} has been cleared.`, 'success');
      }
    } catch (err) {
      showAlert('Error', 'Failed to clear slot: ' + err.message, 'error');
    }
  };

  const handleSubmission = (data, error) => {
    setModalResult(data);
    setModalError(error);
    setShowModal(true);
  };

  const getOutputsList = () => {
    if (!modalResult || !modalResult.executionResult) return [];
    return Object.entries(modalResult.executionResult)
      .map(([nodeId, outputs]) => {
        const n = nodes.find(node => node.id === nodeId);
        if (n && n.type === 'customOutput') {
          const name = n.data?.outputName || nodeId.replace('customOutput-', 'output_');
          return { name, value: outputs[`${nodeId}-value`] ?? 'Empty' };
        }
        return null;
      })
      .filter(Boolean);
  };
  const outputsList = getOutputsList();

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

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0 14px' }} />

        {/* Saved Workflows History */}
        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
            Saved Workflows
          </div>
          
          {/* Workflows list with scroll */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '2px' }}>
            {history.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                No slots available
              </div>
            ) : (
              history.map((wf) => {
                const isSlotEmpty = wf.empty;
                return (
                  <div key={wf.slot} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '13px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        Slot {wf.slot}
                      </span>
                      <span style={{ fontSize: '11px', color: isSlotEmpty ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                        {isSlotEmpty ? 'Empty' : `${wf.nodes_count} Nodes`}
                      </span>
                    </div>
                    
                    {!isSlotEmpty && wf.saved_at && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '-2px' }}>
                        Saved: {new Date(wf.saved_at).toLocaleDateString()} {new Date(wf.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                      {isSlotEmpty ? (
                        <button onClick={() => saveWorkflow(wf.slot)} style={{
                          flex: 1, padding: '6px 4px', fontSize: '11px', fontWeight: '700',
                          border: '1px solid var(--border-default)', background: 'var(--bg-input)',
                          color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer',
                          fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 150ms'
                        }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                        >
                          Save Workflow
                        </button>
                      ) : (
                        <>
                          <button onClick={() => saveWorkflow(wf.slot)} style={{
                            flex: 1, padding: '4px', fontSize: '11px', fontWeight: '700',
                            border: '1px solid var(--border-default)', background: 'var(--bg-input)',
                            color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer',
                            fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 150ms'
                          }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                          >
                            Overwrite
                          </button>
                          <button onClick={() => loadWorkflow(wf.slot)} style={{
                            flex: 1, padding: '4px', fontSize: '11px', fontWeight: '700',
                            border: '1px solid var(--border-default)', background: 'var(--bg-input)',
                            color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer',
                            fontFamily: 'inherit', textTransform: 'uppercase', transition: 'all 150ms'
                          }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                          >
                            Load
                          </button>
                          <button onClick={() => clearWorkflow(wf.slot)} style={{
                            padding: '4px 6px', fontSize: '11px', fontWeight: '700',
                            border: '1px solid var(--border-default)', background: 'var(--bg-input)',
                            color: '#dc2626', borderRadius: '6px', cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all 150ms'
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; e.currentTarget.style.borderColor = '#dc2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
          <AnimatedThemeToggler />
          <button
            onClick={async () => {
              const slot = await showPrompt('Save Workflow', 'Enter workflow name (e.g. MyWorkflow):');
              if (slot) {
                const cleanedSlot = slot.trim();
                if (cleanedSlot) {
                  saveWorkflow(cleanedSlot);
                } else {
                  showAlert('Validation Error', 'Invalid workflow name.', 'warning');
                }
              }
            }}
            style={{
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
          
          {/* Import JSON */}
          <button
            onClick={() => document.getElementById('pipeline-import-file').click()}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '10px',
              color: 'var(--text-secondary)', padding: '8px 16px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 150ms', outline: 'none', fontFamily: "'Smooch Sans', sans-serif",
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import
          </button>
          <input id="pipeline-import-file" type="file" accept=".json" onChange={importPipeline} style={{ display: 'none' }} />

          {/* Export JSON */}
          <button
            onClick={exportPipeline}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '10px',
              color: 'var(--text-secondary)', padding: '8px 16px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 150ms', outline: 'none', fontFamily: "'Smooch Sans', sans-serif",
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>

          <SubmitButton onSubmission={handleSubmission} />
        </div>
        <PipelineUI />
        <DebuggerPanel onSubmission={handleSubmission} />
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

      {/* ── Modal Overlay ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ fontFamily: "'Smooch Sans', sans-serif" }}>
            {modalError ? (
              <>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#e11d48', margin: '0 auto 20px',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 10px', color: 'var(--text-primary)' }}>Submission Error</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: '1.5' }}>{modalError}</p>
              </>
            ) : (
              <>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: modalResult?.is_dag ? 'rgba(22, 163, 74, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                  border: modalResult?.is_dag ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(225, 29, 72, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: modalResult?.is_dag ? '#16a34a' : '#e11d48', margin: '0 auto 20px',
                }}>
                  {modalResult?.is_dag ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  )}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 16px', color: 'var(--text-primary)' }}>
                  Pipeline Analysis
                </h3>
                
                {/* Stats list */}
                <div style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Nodes Count:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{modalResult?.num_nodes}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Edges Count:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{modalResult?.num_edges}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Topology Check:</span>
                    <span style={{
                      color: modalResult?.is_dag ? '#16a34a' : '#e11d48',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {modalResult?.is_dag ? 'Valid DAG (No Cycles)' : 'Invalid Graph (Contains Cycles)'}
                    </span>
                  </div>
                </div>

                {/* Pipeline Execution Outputs */}
                {outputsList.length > 0 && (
                  <div style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    textAlign: 'left',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Pipeline Execution Outputs
                    </div>
                    {outputsList.map((output, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none', paddingTop: idx > 0 ? '10px' : '0' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{output.name}:</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', wordBreak: 'break-word', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                          {String(output.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--text-primary)',
                border: 'none',
                color: 'var(--bg-card)',
                fontWeight: '600',
                fontSize: '15px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'opacity 150ms',
                fontFamily: "'Smooch Sans', sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
