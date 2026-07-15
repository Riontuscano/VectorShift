import { BaseNode } from './baseNode';

export const DelayNode = ({ id, data }) => {
  const ms = data?.delayMs || 1000;

  return (
    <BaseNode
      id={id}
      title="Delay"
      subtitle={`${ms}ms`}
      colorTheme="#db2777"
      inputs={[{ id: `${id}-in`, label: 'In' }]}
      outputs={[{ id: `${id}-out`, label: 'Out' }]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      }
    />
  );
};
