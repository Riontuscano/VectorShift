import { BaseNode } from './baseNode';

const CONDITION_LABELS = {
  equals: 'Equals',
  contains: 'Contains',
  startsWith: 'Starts With',
  endsWith: 'Ends With',
  greaterThan: 'Greater Than',
  lessThan: 'Less Than',
  isEmpty: 'Is Empty',
  isNotEmpty: 'Is Not Empty',
  regex: 'Matches Regex',
};

export const RouterNode = ({ id, data }) => {
  const condition = data?.condition || 'contains';
  const displayCondition = CONDITION_LABELS[condition] || condition;

  return (
    <BaseNode
      id={id}
      title="Router"
      subtitle={`If ${displayCondition}`}
      colorTheme="#ea580c"
      inputs={[{ id: `${id}-input`, label: 'Input' }]}
      outputs={[
        { id: `${id}-true`, label: 'True' },
        { id: `${id}-false`, label: 'False' },
      ]}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/>
        </svg>
      }
    />
  );
};
