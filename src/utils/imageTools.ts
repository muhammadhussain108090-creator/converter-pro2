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

/**
 * Ultra-resilient image loader:
 * Uses URL.createObjectURL with fallback to FileReader DataURL
 */
export const loadImage = (file: File | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (e) {
      objectUrl = null;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (_) {}
      }
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };

    img.onerror = () => {
      cleanup();
      // Fallback: FileReader readAsDataURL handles edge cases
      const reader = new FileReader();
      reader.onload = () => {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => {
          const fileName = (file as File).name || 'image';
          reject(new Error(`Could not decode image "${fileName}". Please ensure it is a valid JPG, PNG, WebP, GIF, or BMP file.`));
        };
        fallbackImg.src = reader.result as string;
      };
      reader.onerror = () => {
        const fileName = (file as File).name || 'image';
        reject(new Error(`Failed to read file "${fileName}".`));
      };
      reader.readAsDataURL(file);
    };

    if (objectUrl) {
      img.src = objectUrl;
    } else {
      // Direct FileReader if URL.createObjectURL was not available
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  });
};

/**
 * Convert Image between JPG, PNG, and WebP formats
 */
export const convertImage = async (
  file: File,
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp',
  quality = 0.92,
  onProgress?: (percent: number, status: string) => void
): Promise<ImageProcessingResult> => {
  onProgress?.(20, 'Loading image into memory...');
  const img = await loadImage(file);

  const formatLabel = targetFormat === 'image/jpeg' ? 'JPG' : targetFormat === 'image/png' ? 'PNG' : 'WebP';
  onProgress?.(50, `Rendering to ${formatLabel}...`);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width || 100;
  canvas.height = img.naturalHeight || img.height || 100;

  const ctx = canvas.getContext('2d', { alpha: targetFormat !== 'image/jpeg' });
  if (!ctx) throw new Error('Could not initialize canvas rendering context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If converting to JPEG, draw solid white background to avoid black alpha background
  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  onProgress?.(80, `Encoding ${formatLabel} output...`);

  // Robust canvas toBlob with fallback
  let blob = await new Promise<Blob | null>(res => canvas.toBlob(res, targetFormat, quality));
  let finalExt = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';

  if (!blob) {
    // If browser lacks WebP encoder, fallback to PNG or JPEG
    console.warn(`Browser failed to encode ${targetFormat}, falling back.`);
    const fallbackFormat = targetFormat === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    blob = await new Promise<Blob | null>(res => canvas.toBlob(res, fallbackFormat, quality));
    finalExt = fallbackFormat === 'image/jpeg' ? 'jpg' : 'png';
  }

  if (!blob) throw new Error('Failed to encode image in your browser.');

  const savings = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));
  onProgress?.(100, 'Conversion complete!');

  return {
    blob,
    originalSize: file.size,
    newSize: blob.size,
    savingsPercent: savings,
    width: canvas.width,
    height: canvas.height,
    mimeType: blob.type || targetFormat,
    extension: finalExt
  };
};

/**
 * Compress image with fine-tuned quality slider and optional max width
 */
export const compressImage = async (
  file: File,
  quality = 0.75,
  targetFormat?: 'image/jpeg' | 'image/png' | 'image/webp',
  maxWidth?: number,
  onProgress?: (percent: number, status: string) => void
): Promise<ImageProcessingResult> => {
  onProgress?.(20, 'Analyzing image...');
  const img = await loadImage(file);

  let targetW = img.naturalWidth || img.width || 100;
  let targetH = img.naturalHeight || img.height || 100;

  if (maxWidth && maxWidth > 0 && targetW > maxWidth) {
    targetH = Math.round((targetH * maxWidth) / targetW);
    targetW = maxWidth;
  }

  onProgress?.(50, `Applying compression (${Math.round(quality * 100)}% quality)...`);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, targetW);
  canvas.height = Math.max(1, targetH);

  // If original was PNG with alpha, default to WebP for smaller transparent compression, else JPEG
  const format = targetFormat || (file.type === 'image/png' ? 'image/webp' : 'image/jpeg');

  const ctx = canvas.getContext('2d', { alpha: format !== 'image/jpeg' });
  if (!ctx) throw new Error('Could not get canvas context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);

  onProgress?.(85, 'Finalizing compressed file...');
  let blob = await new Promise<Blob | null>(res => canvas.toBlob(res, format, quality));
  let ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';

  if (!blob) {
    blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
    ext = 'jpg';
  }

  if (!blob) throw new Error('Image compression failed.');

  const savings = Math.round(((file.size - blob.size) / file.size) * 100);
  onProgress?.(100, 'Image compressed!');

  return {
    blob,
    originalSize: file.size,
    newSize: blob.size,
    savingsPercent: Math.max(0, savings),
    width: targetW,
    height: targetH,
    mimeType: blob.type || format,
    extension: ext
  };
};

