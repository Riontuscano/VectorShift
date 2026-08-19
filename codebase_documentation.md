# Technical Assessment Documentation - Codebase Scan

This document outlines the detailed architecture and components of the VectorShift workflow builder project.

---

## 1. Node Library & Workings

All workflow nodes are defined in the `frontend/src/nodes/` directory. They all consume the custom superclass abstraction [baseNode.js](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/baseNode.js).

### [Input Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/inputNode.js)
- **Role**: Entry point for workflows to capture user values.
- **Config**: Name of input, initial value, and type selection (`Text` / `File`).
- **Outputs**: Outputs the captured text value.

### [Output Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/outputNode.js)
- **Role**: Endpoint for capturing results of the workflow.
- **Config**: Name of output, and type selection (`Text` / `Image`).
- **Inputs**: Receives final values to display.

### [Text Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/textNode.js)
- **Role**: Formats text strings using variables (e.g. `{{name}}`).
- **Config**: Multi-line template text editor.
- **Inputs**: Dynamically generates a target handle on the left side for each variable defined in double curly braces.
- **Outputs**: Outputs the interpolated string template.

### [LLM Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/llmNode.js)
- **Role**: Invokes a Large Language Model (configured to Llama-3.3-70b-versatile via Groq).
- **Inputs**: Receives a `system` prompt instruction handle and a `prompt` user input handle.
- **Outputs**: Generates a completed text output.

### [API Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/apiNode.js)
- **Role**: Performs proxy HTTP REST calls to a third-party service.
- **Config**: Target URL and HTTP Method selection (`GET`, `POST`, `PUT`, `DELETE`).
- **Inputs**: Receives optional json `payload` input.
- **Outputs**: Returns raw `response` body and numeric HTTP `status` code.

### [Router Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/routerNode.js)
- **Role**: Simple conditional branching.
- **Config**: Selection of condition (`Equals`, `Contains`, `Starts With`, `Ends With`, `Greater Than`, `Less Than`, `Is Empty`, `Matches Regex`) and target comparison value.
- **Inputs**: Input data to check.
- **Outputs**: Routes incoming values to either `True` or `False` output handles.

### [Switch Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/switchNode.js) [NEW]
- **Role**: Multi-branch conditional logic routing.
- **Config**: List of match cases (which users can add or remove dynamically in the right sidebar).
- **Inputs**: Data payload to route.
- **Outputs**: Renders an output handle for each defined match case plus a `Default` fallback handle. Routes the data payload to the matching case.

### [JS Code Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/codeNode.js) [NEW]
- **Role**: Executes sandboxed JavaScript code inside the browser.
- **Config**: Comma-separated list of input port names and raw JavaScript code.
- **Inputs**: Renders a target handle for each defined input port name.
- **Outputs**: Outputs the returned value as a `Result` output.

### [Notify Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/notificationNode.js) [NEW]
- **Role**: Dispatches actions or triggers external integrations.
- **Config**: Notification Type (`Alert` / `Slack Webhook`), Webhook URL, and Message Template string.
- **Inputs**: Receives trigger payload data.
- **Outputs**: Dispatches browser alerts or sends POST webhook payloads.

### [Delay Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/delayNode.js)
- **Role**: Pauses pipeline execution for a specified duration.
- **Config**: Number of milliseconds to delay.
- **Inputs**: Data to pass through.
- **Outputs**: Outputs the exact incoming data after the elapsed duration.

### [JSON Node](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/jsonNode.js)
- **Role**: Formats raw text strings to JSON structure.
- **Config**: Optional beautify toggle checkbox.
- **Inputs**: Raw string input.
- **Outputs**: Formatted/beautified JSON string output.

---

## 2. Edge Connections & Data Transfer

Data transfer and canvas connections are handled through React Flow edge structures and our local execution engine in [executor.js](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/executor.js).

### Graph Representation
1. In the React Flow canvas, connections between nodes are saved as `edges` inside the Zustand [store.js](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/store.js).
2. Each edge contains:
   - `source`: The originating node ID.
   - `sourceHandle`: The specific output port ID of the originating node.
   - `target`: The receiving node ID.
   - `targetHandle`: The specific input port ID of the receiving node.

### Execution Resolution
Before running a node in `executePipeline`, the engine resolves its inputs from the completed outputs of its ancestors:
1. Finds all incoming edges where `edge.target === node.id`.
2. Inspects `nodeOutputs[edge.source]`, which maps the source node's outputs by handle IDs.
3. Retrieves the value from the output handle matching `edge.sourceHandle`.
4. Maps it to the target node's input handle under `resolvedInputs[edge.targetHandle]`.
5. Passes the `resolvedInputs` object directly to the node's local execution function.

---

## 3. Creating a Superclass Abstraction to Dry Node Modules

To resolve repeated code across nodes (headers, styles, status indicators, and handle placements), we implemented a reusable superclass component called `BaseNode` in [baseNode.js](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/nodes/baseNode.js).

### Unified Node wrapper responsibilities:
- **Visual Styles**: Applies a glassmorphic look, box-shadow transitions, and dynamic glowing borders reflecting execution states (Running, Completed, Skipped, Error).
- **Header Layout**: Renders uniform titles, subtitles, and icons.
- **Execution Status Badge**: Renders real-time status pills automatically.
- **Ports & Handles Positioning**:
  - If handles are configured with a `label`, it automatically formats them in custom row alignments with left-aligned inputs and right-aligned outputs.
  - If handles are unlabeled, it calculates percentages and stacks them on the left/right borders.
- **Boilerplate Reduction**: Sub-nodes now only have to specify their unique config settings and properties. This reduces the size of custom node files (e.g. [dbNode.js] or [routerNode.js]) to less than 40 lines of code.

---

## 4. Execution Logs, Debugger Panel, & Parallel Running

We implemented a collapsible bottom debugger panel in [debuggerPanel.js](file:///Users/rio/Downloads/frontend_technical_assessment/frontend/src/components/debuggerPanel.js) tied to the Zustand store.

### How Parallel Execution Works
When executing a normal pipeline run (not debugging):
1. **In-Degree Setup**: We build an in-degree map for each node in the graph.
2. **Initial Layer**: We scan and start running all nodes with an initial in-degree of 0 (which have no incoming connections) concurrently using `Promise.all`.
3. **Dynamic Graph Traversal**:
   - As each node completes, we subtract 1 from the remaining in-degree of all connected descendant nodes.
   - If a descendant's in-degree drops to 0 (meaning all of its prerequisites have executed), it is queued and executed immediately in a new parallel block.
4. **Cascading Branch Skip**:
   - If a router/switch node executes and does not activate a specific output branch, the edges originating from that handle are marked inactive.
   - Downstream nodes check their incoming edges. If they are fed by inactive paths, they get skipped. They propagate this skip status down to their child nodes, ensuring they don't execute with empty or `undefined` values.

### How the Step-by-Step Debugger Works
When running in debug mode:
1. **Sequential Stepping**: The engine performs a topological sort to get a clean linear order of execution.
2. **Promise-Based Pause**:
   - Before executing a node, the loop creates a pending `Promise` and stores its `resolve` trigger in the Zustand store.
   - The engine changes the node status to `running`, pushes a debug message to `executionLogs`, and **awaits** the step promise, suspending the topological execution loop.
3. **Step & Resume**:
   - Clicking **Step** triggers the stored resolve function, resuming the loop for just a single node, and pauses again on the next node.
   - Clicking **Resume** disables debugging mode, resolves the promise, and runs all remaining nodes in the sequence without pausing.
   - Clicking **Stop** resolves the promise, clears the debugger states, and stops execution immediately.
