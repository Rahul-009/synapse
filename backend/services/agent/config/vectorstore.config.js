import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings, EMBEDDING_DIMS } from "./embeddings.config.js";

export const COLLECTION = "documents";

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export const vectorStore = new QdrantVectorStore(embeddings, {
  client: qdrantClient,
  collectionName: COLLECTION,
});

export const ensureCollection = async () => {
  const { collections } = await qdrantClient.getCollections();
  if (!collections.some((c) => c.name === COLLECTION)) {
    await qdrantClient.createCollection(COLLECTION, {
      vectors: { size: EMBEDDING_DIMS, distance: "Cosine" },
    });
  }
  // Qdrant Cloud (strict mode) requires payload indexes for filtered
  // queries/deletes; creating an existing index is a no-op error we ignore
  for (const field of ["metadata.conversationId", "metadata.userId"]) {
    await qdrantClient
      .createPayloadIndex(COLLECTION, { field_name: field, field_schema: "keyword" })
      .catch(() => {});
  }
};

export const deleteConversationVectors = async (conversationId) => {
  await qdrantClient.delete(COLLECTION, {
    wait: true,
    filter: {
      must: [{ key: "metadata.conversationId", match: { value: conversationId } }],
    },
  });
};
