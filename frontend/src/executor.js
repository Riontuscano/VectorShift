import { Position } from 'reactflow';

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
      // Mock LLM generation
      const response = `[LLM Response] Under system guidelines: "${system}", processed query: "${prompt}".`;
      return { [`${node.id}-response`]: response };
    }
    case 'api': {
      const url = d.url || '';
      const method = d.method || 'GET';
      const payload = inputs[`${node.id}-payload`] || '';
      // Mock API call response
      return {
        [`${node.id}-response`]: `[API ${method} Response] Success from endpoint: ${url}. Payload processed: ${JSON.stringify(payload)}`,
        [`${node.id}-status`]: 200,
      };
    }
    case 'db': {
      const dbType = d.dbType || 'PostgreSQL';
      const query = d.query || '';
      const params = inputs[`${node.id}-params`] || '';
      // Mock Database results
      return {
        [`${node.id}-results`]: `[${dbType} Query Result] Executed: "${query}" with arguments: "${JSON.stringify(params)}"`,
      };
    }
    case 'router': {
      const condition = d.condition || 'contains';
      const checkValue = d.value || '';
      const inputVal = String(inputs[`${node.id}-input`] || '');

      let matched = false;
      if (condition === 'equals') matched = (inputVal === checkValue);
      else if (condition === 'contains') matched = inputVal.includes(checkValue);
      else if (condition === 'startsWith') matched = inputVal.startsWith(checkValue);
      else if (condition === 'greaterThan') matched = (Number(inputVal) > Number(checkValue));

      return matched
        ? { [`${node.id}-true`]: inputVal, [`${node.id}-false`]: null }
        : { [`${node.id}-true`]: null, [`${node.id}-false`]: inputVal };
    }
    case 'delay': {
      const delayMs = d.delayMs || 1000;
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
          [`${node.id}-error`]: null,
        };
      } catch (err) {
        return { [`${node.id}-parsed`]: null, [`${node.id}-error`]: err.message };
      }
    }
    case 'customOutput': {
      const val = inputs[`${node.id}-value`] || '';
      return { [`${node.id}-value`]: val };
    }
    default:
      return {};
  }
};
