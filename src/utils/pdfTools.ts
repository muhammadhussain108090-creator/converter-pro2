import { PDFDocument, degrees, PageSizes } from 'pdf-lib';
import JSZip from 'jszip';
import { PdfMetadataInfo } from '../types';
import { parsePageRange, parsePagesToDelete } from './pureLogic';

export const saveBlob = (blob: Blob, name: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const loadPdfDocument = async (file: File): Promise<PDFDocument> => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    return await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  } catch (err: any) {
    if (err?.message?.includes('encrypted') || err?.message?.includes('password')) {
      throw new Error('This PDF is encrypted with a password. Please unlock it first.');
    }
    throw new Error('Could not parse this PDF file. It may be corrupted or not a valid PDF.');
  }
};

/**
 * Merge multiple PDF files into a single PDF
 */
export const mergePdfs = async (
  files: File[],
  onProgress?: (percent: number, status: string) => void
): Promise<{ blob: Blob; pageCount: number }> => {
  if (files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  onProgress?.(10, 'Initializing merge...');
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = Math.round(15 + (i / files.length) * 70);
    onProgress?.(progress, `Merging ${file.name} (${i + 1}/${files.length})...`);

    const srcPdf = await loadPdfDocument(file);
    const indices = srcPdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(srcPdf, indices);
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }

  onProgress?.(90, 'Generating merged PDF...');
  const bytes = await mergedPdf.save();
  onProgress?.(100, 'Merge complete!');

  return {
    blob: new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }),
    pageCount: mergedPdf.getPageCount()
  };
};

/**
 * Split a PDF into a page range, or split all pages into individual PDFs zipped together
 */
export const splitPdf = async (
  file: File,
  options: {
    mode: 'range' | 'all' | 'every';
    rangeStr?: string;
    everyN?: number;
  },
  onProgress?: (percent: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; isZip: boolean }> => {
  onProgress?.(15, 'Loading PDF document...');
  const srcPdf = await loadPdfDocument(file);
  const totalPages = srcPdf.getPageCount();

  const baseName = file.name.replace(/\.[^.]+$/, '');

  if (options.mode === 'range') {
    const rangeStr = options.rangeStr || '1';
    onProgress?.(40, 'Parsing page ranges...');
    const pageIndices = parsePageRange(rangeStr, totalPages);

    const outPdf = await PDFDocument.create();
    const copied = await outPdf.copyPages(srcPdf, pageIndices);
    copied.forEach(p => outPdf.addPage(p));

    onProgress?.(85, 'Rendering split PDF...');
    const bytes = await outPdf.save();
    onProgress?.(100, 'Split complete!');

    return {
      blob: new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }),
      fileName: `${baseName}-pages-${rangeStr.replace(/[\s,]+/g, '_')}.pdf`,
      isZip: false
    };
  }

  // All pages into individual PDFs or every N pages
  const zip = new JSZip();
  const folder = zip.folder(`${baseName}-split`) || zip;

  if (options.mode === 'all') {
    for (let i = 0; i < totalPages; i++) {
      const progress = Math.round(20 + ((i + 1) / totalPages) * 65);
      onProgress?.(progress, `Extracting page ${i + 1} of ${totalPages}...`);

      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(srcPdf, [i]);
      singleDoc.addPage(copied);
      const bytes = await singleDoc.save();

      const pageNumStr = String(i + 1).padStart(String(totalPages).length, '0');
      folder.file(`${baseName}-page-${pageNumStr}.pdf`, bytes);
    }
  } else {
    // Every N pages
    const n = Math.max(1, options.everyN || 1);
    let chunkIndex = 1;
    for (let i = 0; i < totalPages; i += n) {
      const chunkEnd = Math.min(i + n, totalPages);
      const progress = Math.round(20 + (chunkEnd / totalPages) * 65);
      onProgress?.(progress, `Creating chunk ${chunkIndex} (pages ${i + 1}-${chunkEnd})...`);

      const chunkIndices: number[] = [];
      for (let j = i; j < chunkEnd; j++) chunkIndices.push(j);

      const chunkDoc = await PDFDocument.create();
      const copied = await chunkDoc.copyPages(srcPdf, chunkIndices);
      copied.forEach(p => chunkDoc.addPage(p));
      const bytes = await chunkDoc.save();

      folder.file(`${baseName}-part-${chunkIndex}-pages-${i + 1}-to-${chunkEnd}.pdf`, bytes);
      chunkIndex++;
    }
  }

  onProgress?.(90, 'Packaging split files into ZIP archive...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  onProgress?.(100, 'Split archive ready!');

  return {
    blob: zipBlob,
    fileName: `${baseName}-split.zip`,
    isZip: true
  };
};

