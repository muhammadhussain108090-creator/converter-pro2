import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import {
  AudioConvertOptions,
  VideoConvertOptions,
  ExtractAudioOptions
} from '../types';
import {
  encodePcmWav,
  buildFFmpegAudioArgs,
  buildFFmpegVideoArgs,
  buildFFmpegExtractArgs,
  getMediaMimeType,
  safeName
} from './pureLogic';

// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

const FFMPEG_CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
const FFMPEG_CORE_FALLBACK = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';

/**
 * Loads and initializes the FFmpeg WebAssembly core.
 * Uses single-threaded build compatible with standard browsers.
 */
export async function getFFmpeg(
  onStatusUpdate?: (status: string, percent?: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (ffmpegLoadPromise) {
    return ffmpegLoadPromise;
  }

  ffmpegLoadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    if (onStatusUpdate) {
      onStatusUpdate('Loading media conversion engine...', 12);
    }

    try {
      // Primary CDN: unpkg
      const coreURL = await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm');

      await ffmpeg.load({
        coreURL,
        wasmURL
      });
    } catch (err) {
      console.warn('Primary FFmpeg CDN failed, trying fallback CDN...', err);
      if (onStatusUpdate) {
        onStatusUpdate('Connecting to fallback conversion engine...', 15);
      }

      const coreURL = await toBlobURL(`${FFMPEG_CORE_FALLBACK}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${FFMPEG_CORE_FALLBACK}/ffmpeg-core.wasm`, 'application/wasm');

      await ffmpeg.load({
        coreURL,
        wasmURL
      });
    }

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    const loaded = await ffmpegLoadPromise;
    return loaded;
  } catch (err) {
    ffmpegLoadPromise = null;
    throw err;
  }
}

/**
 * Fallback Web Audio API decoder and WAV encoder.
 * Works 100% in-browser offline for any audio or video container supported by the browser.
 */
export async function convertToWavViaWebAudio(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; extension: string }> {
  if (onProgress) onProgress(25, 'Reading audio data...');
  const arrayBuffer = await file.arrayBuffer();

  if (onProgress) onProgress(45, 'Decoding audio track with Web Audio API...');
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) throw new Error('Web Audio API is not supported in this browser.');

  const audioCtx = new AudioCtx();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    if (onProgress) onProgress(75, 'Encoding 16-bit PCM WAV...');

    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;
    const wavBytes = encodePcmWav(left, right, audioBuffer.sampleRate);

    if (onProgress) onProgress(95, 'Finalizing WAV file...');
    const blob = new Blob([wavBytes as unknown as BlobPart], { type: 'audio/wav' });
    const fileName = safeName(file.name, 'wav', 'audio-converted');

    return { blob, fileName, extension: 'wav' };
  } finally {
    audioCtx.close().catch(() => {});
  }
}

/**
 * Converts an audio file to the target format (MP3, WAV, AAC, FLAC, OGG, M4A, WMA).
 */
