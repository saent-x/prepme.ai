import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { CvError, docxText, readCv } from './cv';

const docx = (body: string) =>
  zipSync({ 'word/document.xml': strToU8(`<w:document><w:body>${body}</w:body></w:document>`) });

describe('readCv', () => {
  it('reads paragraphs from a .docx', () => {
    const text = docxText(docx('<w:p><w:r><w:t>Tor Smith</w:t></w:r></w:p><w:p><w:r><w:t>AI &amp; Cloud</w:t></w:r></w:p>'));
    expect(text).toBe('Tor Smith\nAI & Cloud\n');
  });

  it('reads a text file and tidies spaces', async () => {
    const body = 'Senior Software Engineer   \n\n\n\nBuilt RAG pipelines and evals. '.repeat(3);
    const cv = await readCv(new File([body], 'cv.txt', { type: 'text/plain' }));
    expect(cv.name).toBe('cv.txt');
    expect(cv.text).not.toMatch(/\n{3,}/);
  });

  it('rejects unknown types and empty text', async () => {
    await expect(readCv(new File(['x'.repeat(100)], 'cv.png', { type: 'image/png' }))).rejects.toBeInstanceOf(CvError);
    await expect(readCv(new File(['hi'], 'cv.txt'))).rejects.toThrow(/couldn't find text/);
  });
});
