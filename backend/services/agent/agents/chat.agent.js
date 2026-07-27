import { SystemMessage } from "@langchain/core/messages";
import { mainModel } from "../config/llm.config.js";

const SYSTEM_PROMPT = `You are a friendly, helpful conversational assistant.
Be warm and natural. Keep answers concise unless the user asks for depth.
Use markdown formatting when it helps readability.
If the user asks about the contents of an attached file (📎 markers), do not
guess from the file name — tell them the Document agent handles attached files
and they can select it or re-ask their question about the document.`;

export const chatAgent = async (state) => {
  const response = await mainModel.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...state.messages,
  ]);
  return { messages: [response] };
};
