import { useState } from 'react';
import { useStore } from './store';
import { executePipeline } from './executor';

export const SubmitButton = ({ onSubmission }) => {
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  const updateNodeField = useStore(state => state.updateNodeField);
  const addExecutionLog = useStore(state => state.addExecutionLog);
  const clearExecutionLogs = useStore(state => state.clearExecutionLogs);
  const setDebuggingState = useStore(state => state.setDebuggingState);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    clearExecutionLogs();

    try {
      // 1. Query backend for pipeline topology DAG check
      const response = await fetch('http://localhost:8000/pipelines/parse', {
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

      // 2. If there is a cycle (not a DAG), abort and show warning modal
      if (!backendData.is_dag) {
        nodes.forEach(n => updateNodeField(n.id, 'status', 'error'));
        addExecutionLog({
          status: 'error',
          message: 'Pipeline contains circular dependency loops. Must be a DAG.',
        });
        throw new Error('Pipeline contains circular dependency loops. Graph must be a Directed Acyclic Graph (DAG) to execute.');
      }

      // 3. Run execution engine in normal (parallel) mode
      await executePipeline({
        nodes,
        edges,
        isDebugMode: false,
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
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          background: 'var(--text-primary)',
          border: 'none',
          color: 'var(--bg-card)',
          padding: '8px 20px',
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'opacity 150ms',
          outline: 'none',
          fontFamily: "'Smooch Sans', sans-serif",
          letterSpacing: '0.02em',
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={e => { if(!loading) e.currentTarget.style.opacity = '0.8'; }}
        onMouseLeave={e => { if(!loading) e.currentTarget.style.opacity = '1'; }}
      >
        {loading ? (
          <span className="spinner" style={{
            width: '12px',
            height: '12px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
          }} />
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        )}
        {loading ? 'Executing...' : 'Run Pipeline'}
      </button>

      {/* Spinner animation style */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};
