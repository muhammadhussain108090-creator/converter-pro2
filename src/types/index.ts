export type ToolCategory = 'All' | 'PDF' | 'Image' | 'Document';

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
