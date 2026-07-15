import { BaseNode } from './baseNode';

export const JSONNode = ({ id, data }) => {
  const beautify = data?.beautify !== false;

  return (
    <BaseNode
      id={id}
      title="JSON"
      subtitle={beautify ? 'Beautify enabled' : 'Raw output'}
      colorTheme="#0d9488"
      inputs={[{ id: `${id}-raw`, label: 'Raw' }]}
      outputs={[
        { id: `${id}-parsed`, label: 'Parsed' },
        { id: `${id}-error`, label: 'Error' },
      ]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      }
    />
  );
};
