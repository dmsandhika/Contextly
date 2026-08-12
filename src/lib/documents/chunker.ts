export interface TextChunk {
  chunkIndex: number;
  content: string;
  charCount: number;
}

export interface ChunkingOptions {
  maxChunkSize?: number;
  chunkOverlap?: number;
}

export function splitTextIntoChunks(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const maxChunkSize = options.maxChunkSize || 800;
  const chunkOverlap = options.chunkOverlap || 120;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split text by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= maxChunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // If single paragraph is larger than maxChunkSize, split by sentence or window
      if (trimmedPara.length > maxChunkSize) {
        const subChunks = splitLargeParagraph(trimmedPara, maxChunkSize, chunkOverlap);
        chunks.push(...subChunks);
        currentChunk = "";
      } else {
        currentChunk = trimmedPara;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // Apply chunk overlap & index metadata
  return chunks.map((content, index) => ({
    chunkIndex: index,
    content,
    charCount: content.length,
  }));
}

function splitLargeParagraph(
  text: string,
  maxChunkSize: number,
  overlap: number
): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
  const result: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length <= maxChunkSize) {
      current += sentence;
    } else {
      if (current) result.push(current.trim());
      current = sentence;
    }
  }

  if (current) result.push(current.trim());
  return result;
}
