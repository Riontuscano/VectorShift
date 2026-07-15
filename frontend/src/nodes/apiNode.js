import { BaseNode } from './baseNode';

export const APINode = ({ id, data }) => {
  const method = data?.method || 'GET';
  const url = data?.url || 'https://api.example.com';
  const shortUrl = url.length > 28 ? url.substring(0, 28) + '…' : url;

  return (
    <BaseNode
      id={id}
      title="API"
      subtitle={`${method} · ${shortUrl}`}
      colorTheme="#2563eb"
      inputs={[{ id: `${id}-payload`, label: 'Payload' }]}
      outputs={[
        { id: `${id}-response`, label: 'Response' },
        { id: `${id}-status`, label: 'Status' },
      ]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      }
    />
  );
};
