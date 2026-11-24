import { unzipSync, strFromU8 } from 'fflate';

/** Biggest CV file we accept. */
export const CV_MAX_BYTES = 5 * 1024 * 1024;
/** Text kept from a CV. Plenty for a few pages; keeps prompts small. */
export const CV_MAX_CHARS = 20_000;
export const CV_ACCEPT = '.pdf,.docx,.txt,.md';

export class CvError extends Error {}

const tidy = (s: string) =>
  s
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, CV_MAX_CHARS);

/** Plain text from a Word .docx: paragraphs from word/document.xml. */
export function docxText(bytes: Uint8Array) {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (f) => f.name === 'word/document.xml' });
  } catch {
    throw new CvError('That Word file could not be opened.');
  }
  const xml = files['word/document.xml'];
  if (!xml) throw new CvError('That Word file has no text.');
  return strFromU8(xml)
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function pdfText(bytes: Uint8Array) {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  } catch {
    throw new CvError('That PDF could not be read.');
  }
}

/** Reads the text out of an uploaded CV (PDF, Word .docx, or plain text). */
export async function readCv(file: File): Promise<{ name: string; text: string }> {
  if (!file.size) throw new CvError('That file is empty.');
  if (file.size > CV_MAX_BYTES) throw new CvError('Use a CV under 5 MB.');
  const name = file.name.slice(0, 120) || 'CV';
  const ext = name.toLowerCase().split('.').pop() ?? '';
  const bytes = new Uint8Array(await file.arrayBuffer());

  let raw: string;
  if (ext === 'pdf' || file.type === 'application/pdf') raw = await pdfText(bytes);
  else if (ext === 'docx') raw = docxText(bytes);
  else if (ext === 'txt' || ext === 'md' || file.type.startsWith('text/')) raw = new TextDecoder().decode(bytes);
  else throw new CvError('Use a PDF, Word (.docx) or text file.');

  const text = tidy(raw);
  if (text.length < 80) throw new CvError("We couldn't find text in that file. If it's a scan, try a PDF exported from Word or Google Docs.");
  return { name, text };
}
