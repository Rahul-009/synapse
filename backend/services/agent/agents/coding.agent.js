import { SystemMessage } from "@langchain/core/messages";
import { mainModel } from "../config/llm.config.js";

const SYSTEM_PROMPT = `You are an expert software engineer.
- Write clean, idiomatic, working code.
- Always put code in fenced markdown blocks with the language tag.
- Explain briefly what the code does and any important caveats.
- When debugging, identify the root cause before proposing a fix.`;

export const codingAgent = async (state) => {
  const response = await mainModel.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...state.messages,
  ]);
  return { messages: [response] };
};
