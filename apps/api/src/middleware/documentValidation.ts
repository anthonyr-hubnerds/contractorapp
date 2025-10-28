import { Request, Response, NextFunction } from 'express';
import { DocumentType, DocumentStatus, DocumentUploadRequest, VerifyDocumentRequest } from '../types/documents';

const validDocumentTypes: DocumentType[] = ['insurance', 'license', 'certification', 'contract', 'other'];
const validDocumentStatuses: DocumentStatus[] = ['pending', 'approved', 'rejected', 'pending_revision'];

export const validateDocumentUpload = (req: DocumentUploadRequest, res: Response, next: NextFunction): void => {
  const { type, expiresAt } = req.body;

  // Validate document type
  if (!type || !validDocumentTypes.includes(type)) {
    res.status(400).json({
      error: 'Invalid document type',
      validTypes: validDocumentTypes
    });
    return;
  }

  // Validate expiration date if provided
  if (expiresAt) {
    const expDate = new Date(expiresAt);
    if (isNaN(expDate.getTime())) {
      res.status(400).json({ error: 'Invalid expiration date format' });
      return;
    }
    if (expDate < new Date()) {
      res.status(400).json({ error: 'Expiration date cannot be in the past' });
      return;
    }
  }

  next();
};

export const validateDocumentVerification = (req: VerifyDocumentRequest, res: Response, next: NextFunction): void => {
  const { status, verifiedBy } = req.body;

  // Validate required fields
  if (!status || !verifiedBy) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['status', 'verifiedBy']
    });
    return;
  }

  // Validate status
  if (!validDocumentStatuses.includes(status)) {
    res.status(400).json({
      error: 'Invalid status',
      validStatuses: validDocumentStatuses
    });
    return;
  }

  // Validate verifiedBy is not empty
  if (!verifiedBy.trim()) {
    res.status(400).json({
      error: 'Verified by cannot be empty'
    });
    return;
  }

  next();
};

export const validateDocumentAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { subcontractorId, documentId } = req.params;
  
  // Ensure both IDs are provided
  if (!subcontractorId || !documentId) {
    res.status(400).json({
      error: 'Missing required parameters',
      required: ['subcontractorId', 'documentId']
    });
    return;
  }

  next();
};