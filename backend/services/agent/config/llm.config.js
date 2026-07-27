import { ChatGroq } from "@langchain/groq";

// Fast, cheap classifier for the supervisor
export const routerModel = new ChatGroq({
  model: "llama-3.1-8b-instant",
  temperature: 0,
  maxTokens: 10,
});

// Main workhorse for chat / coding / pdf agents
export const mainModel = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
});

// Multimodal model for image understanding
export const visionModel = new ChatGroq({
  model: "qwen/qwen3.6-27b",
  temperature: 0.5,
  // qwen is a reasoning model — disable thinking so <think> blocks don't
  // leak into the output (reasoning_format is ignored by qwen on Groq)
  reasoningEffort: "none",
});

// Groq compound system with built-in web search
export const searchModel = new ChatGroq({
  model: "groq/compound-mini",
  temperature: 0.5,
});
