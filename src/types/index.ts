export type ToolCategory = 'All' | 'PDF' | 'Image' | 'Audio' | 'Video' | 'Document';

export type AudioTargetFormat = 'mp3' | 'wav' | 'aac' | 'flac' | 'ogg' | 'm4a' | 'wma';
export type VideoTargetFormat = 'mp4' | 'mov' | 'mkv' | 'avi' | 'webm';
export type ExtractedAudioFormat = 'mp3' | 'wav' | 'aac' | 'ogg' | 'm4a';

export interface AudioConvertOptions {
  format: AudioTargetFormat;
  bitrate?: string; // '128k' | '192k' | '256k' | '320k'
  sampleRate?: number; // 44100 | 48000
  channels?: 'auto' | '1' | '2';
}

export interface VideoConvertOptions {
  format: VideoTargetFormat;
  quality?: 'high' | 'medium' | 'low';
  resolution?: 'original' | '1080p' | '720p' | '480p';
}

export interface ExtractAudioOptions {
  format: ExtractedAudioFormat;
  bitrate?: string;
  sampleRate?: number;
}

export interface Tool {
  id: string;
  name: string;
  shortDesc: string;
  desc: string;
  category: ToolCategory;
  icon: string;
  tag?: 'Popular' | 'New' | 'Updated';
  acceptedTypes: string[];
  acceptAttribute: string;
  maxFiles: number;
  technicalNote?: string;
}

export interface ConversionHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  inputFileName: string;
  inputFileSize: number;
  outputFileName: string;
  outputFileSize: number;
  timestamp: number;
  status: 'success' | 'error';
  details?: string;
}

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: number;
  conversionsCount?: number;
}

export interface NoticeMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface PdfMetadataInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  pdfVersion?: string;
}