/**
 * Rotate pages in a PDF
 */
export const rotatePdf = async (
  file: File,
  options: {
    angle: number; // 90, 180, 270
    pageSelection: 'all' | 'odd' | 'even' | string;
  },
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> => {
  onProgress?.(20, 'Reading PDF pages...');
  const pdf = await loadPdfDocument(file);
  const pages = pdf.getPages();
  const total = pages.length;

  let targetIndices: number[] = [];
  if (options.pageSelection === 'all') {
    targetIndices = pages.map((_, i) => i);
  } else if (options.pageSelection === 'odd') {
    targetIndices = pages.map((_, i) => i).filter(i => (i + 1) % 2 !== 0);
  } else if (options.pageSelection === 'even') {
    targetIndices = pages.map((_, i) => i).filter(i => (i + 1) % 2 === 0);
  } else {
    targetIndices = parsePageRange(options.pageSelection, total);
  }

  onProgress?.(60, `Rotating ${targetIndices.length} page(s) by ${options.angle}°...`);
  const targetSet = new Set(targetIndices);

  pages.forEach((page, index) => {
    if (targetSet.has(index)) {
      const currentAngle = page.getRotation().angle;
      const newAngle = (currentAngle + options.angle) % 360;
      page.setRotation(degrees(newAngle));
    }
  });

  onProgress?.(85, 'Saving rotated document...');
  const bytes = await pdf.save();
  onProgress?.(100, 'Rotation complete!');

  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
};

/**
 * Extract specific pages into a new PDF
 */
export const extractPdfPages = async (
  file: File,
  pagesStr: string,
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> => {
  onProgress?.(20, 'Loading PDF document...');
  const srcPdf = await loadPdfDocument(file);
  const totalPages = srcPdf.getPageCount();

  onProgress?.(45, 'Extracting selected pages...');
  const pageIndices = parsePageRange(pagesStr, totalPages);

  const outPdf = await PDFDocument.create();
  const copied = await outPdf.copyPages(srcPdf, pageIndices);
  copied.forEach(p => outPdf.addPage(p));

  onProgress?.(85, 'Rendering extracted pages...');
  const bytes = await outPdf.save();
  onProgress?.(100, 'Extraction complete!');

  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
};

/**
 * Delete specified pages from a PDF and keep the remaining
 */
export const deletePdfPages = async (
  file: File,
  deletePagesStr: string,
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> => {
  onProgress?.(20, 'Loading PDF document...');
  const srcPdf = await loadPdfDocument(file);
  const totalPages = srcPdf.getPageCount();

  onProgress?.(40, 'Calculating remaining pages...');
  const remainingIndices = parsePagesToDelete(deletePagesStr, totalPages);

  const outPdf = await PDFDocument.create();
  const copied = await outPdf.copyPages(srcPdf, remainingIndices);
  copied.forEach(p => outPdf.addPage(p));

  onProgress?.(85, 'Generating cleaned document...');
  const bytes = await outPdf.save();
  onProgress?.(100, 'Pages removed successfully!');

  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
};

/**
 * Read PDF Metadata
 */
export const getPdfMetadata = async (file: File): Promise<PdfMetadataInfo> => {
  const pdf = await loadPdfDocument(file);
  return {
    title: pdf.getTitle() || undefined,
    author: pdf.getAuthor() || undefined,
    subject: pdf.getSubject() || undefined,
    keywords: pdf.getKeywords()?.split(';').map(k => k.trim()).filter(Boolean) || undefined,
    creator: pdf.getCreator() || undefined,
    producer: pdf.getProducer() || undefined,
    creationDate: pdf.getCreationDate() || undefined,
    modificationDate: pdf.getModificationDate() || undefined,
    pageCount: pdf.getPageCount()
  };
};

/**
 * Update PDF Metadata
 */
export const updatePdfMetadata = async (
  file: File,
  updates: Partial<PdfMetadataInfo>,
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> => {
  onProgress?.(25, 'Loading PDF document...');
  const pdf = await loadPdfDocument(file);

  onProgress?.(60, 'Updating metadata attributes...');
  if (updates.title !== undefined) pdf.setTitle(updates.title);
  if (updates.author !== undefined) pdf.setAuthor(updates.author);
  if (updates.subject !== undefined) pdf.setSubject(updates.subject);
  if (updates.keywords !== undefined) pdf.setKeywords(updates.keywords);
  if (updates.creator !== undefined) pdf.setCreator(updates.creator);
  if (updates.producer !== undefined) pdf.setProducer(updates.producer);
  pdf.setModificationDate(new Date());

  onProgress?.(85, 'Saving updated PDF...');
  const bytes = await pdf.save();
  onProgress?.(100, 'Metadata updated successfully!');

  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
};

import { loadImage } from './imageTools';

/**
 * Safely embeds any image into a PDFDocument (PNG, JPG, WebP, BMP, SVG, GIF)
 * Attempts direct embedding first, then falls back to canvas-rendered JPEG.
 */
const embedImageSafely = async (pdfDoc: PDFDocument, file: File): Promise<any> => {
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  const isJpg = ['image/jpeg', 'image/jpg'].includes(file.type) || /\.(jpe?g)$/i.test(file.name);

  if (isPng || isJpg) {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (isPng) {
        return await pdfDoc.embedPng(bytes);
      } else {
        return await pdfDoc.embedJpg(bytes);
      }
    } catch (e) {
      console.warn(`Direct PDF embedding failed for ${file.name}, using canvas normalization:`, e);
    }
  }

  // Fallback: render through HTML5 Canvas into standardized RGB JPEG
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width || 100;
  canvas.height = img.naturalHeight || img.height || 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering context not available.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.92));
  if (!blob) throw new Error(`Could not process image "${file.name}"`);
  const buf = await blob.arrayBuffer();
  return await pdfDoc.embedJpg(new Uint8Array(buf));
};

/**
 * Images to PDF: converts multiple images into a multi-page PDF document
 */
export const imagesToPdf = async (
  files: File[],
  options: {
    pageSize: 'fit' | 'a4' | 'letter';
    orientation: 'auto' | 'portrait' | 'landscape';
    margin: number; // 0, 20, 40
  },
  onProgress?: (percent: number, status: string) => void
): Promise<Blob> => {
  if (!files.length) throw new Error('Please select at least one image.');

  onProgress?.(10, 'Initializing PDF document...');
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = Math.round(15 + ((i + 1) / files.length) * 75);
    onProgress?.(progress, `Processing ${file.name} (${i + 1}/${files.length})...`);

    const embeddedImg = await embedImageSafely(pdfDoc, file);

    let pageWidth = embeddedImg.width;
    let pageHeight = embeddedImg.height;

    if (options.pageSize === 'a4') {
      const [a4w, a4h] = PageSizes.A4;
      if (options.orientation === 'portrait') {
        pageWidth = Math.min(a4w, a4h);
        pageHeight = Math.max(a4w, a4h);
      } else if (options.orientation === 'landscape') {
        pageWidth = Math.max(a4w, a4h);
        pageHeight = Math.min(a4w, a4h);
      } else {
        // Auto
        if (embeddedImg.width > embeddedImg.height) {
          pageWidth = Math.max(a4w, a4h);
          pageHeight = Math.min(a4w, a4h);
        } else {
          pageWidth = Math.min(a4w, a4h);
          pageHeight = Math.max(a4w, a4h);
        }
      }
    } else if (options.pageSize === 'letter') {
      const [lw, lh] = PageSizes.Letter;
      if (options.orientation === 'portrait') {
        pageWidth = Math.min(lw, lh);
        pageHeight = Math.max(lw, lh);
      } else if (options.orientation === 'landscape') {
        pageWidth = Math.max(lw, lh);
        pageHeight = Math.min(lw, lh);
      } else {
        if (embeddedImg.width > embeddedImg.height) {
          pageWidth = Math.max(lw, lh);
          pageHeight = Math.min(lw, lh);
        } else {
          pageWidth = Math.min(lw, lh);
          pageHeight = Math.max(lw, lh);
        }
      }
    } else {
      // Fit to image with optional margins
      pageWidth = embeddedImg.width + options.margin * 2;
      pageHeight = embeddedImg.height + options.margin * 2;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Scale image into printable area considering margins
    const margin = options.margin;
    const availWidth = Math.max(10, pageWidth - margin * 2);
    const availHeight = Math.max(10, pageHeight - margin * 2);

    const scale = Math.min(availWidth / embeddedImg.width, availHeight / embeddedImg.height);
    const drawWidth = embeddedImg.width * scale;
    const drawHeight = embeddedImg.height * scale;

    const x = margin + (availWidth - drawWidth) / 2;
    const y = margin + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight
    });
  }

  onProgress?.(92, 'Generating PDF...');
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, 'Images converted to PDF successfully!');

  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
};
