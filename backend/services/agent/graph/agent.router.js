import { SystemMessage } from "@langchain/core/messages";
import { routerModel } from "../config/llm.config.js";
import { AGENTS } from "./agent.state.js";

const ROUTER_PROMPT = `You are a router for a multi-agent assistant. Classify the user's latest message into exactly one category:

- coding: writing, debugging, explaining, or reviewing code
- search: current events, news, recent facts, or anything needing live web data
- pdf: questions about an attached or uploaded document/file — its contents, summary, results, or any message referring to "this document", "this file", "the pdf", or a 📎 attachment
- image: analyzing or describing an image
- chat: everything else (greetings, general questions, advice, creative writing)

Reply with ONLY the category word, nothing else.`;

export const supervisor = async (state) => {
  const lastUserMessage = [...state.messages]
    .reverse()
    .find((m) => m.getType?.() === "human" || m.role === "user");

  // An uploaded document is a strong signal for the pdf agent
  const hint = state.hasDocument
    ? `\n\nNote: the user has uploaded the document "${state.docName ?? "document"}" in this conversation. Questions about it are 'pdf'. Factual questions that could plausibly be asking about the document's contents should also be 'pdf' — only pick another category when the message clearly is not about the document (e.g. writing new code, greetings, current news).`
    : "";

  const response = await routerModel.invoke([
    new SystemMessage(ROUTER_PROMPT + hint),
    lastUserMessage ?? state.messages[state.messages.length - 1],
  ]);

  const choice = response.content?.trim().toLowerCase().replace(/[^a-z]/g, "");
  return { agent: AGENTS.includes(choice) ? choice : "chat" };
};
