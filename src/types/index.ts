export interface FileUpload {
  id: string;
  name: string;
  size: number;
  s3Key: string;
  uploadProgress: number;
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';
  jobId?: string;
  error?: string;
  uploadedAt?: Date;
}

export interface Job {
  id: string;
  fileId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  stages?: {
    upload: { status: 'pending' | 'active' | 'completed' | 'failed'; timestamp?: Date };
    extract: { status: 'pending' | 'active' | 'completed' | 'failed'; timestamp?: Date };
    process: { status: 'pending' | 'active' | 'completed' | 'failed'; timestamp?: Date };
  };
}

export interface DataRow {
  id: string;
  [key: string]: any;
}

export interface TableData {
  fileId: string;
  columns: string[];
  rows: DataRow[];
  modifiedRows: Set<string>;
}

export interface PresentationRequest {
  jobId: string;
  format: 'pdf' | 'pptx';
  template?: string;
}

export interface QARequest {
  question: string;
  fileIds?: string[];
}

export interface QAResponse {
  answer: string;
  sources: Array<{
    fileId: string;
    fileName: string;
    relevance: number;
  }>;
  timestamp: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  token: string;
}
