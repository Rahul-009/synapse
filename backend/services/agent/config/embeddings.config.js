import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Free tier on the Gemini API; reads GOOGLE_API_KEY. Produces 3072-dim vectors.
export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
});

export const EMBEDDING_DIMS = 3072;
