import { SystemMessage } from "@langchain/core/messages";
import { searchModel } from "../config/llm.config.js";

// groq/compound-mini performs web searches natively — no external search tool needed
const SYSTEM_PROMPT = `You are a research assistant with live web access.
Answer using up-to-date information from the web.
Cite your sources with markdown links at the end of the answer.
If results are inconclusive, say what you found and what remains uncertain.`;

export const searchAgent = async (state) => {
  const response = await searchModel.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...state.messages,
  ]);
  return { messages: [response] };
};
