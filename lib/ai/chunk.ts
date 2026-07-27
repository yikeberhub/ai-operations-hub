// Simple word-boundary chunker for embedding ingestion. Not sentence-aware,
// but good enough for short knowledge-base articles/FAQs.
export function chunkText(text: string, chunkSize = 1000, overlap = 150): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    let end = start;
    let length = 0;
    while (end < words.length && length + words[end].length + 1 <= chunkSize) {
      length += words[end].length + 1;
      end++;
    }
    if (end === start) end = start + 1; // guard against a single very long word

    chunks.push(words.slice(start, end).join(" "));

    if (end >= words.length) break;

    // step back by `overlap` characters worth of words for context continuity
    let overlapWords = 0;
    let overlapLength = 0;
    while (overlapWords < end - start && overlapLength < overlap) {
      overlapLength += words[end - 1 - overlapWords].length + 1;
      overlapWords++;
    }
    start = end - overlapWords;
  }

  return chunks;
}
