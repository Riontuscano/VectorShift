import { BaseNode } from './baseNode';

export const LLMNode = ({ id }) => (
  <BaseNode
    id={id}
    title="LLM"
    subtitle="AI language model"
    colorTheme="#7c3aed"
    inputs={[
      { id: `${id}-system`, label: 'System' },
      { id: `${id}-prompt`, label: 'Prompt' },
    ]}
    outputs={[{ id: `${id}-response`, label: 'Response' }]}
    icon={
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    }
  />
);
