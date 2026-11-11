/**
 * Pure helper functions and business logic for ConvertPro.
 * Decoupled from DOM/UI for fast, deterministic unit testing.
 */

export const formatBytes = (bytes: number = 0): string => {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
};

export const safeName = (originalName: string, newExt: string, prefix = 'convertpro'): string => {
  const base = originalName
    ? originalName.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_')
    : prefix;
  const cleanExt = newExt.replace(/^\./, '');
  return `${base}-${Date.now()}.${cleanExt}`;
};

/**
 * Parses page ranges such as "1", "1-3", "1, 3, 5-8", "2, 4"
 * Returns 0-indexed page numbers, sorted and deduplicated, within [0, totalPages - 1].
 */
export const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
  if (!rangeStr || !rangeStr.trim()) {
    throw new Error('Please enter at least one page number or range (e.g. 1-3, 5).');
  }

  if (totalPages < 1) {
    throw new Error('Document has no pages.');
  }

  const parts = rangeStr.split(',').map(p => p.trim()).filter(Boolean);
  if (!parts.length) {
    throw new Error('Invalid page format. Please enter numbers like 1, 3-5.');
  }

  const pageIndices = new Set<number>();

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!rangeMatch) {
      throw new Error(`Invalid range format: "${part}". Example of valid format: 1, 3-5`);
    }

    const start = parseInt(rangeMatch[1], 10);
    const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;

    if (start < 1) {
      throw new Error(`Page numbers start at 1. Found: ${start}`);
    }
    if (end < start) {
      throw new Error(`Invalid range: start page (${start}) is greater than end page (${end}).`);
    }
    if (start > totalPages || end > totalPages) {
      throw new Error(`This PDF only has ${totalPages} page${totalPages === 1 ? '' : 's'}. Cannot select page ${Math.max(start, end)}.`);
    }

    for (let p = start; p <= end; p++) {
      pageIndices.add(p - 1);
    }
  }

  return Array.from(pageIndices).sort((a, b) => a - b);
};

/**
 * Parses page numbers to delete, returning the remaining 0-indexed pages.
 */
export const parsePagesToDelete = (deleteInput: string, totalPages: number): number[] => {
  const pagesToDelete = new Set(parsePageRange(deleteInput, totalPages));

  if (pagesToDelete.size >= totalPages) {
    throw new Error(`Cannot delete all ${totalPages} pages. A PDF must have at least one remaining page.`);
  }

  const remaining: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (!pagesToDelete.has(i)) {
      remaining.push(i);
    }
  }

  return remaining;
};

/**
 * Calculates resized dimensions while optionally preserving aspect ratio.
 */
export const calculateResize = (
  origW: number,
  origH: number,
  targetW: number,
  targetH: number,
  keepRatio: boolean
): { width: number; height: number } => {
  if (origW <= 0 || origH <= 0) {
    throw new Error('Invalid original image dimensions.');
  }

  let finalW = Math.round(targetW);
  let finalH = Math.round(targetH);

  if (finalW <= 0 && finalH <= 0) {
    throw new Error('Please enter a target width or height.');
  }

  if (keepRatio) {
    if (finalW > 0 && (!finalH || finalH <= 0)) {
      finalH = Math.round((origH * finalW) / origW);
    } else if (finalH > 0 && (!finalW || finalW <= 0)) {
      finalW = Math.round((origW * finalH) / origH);
    } else if (finalW > 0 && finalH > 0) {
      // Fit within bounding box while preserving ratio
      const ratio = Math.min(finalW / origW, finalH / origH);
      finalW = Math.round(origW * ratio);
      finalH = Math.round(origH * ratio);
    }
  } else {
    finalW = finalW > 0 ? finalW : origW;
    finalH = finalH > 0 ? finalH : origH;
  }

  finalW = Math.max(1, Math.min(finalW, 12000));
  finalH = Math.max(1, Math.min(finalH, 12000));

  return { width: finalW, height: finalH };
};

/**
 * Validates password strength and returns score (0-4), status label, and criteria.
 */
