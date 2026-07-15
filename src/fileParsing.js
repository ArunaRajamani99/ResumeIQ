import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => item.str).join(' '));
  }
  return pageTexts.join('\n').trim();
}

async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function extractPlainText(file) {
  return (await file.text()).trim();
}

export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  let text;
  if (ext === 'pdf') {
    text = await extractPdfText(file);
  } else if (ext === 'docx') {
    text = await extractDocxText(file);
  } else if (ext === 'txt') {
    text = await extractPlainText(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }

  if (!text) {
    throw new Error('No text could be extracted — this may be a scanned/image-only file. Try pasting the resume text manually.');
  }
  return text;
}