export async function convertAudioFile(
  file: File,
  options: AudioConvertOptions,
  onProgress: (percent: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; extension: string }> {
  const targetFormat = options.format.toLowerCase();

  // If target is WAV, check if Web Audio can perform instant zero-download conversion
  if (targetFormat === 'wav' && (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|weba)$/i.test(file.name))) {
    try {
      return await convertToWavViaWebAudio(file, onProgress);
    } catch (e) {
      console.warn('Native WebAudio decoding unavailable for this format, falling back to FFmpeg:', e);
    }
  }

  onProgress(10, 'Initializing FFmpeg media engine...');
  const ffmpeg = await getFFmpeg((status, p) => onProgress(p || 15, status));

  const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  const inputName = `input_${Date.now()}.${inputExt}`;
  const outputName = `output_${Date.now()}.${targetFormat}`;

  onProgress(25, `Loading "${file.name}" into virtual memory...`);
  const fileData = await fetchFile(file);
  await ffmpeg.writeFile(inputName, fileData);

  // Set up progress tracking
  const progressHandler = ({ progress }: { progress: number }) => {
    if (progress > 0 && progress <= 1) {
      const pct = Math.min(95, Math.round(30 + progress * 65));
      onProgress(pct, `Converting audio to ${targetFormat.toUpperCase()} (${pct}%)...`);
    }
  };
  ffmpeg.on('progress', progressHandler);

  onProgress(35, `Processing and re-encoding to ${targetFormat.toUpperCase()}...`);
  const args = buildFFmpegAudioArgs(inputName, outputName, targetFormat, {
    bitrate: options.bitrate,
    sampleRate: options.sampleRate,
    channels: options.channels
  });

  try {
    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with error code ${exitCode} while converting audio.`);
    }

    onProgress(92, 'Extracting converted audio file...');
    const outputData = await ffmpeg.readFile(outputName);
    const mimeType = getMediaMimeType(targetFormat);
    const outputBlob = new Blob([outputData as unknown as BlobPart], { type: mimeType });

    const fileName = safeName(file.name, targetFormat, 'audio-converted');
    onProgress(100, 'Audio conversion complete!');

    return {
      blob: outputBlob,
      fileName,
      extension: targetFormat
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch (_) {}
    try {
      await ffmpeg.deleteFile(outputName);
    } catch (_) {}
  }
}

/**
 * Converts a video file to the target format (MP4, MOV, MKV, AVI, WebM).
 */
export async function convertVideoFile(
  file: File,
  options: VideoConvertOptions,
  onProgress: (percent: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; extension: string }> {
  const targetFormat = options.format.toLowerCase();

  onProgress(10, 'Initializing FFmpeg video engine...');
  const ffmpeg = await getFFmpeg((status, p) => onProgress(p || 15, status));

  const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const inputName = `input_${Date.now()}.${inputExt}`;
  const outputName = `output_${Date.now()}.${targetFormat}`;

  onProgress(25, `Preparing video "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
  const fileData = await fetchFile(file);
  await ffmpeg.writeFile(inputName, fileData);

  const progressHandler = ({ progress }: { progress: number }) => {
    if (progress > 0 && progress <= 1) {
      const pct = Math.min(95, Math.round(25 + progress * 70));
      onProgress(pct, `Encoding ${targetFormat.toUpperCase()} frames (${pct}%)...`);
    }
  };
  ffmpeg.on('progress', progressHandler);

  onProgress(35, `Transcoding video to ${targetFormat.toUpperCase()} with ${options.quality || 'medium'} quality...`);
  const args = buildFFmpegVideoArgs(inputName, outputName, targetFormat, {
    quality: options.quality,
    resolution: options.resolution
  });

  try {
    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with error code ${exitCode} while transcoding video.`);
    }

    onProgress(95, 'Finalizing video package...');
    const outputData = await ffmpeg.readFile(outputName);
    const mimeType = getMediaMimeType(targetFormat);
    const outputBlob = new Blob([outputData as unknown as BlobPart], { type: mimeType });

    const fileName = safeName(file.name, targetFormat, 'video-converted');
    onProgress(100, 'Video conversion complete!');

    return {
      blob: outputBlob,
      fileName,
      extension: targetFormat
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch (_) {}
    try {
      await ffmpeg.deleteFile(outputName);
    } catch (_) {}
  }
}

/**
 * Extracts pure audio track from a video file into MP3, WAV, AAC, OGG, or M4A.
 */
export async function extractAudioFromVideo(
  file: File,
  options: ExtractAudioOptions,
  onProgress: (percent: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; extension: string }> {
  const targetFormat = options.format.toLowerCase();

  // If extracting to WAV, attempt instant Web Audio decode
  if (targetFormat === 'wav') {
    try {
      return await convertToWavViaWebAudio(file, onProgress);
    } catch (e) {
      console.warn('Native video audio track extraction unavailable, using FFmpeg:', e);
    }
  }

  onProgress(10, 'Initializing audio extraction engine...');
  const ffmpeg = await getFFmpeg((status, p) => onProgress(p || 15, status));

  const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const inputName = `input_${Date.now()}.${inputExt}`;
  const outputName = `output_${Date.now()}.${targetFormat}`;

  onProgress(25, `Reading video stream from "${file.name}"...`);
  const fileData = await fetchFile(file);
  await ffmpeg.writeFile(inputName, fileData);

  const progressHandler = ({ progress }: { progress: number }) => {
    if (progress > 0 && progress <= 1) {
      const pct = Math.min(95, Math.round(30 + progress * 65));
      onProgress(pct, `Extracting audio track to ${targetFormat.toUpperCase()} (${pct}%)...`);
    }
  };
  ffmpeg.on('progress', progressHandler);

  onProgress(40, `Extracting audio stream to ${targetFormat.toUpperCase()}...`);
  const args = buildFFmpegExtractArgs(inputName, outputName, targetFormat, {
    bitrate: options.bitrate
  });

  try {
    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with error code ${exitCode} while extracting audio.`);
    }

    onProgress(95, 'Finalizing audio export...');
    const outputData = await ffmpeg.readFile(outputName);
    const mimeType = getMediaMimeType(targetFormat);
    const outputBlob = new Blob([outputData as unknown as BlobPart], { type: mimeType });

    const fileName = safeName(file.name, targetFormat, 'extracted-audio');
    onProgress(100, 'Audio extraction complete!');

    return {
      blob: outputBlob,
      fileName,
      extension: targetFormat
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch (_) {}
    try {
      await ffmpeg.deleteFile(outputName);
    } catch (_) {}
  }
}
