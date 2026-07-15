import { BaseNode } from './baseNode';

export const TextNode = ({ id, data }) => {
  const text = data?.text || '{{input}}';
  const preview = text.length > 30 ? text.substring(0, 30) + '…' : text;

  return (
    <BaseNode
      id={id}
      title="Text"
      subtitle={preview}
      colorTheme="#ca8a04"
      outputs={[{ id: `${id}-output` }]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
        </svg>
      }
    />
  );
};
