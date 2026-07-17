import { BaseNode } from './baseNode';

export const NotificationNode = ({ id, data }) => {
  const type = data?.notifType || 'Alert';
  return (
    <BaseNode
      id={id}
      title="Notify"
      subtitle={type}
      colorTheme="#f43f5e"
      inputs={[{ id: `${id}-input`, label: 'Input' }]}
      outputs={[]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      }
    />
  );
};
