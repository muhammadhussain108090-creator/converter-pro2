import { Tool } from '../types';

export const TOOLS: Tool[] = [
  {
    id: 'merge',
    name: 'Merge PDF',
    shortDesc: 'Combine multiple PDFs into a single organized document.',
    desc: 'Upload two or more PDF files, reorder pages, and merge them into one unified PDF document directly in your browser.',
    category: 'PDF',
    icon: 'Layers',
    tag: 'Popular',
    acceptedTypes: ['application/pdf', '.pdf'],
    acceptAttribute: '.pdf,application/pdf',
    maxFiles: 20
  },
  {
    id: 'split',
    name: 'Split PDF',
    shortDesc: 'Extract page ranges or separate all pages into a zip archive.',
    desc: 'Extract individual pages, custom page ranges (e.g. 1-3, 5), or split every single page into separate downloadable PDF files.',
    category: 'PDF',
    icon: 'Scissors',
    tag: 'Updated',
    acceptedTypes: ['application/pdf', '.pdf'],
    acceptAttribute: '.pdf,application/pdf',
    maxFiles: 1
  },
  {
    id: 'rotate',
    name: 'Rotate PDF',
    shortDesc: 'Rotate all or specific pages 90°, 180°, or 270° clockwise.',
    desc: 'Correct upside-down or sideways pages. Choose to rotate all pages, odd pages, even pages, or specific page numbers.',
    category: 'PDF',
    icon: 'RotateCw',
    acceptedTypes: ['application/pdf', '.pdf'],
    acceptAttribute: '.pdf,application/pdf',
    maxFiles: 1
  },
  {
    id: 'extract-pages',
    name: 'Extract PDF Pages',
    shortDesc: 'Pick exact pages to pull out into a brand new PDF file.',
    desc: 'Specify the exact pages you need (e.g. "1, 3, 5-8") and create a clean, dedicated PDF without modifying the original file.',
    category: 'PDF',
    icon: 'FilePlus2',
    tag: 'New',
    acceptedTypes: ['application/pdf', '.pdf'],
    acceptAttribute: '.pdf,application/pdf',
    maxFiles: 1
  },
  {
    id: 'delete-pages',
    name: 'Delete PDF Pages',
    shortDesc: 'Remove unwanted pages and keep the rest of your document.',
    desc: 'Quickly remove blank, sensitive, or redundant pages from your PDF file while keeping everything else perfectly intact.',
    category: 'PDF',
    icon: 'Trash2',
    tag: 'New',
    acceptedTypes: ['application/pdf', '.pdf'],
    acceptAttribute: '.pdf,application/pdf',
    maxFiles: 1
  },
  {
    id: 'pdf-metadata',
    name: 'PDF Metadata',
    shortDesc: 'View and edit document title, author, subject, and keywords.',
    desc: 'Inspect technical document details (creation date, page count, software producer) and customize title, author, and keywords.',
    category: 'PDF',
    icon: 'Info',
    tag: 'New',
    acceptedTypes: ['application/pdf', '.pdf'],
    acceptAttribute: '.pdf,application/pdf',
    maxFiles: 1
  },
  {
    id: 'images-pdf',
    name: 'Images to PDF',
    shortDesc: 'Convert JPG, PNG, and WebP pictures into a clean PDF.',
    desc: 'Combine multiple image files into a single multi-page PDF document. Choose between auto-fit, standard A4, or Letter page sizes.',
    category: 'PDF',
    icon: 'FileImage',
    tag: 'Popular',
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.bmp'],
    acceptAttribute: 'image/jpeg,image/png,image/webp,image/bmp',
    maxFiles: 20
  },
  {
    id: 'compress-image',
    name: 'Compress Image',
    shortDesc: 'Reduce image file size with fine-tuned quality control.',
    desc: 'Shrink photo and graphics file sizes by up to 80% while maintaining visual sharpness. Real-time before/after size calculation.',
    category: 'Image',
    icon: 'Minimize2',
    tag: 'Popular',
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    acceptAttribute: 'image/jpeg,image/png,image/webp',
    maxFiles: 1
  },
  {
    id: 'resize-image',
    name: 'Resize Image',
    shortDesc: 'Scale dimensions by pixels or presets while keeping ratio.',
    desc: 'Adjust image width and height with bicubic anti-aliasing. Lock aspect ratio or select standard presets (Full HD, Avatar, Social).',
    category: 'Image',
    icon: 'Maximize2',
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    acceptAttribute: 'image/jpeg,image/png,image/webp',
    maxFiles: 1
  },
  {
    id: 'convert-image',
    name: 'Convert Image',
    shortDesc: 'Convert smoothly between JPG, PNG, and WebP formats.',
    desc: 'Fast, loss-free browser conversion between major web image formats. Handles alpha transparency cleanly.',
    category: 'Image',
    icon: 'RefreshCw',
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    acceptAttribute: 'image/jpeg,image/png,image/webp',
    maxFiles: 1
  },
  {
    id: 'crop-image',
    name: 'Crop Image',
    shortDesc: 'Trim and crop images with standard aspect ratio presets.',
    desc: 'Crop photos to 1:1 square, 16:9 widescreen, 4:3 standard, or custom freeform boundaries.',
    category: 'Image',
    icon: 'Crop',
    tag: 'New',
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    acceptAttribute: 'image/jpeg,image/png,image/webp',
    maxFiles: 1
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    shortDesc: 'Convert Word (.docx) documents into standard PDF pages.',
    desc: 'Converts Word files into printable, formatted PDF documents directly in the browser.',
    category: 'Document',
    icon: 'FileText',
    tag: 'New',
    acceptedTypes: ['.docx', '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    acceptAttribute: '.docx',
    maxFiles: 1,
    technicalNote: 'Browser conversion extracts text, headings, and formatting from standard .docx files. Proprietary Microsoft Word macros or complex vector shapes require server-side LibreOffice.'
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    shortDesc: 'Extract PDF contents into an editable Word document (.doc).',
    desc: 'Extract document structure and contents into an editable document compatible with Microsoft Word and Google Docs.',
    category: 'Document',
    icon: 'FileCode',
    tag: 'New',
    acceptedTypes: ['application/pdf', '.pdf'],
    acceptAttribute: '.pdf,application/pdf',
    maxFiles: 1,
    technicalNote: 'Browser-based conversion extracts textual content and structure into an editable Word document. Complex multi-column graphic layouts or scanned images without embedded text require specialized OCR engines.'
  }
];
