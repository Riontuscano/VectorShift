import { DraggableNode } from './draggableNode';

export const PipelineToolbar = () => {
    return (
        <div className="pipeline-nodes-list">
            <DraggableNode type='customInput' label='Input' />
            <DraggableNode type='llm' label='LLM' />
            <DraggableNode type='customOutput' label='Output' />
            <DraggableNode type='text' label='Text' />
            <DraggableNode type='api' label='API' />
            <DraggableNode type='db' label='Database' />
            <DraggableNode type='router' label='Router' />
            <DraggableNode type='switch' label='Switch' />
            <DraggableNode type='codeRunner' label='JS Code' />
            <DraggableNode type='notification' label='Notify' />
            <DraggableNode type='delay' label='Delay' />
            <DraggableNode type='json' label='JSON' />
        </div>
    );
};
