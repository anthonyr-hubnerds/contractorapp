import { Request } from 'express';

export type DocumentType = 'insurance' | 'license' | 'certification' | 'contract' | 'other';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'pending_revision';

export interface DocumentMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  key: string;
  bucket: string;
  lastVerifiedAt?: string;
  verificationHistory?: VerificationHistoryEntry[];
}

export interface VerificationHistoryEntry {
  status: DocumentStatus;
  verifiedBy: string;
  date: string;
  notes?: string;
}

export interface DocumentUploadRequest extends Request {
  file: Express.MulterS3.File;
  body: {
    type: DocumentType;
    expiresAt?: string;
    description?: string;
    tags?: string[];
  };
}

export interface VerifyDocumentRequest extends Request {
  body: {
    status: DocumentStatus;
    verifiedBy: string;
    verificationNotes?: string;
  };
}

export interface DocumentResponse {
  id: string;
  type: DocumentType;
  fileUrl: string;
  status: DocumentStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  verificationDate?: Date;
  verifiedBy?: string;
  verificationNotes?: string;
  metadata: DocumentMetadata;
  subcontractorId: string;
}