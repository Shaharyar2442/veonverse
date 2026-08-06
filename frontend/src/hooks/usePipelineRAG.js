import { useCallback, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function usePipelineRAG() {
  const [pipelineState, setPipelineState] = useState({
    isExecuting: false,
    activeNodeId: null,
    query: "How does Clarity is Our Superpower eliminate corporate confusion?",
    principleId: 1,
    nodes: {
      "node-query": { status: "idle", duration: 0, payload: null },
      "node-embed": { status: "idle", duration: 0, payload: null },
      "node-vector": { status: "idle", duration: 0, payload: null },
      "node-llm": { status: "idle", duration: 0, payload: null },
      "node-output": { status: "idle", duration: 0, payload: null },
    },
    retrievedSources: [],
    responseOutput: null,
    avatarState: "idle", // "idle", "thinking", "speaking"
    selectedNodeDetails: null,
  });

  const updateNode = (nodeId, status, duration = 0, payload = null) => {
    setPipelineState((prev) => ({
      ...prev,
      activeNodeId: status === "processing" ? nodeId : prev.activeNodeId,
      nodes: {
        ...prev.nodes,
        [nodeId]: { status, duration, payload },
      },
    }));
  };

  const setSelectedNode = (nodeId) => {
    setPipelineState((prev) => {
      const nodeData = prev.nodes[nodeId];
      if (!nodeData) return { ...prev, selectedNodeDetails: null };
      return {
        ...prev,
        selectedNodeDetails: {
          nodeId,
          ...nodeData,
        },
      };
    });
  };

  const runPipeline = useCallback(
    async (customQuery, principleId = pipelineState.principleId) => {
      const queryText = customQuery || pipelineState.query;

      setPipelineState((prev) => ({
        ...prev,
        isExecuting: true,
        query: queryText,
        principleId,
        avatarState: "thinking",
        responseOutput: null,
        retrievedSources: [],
      }));

      // Step 1: User Query Node
      const startTimeQuery = performance.now();
      updateNode("node-query", "processing");
      await new Promise((r) => setTimeout(r, 200));
      const queryDuration = Math.round(performance.now() - startTimeQuery);
      updateNode("node-query", "success", queryDuration, { query: queryText, principleId });

      // Step 2: Embedding Node
      const startTimeEmbed = performance.now();
      updateNode("node-embed", "processing");
      await new Promise((r) => setTimeout(r, 350));
      const embedDuration = Math.round(performance.now() - startTimeEmbed);
      const mockVectorSnippet = [0.042, -0.118, 0.285, -0.091, 0.412, "... (384 dimensions)"];
      updateNode("node-embed", "success", embedDuration, {
        model: "sentence-transformers/all-MiniLM-L6-v2",
        dimension: 384,
        vectorSnippet: mockVectorSnippet,
      });

      // Step 3: Vector Search / RAG Retrieval Node
      const startTimeVector = performance.now();
      updateNode("node-vector", "processing");
      await new Promise((r) => setTimeout(r, 300));
      const vectorDuration = Math.round(performance.now() - startTimeVector);

      try {
        // Step 4: LLM Inference via FastAPI Backend
        updateNode("node-llm", "processing");
        const startTimeLLM = performance.now();

        const response = await fetch(`${API_BASE_URL}/mentor/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: 1,
            question: queryText,
            principle_id: principleId,
          }),
        });

        const llmDuration = Math.round(performance.now() - startTimeLLM);

        if (!response.ok) {
          throw new Error(`RAG API returned ${response.status}`);
        }

        const data = await response.json();

        // Update Vector Node Payload with retrieved sources
        const mockSources = (data.sources || ["1", "2", "3"]).map((srcId, idx) => ({
          chunkId: srcId,
          score: (0.94 - idx * 0.04).toFixed(3),
          principleId,
          chunkType: "definition",
        }));

        updateNode("node-vector", "success", vectorDuration, {
          searchEngine: "pgvector / SQLite Cosine Similarity",
          topK: mockSources.length,
          matches: mockSources,
        });

        // Update LLM Node
        updateNode("node-llm", "success", llmDuration, {
          model: "llama-3.3-70b-versatile (Groq)",
          temperature: 0.4,
          maxTokens: 700,
          rawResponse: data.text,
        });

        // Step 5: Formatted Output & Avatar Node
        updateNode("node-output", "processing");
        await new Promise((r) => setTimeout(r, 150));
        updateNode("node-output", "success", 150, {
          avatarState: data.avatar_state || "Coaching & Feedback",
          text: data.text,
        });

        setPipelineState((prev) => ({
          ...prev,
          isExecuting: false,
          avatarState: "speaking",
          responseOutput: data.text,
          retrievedSources: mockSources,
        }));

        return data;
      } catch (err) {
        console.error("Pipeline Execution Error:", err);
        updateNode("node-llm", "error", 0, { error: err.message });
        updateNode("node-output", "error", 0, { error: err.message });

        setPipelineState((prev) => ({
          ...prev,
          isExecuting: false,
          avatarState: "idle",
        }));
        return null;
      }
    },
    [pipelineState.query, pipelineState.principleId]
  );

  return {
    pipelineState,
    runPipeline,
    setSelectedNode,
    setPipelineState,
  };
}
