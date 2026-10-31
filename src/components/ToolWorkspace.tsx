import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  FileImage,
  RefreshCw,
  MoveUp,
  MoveDown,
  Info,
  Shield,
  Layers,
  Scissors,
  RotateCw,
  Minimize2,
  Maximize2,
  Crop,
  FileCode,
  FilePlus2,
  Sparkles,
  Lock,
  Sliders,
  Check
} from 'lucide-react';
import { Tool, PdfMetadataInfo } from '../types';
import {
  formatBytes,
  safeName,
  validateFileSelection,
  parsePageRange
} from '../utils/pureLogic';
import {
  mergePdfs,
  splitPdf,
  rotatePdf,
  extractPdfPages,
  deletePdfPages,
  getPdfMetadata,
  updatePdfMetadata,
  imagesToPdf,
  saveBlob,
  loadPdfDocument
} from '../utils/pdfTools';
import {
  convertImage,
  compressImage,
  resizeImage,
  cropImage,
  loadImage,
  ImageProcessingResult
} from '../utils/imageTools';
import { wordToPdf, pdfToWordDocument } from '../utils/documentTools';
import { saveConversionRecord } from '../config/firebase';

interface ToolWorkspaceProps {
  tool: Tool;
  onBack: () => void;
  onShowNotice: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Layers,
  Scissors,
  RotateCw,
  FileImage,
  Minimize2,
  Maximize2,
  RefreshCw,
  Crop,
  FileText,
  FileCode,
  FilePlus2,
  Trash2,
  Info
};

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({
  tool,
  onBack,
  onShowNotice
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    outputSize: number;
    inputSize: number;
    savings?: number;
    summary?: string;
  } | null>(null);

  // Tool Specific Options
  // Split
  const [splitMode, setSplitMode] = useState<'range' | 'all' | 'every'>('range');
  const [splitRange, setSplitRange] = useState('1');
  const [splitEveryN, setSplitEveryN] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);

  // Rotate
  const [rotateAngle, setRotateAngle] = useState(90);
  const [rotateSelection, setRotateSelection] = useState<'all' | 'odd' | 'even' | 'custom'>('all');
  const [rotateCustomPages, setRotateCustomPages] = useState('1');

  // Extract & Delete Pages
  const [extractPagesStr, setExtractPagesStr] = useState('1');
  const [deletePagesStr, setDeletePagesStr] = useState('1');

  // Metadata
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSubject, setMetaSubject] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Images to PDF
  const [imgPdfPageSize, setImgPdfPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [imgPdfOrientation, setImgPdfOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [imgPdfMargin, setImgPdfMargin] = useState(20);

  // Compress Image
  const [compressQuality, setCompressQuality] = useState(75);
  const [compressFormat, setCompressFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [compressMaxWidth, setCompressMaxWidth] = useState<number | ''>('');

  // Resize Image
  const [resizeWidth, setResizeWidth] = useState<number | ''>('');
  const [resizeHeight, setResizeHeight] = useState<number | ''>('');
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number; h: number } | null>(null);

  // Convert Image
  const [convertFormat, setConvertFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [convertQuality, setConvertQuality] = useState(90);

  // Crop Image
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '16:9' | '4:3'>('1:1');
  const [cropCoords, setCropCoords] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 300,
    height: 300
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when tool changes
  useEffect(() => {
    setFiles([]);
    setResult(null);
    setPdfPageCount(null);
    setOriginalDimensions(null);
  }, [tool.id]);

  // Read metadata or image dimensions when first file is loaded
  useEffect(() => {
    if (files.length === 0) return;

    const first = files[0];
    if (tool.id === 'pdf-metadata' && first.type === 'application/pdf') {
      setLoadingMeta(true);
      getPdfMetadata(first)
        .then((data) => {
          setMetaTitle(data.title || '');
          setMetaAuthor(data.author || '');
          setMetaSubject(data.subject || '');
          setMetaKeywords(data.keywords?.join(', ') || '');
          setPdfPageCount(data.pageCount);
        })
        .catch((e) => console.warn(e))
        .finally(() => setLoadingMeta(false));
    } else if (['split', 'rotate', 'extract-pages', 'delete-pages'].includes(tool.id)) {
      loadPdfDocument(first)
        .then((doc) => {
          setPdfPageCount(doc.getPageCount());
        })
        .catch((e) => console.warn(e));
    } else if (['resize-image', 'crop-image'].includes(tool.id) && first.type.startsWith('image/')) {
      loadImage(first)
        .then((img) => {
          setOriginalDimensions({ w: img.naturalWidth, h: img.naturalHeight });
          if (!resizeWidth && !resizeHeight) {
            setResizeWidth(img.naturalWidth);
            setResizeHeight(img.naturalHeight);
          }
          const defaultCropSize = Math.min(img.naturalWidth, img.naturalHeight, 400);
          setCropCoords({
            x: Math.round((img.naturalWidth - defaultCropSize) / 2),
            y: Math.round((img.naturalHeight - defaultCropSize) / 2),
            width: defaultCropSize,
            height: defaultCropSize
          });
        })
        .catch((e) => console.warn(e));
    }
  }, [files, tool.id]);

  const handleFilesChosen = (incomingList: FileList | null) => {
    if (!incomingList || !incomingList.length) return;
    const incoming = Array.from(incomingList);

    const validation = validateFileSelection(incoming, tool.id, 50);
    if (!validation.valid) {
      onShowNotice('error', validation.error || 'Invalid file.');
      return;
    }

    if (tool.maxFiles === 1) {
      setFiles([incoming[0]]);
      setResult(null);
    } else {
      setFiles((prev) => {
        const combined = [...prev, ...incoming].slice(0, tool.maxFiles);
        return combined;
      });
      setResult(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const moveFileOrder = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleExecuteTool = async () => {
    if (!files.length) {
      onShowNotice('error', 'Please choose a file to process.');
      return;
    }

    setProcessing(true);
    setProgressPercent(10);
    setProgressStatus('Starting process...');

    try {
      let outputBlob: Blob | null = null;
      let outputFileName = '';
      let isZip = false;
      let savingsPct: number | undefined;
      const totalInputBytes = files.reduce((acc, f) => acc + f.size, 0);

      // Branching by tool
      if (tool.id === 'merge') {
        if (files.length < 2) throw new Error('Please add at least 2 PDF files to merge.');
        const mergeRes = await mergePdfs(files, (p, s) => {
          setProgressPercent(p);
          setProgressStatus(s);
        });
        outputBlob = mergeRes.blob;
        outputFileName = safeName(files[0].name, 'pdf', 'merged-doc');
      } else if (tool.id === 'split') {
        const splitRes = await splitPdf(
          files[0],
          {
            mode: splitMode,
            rangeStr: splitRange,
            everyN: splitEveryN
          },
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputBlob = splitRes.blob;
        outputFileName = splitRes.fileName;
        isZip = splitRes.isZip;
      } else if (tool.id === 'rotate') {
        outputBlob = await rotatePdf(
          files[0],
          {
            angle: rotateAngle,
            pageSelection: rotateSelection === 'custom' ? rotateCustomPages : rotateSelection
          },
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputFileName = safeName(files[0].name, 'pdf', 'rotated');
      } else if (tool.id === 'extract-pages') {
        outputBlob = await extractPdfPages(files[0], extractPagesStr, (p, s) => {
          setProgressPercent(p);
          setProgressStatus(s);
        });
        outputFileName = safeName(files[0].name, 'pdf', 'extracted');
      } else if (tool.id === 'delete-pages') {
        outputBlob = await deletePdfPages(files[0], deletePagesStr, (p, s) => {
          setProgressPercent(p);
          setProgressStatus(s);
        });
        outputFileName = safeName(files[0].name, 'pdf', 'cleaned');
      } else if (tool.id === 'pdf-metadata') {
        const keywordsArray = metaKeywords
          ? metaKeywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [];
        outputBlob = await updatePdfMetadata(
          files[0],
          {
            title: metaTitle,
            author: metaAuthor,
            subject: metaSubject,
            keywords: keywordsArray
          },
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputFileName = safeName(files[0].name, 'pdf', 'metadata-updated');
      } else if (tool.id === 'images-pdf') {
        outputBlob = await imagesToPdf(
          files,
          {
            pageSize: imgPdfPageSize,
            orientation: imgPdfOrientation,
            margin: imgPdfMargin
          },
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputFileName = 'convertpro-images.pdf';
      } else if (tool.id === 'compress-image') {
        const compRes = await compressImage(
          files[0],
          compressQuality / 100,
          compressFormat,
          compressMaxWidth ? Number(compressMaxWidth) : undefined,
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputBlob = compRes.blob;
        outputFileName = safeName(files[0].name, compRes.extension, 'compressed');
        savingsPct = compRes.savingsPercent;
      } else if (tool.id === 'resize-image') {
        let w = Number(resizeWidth);
        let h = Number(resizeHeight);
        if (!w && !h) {
          if (originalDimensions) {
            w = originalDimensions.w;
            h = originalDimensions.h;
          } else {
            const img = await loadImage(files[0]);
            w = img.naturalWidth || img.width || 800;
            h = img.naturalHeight || img.height || 600;
          }
        }
        const resRes = await resizeImage(
          files[0],
          w,
          h,
          keepAspectRatio,
          files[0].type === 'image/png' ? 'image/png' : 'image/jpeg',
          0.92,
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputBlob = resRes.blob;
        outputFileName = safeName(files[0].name, resRes.extension, 'resized');
      } else if (tool.id === 'image-to-jpg') {
        const convRes = await convertImage(
          files[0],
          'image/jpeg',
          convertQuality / 100,
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputBlob = convRes.blob;
        outputFileName = safeName(files[0].name, 'jpg', 'converted');
        savingsPct = convRes.savingsPercent;
      } else if (tool.id === 'image-to-png') {
        const convRes = await convertImage(
          files[0],
          'image/png',
          1.0,
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputBlob = convRes.blob;
        outputFileName = safeName(files[0].name, 'png', 'converted');
      } else if (tool.id === 'image-to-webp') {
        const convRes = await convertImage(
          files[0],
          'image/webp',
          convertQuality / 100,
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputBlob = convRes.blob;
        outputFileName = safeName(files[0].name, 'webp', 'converted');
        savingsPct = convRes.savingsPercent;
      } else if (tool.id === 'convert-image') {
        const convRes = await convertImage(
          files[0],
          convertFormat,
          convertQuality / 100,
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputBlob = convRes.blob;
        outputFileName = safeName(files[0].name, convRes.extension, 'converted');
        savingsPct = convRes.savingsPercent;
      } else if (tool.id === 'crop-image') {
        const cropRes = await cropImage(
          files[0],
          cropCoords,
          files[0].type === 'image/png' ? 'image/png' : 'image/jpeg',
          0.92,
          (p, s) => {
            setProgressPercent(p);
            setProgressStatus(s);
          }
        );
        outputBlob = cropRes.blob;
        outputFileName = safeName(files[0].name, cropRes.extension, 'cropped');
      } else if (tool.id === 'word-to-pdf') {
        outputBlob = await wordToPdf(files[0], (p, s) => {
          setProgressPercent(p);
          setProgressStatus(s);
        });
        outputFileName = safeName(files[0].name, 'pdf', 'word-doc');
      } else if (tool.id === 'pdf-to-word') {
        outputBlob = await pdfToWordDocument(files[0], (p, s) => {
          setProgressPercent(p);
          setProgressStatus(s);
        });
        outputFileName = safeName(files[0].name, 'doc', 'extracted-document');
      }

      if (!outputBlob) throw new Error('Processing failed to create an output file.');

      setResult({
        blob: outputBlob,
        fileName: outputFileName,
        outputSize: outputBlob.size,
        inputSize: totalInputBytes,
        savings: savingsPct
      });

      // Save activity record to Firestore / LocalStorage (safe, non-blocking)
      try {
        await saveConversionRecord({
          toolId: tool.id,
          toolName: tool.name,
          inputFileName: files.length === 1 ? files[0].name : `${files.length} files`,
          inputFileSize: totalInputBytes,
          outputFileName,
          outputFileSize: outputBlob.size,
          status: 'success',
          details: savingsPct ? `${savingsPct}% size reduction` : undefined
        });
      } catch (logErr) {
        console.warn('Activity logging notice:', logErr);
      }

      // Auto trigger download for frictionless UX
      saveBlob(outputBlob, outputFileName);
      onShowNotice('success', 'Conversion complete! Your file download has started.');
    } catch (err: any) {
      console.error(err);
      onShowNotice('error', err?.message || 'Processing failed. Please check your files.');
    } finally {
      setProcessing(false);
    }
  };

  const IconComponent = ICON_MAP[tool.icon] || FileText;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Bar: Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all tools</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
          <Shield className="w-3.5 h-3.5" />
          <span>Private Client-Side Processing</span>
        </div>
      </div>

      {/* Tool Header Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-indigo-50/50 dark:ring-indigo-950/30">
            <IconComponent className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {tool.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                {tool.category}
              </span>
              {tool.tag && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                  {tool.tag}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              {tool.desc}
            </p>
          </div>
        </div>

        {/* Technical Notice / Disclaimer if applicable */}
        {tool.technicalNote && (
          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2.5 text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Technical Note: </span>
              {tool.technicalNote}
            </div>
          </div>
        )}
      </div>

      {/* Main Workbench Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6">
        {/* Drag & Drop Upload Zone */}
        {files.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFilesChosen(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl min-h-[240px] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[0.99]'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={tool.acceptAttribute}
              multiple={tool.maxFiles > 1}
              onChange={(e) => handleFilesChosen(e.target.files)}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
              Choose or drag & drop files here
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Supports {tool.acceptedTypes.join(', ')}. Maximum file size 50 MB per file.
            </p>
            <button
              type="button"
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer pointer-events-none"
            >
              Select {tool.maxFiles > 1 ? 'Files' : 'File'}
            </button>
          </div>
        ) : (
          /* File Queue & Controls */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-zinc-900 dark:text-white">
                  Selected {files.length === 1 ? 'File' : `Files (${files.length})`}
                </span>
                {pdfPageCount !== null && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    {pdfPageCount} {pdfPageCount === 1 ? 'Page' : 'Pages'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {tool.maxFiles > 1 && files.length < tool.maxFiles && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    + Add more files
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={tool.acceptAttribute}
                  multiple={tool.maxFiles > 1}
                  onChange={(e) => handleFilesChosen(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setResult(null);
                  }}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-2"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* File List Items */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-600">
                      {file.type.startsWith('image/') ? (
                        <FileImage className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatBytes(file.size)}
                        {originalDimensions && idx === 0 && ` • ${originalDimensions.w}x${originalDimensions.h}px`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {tool.maxFiles > 1 && (
                      <>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveFileOrder(idx, 'up')}
                          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === files.length - 1}
                          onClick={() => moveFileOrder(idx, 'down')}
                          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tool-Specific Options Panel */}
            <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Conversion Settings</span>
              </h4>

              {/* SPLIT SETTINGS */}
              {tool.id === 'split' && (
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSplitMode('range')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        splitMode === 'range'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      Page Range (Single PDF)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        splitMode === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      All Pages (Zip Archive)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('every')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        splitMode === 'every'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      Every N Pages
                    </button>
                  </div>

                  {splitMode === 'range' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Page Range (e.g. 1-3 or 2, 4-6)
                      </label>
                      <input
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        placeholder="1-3"
                        className="w-full max-w-sm px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs"
                      />
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {pdfPageCount ? `Document contains ${pdfPageCount} pages.` : ''}
                      </p>
                    </div>
                  )}

                  {splitMode === 'every' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Split every N pages
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={pdfPageCount || 100}
                        value={splitEveryN}
                        onChange={(e) => setSplitEveryN(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ROTATE SETTINGS */}
              {tool.id === 'rotate' && (
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Rotation Angle
                      </label>
                      <div className="flex items-center gap-2">
                        {[90, 180, 270].map((deg) => (
                          <button
                            key={deg}
                            type="button"
                            onClick={() => setRotateAngle(deg)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                              rotateAngle === deg
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            +{deg}° Clockwise
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Pages to Rotate
                      </label>
                      <select
                        value={rotateSelection}
                        onChange={(e) => setRotateSelection(e.target.value as any)}
                        className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs cursor-pointer"
                      >
                        <option value="all">All Pages</option>
                        <option value="odd">Odd Pages Only (1, 3, 5...)</option>
                        <option value="even">Even Pages Only (2, 4, 6...)</option>
                        <option value="custom">Custom Page Range</option>
                      </select>
                    </div>
                  </div>

                  {rotateSelection === 'custom' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Specific Pages to Rotate (e.g. 1, 3-5)
                      </label>
                      <input
                        type="text"
                        value={rotateCustomPages}
                        onChange={(e) => setRotateCustomPages(e.target.value)}
                        placeholder="1, 3-5"
                        className="w-full max-w-sm px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* EXTRACT PAGES */}
              {tool.id === 'extract-pages' && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Pages to Extract into New PDF (e.g. 1, 3, 5-7)
                  </label>
                  <input
                    type="text"
                    value={extractPagesStr}
                    onChange={(e) => setExtractPagesStr(e.target.value)}
                    placeholder="1, 3, 5-7"
                    className="w-full max-w-sm px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {pdfPageCount ? `Total pages in file: ${pdfPageCount}.` : ''} Selected pages will be copied into a new clean document.
                  </p>
                </div>
              )}

              {/* DELETE PAGES */}
              {tool.id === 'delete-pages' && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Pages to Remove (e.g. 2, 4)
                  </label>
                  <input
                    type="text"
                    value={deletePagesStr}
                    onChange={(e) => setDeletePagesStr(e.target.value)}
                    placeholder="2, 4"
                    className="w-full max-w-sm px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    At least one page must remain in the final PDF.
                  </p>
                </div>
              )}

              {/* PDF METADATA */}
              {tool.id === 'pdf-metadata' && (
                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  {loadingMeta ? (
                    <p className="text-xs text-zinc-400">Loading document metadata...</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Document Title
                        </label>
                        <input
                          type="text"
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          placeholder="My Report"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Author
                        </label>
                        <input
                          type="text"
                          value={metaAuthor}
                          onChange={(e) => setMetaAuthor(e.target.value)}
                          placeholder="Author Name"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Subject / Description
                        </label>
                        <input
                          type="text"
                          value={metaSubject}
                          onChange={(e) => setMetaSubject(e.target.value)}
                          placeholder="Project documentation"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Keywords (comma separated)
                        </label>
                        <input
                          type="text"
                          value={metaKeywords}
                          onChange={(e) => setMetaKeywords(e.target.value)}
                          placeholder="report, finance, 2026"
                          className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* IMAGES TO PDF */}
              {tool.id === 'images-pdf' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Page Size
                    </label>
                    <select
                      value={imgPdfPageSize}
                      onChange={(e) => setImgPdfPageSize(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                    >
                      <option value="a4">Standard A4</option>
                      <option value="letter">US Letter</option>
                      <option value="fit">Fit to Image Size</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Orientation
                    </label>
                    <select
                      value={imgPdfOrientation}
                      onChange={(e) => setImgPdfOrientation(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                    >
                      <option value="auto">Auto (Best Match)</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Page Margins
                    </label>
                    <select
                      value={imgPdfMargin}
                      onChange={(e) => setImgPdfMargin(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                    >
                      <option value="0">No Margin (Full Bleed)</option>
                      <option value="20">Small (20px)</option>
                      <option value="40">Standard (40px)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* COMPRESS IMAGE */}
              {tool.id === 'compress-image' && (
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      <span>Compression Quality: {compressQuality}%</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {compressQuality < 40 ? 'High Compression (Smaller size)' : compressQuality < 80 ? 'Balanced (Recommended)' : 'High Quality'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="95"
                      step="5"
                      value={compressQuality}
                      onChange={(e) => setCompressQuality(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Format
                      </label>
                      <select
                        value={compressFormat}
                        onChange={(e) => setCompressFormat(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                      >
                        <option value="image/jpeg">JPG (Widely Compatible)</option>
                        <option value="image/webp">WebP (Maximum Compression)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Constraint Max Width (Optional)
                      </label>
                      <select
                        value={compressMaxWidth}
                        onChange={(e) => setCompressMaxWidth(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                      >
                        <option value="">Keep Original Resolution</option>
                        <option value="1920">1920px (Full HD)</option>
                        <option value="1280">1280px (Web standard)</option>
                        <option value="800">800px (Mobile optimized)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* RESIZE IMAGE */}
              {tool.id === 'resize-image' && (
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        value={resizeWidth}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : '';
                          setResizeWidth(val);
                          if (keepAspectRatio && originalDimensions && val) {
                            setResizeHeight(Math.round((originalDimensions.h * Number(val)) / originalDimensions.w));
                          }
                        }}
                        placeholder="1920"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        value={resizeHeight}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : '';
                          setResizeHeight(val);
                          if (keepAspectRatio && originalDimensions && val) {
                            setResizeWidth(Math.round((originalDimensions.w * Number(val)) / originalDimensions.h));
                          }
                        }}
                        placeholder="1080"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keepAspectRatio}
                        onChange={(e) => setKeepAspectRatio(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Lock aspect ratio</span>
                    </label>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Presets:</span>
                      {[
                        { label: 'Full HD', w: 1920, h: 1080 },
                        { label: 'HD', w: 1280, h: 720 },
                        { label: 'Square', w: 800, h: 800 },
                        { label: 'Avatar', w: 400, h: 400 }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setResizeWidth(preset.w);
                            setResizeHeight(preset.h);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DEDICATED IMAGE CONVERSIONS (JPG, PNG, WebP) & CONVERT IMAGE */}
              {(tool.id === 'image-to-jpg' || tool.id === 'image-to-webp') && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>Output Quality: {convertQuality}%</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {convertQuality > 85 ? 'High Quality (Default)' : convertQuality > 60 ? 'Balanced' : 'Smallest Size'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={convertQuality}
                    onChange={(e) => setConvertQuality(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-zinc-400">
                    {tool.id === 'image-to-jpg' && 'Alpha transparency from PNG/WebP files will be filled with clean white background.'}
                    {tool.id === 'image-to-webp' && 'Produces ultra-compact next-gen WebP images supported across modern browsers.'}
                  </p>
                </div>
              )}

              {tool.id === 'image-to-png' && (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">Lossless PNG Output</p>
                  <p className="text-[11px] mt-0.5">PNG format preserves full pixel fidelity and transparency without compression artifacts.</p>
                </div>
              )}

              {tool.id === 'convert-image' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Target Output Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'image/webp', label: 'WebP' },
                        { id: 'image/jpeg', label: 'JPG' },
                        { id: 'image/png', label: 'PNG' }
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setConvertFormat(fmt.id as any)}
                          className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                            convertFormat === fmt.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {convertFormat !== 'image/png' && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        <span>Quality: {convertQuality}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={convertQuality}
                        onChange={(e) => setConvertQuality(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* CROP IMAGE */}
              {tool.id === 'crop-image' && (
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Aspect Ratio Preset
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        { id: '1:1', label: '1:1 Square' },
                        { id: '16:9', label: '16:9 Cinema' },
                        { id: '4:3', label: '4:3 Standard' },
                        { id: 'free', label: 'Freeform' }
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setCropAspect(preset.id as any);
                            if (originalDimensions) {
                              let w = Math.min(originalDimensions.w, 500);
                              let h = w;
                              if (preset.id === '16:9') h = Math.round((w * 9) / 16);
                              if (preset.id === '4:3') h = Math.round((w * 3) / 4);
                              setCropCoords({
                                x: Math.round((originalDimensions.w - w) / 2),
                                y: Math.round((originalDimensions.h - h) / 2),
                                width: w,
                                height: h
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                            cropAspect === preset.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">X Offset</span>
                      <input
                        type="number"
                        value={cropCoords.x}
                        onChange={(e) => setCropCoords((prev) => ({ ...prev, x: Number(e.target.value) }))}
                        className="w-full px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Y Offset</span>
                      <input
                        type="number"
                        value={cropCoords.y}
                        onChange={(e) => setCropCoords((prev) => ({ ...prev, y: Number(e.target.value) }))}
                        className="w-full px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Width</span>
                      <input
                        type="number"
                        value={cropCoords.width}
                        onChange={(e) => setCropCoords((prev) => ({ ...prev, width: Number(e.target.value) }))}
                        className="w-full px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Height</span>
                      <input
                        type="number"
                        value={cropCoords.height}
                        onChange={(e) => setCropCoords((prev) => ({ ...prev, height: Number(e.target.value) }))}
                        className="w-full px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            {processing && (
              <div className="pt-4 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {progressStatus || 'Processing file...'}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              disabled={processing || files.length === 0}
              onClick={handleExecuteTool}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute {tool.name}</span>
                </>
              )}
            </button>

            {/* Result Download Card */}
            {result && !processing && (
              <div className="mt-6 p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-extrabold text-base text-zinc-900 dark:text-white">
                          Ready for Download!
                        </h4>
                        {result.savings !== undefined && result.savings > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                            -{result.savings}% Smaller
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {result.fileName} ({formatBytes(result.outputSize)})
                        {result.inputSize > 0 && ` • Reduced from ${formatBytes(result.inputSize)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveBlob(result.blob, result.fileName)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFiles([]);
                        setResult(null);
                      }}
                      className="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                    >
                      New Conversion
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
