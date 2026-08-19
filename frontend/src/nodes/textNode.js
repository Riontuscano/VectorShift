import { BaseNode } from './baseNode';

export const TextNode = ({ id, data }) => {
  const text = data?.text || '{{input}}';


  const regex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/;
  const matches = [...text.matchAll(regex)];
  const variables = Array.from(new Set(matches.map(m => m[1])));

  const dynamicInputs = variables.map((varName) => ({
    id: `${id}-${varName}`,
    label: varName,
  }));

  return (
    <BaseNode
      id={id}
      title="Text"
      colorTheme="#ca8a04"
      inputs={dynamicInputs}
      outputs={[{ id: `${id}-output` }]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      }
    >
      <div
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '13px',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          minHeight: '36px',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: "'Smooch Sans', sans-serif",
          lineHeight: '1.4',
        }}
      >
        {text}
      </div>
    </BaseNode>
  );
};
