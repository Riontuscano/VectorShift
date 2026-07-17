
import { useStore } from './store';
import { showAlert } from './utils/alert';

/**
 * Topologically sorts the canvas DAG using Kahn's Algorithm.
 */
export const topologicalSort = (nodes, edges) => {
  const adj = {};
  const inDegree = {};

  nodes.forEach(node => {
    adj[node.id] = [];
    inDegree[node.id] = 0;
  });

  edges.forEach(edge => {
    const src = edge.source;
    const tgt = edge.target;
    if (adj[src]) {
      adj[src].push(tgt);
    }
    if (inDegree[tgt] !== undefined) {
      inDegree[tgt]++;
    }
  });

  const queue = nodes.filter(node => inDegree[node.id] === 0).map(node => node.id);
  const order = [];

  while (queue.length > 0) {
    const u = queue.shift();
    order.push(u);

    (adj[u] || []).forEach(v => {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    });
  }

  if (order.length < nodes.length) {
    return null; // Cycle detected
  }

  return order.map(id => nodes.find(n => n.id === id));
};

/**
 * Executes a single node's processing logic based on its inputs and properties.
 */
export const executeNode = async (node, inputs) => {
  const d = node.data || {};

  switch (node.type) {
    case 'customInput': {
      const val = d.inputValue || '';
      return { [`${node.id}-value`]: val };
    }
    case 'text': {
      let template = d.text || '';
      // Replace {{varName}} with matching input values
      Object.entries(inputs).forEach(([key, val]) => {
        const varName = key.replace(`${node.id}-`, '');
        const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g');
        template = template.replace(regex, val ?? '');
      });
      return { [`${node.id}-output`]: template };
    }
    case 'llm': {
      const system = inputs[`${node.id}-system`] || '';
      const prompt = inputs[`${node.id}-prompt`] || '';
      try {
        const res = await fetch('http://localhost:8000/pipelines/llm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ system, prompt })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to call LLM');
        }
        const data = await res.json();
        return { [`${node.id}-response`]: data.response };
      } catch (err) {
        return { [`${node.id}-response`]: `[LLM Error] ${err.message}` };
      }
    }
    case 'api': {
      const url = d.url || '';
      const method = d.method || 'GET';
      const payload = inputs[`${node.id}-payload`] || null;
      try {
        const res = await fetch('http://localhost:8000/pipelines/api_proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url, method, payload })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'API execution failed');
        }
        const data = await res.json();
        return {
          [`${node.id}-response`]: data.response,
          [`${node.id}-status`]: data.status,
        };
      } catch (err) {
        return {
          [`${node.id}-response`]: `[API Error] ${err.message}`,
          [`${node.id}-status`]: 500,
        };
      }
    }
    case 'db': {
      const dbType = d.dbType || 'PostgreSQL';
      const query = d.query || '';
      const params = inputs[`${node.id}-params`] || null;
      try {
        const res = await fetch('http://localhost:8000/pipelines/db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ dbType, query, params })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Database execution failed');
        }
        const data = await res.json();
        return {
          [`${node.id}-results`]: data.results,
        };
      } catch (err) {
        return {
          [`${node.id}-results`]: `[DB Error] ${err.message}`,
        };
      }
    }
    case 'router': {
      const condition = d.condition || 'contains';
      const checkValue = d.value || '';
      const inputVal = String(inputs[`${node.id}-input`] ?? '');

      let matched = false;
      if (condition === 'equals') matched = (inputVal === checkValue);
      else if (condition === 'contains') matched = inputVal.includes(checkValue);
      else if (condition === 'startsWith') matched = inputVal.startsWith(checkValue);
      else if (condition === 'endsWith') matched = inputVal.endsWith(checkValue);
      else if (condition === 'greaterThan') matched = (Number(inputVal) > Number(checkValue));
      else if (condition === 'lessThan') matched = (Number(inputVal) < Number(checkValue));
      else if (condition === 'isEmpty') matched = (inputVal.trim() === '');
      else if (condition === 'isNotEmpty') matched = (inputVal.trim() !== '');
      else if (condition === 'regex') {
        try {
          matched = new RegExp(checkValue).test(inputVal);
        } catch (e) {
          matched = false;
        }
      }

      return matched
        ? { [`${node.id}-true`]: inputVal }
        : { [`${node.id}-false`]: inputVal };
    }
    case 'delay': {
      const delayMs = Number(d.delayMs) || 1000;
      const val = inputs[`${node.id}-in`] || '';
      // Wait for delay duration
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return { [`${node.id}-out`]: val };
    }
    case 'json': {
      const raw = inputs[`${node.id}-raw`] || '';
      const beautify = d.beautify !== false;
      try {
        const parsed = JSON.parse(raw);
        return {
          [`${node.id}-parsed`]: beautify ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed),
        };
      } catch (err) {
        return {
          [`${node.id}-error`]: err.message,
        };
      }
    }
    case 'customOutput': {
      const val = inputs[`${node.id}-value`] || '';
      return { [`${node.id}-value`]: val };
    }
    case 'switch': {
      const cases = d.cases || ['Case 1'];
      const inputVal = String(inputs[`${node.id}-input`] ?? '');
      
      let matchedIndex = -1;
      for (let i = 0; i < cases.length; i++) {
        if (inputVal === cases[i]) {
          matchedIndex = i;
          break;
        }
      }
      
      if (matchedIndex !== -1) {
        return { [`${node.id}-case-${matchedIndex}`]: inputVal };
      } else {
        return { [`${node.id}-default`]: inputVal };
      }
    }
    case 'codeRunner': {
      const code = d.code || 'return inputs.a + inputs.b;';
      const inputPortsString = d.inputPorts || 'a, b';
      
      const parsedInputs = {};
      const portNames = inputPortsString.split(',').map(p => p.trim()).filter(Boolean);
      portNames.forEach(p => {
        parsedInputs[p] = inputs[`${node.id}-${p}`];
      });
      
      try {
        const fn = new Function('inputs', code);
        const result = fn(parsedInputs);
        return { [`${node.id}-result`]: result };
      } catch (err) {
        return { [`${node.id}-result`]: `[Script Error] ${err.message}` };
      }
    }
    case 'notification': {
      const notifType = d.notifType || 'Alert';
      const messageTemplate = d.messageTemplate || 'Pipeline finished with value: {{input}}';
      const inputVal = inputs[`${node.id}-input`] || '';
      
      const message = messageTemplate.replace(/\{\{\s*input\s*\}\}/g, String(inputVal));
      
      if (notifType === 'Slack Webhook') {
        const url = d.webhookUrl || '';
        if (url) {
          try {
            await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: message }),
              mode: 'no-cors',
            });
          } catch (e) {
            console.error('Slack webhook failed:', e);
          }
        }
      } else {
        showAlert('Pipeline Notification', message, 'info');
      }
      return {};
    }
    default:
      return {};
  }
};

