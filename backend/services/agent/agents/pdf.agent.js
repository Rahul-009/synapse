import { SystemMessage } from "@langchain/core/messages";
import { mainModel } from "../config/llm.config.js";
import { vectorStore, ensureCollection } from "../config/vectorstore.config.js";

const NO_SPECULATION =
  "Never infer, guess, or speculate about the document's contents from its file name or from 📎 attachment markers in the conversation. ";

const NO_CONTEXT_PROMPT = `You are a document analysis assistant, but no document
has been indexed for this conversation. ${NO_SPECULATION}
Politely ask the user to attach the document (.pdf, .txt or .md) they want to discuss.`;

const RETRIEVAL_FAILED_PROMPT = (
  docName,
) => `You are a document analysis assistant.
The user has uploaded "${docName ?? "a document"}" in this conversation, but no
relevant content could be retrieved for their current question.
${NO_SPECULATION}
Tell the user plainly that you couldn't retrieve the document's content for this
question, and suggest they rephrase the question or re-attach the document.`;

const buildPrompt = (chunks) => `You are a document analysis assistant.
Answer the user's question strictly based on the retrieved document below. Quote relevant passages when useful. If the answer is not in the document, say so — do not invent content. ${NO_SPECULATION}

Retrieved information:
${chunks
  .map(
    (doc, i) =>
      `[${i + 1}] (${doc.metadata?.source ?? "document"}) ${doc.pageContent}`,
  )
  .join("\n\n")}`;

const latestQuestion = (messages) => {
  const lastUser = [...messages]
    .reverse()
    .find((m) => m.getType?.() === "human" || m.role === "user");
  const content = lastUser?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ");
  }
  return "";
};

export const pdfAgent = async (state) => {
  let chunks = [];

  if (state.conversationId) {
    try {
      await ensureCollection();
      chunks = await vectorStore.similaritySearch(
        latestQuestion(state.messages) || "document summary",
        5,
        {
          must: [
            {
              key: "metadata.conversationId",
              match: { value: state.conversationId },
            },
          ],
        },
      );
    } catch (error) {
      console.error("RAG retrieval error:", error.message);
    }
  }
  console.log(
    `pdf agent: retrieved ${chunks.length} chunks for conversation ${state.conversationId ?? "(none)"}`,
  );

  let systemPrompt;
  if (chunks.length > 0) {
    systemPrompt = buildPrompt(chunks);
  } else if (state.hasDocument) {
    systemPrompt = RETRIEVAL_FAILED_PROMPT(state.docName);
  } else {
    systemPrompt = NO_CONTEXT_PROMPT;
  }

  const response = await mainModel.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages,
  ]);
  return { messages: [response] };
};
