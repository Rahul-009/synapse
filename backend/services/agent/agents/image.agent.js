import { SystemMessage } from "@langchain/core/messages";
import { visionModel } from "../config/llm.config.js";

const SYSTEM_PROMPT = `You are an image analysis assistant.
Describe, interpret, and answer questions about images the user provides.
User messages may contain image_url content parts alongside text.
You cannot generate or edit images — if asked to, explain that you can only
analyze images, and offer to describe or discuss one instead.`;

export const imageAgent = async (state) => {
  const response = await visionModel.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...state.messages,
  ]);
  return { messages: [response] };
};
