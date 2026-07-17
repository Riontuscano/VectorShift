import { BaseNode } from './baseNode';

export const SwitchNode = ({ id, data }) => {
  const cases = data?.cases || ['Case 1'];
  
  const outputs = [
    ...cases.map((c, index) => ({
      id: `${id}-case-${index}`,
      label: c || `Case ${index + 1}`,
    })),
    { id: `${id}-default`, label: 'Default' },
  ];

  return (
    <BaseNode
      id={id}
      title="Switch"
      subtitle={`Branches: ${cases.length}`}
      colorTheme="#8b5cf6"
      inputs={[{ id: `${id}-input`, label: 'Input' }]}
      outputs={outputs}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4" />
          <path d="M20 8h-5" />
          <path d="M20 12h-5" />
          <path d="M20 16h-5" />
        </svg>
      }
    />
  );
};
