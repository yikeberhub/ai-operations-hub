import OpenAI from "openai";

const MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.embeddings.create({ model: MODEL, input: texts });
  return response.data.map((d) => d.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}