/**
 * Orchestrates the execution of the entire workflow.
 * Supports Parallel Execution in normal mode, and Step-by-Step Stepping in debug mode.
 */
export const executePipeline = async ({
  nodes,
  edges,
  isDebugMode,
  updateNodeField,
  addExecutionLog,
  setDebuggingState,
  onSubmission,
}) => {
  // 1. Reset execution states in store
  nodes.forEach(node => {
    updateNodeField(node.id, 'status', 'idle');
    updateNodeField(node.id, 'outputVal', null);
  });

  const nodeOutputs = {};
  
  // Track in-degrees of nodes in the active graph
  const inDegree = {};
  const adj = {}; // sourceNodeId -> array of { target, targetHandle, sourceHandle }
  
  nodes.forEach(node => {
    inDegree[node.id] = 0;
    adj[node.id] = [];
  });
  
  edges.forEach(edge => {
    const src = edge.source;
    const tgt = edge.target;
    if (inDegree[tgt] !== undefined) {
      inDegree[tgt]++;
    }
    if (adj[src]) {
      adj[src].push({
        target: tgt,
        targetHandle: edge.targetHandle,
        sourceHandle: edge.sourceHandle,
      });
    }
  });

  if (isDebugMode) {
    // === Sequential Stepping Debug Mode ===
    const sortedNodes = topologicalSort(nodes, edges);
    if (!sortedNodes) {
      onSubmission(null, 'Topological sort failed. Graph contains cycles.');
      return;
    }

    addExecutionLog({
      status: 'info',
      message: 'Debugger started. Use "Step" or "Resume" controls.',
    });

    for (const node of sortedNodes) {
      // Check if debug was cancelled/aborted
      const currentDbgState = useStore.getState();
      if (!currentDbgState.isDebugging && currentDbgState.currentNodeId === null) {
        addExecutionLog({ status: 'warning', message: 'Debugging aborted by user.' });
        return;
      }

      // Gather resolved inputs
      const incomingEdges = edges.filter(e => e.target === node.id);
      const resolvedInputs = {};
      incomingEdges.forEach(edge => {
        const sourceVal = (nodeOutputs[edge.source] || {})[edge.sourceHandle];
        resolvedInputs[edge.targetHandle] = sourceVal;
      });

      // Pause before running this node
      let stepResolver = null;
      const stepPromise = new Promise(resolve => {
        stepResolver = resolve;
      });

      setDebuggingState({
        isDebugging: true,
        debugPaused: true,
        currentNodeId: node.id,
        debugResolvePromise: stepResolver,
      });

      addExecutionLog({
        nodeId: node.id,
        nodeType: node.type,
        status: 'running',
        message: `Paused before executing ${node.id}`,
        inputs: resolvedInputs,
      });
      updateNodeField(node.id, 'status', 'running');

      // Wait for user to trigger step or resume
      await stepPromise;

      // Check if debugging was turned off / stopped
      const postStepState = useStore.getState();
      if (!postStepState.isDebugging && postStepState.currentNodeId === null) {
        updateNodeField(node.id, 'status', 'idle');
        addExecutionLog({ status: 'warning', message: 'Debugging aborted by user.' });
        return;
      }

      const startTime = performance.now();
      try {
        const outputs = await executeNode(node, resolvedInputs);
        const duration = (performance.now() - startTime).toFixed(1);
        nodeOutputs[node.id] = outputs;
        
        updateNodeField(node.id, 'status', 'completed');
        updateNodeField(node.id, 'outputVal', JSON.stringify(outputs));
        
        addExecutionLog({
          nodeId: node.id,
          nodeType: node.type,
          status: 'completed',
          message: `Completed in ${duration}ms`,
          inputs: resolvedInputs,
          outputs,
        });
      } catch (err) {
        updateNodeField(node.id, 'status', 'error');
        addExecutionLog({
          nodeId: node.id,
          nodeType: node.type,
          status: 'error',
          message: `Error at node ${node.id}: ${err.message}`,
        });
        setDebuggingState({ isDebugging: false, debugPaused: false, currentNodeId: null, debugResolvePromise: null });
        onSubmission(null, `Error at node ${node.id}: ${err.message}`);
        return;
      }
      
      // Delay for visual trace effect
      await new Promise(r => setTimeout(r, 600));
    }

    setDebuggingState({ isDebugging: false, debugPaused: false, currentNodeId: null, debugResolvePromise: null });
    addExecutionLog({ status: 'success', message: 'Debugging finished successfully!' });
    onSubmission({ num_nodes: nodes.length, num_edges: edges.length, is_dag: true, executionResult: nodeOutputs }, null);

  } else {
    // === Parallel Normal Execution Mode ===
    const queue = nodes.filter(node => inDegree[node.id] === 0);
    const inDegreesDynamic = { ...inDegree };
    const processedNodes = new Set();

    addExecutionLog({
      status: 'info',
      message: 'Starting parallel execution...',
    });

    const runNodeProcess = async (node) => {
      // Resolve inputs
      const incomingEdges = edges.filter(e => e.target === node.id);
      const resolvedInputs = {};
      incomingEdges.forEach(edge => {
        const sourceVal = (nodeOutputs[edge.source] || {})[edge.sourceHandle];
        resolvedInputs[edge.targetHandle] = sourceVal;
      });

      updateNodeField(node.id, 'status', 'running');
      addExecutionLog({
        nodeId: node.id,
        nodeType: node.type,
        status: 'running',
        message: `Executing ${node.id}...`,
        inputs: resolvedInputs,
      });

      const startTime = performance.now();
      try {
        const outputs = await executeNode(node, resolvedInputs);
        const duration = (performance.now() - startTime).toFixed(1);
        nodeOutputs[node.id] = outputs;

        updateNodeField(node.id, 'status', 'completed');
        updateNodeField(node.id, 'outputVal', JSON.stringify(outputs));

        addExecutionLog({
          nodeId: node.id,
          nodeType: node.type,
          status: 'completed',
          message: `Completed in ${duration}ms`,
          inputs: resolvedInputs,
          outputs,
        });

        // Trigger descendants
        const nextNodes = [];
        (adj[node.id] || []).forEach(edgeInfo => {
          inDegreesDynamic[edgeInfo.target]--;
          if (inDegreesDynamic[edgeInfo.target] === 0) {
            const nextNode = nodes.find(n => n.id === edgeInfo.target);
            if (nextNode && !processedNodes.has(nextNode.id)) {
              processedNodes.add(nextNode.id);
              nextNodes.push(nextNode);
            }
          }
        });

        // Small visual delay
        await new Promise(r => setTimeout(r, 600));

        // Recursively run next layers
        if (nextNodes.length > 0) {
          await Promise.all(nextNodes.map(n => runNodeProcess(n)));
        }

      } catch (err) {
        updateNodeField(node.id, 'status', 'error');
        addExecutionLog({
          nodeId: node.id,
          nodeType: node.type,
          status: 'error',
          message: `Error: ${err.message}`,
        });
        throw err;
      }
    };

    try {
      queue.forEach(n => processedNodes.add(n.id));
      await Promise.all(queue.map(node => runNodeProcess(node)));

      addExecutionLog({
        status: 'success',
        message: 'Execution finished successfully!',
      });

      onSubmission({ num_nodes: nodes.length, num_edges: edges.length, is_dag: true, executionResult: nodeOutputs }, null);
    } catch (err) {
      onSubmission(null, `Execution failed: ${err.message}`);
    }
  }
};