/**
 * Resize image with exact pixel dimensions or aspect ratio preservation
 */
export const resizeImage = async (
  file: File,
  targetWidth: number,
  targetHeight: number,
  keepRatio = true,
  targetFormat?: string,
  quality = 0.92,
  onProgress?: (percent: number, status: string) => void
): Promise<ImageProcessingResult> => {
  onProgress?.(20, 'Reading image dimensions...');
  const img = await loadImage(file);

  const origW = img.naturalWidth || img.width || 100;
  const origH = img.naturalHeight || img.height || 100;

  // If no dimensions were specified, default to original dimensions
  const reqW = targetWidth > 0 ? targetWidth : origW;
  const reqH = targetHeight > 0 ? targetHeight : origH;

  const { width: finalW, height: finalH } = calculateResize(
    origW,
    origH,
    reqW,
    reqH,
    keepRatio
  );

  onProgress?.(55, `Resizing from ${origW}x${origH} to ${finalW}x${finalH}...`);
  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;

  const outputFormat = targetFormat || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

  const ctx = canvas.getContext('2d', { alpha: outputFormat !== 'image/jpeg' });
  if (!ctx) throw new Error('Could not get canvas context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalW, finalH);
  }

  ctx.drawImage(img, 0, 0, finalW, finalH);

  onProgress?.(85, 'Encoding resized output...');
  let blob = await new Promise<Blob | null>(res => canvas.toBlob(res, outputFormat, quality));
  let ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/png' ? 'png' : 'webp';

  if (!blob) {
    blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
    ext = 'jpg';
  }

  if (!blob) throw new Error('Image resize encoding failed.');

  const savings = Math.round(((file.size - blob.size) / file.size) * 100);
  onProgress?.(100, 'Image resized successfully!');

  return {
    blob,
    originalSize: file.size,
    newSize: blob.size,
    savingsPercent: Math.max(0, savings),
    width: finalW,
    height: finalH,
    mimeType: blob.type || outputFormat,
    extension: ext
  };
};

/**
 * Crop image to exact rectangle
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

  const natW = img.naturalWidth || img.width || 100;
  const natH = img.naturalHeight || img.height || 100;

  const cropW = Math.max(1, Math.min(Math.round(cropArea.width || natW), natW));
  const cropH = Math.max(1, Math.min(Math.round(cropArea.height || natH), natH));
  const cropX = Math.max(0, Math.min(Math.round(cropArea.x || 0), natW - cropW));
  const cropY = Math.max(0, Math.min(Math.round(cropArea.y || 0), natH - cropH));

  onProgress?.(55, `Cropping selection (${cropW}x${cropH})...`);
  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext('2d', { alpha: targetFormat !== 'image/jpeg' });
  if (!ctx) throw new Error('Could not get canvas context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cropW, cropH);
  }

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  onProgress?.(85, 'Encoding cropped image...');
  let blob = await new Promise<Blob | null>(res => canvas.toBlob(res, targetFormat, quality));
  let ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';

  if (!blob) {
    blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
    ext = 'jpg';
  }

  if (!blob) throw new Error('Could not crop image.');

  onProgress?.(100, 'Image cropped successfully!');

  return {
    blob,
    originalSize: file.size,
    newSize: blob.size,
    savingsPercent: Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100)),
    width: cropW,
    height: cropH,
    mimeType: blob.type || targetFormat,
    extension: ext
  };
};
