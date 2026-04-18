import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const textMimeTypes = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/octet-stream"
]);

export type UploadedAssignmentDocument = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

export type ParsedAssignmentDocument = {
  fileName: string;
  sourceText: string;
};

export async function parseAssignmentDocument(
  file: UploadedAssignmentDocument
): Promise<ParsedAssignmentDocument> {
  const extension = path.extname(file.originalname).toLowerCase();
  let sourceText = "";

  if (extension === ".pdf" || file.mimetype === "application/pdf") {
    sourceText = await extractPdfText(file.buffer);
  } else if (
    extension === ".docx" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    sourceText = result.value;
  } else if (extension === ".txt" || extension === ".md" || textMimeTypes.has(file.mimetype)) {
    sourceText = file.buffer.toString("utf8");
  } else {
    throw new Error("Unsupported file type. Upload a .txt, .md, .pdf, or .docx file.");
  }

  const normalized = normalizeExtractedText(sourceText);
  if (!normalized) {
    throw new Error("The uploaded document did not contain readable assignment text.");
  }

  return {
    fileName: file.originalname,
    sourceText: normalized
  };
}

export function buildAssignmentTitleFromFileName(fileName: string) {
  return path.parse(fileName).name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
