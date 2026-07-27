import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// Valid routing targets — must match the node names in the graph
export const AGENTS = ["chat", "coding", "pdf", "search", "image"];

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  // which specialized agent the supervisor routed to
  agent: Annotation(),
  // scopes RAG retrieval to this conversation's document vectors
  conversationId: Annotation(),
  // router hint: a document has been uploaded for this conversation
  hasDocument: Annotation(),
  // filename of the indexed document, if any
  docName: Annotation(),
});