export const calculatePasswordStrength = (password: string) => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      label: 'Too Short' as const,
      percent: 0,
      color: 'bg-zinc-300 dark:bg-zinc-700',
      feedback: ['Enter a password to begin.']
    };
  }

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Must be at least 8 characters long.');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one uppercase letter (A-Z).');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one number (0-9).');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one special character (!@#$%^&*).');
  }

  if (password.length >= 12 && score === 4) {
    score = 5;
  }

  let label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong' = 'Very Weak';
  let color = 'bg-rose-500';
  let percent = 20;

  if (score <= 1) {
    label = 'Weak';
    color = 'bg-rose-500';
    percent = 25;
  } else if (score === 2) {
    label = 'Fair';
    color = 'bg-amber-500';
    percent = 50;
  } else if (score === 3) {
    label = 'Good';
    color = 'bg-blue-500';
    percent = 75;
  } else {
    label = 'Strong';
    color = 'bg-emerald-500';
    percent = 100;
  }

  return {
    score,
    label,
    percent,
    color,
    feedback
  };
};

/**
 * Validates incoming files against tool constraints.
 */
export const validateFileSelection = (
  files: File[],
  toolId: string,
  maxFileSizeMb = 50
): { valid: boolean; error?: string } => {
  if (!files || files.length === 0) {
    return { valid: false, error: 'No files selected.' };
  }

  const maxBytes = maxFileSizeMb * 1024 * 1024;
  for (const file of files) {
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `"${file.name}" exceeds the ${maxFileSizeMb} MB limit (${formatBytes(file.size)}).`
      };
    }
    if (file.size === 0) {
      return {
        valid: false,
        error: `"${file.name}" appears to be empty (0 bytes).`
      };
    }
  }

  const pdfTools = ['merge', 'split', 'rotate', 'extract-pages', 'delete-pages', 'pdf-metadata', 'pdf-to-word', 'pdf-protect'];
  const imageTools = [
    'compress-image',
    'resize-image',
    'convert-image',
    'crop-image',
    'images-pdf',
    'image-to-jpg',
    'image-to-png',
    'image-to-webp'
  ];
  const docTools = ['word-to-pdf'];
  const audioTools = ['audio-converter', 'audio-to-mp3', 'audio-to-wav'];
  const videoTools = ['video-converter', 'video-to-mp4'];
  const videoToAudioTools = ['video-to-audio', 'extract-audio'];

  if (pdfTools.includes(toolId)) {
    const invalid = files.find(f => !f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf');
    if (invalid) {
      return { valid: false, error: `"${invalid.name}" is not a valid PDF file. Please select PDF documents only.` };
    }
  } else if (imageTools.includes(toolId)) {
    const invalid = files.find(f => !f.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(f.name));
    if (invalid) {
      return { valid: false, error: `"${invalid.name}" is not a supported image file.` };
    }
  } else if (docTools.includes(toolId)) {
    const invalid = files.find(f => !f.name.toLowerCase().endsWith('.docx') && !f.name.toLowerCase().endsWith('.doc'));
    if (invalid) {
      return { valid: false, error: `"${invalid.name}" is not a Word document. Please select a .docx file.` };
    }
  } else if (audioTools.includes(toolId)) {
    const invalid = files.find(
      f =>
        !f.type.startsWith('audio/') &&
        !/\.(mp3|wav|aac|flac|ogg|m4a|wma|opus|aiff|alac|weba|webm)$/i.test(f.name)
    );
    if (invalid) {
      return {
        valid: false,
        error: `"${invalid.name}" is not a supported audio file. Supported formats: MP3, WAV, AAC, FLAC, OGG, M4A, WMA.`
      };
    }
  } else if (videoTools.includes(toolId) || videoToAudioTools.includes(toolId)) {
    const invalid = files.find(
      f =>
        !f.type.startsWith('video/') &&
        !/\.(mp4|mov|mkv|avi|webm|flv|wmv|m4v|3gp|ts)$/i.test(f.name)
    );
    if (invalid) {
      return {
        valid: false,
        error: `"${invalid.name}" is not a supported video file. Supported formats: MP4, MOV, MKV, AVI, WebM.`
      };
    }
  }

  return { valid: true };
};

/**
 * Returns the standard MIME type for given audio or video extension.
 */
