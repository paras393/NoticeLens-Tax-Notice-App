import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import tesseractWorkerUrl from 'tesseract.js/dist/worker.min.js?url';
import tesseractCoreUrl from 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url';
import englishDataUrl from '@tesseract.js-data/eng/4.0.0/eng.traineddata.gz?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const EXTRACTION_ERROR_MESSAGE =
  "We couldn't read this document. Please upload a clearer file.";

const MINIMUM_TEXT_LENGTH = 40;

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function validateExtractedText(text: string): string | null {
  const normalized = normalizeExtractedText(text);
  if (
    normalized.length < MINIMUM_TEXT_LENGTH ||
    !/[A-Za-z]{3,}/.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

async function recognizeWithLocalOcr(image: ImageLike): Promise<string> {
  const englishDataDirectory = new URL("./", englishDataUrl).toString();
  const worker = await createWorker("eng", 1, {
    workerPath: tesseractWorkerUrl,
    corePath: tesseractCoreUrl,
    langPath: englishDataDirectory,
    logger: () => undefined,
  });

  try {
    const result = await worker.recognize(image);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

async function extractPdfText(file: File): Promise<string> {
  const document = await pdfjsLib
    .getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    .promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    pageTexts.push(
      textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" "),
    );
  }

  return pageTexts.join("\n\n");
}

async function renderPdfPagesForOcr(file: File): Promise<HTMLCanvasElement[]> {
  const document = await pdfjsLib
    .getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    .promise;
  const canvases: HTMLCanvasElement[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available for PDF OCR.");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    canvases.push(canvas);
  }

  return canvases;
}

async function extractPdfWithOcr(file: File): Promise<string> {
  const canvases = await renderPdfPagesForOcr(file);
  const pageTexts: string[] = [];
  const englishDataDirectory = new URL("./", englishDataUrl).toString();
  const worker = await createWorker("eng", 1, {
    workerPath: tesseractWorkerUrl,
    corePath: tesseractCoreUrl,
    langPath: englishDataDirectory,
    logger: () => undefined,
  });

  try {
    for (const canvas of canvases) {
      const result = await worker.recognize(canvas);
      pageTexts.push(result.data.text);
    }
  } finally {
    await worker.terminate();
  }

  return pageTexts.join("\n\n");
}

export async function extractUploadedFile(file: File): Promise<string> {
  const extension = file.name.toLowerCase().split(".").pop();
  if (file.type === "application/pdf" || extension === "pdf") {
    const parsedText = validateExtractedText(await extractPdfText(file));
    if (parsedText) return parsedText;
    return normalizeExtractedText(await extractPdfWithOcr(file));
  }

  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    ["jpg", "jpeg", "png"].includes(extension ?? "")
  ) {
    return normalizeExtractedText(await recognizeWithLocalOcr(file));
  }

  throw new Error(EXTRACTION_ERROR_MESSAGE);
}