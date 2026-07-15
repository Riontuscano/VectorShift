import { BaseNode } from './baseNode';

export const DBNode = ({ id, data }) => {
  const dbType = data?.dbType || 'PostgreSQL';

  return (
    <BaseNode
      id={id}
      title="Database"
      subtitle={dbType}
      colorTheme="#0891b2"
      inputs={[{ id: `${id}-params`, label: 'Params' }]}
      outputs={[{ id: `${id}-results`, label: 'Results' }]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
        </svg>
      }
    />
  );
};