export const getMediaMimeType = (ext: string): string => {
  const clean = ext.toLowerCase().replace(/^\./, '');
  switch (clean) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'aac':
      return 'audio/aac';
    case 'flac':
      return 'audio/flac';
    case 'ogg':
      return 'audio/ogg';
    case 'm4a':
      return 'audio/mp4';
    case 'wma':
      return 'audio/x-ms-wma';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'mkv':
      return 'video/x-matroska';
    case 'avi':
      return 'video/x-msvideo';
    case 'webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Encodes audio channel data (Float32Array) into standard 16-bit PCM RIFF WAVE format.
 * Generates genuine, playable .wav audio files directly in-browser.
 */
export const encodePcmWav = (
  leftChannel: Float32Array,
  rightChannel: Float32Array | null,
  sampleRate: number
): Uint8Array => {
  const numChannels = rightChannel ? 2 : 1;
  const numSamples = leftChannel.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample (16-bit)
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, leftChannel[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
    if (rightChannel) {
      s = Math.max(-1, Math.min(1, rightChannel[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return new Uint8Array(buffer);
};

/**
 * Builds FFmpeg command line arguments for Audio Conversion.
 */
export const buildFFmpegAudioArgs = (
  inputName: string,
  outputName: string,
  targetFormat: string,
  options: { bitrate?: string; sampleRate?: number; channels?: string } = {}
): string[] => {
  const args = ['-i', inputName, '-vn'];
  const bitrate = options.bitrate || '192k';

  switch (targetFormat.toLowerCase()) {
    case 'mp3':
      args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
      break;
    case 'wav':
      args.push('-c:a', 'pcm_s16le');
      break;
    case 'aac':
      args.push('-c:a', 'aac', '-b:a', bitrate);
      break;
    case 'flac':
      args.push('-c:a', 'flac');
      break;
    case 'ogg':
      args.push('-c:a', 'libvorbis', '-b:a', bitrate);
      break;
    case 'm4a':
      args.push('-c:a', 'aac', '-b:a', bitrate);
      break;
    case 'wma':
      args.push('-c:a', 'wmav2', '-b:a', bitrate);
      break;
    default:
      args.push('-b:a', bitrate);
  }

  if (options.sampleRate) {
    args.push('-ar', String(options.sampleRate));
  }
  if (options.channels && options.channels !== 'auto') {
    args.push('-ac', options.channels);
  }

  args.push(outputName);
  return args;
};

/**
 * Builds FFmpeg command line arguments for Video Conversion.
 */
export const buildFFmpegVideoArgs = (
  inputName: string,
  outputName: string,
  targetFormat: string,
  options: { quality?: string; resolution?: string } = {}
): string[] => {
  const args = ['-i', inputName];
  const quality = options.quality || 'medium';
  const crf = quality === 'high' ? '22' : quality === 'low' ? '30' : '26';

  if (options.resolution && options.resolution !== 'original') {
    const scale =
      options.resolution === '1080p'
        ? 'scale=-2:1080'
        : options.resolution === '720p'
        ? 'scale=-2:720'
        : 'scale=-2:480';
    args.push('-vf', scale);
  }

  switch (targetFormat.toLowerCase()) {
    case 'mp4':
      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', crf, '-c:a', 'aac', '-b:a', '128k');
      break;
    case 'webm':
      args.push('-c:v', 'libvpx', '-crf', crf, '-b:v', '1M', '-c:a', 'libvorbis');
      break;
    case 'mov':
      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', crf, '-c:a', 'aac');
      break;
    case 'mkv':
      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', crf, '-c:a', 'aac');
      break;
    case 'avi':
      args.push('-c:v', 'mpeg4', '-qscale:v', quality === 'high' ? '3' : '5', '-c:a', 'mp3');
      break;
    default:
      args.push('-c:v', 'libx264', '-c:a', 'aac');
  }

  args.push(outputName);
  return args;
};

/**
 * Builds FFmpeg command line arguments for Video-to-Audio Extraction.
 */
export const buildFFmpegExtractArgs = (
  inputName: string,
  outputName: string,
  targetFormat: string,
  options: { bitrate?: string } = {}
): string[] => {
  const args = ['-i', inputName, '-vn'];
  const bitrate = options.bitrate || '192k';

  switch (targetFormat.toLowerCase()) {
    case 'mp3':
      args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
      break;
    case 'wav':
      args.push('-c:a', 'pcm_s16le');
      break;
    case 'aac':
      args.push('-c:a', 'aac', '-b:a', bitrate);
      break;
    case 'ogg':
      args.push('-c:a', 'libvorbis', '-b:a', bitrate);
      break;
    case 'm4a':
      args.push('-c:a', 'aac', '-b:a', bitrate);
      break;
    default:
      args.push('-b:a', bitrate);
  }

  args.push(outputName);
  return args;
};
