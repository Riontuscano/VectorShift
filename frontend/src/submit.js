import { useStore } from './store';

export const SubmitButton = () => {
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);

  const handleSubmit = () => {
    alert(`Pipeline: ${nodes.length} nodes, ${edges.length} edges`);
  };

  return (
    <button
      onClick={handleSubmit}
      style={{
        background: '#1A1A1A',
        border: 'none',
        color: '#FFFFFF',
        padding: '8px 20px',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'opacity 150ms',
        outline: 'none',
        fontFamily: "'Smooch Sans', sans-serif",
        letterSpacing: '0.02em',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      Run
    </button>
  );
};
