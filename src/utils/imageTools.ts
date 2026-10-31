import { calculateResize } from './pureLogic';

export interface ImageProcessingResult {
  blob: Blob;
  originalSize: number;
  newSize: number;
  savingsPercent: number;
  width: number;
  height: number;
  mimeType: string;
  extension: string;
}

export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not decode image "${file.name}". Please ensure it is a valid JPG, PNG, or WebP file.`));
    };
    img.src = url;
  });
};

/**
 * Convert Image between JPG, PNG, and WebP
 */
export const convertImage = async (
  file: File,
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp',
  quality = 0.9,
  onProgress?: (percent: number, status: string) => void
): Promise<ImageProcessingResult> => {
  onProgress?.(25, 'Loading image into memory...');
  const img = await loadImage(file);

  onProgress?.(50, `Rendering to ${targetFormat.split('/')[1].toUpperCase()}...`);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D rendering context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If converting to JPEG, draw solid white background to avoid black background on transparent PNGs
  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  onProgress?.(80, 'Encoding output format...');
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, targetFormat, quality));
  if (!blob) throw new Error('Failed to encode image in the requested format.');

  const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';
  const savings = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));

  onProgress?.(100, 'Conversion complete!');

  return {
    blob,
    originalSize: file.size,
    newSize: blob.size,
    savingsPercent: savings,
    width: img.naturalWidth,
    height: img.naturalHeight,
    mimeType: targetFormat,
    extension: ext
  };
};

/**
 * Compress image with quality slider and optional max width
 */
export const compressImage = async (
  file: File,
  quality = 0.75,
  targetFormat?: 'image/jpeg' | 'image/png' | 'image/webp',
  maxWidth?: number,
  onProgress?: (percent: number, status: string) => void
): Promise<ImageProcessingResult> => {
  onProgress?.(25, 'Analyzing image...');
  const img = await loadImage(file);

  let targetW = img.naturalWidth;
  let targetH = img.naturalHeight;

  if (maxWidth && maxWidth > 0 && targetW > maxWidth) {
    targetH = Math.round((img.naturalHeight * maxWidth) / targetW);
    targetW = maxWidth;
  }

  onProgress?.(50, `Applying compression (${Math.round(quality * 100)}% quality)...`);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const format = targetFormat || (file.type === 'image/png' ? 'image/webp' : 'image/jpeg');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);

  onProgress?.(85, 'Finalizing compressed file...');
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, format, quality));
  if (!blob) throw new Error('Compression failed.');

  const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
  const savings = Math.round(((file.size - blob.size) / file.size) * 100);

  onProgress?.(100, 'Image compressed!');

  return {
    blob,
    originalSize: file.size,
    newSize: blob.size,
    savingsPercent: Math.max(0, savings),
    width: targetW,
    height: targetH,
    mimeType: format,
    extension: ext
  };
};

/**
 * Resize image with exact dimensions or percentage
 */
export const resizeImage = async (
  file: File,
  targetWidth: number,
  targetHeight: number,
  keepRatio = true,
  targetFormat = 'image/jpeg',
  quality = 0.9,
  onProgress?: (percent: number, status: string) => void
): Promise<ImageProcessingResult> => {
  onProgress?.(20, 'Reading image dimensions...');
  const img = await loadImage(file);

  const { width: finalW, height: finalH } = calculateResize(
    img.naturalWidth,
    img.naturalHeight,
    targetWidth,
    targetHeight,
    keepRatio
  );

  onProgress?.(55, `Resizing from ${img.naturalWidth}x${img.naturalHeight} to ${finalW}x${finalH}...`);
  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalW, finalH);
  }

  ctx.drawImage(img, 0, 0, finalW, finalH);

  onProgress?.(85, 'Encoding resized output...');
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, targetFormat, quality));
  if (!blob) throw new Error('Image resize encoding failed.');

  const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';
  const savings = Math.round(((file.size - blob.size) / file.size) * 100);

  onProgress?.(100, 'Image resized successfully!');

  return {
    blob,
    originalSize: file.size,
    newSize: blob.size,
    savingsPercent: savings,
    width: finalW,
    height: finalH,
    mimeType: targetFormat,
    extension: ext
  };
};

/**
 * Crop image to coordinates
 */
export const cropImage = async (
  file: File,
  cropArea: { x: number; y: number; width: number; height: number },
  targetFormat = 'image/jpeg',
  quality = 0.92,
  onProgress?: (percent: number, status: string) => void
): Promise<ImageProcessingResult> => {
  onProgress?.(25, 'Loading source image...');
  const img = await loadImage(file);

  const cropW = Math.max(1, Math.min(Math.round(cropArea.width), img.naturalWidth));
  const cropH = Math.max(1, Math.min(Math.round(cropArea.height), img.naturalHeight));
  const cropX = Math.max(0, Math.min(Math.round(cropArea.x), img.naturalWidth - cropW));
  const cropY = Math.max(0, Math.min(Math.round(cropArea.y), img.naturalHeight - cropH));

  onProgress?.(55, `Cropping selection (${cropW}x${cropH})...`);
  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cropW, cropH);
  }

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  onProgress?.(85, 'Encoding cropped image...');
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, targetFormat, quality));
  if (!blob) throw new Error('Could not crop image.');

  const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';

  onProgress?.(100, 'Image cropped successfully!');

  return {
    blob,
    originalSize: file.size,
    newSize: blob.size,
    savingsPercent: Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100)),
    width: cropW,
    height: cropH,
    mimeType: targetFormat,
    extension: ext
  };
};
