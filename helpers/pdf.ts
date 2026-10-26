import { PDFParse } from 'pdf-parse';

/**
 * Extracts the text of a PDF file, with all whitespace (line breaks, tabs, repeated spaces)
 * collapsed to single spaces, so checks don't depend on the PDF's layout.
 */
export async function readPdfText(pdf: Buffer): Promise<string> {
    const parser = new PDFParse({ data: new Uint8Array(pdf) });
    try {
        const { text } = await parser.getText();
        return text.replace(/\s+/g, ' ').trim();
    } finally {
        await parser.destroy();
    }
}

/**
 * Removes all whitespace. Use it to compare headings the PDF prints with letter spacing:
 * "SHIP TO" is extracted as "S H I P TO", so compare withoutSpaces(text) with withoutSpaces('SHIP TO').
 */
export function withoutSpaces(text: string): string {
    return text.replace(/\s+/g, '');
}

/** True when the bytes start with the PDF signature "%PDF". */
export function isPdf(file: Buffer): boolean {
    return file.subarray(0, 4).toString('latin1') === '%PDF';
}
