import { PineconeVector } from "@mastra/pinecone";

export const pineconeVector = new PineconeVector(
  process.env.PINECONE_API_KEY as string
);
