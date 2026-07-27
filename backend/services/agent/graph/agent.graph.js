import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, AGENTS } from "./agent.state.js";
import { supervisor } from "./agent.router.js";
import { chatAgent } from "../agents/chat.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { imageAgent } from "../agents/image.agent.js";

const graph = new StateGraph(AgentState)
  .addNode("supervisor", supervisor)
  .addNode("chat", chatAgent)
  .addNode("coding", codingAgent)
  .addNode("pdf", pdfAgent)
  .addNode("search", searchAgent)
  .addNode("image", imageAgent)
  // A pre-selected agent in the initial state bypasses the supervisor
  .addConditionalEdges(
    START,
    (state) => (AGENTS.includes(state.agent) ? state.agent : "supervisor"),
    ["supervisor", ...AGENTS]
  )
  .addConditionalEdges("supervisor", (state) => state.agent, AGENTS)
  .addEdge("chat", END)
  .addEdge("coding", END)
  .addEdge("pdf", END)
  .addEdge("search", END)
  .addEdge("image", END);

export const agentGraph = graph.compile();
