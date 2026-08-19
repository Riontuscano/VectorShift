// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';

export const useStore = create((set, get) => ({
    nodes: [],
    edges: [],
    nodeIDs: {},
    executionLogs: [],
    isDebugging: false,
    debugPaused: false,
    currentNodeId: null,
    debugResolvePromise: null,
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      set({
        edges: [...get().edges, {...connection, type: 'smoothstep', animated: true, markerEnd: {type: MarkerType.Arrow, height: '20px', width: '20px'}}],
      });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            node.data = { ...node.data, [fieldName]: fieldValue };
          }
  
          return node;
        }),
      });
    },
    deleteNode: (nodeId) => {
      set({
        nodes: get().nodes.filter((node) => node.id !== nodeId),
        edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      });
    },
    setPipeline: (nodes, edges) => {
      set({
        nodes: nodes || [],
        edges: edges || [],
      });
    },
    addExecutionLog: (log) => {
      set((state) => ({
        executionLogs: [
          ...state.executionLogs,
          {
            ...log,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));
    },
    clearExecutionLogs: () => set({ executionLogs: [] }),
    setDebuggingState: (fields) => set(fields),
    triggerStep: () => {
      const { debugResolvePromise } = get();
      if (debugResolvePromise) {
        debugResolvePromise();
        set({ debugPaused: false, debugResolvePromise: null });
      }
    },
    triggerResume: () => {
      const { debugResolvePromise } = get();
      if (debugResolvePromise) {
        debugResolvePromise();
        set({ isDebugging: false, debugPaused: false, debugResolvePromise: null, currentNodeId: null });
      }
    },
  }));
