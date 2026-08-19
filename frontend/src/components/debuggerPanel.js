import { useState } from 'react';
import { useStore } from '../store';
import { executePipeline } from '../executor';
import { showAlert } from '../utils/alert';
import { apiUrl } from '../config';

export const DebuggerPanel = ({ onSubmission }) => {
  const [isOpen, setIsOpen] = useState(false);
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  const updateNodeField = useStore(state => state.updateNodeField);
  const addExecutionLog = useStore(state => state.addExecutionLog);
  const clearExecutionLogs = useStore(state => state.clearExecutionLogs);
  const setDebuggingState = useStore(state => state.setDebuggingState);

  const executionLogs = useStore(state => state.executionLogs);
  const isDebugging = useStore(state => state.isDebugging);
  const debugPaused = useStore(state => state.debugPaused);
  const currentNodeId = useStore(state => state.currentNodeId);
  const triggerStep = useStore(state => state.triggerStep);
  const triggerResume = useStore(state => state.triggerResume);

  const [isRunning, setIsRunning] = useState(false);

  const startExecution = async (debugMode = false) => {
    if (nodes.length === 0) {
      showAlert('No Nodes', 'Create some nodes on the canvas first!', 'warning');
      return;
    }

    setIsRunning(true);
    setIsOpen(true);
    clearExecutionLogs();

    // Set debugging state, put for initial testing 
    if (debugMode) {
      setDebuggingState({
        isDebugging: true,
        debugPaused: false,
        currentNodeId: null,
        debugResolvePromise: null,
      });
    } else {
      setDebuggingState({
        isDebugging: false,
        debugPaused: false,
        currentNodeId: null,
        debugResolvePromise: null,
      });
    }

    try {

      const response = await fetch(apiUrl('/pipelines/parse'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const backendData = await response.json();

      if (!backendData.is_dag) {
        nodes.forEach(n => updateNodeField(n.id, 'status', 'error'));
        addExecutionLog({
          status: 'error',
          message: 'Pipeline contains circular dependency loops. Must be a DAG.',
        });
        throw new Error('Pipeline contains circular dependency loops. Graph must be a Directed Acyclic Graph (DAG) to execute.');
      }

      await executePipeline({
        nodes,
        edges,
        isDebugMode: debugMode,
        updateNodeField,
        addExecutionLog,
        setDebuggingState,
        onSubmission: (res, err) => {
          if (err) {
            onSubmission(null, err);
          } else {
            onSubmission(res, null);
          }
        },
      });

    } catch (err) {
      onSubmission(null, err.message || 'Failed to execute pipeline.');
    } finally {
      setIsRunning(false);

      if (!useStore.getState().isDebugging) {
        setDebuggingState({
          isDebugging: false,
          debugPaused: false,
          currentNodeId: null,
          debugResolvePromise: null,
        });
      }
    }
  };

  const handleStop = () => {
    const currentResolver = useStore.getState().debugResolvePromise;
    if (currentResolver) {
      currentResolver();
    }
    setDebuggingState({
      isDebugging: false,
      debugPaused: false,
      currentNodeId: null,
      debugResolvePromise: null,
    });
    setIsRunning(false);

    nodes.forEach(node => {
      updateNodeField(node.id, 'status', 'idle');
    });

    addExecutionLog({
      status: 'warning',
      message: 'Execution aborted by user.',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
      case 'completed': return '#16a34a';
      case 'error': return '#dc2626';
      case 'warning': return '#ea580c';
      case 'running': return '#2563eb';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-sidebar)',
      borderTop: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      height: isOpen ? '300px' : '44px',
      transition: 'height var(--transition)',
      zIndex: 100,
      fontFamily: "'Smooch Sans', sans-serif",
      boxShadow: '0 -4px 12px rgba(0,0,0,0.03)',
    }}>
      {/* Header Panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        height: '43px',
        borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
        userSelect: 'none',
      }}>
        {/* Left: Title & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => setIsOpen(!isOpen)}
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 150ms' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            EXECUTION LOGS & DEBUGGER {executionLogs.length > 0 && `(${executionLogs.length})`}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Run Normal */}
            <button
              onClick={() => startExecution(false)}
              disabled={isRunning}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                background: isRunning ? 'var(--border-default)' : 'var(--text-primary)',
                color: isRunning ? 'var(--text-muted)' : 'var(--bg-card)',
                border: 'none',
                borderRadius: '6px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run
            </button>

            {/* Run Step-by-Step Debug */}
            <button
              onClick={() => startExecution(true)}
              disabled={isRunning}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                background: isRunning ? 'var(--border-default)' : 'var(--bg-card)',
                color: isRunning ? 'var(--text-muted)' : 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              Debug
            </button>

            {/* Step Button */}
            <button
              onClick={triggerStep}
              disabled={!isDebugging || !debugPaused}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                background: (isDebugging && debugPaused) ? 'var(--bg-card)' : 'transparent',
                color: (isDebugging && debugPaused) ? 'var(--text-primary)' : 'var(--text-muted)',
                border: (isDebugging && debugPaused) ? '1px solid var(--border-hover)' : '1px solid transparent',
                borderRadius: '6px',
                cursor: (isDebugging && debugPaused) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
              </svg>
              Step
            </button>

            {/* Resume Button */}
            <button
              onClick={triggerResume}
              disabled={!isDebugging || !debugPaused}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                background: (isDebugging && debugPaused) ? 'var(--bg-card)' : 'transparent',
                color: (isDebugging && debugPaused) ? 'var(--text-primary)' : 'var(--text-muted)',
                border: (isDebugging && debugPaused) ? '1px solid var(--border-hover)' : '1px solid transparent',
                borderRadius: '6px',
                cursor: (isDebugging && debugPaused) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
              Resume
            </button>

            {/* Stop Button */}
            {isRunning && (
              <button
                onClick={handleStop}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isDebugging && (
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 8px',
              borderRadius: '4px',
              background: debugPaused ? 'rgba(234, 88, 12, 0.1)' : 'rgba(37, 99, 235, 0.1)',
              color: debugPaused ? '#ea580c' : '#2563eb',
            }}>
              {debugPaused ? `Paused: ${currentNodeId}` : 'Running...'}
            </div>
          )}

          <button
            onClick={clearExecutionLogs}
            disabled={executionLogs.length === 0}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '12px',
              fontWeight: '600',
              color: executionLogs.length === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: executionLogs.length === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Clear logs
          </button>
        </div>
      </div>

      {/* Logs Body */}
      {isOpen && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 18px',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {executionLogs.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}>
              No execution logs. Run or debug the pipeline to see output.
            </div>
          ) : (
            executionLogs.map((log) => {
              const hasPayload = log.inputs || log.outputs;
              return (
                <div
                  key={log.id}
                  style={{
                    fontSize: '13px',
                    borderLeft: `3px solid ${getStatusColor(log.status)}`,
                    paddingLeft: '12px',
                    padding: '4px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    background: currentNodeId === log.nodeId && log.status === 'running'
                      ? 'var(--accent-soft)'
                      : 'transparent',
                    borderRadius: '0 4px 4px 0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>
                      [{log.timestamp}]
                    </span>
                    {log.nodeId && (
                      <span style={{
                        fontWeight: '700',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'var(--bg-input)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                      }}>
                        {log.nodeId}
                      </span>
                    )}
                    <span style={{
                      color: log.status === 'error' ? '#dc2626' : 'var(--text-primary)',
                      fontWeight: log.status === 'error' || log.status === 'success' ? '700' : '500',
                    }}>
                      {log.message}
                    </span>
                  </div>

                  {hasPayload && (
                    <details style={{ marginTop: '2px', cursor: 'pointer' }}>
                      <summary style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Payload Details
                      </summary>
                      <div style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '8px',
                        marginTop: '4px',
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {log.inputs && (
                          <div style={{ marginBottom: log.outputs ? '8px' : '0' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>[Inputs]:</span>
                            <div>{JSON.stringify(log.inputs, null, 2)}</div>
                          </div>
                        )}
                        {log.outputs && (
                          <div>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>[Outputs]:</span>
                            <div>{JSON.stringify(log.outputs, null, 2)}</div>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
