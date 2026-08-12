import fs from "fs/promises";
import mammoth from "mammoth";

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
}

export async function extractTextFromFile(
  filePath: string,
  mimeType: string
): Promise<ExtractedDocument> {
  const fileBuffer = await fs.readFile(filePath);

  if (mimeType === "application/pdf" || filePath.endsWith(".pdf")) {
    // Polyfill DOMMatrix for node environment if missing
    if (typeof globalThis.DOMMatrix === "undefined") {
      // @ts-expect-error polyfill for pdf-parse in Node runtime
      globalThis.DOMMatrix = class DOMMatrix {};
    }

    // Lazy load pdf-parse inside function execution
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(fileBuffer);
    return {
      text: cleanExtractedText(data.text),
      pageCount: data.numpages || 1,
    };
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filePath.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return {
      text: cleanExtractedText(result.value),
    };
  }

  // Plain Text & Markdown files
  const utf8Text = fileBuffer.toString("utf-8");
  return {
    text: cleanExtractedText(utf8Text),
  };
}

function cleanExtractedText(text: string): string {
  if (!text) return "";

  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
