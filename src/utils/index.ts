export async function extractTextFromPdf(pdf: File): Promise<string> {
  if (!pdf) throw new Error('no pdf provided');
  if (!pdf.type.includes('pdf')) throw new Error('invalid file type');

  const { readPdfText } = await import('./pdftext');
  const buffer = await pdf.arrayBuffer();
  return readPdfText({ data: buffer });
}

export async function extractTextFromImage(image: File, lang = 'eng'): Promise<string> {
  if (!image) throw new Error('no image provided');
  if (!image.type.includes('image')) throw new Error('invalid file type');

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(lang, 1);
  const ocr = await worker.recognize(image);
  await worker.terminate();
  return ocr.data.text;
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) reject('no file provided');
    if (!file.type.includes('text')) reject('invalid file type');

    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target as FileReader).result as string);
    reader.onerror = (e) => reject((e.target as FileReader).error);
    reader.readAsText(file);
  });
}
