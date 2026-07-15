import { BaseNode } from './baseNode';

export const InputNode = ({ id, data }) => {
  const name = data?.inputName || id.replace('customInput-', 'input_');
  const type = data?.inputType || 'Text';

  return (
    <BaseNode
      id={id}
      title="Input"
      subtitle={`${name} · ${type}`}
      colorTheme="#16a34a"
      outputs={[{ id: `${id}-value` }]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/>
        </svg>
      }
    />
  );
};
