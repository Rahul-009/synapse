import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { agentGraph } from "../graph/agent.graph.js";
import { AGENTS } from "../graph/agent.state.js";

// content may be a plain string or a multimodal parts array (text + image_url)
const toLangchainMessages = (messages) =>
  messages.map((m) =>
    m.role === "assistant"
      ? new AIMessage(typeof m.content === "string" ? m.content : "")
      : new HumanMessage({ content: m.content })
  );

const sendEvent = (res, event, data) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

export const runAgent = async (req, res) => {
  const { messages, agent, conversationId, hasDocument, docName } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: "messages array is required" });
  }

  // Optional manual agent selection — bypasses the supervisor in the graph
  const presetAgent = AGENTS.includes(agent) ? agent : null;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const abortController = new AbortController();
  // res "close" fires on client disconnect; req "close" would fire as soon as
  // the request body is consumed, aborting the run immediately
  res.on("close", () => {
    if (!res.writableEnded) abortController.abort();
  });

  let fullText = "";
  let chosenAgent = presetAgent;

  try {
    if (presetAgent) {
      // The supervisor never runs, so announce the agent up front
      sendEvent(res, "agent", { agent: presetAgent });
    }

    const stream = agentGraph.streamEvents(
      {
        messages: toLangchainMessages(messages),
        agent: presetAgent,
        conversationId,
        hasDocument: Boolean(hasDocument),
        docName,
      },
      { version: "v2", signal: abortController.signal }
    );

    for await (const event of stream) {
      const node = event.metadata?.langgraph_node;

      if (event.event === "on_chain_end" && event.name === "supervisor") {
        chosenAgent = event.data?.output?.agent ?? "chat";
        sendEvent(res, "agent", { agent: chosenAgent });
      }

      if (event.event === "on_chat_model_stream" && node !== "supervisor") {
        const token = event.data?.chunk?.content;
        if (typeof token === "string" && token.length > 0) {
          fullText += token;
          sendEvent(res, "token", { token });
        }
      }
    }

    sendEvent(res, "done", { agent: chosenAgent, content: fullText });
  } catch (error) {
    if (!abortController.signal.aborted) {
      console.error("Agent run error:", error.message);
      sendEvent(res, "error", { message: "Agent failed to respond" });
    }
  } finally {
    res.end();
  }
};
