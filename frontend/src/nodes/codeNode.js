import { BaseNode } from './baseNode';

export const CodeNode = ({ id, data }) => {
  const code = data?.code || 'return inputs.a + inputs.b;';
  const inputPortsString = data?.inputPorts || 'a, b';
  
  // Parse comma-separated inputs
  const inputs = inputPortsString
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => ({ id: `${id}-${p}`, label: p }));

  return (
    <BaseNode
      id={id}
      title="Code JS"
      subtitle="Runs custom script"
      colorTheme="#10b981"
      inputs={inputs}
      outputs={[{ id: `${id}-result`, label: 'Result' }]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      }
    >
      <div style={{
        fontSize: '11px',
        fontFamily: 'monospace',
        color: 'var(--text-secondary)',
        background: 'var(--bg-input)',
        padding: '6px 8px',
        borderRadius: '6px',
        border: '1px solid var(--border-subtle)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {code.substring(0, 30)}{code.length > 30 ? '...' : ''}
      </div>
    </BaseNode>
  );
};
