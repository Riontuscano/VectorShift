import { BaseNode } from './baseNode';

export const OutputNode = ({ id, data }) => {
  const name = data?.outputName || id.replace('customOutput-', 'output_');
  const type = data?.outputType || 'Text';

  return (
    <BaseNode
      id={id}
      title="Output"
      subtitle={`${name} · ${type}`}
      colorTheme="#e11d48"
      inputs={[{ id: `${id}-value` }]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 21v-9"/><path d="m16 12-4-4-4 4"/>
        </svg>
      }
    />
  );
};
