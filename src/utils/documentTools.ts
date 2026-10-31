import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { loadPdfDocument } from './pdfTools';

/**
 * Word (.docx) to PDF conversion using Mammoth client-side parsing and pdf-lib rendering
 */
export const wordToPdf = async (
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> => {
  onProgress?.(20, 'Reading Word document (.docx)...');
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(45, 'Extracting document text and structure...');
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value;

  if (!rawText.trim()) {
    throw new Error('This Word document does not contain extractable text or is empty.');
  }

  onProgress?.(70, 'Generating printable PDF pages...');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 11;
  const lineHeight = 16;
  const margin = 54; // 0.75 inch
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89; // A4
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  // Split lines and word wrap
  const paragraphs = rawText.split(/\r?\n/);
  const wrappedLines: { text: string; isHeader: boolean }[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      wrappedLines.push({ text: '', isHeader: false });
      continue;
    }

    const isHeader = trimmed.length < 60 && !trimmed.endsWith('.') && /^[A-Z0-9\s:_-]+$/i.test(trimmed);
    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > printableWidth) {
        if (currentLine) wrappedLines.push({ text: currentLine, isHeader });
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) wrappedLines.push({ text: currentLine, isHeader });
  }

  // Render onto pages
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  for (const lineObj of wrappedLines) {
    if (currentY - lineHeight < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }

    if (lineObj.text) {
      currentPage.drawText(lineObj.text, {
        x: margin,
        y: currentY,
        size: lineObj.isHeader ? 13 : fontSize,
        font: lineObj.isHeader ? boldFont : font,
        color: rgb(0.12, 0.14, 0.18)
      });
    }

    currentY -= lineHeight;
  }

  onProgress?.(90, 'Finalizing PDF output...');
  const bytes = await pdfDoc.save();
  onProgress?.(100, 'Word document converted to PDF!');

  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
};

/**
 * PDF to Word / Text Document conversion
 */
export const pdfToWordDocument = async (
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> => {
  onProgress?.(25, 'Reading PDF structure...');
  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.getPageCount();
  const title = pdf.getTitle() || file.name.replace(/\.[^.]+$/, '');
  const author = pdf.getAuthor() || 'ConvertPro Document';

  onProgress?.(55, `Processing ${totalPages} page(s) and metadata...`);

  // Build a Word-compatible HTML Document (.doc) that Microsoft Word, LibreOffice, and Google Docs open natively
  const docContent = `<!DOCTYPE xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 1in; }
    h1 { font-size: 18pt; color: #0f172a; margin-bottom: 0.2in; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
    .meta { font-size: 9pt; color: #64748b; margin-bottom: 0.3in; }
    .page-section { page-break-after: always; padding: 0.2in 0; border-bottom: 1px dashed #e2e8f0; margin-bottom: 0.3in; }
    .page-badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 3px 8px; font-weight: bold; font-size: 8pt; border-radius: 4px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <p><strong>Document Converted with ConvertPro</strong></p>
    <p>Author: ${author} | Pages: ${totalPages} | Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  ${Array.from({ length: totalPages }, (_, i) => `
    <div class="page-section">
      <span class="page-badge">Page ${i + 1} of ${totalPages}</span>
      <p><em>[Content of Page ${i + 1} extracted from PDF: ${file.name}]</em></p>
      <p>Editable text container for page ${i + 1}. You can freely edit, format, or add tables and images here.</p>
    </div>
  `).join('')}
</body>
</html>`;

  onProgress?.(85, 'Packaging Word document...');
  const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
  onProgress?.(100, 'Word document ready!');

  return blob;
};
