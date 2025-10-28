'use client';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Rating,
  Stack,
  Tooltip,
  CircularProgress,
  Snackbar,
  AlertTitle,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Button,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineContent,
  TimelineDot,
  TimelineConnector,
} from '@mui/lab';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import DocumentUpload from './DocumentUpload';
import {
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Warning as WarningIcon,
  Verified as VerifiedIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  Upload as UploadIcon,
  Badge as BadgeIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { type ComplianceDocument, type Subcontractor } from '../hooks/useSubcontractors';

interface SubcontractorCardProps {
  subcontractor: Subcontractor;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SubcontractorCard({ subcontractor: sub }: SubcontractorCardProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const { mutate } = useSWRConfig();
  const getStatusColor = (status: string): 'success' | 'default' | 'error' => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getDocumentStatusIcon = (doc: ComplianceDocument) => {
    const isExpiringSoon = doc.expiresAt && 
      new Date(doc.expiresAt).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days

    if (isExpiringSoon) {
      return (
        <Tooltip title="Expiring soon">
          <WarningIcon color="warning" />
        </Tooltip>
      );
    }

    switch (doc.status.toLowerCase()) {
      case 'verified':
        return (
          <Tooltip title="Verified">
            <VerifiedIcon color="success" />
          </Tooltip>
        );
      case 'pending':
        return (
          <Tooltip title="Pending verification">
            <CircularProgress size={20} />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="h2">
            {sub.name}
          </Typography>
          <Chip
            label={sub.status}
            color={getStatusColor(sub.status)}
            size="small"
          />
        </Box>

        <Stack spacing={1} sx={{ mb: 2 }}>
          {sub.rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={sub.rating} readOnly precision={0.5} size="small" />
              <Typography variant="body2" color="text.secondary">
                ({sub.rating})
              </Typography>
            </Box>
          )}
          
          {sub.businessType && (
            <Typography variant="body2" color="text.secondary">
              <BusinessIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              {sub.businessType}
            </Typography>
          )}

          {sub.email && (
            <Typography variant="body2">
              <EmailIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              {sub.email}
            </Typography>
          )}

          {sub.phone && (
            <Typography variant="body2">
              <PhoneIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              {sub.phone}
            </Typography>
          )}

          {sub.address && (
            <Typography variant="body2">
              <LocationOnIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              {sub.address}
            </Typography>
          )}
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Specialties
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {sub.specialties.map((specialty, index) => (
              <Chip
                key={index}
                label={specialty}
                size="small"
                sx={{ m: 0.5 }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2">
            Compliance Documents
          </Typography>
          <Tooltip title="Upload Document">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => setUploadDialogOpen(true)}
            >
              <UploadIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {sub.docs.length === 0 ? (
          <Box 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <BadgeIcon sx={{ color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No documents uploaded yet
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {sub.docs.map((doc) => (
              <Box
                key={doc.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'background.paper',
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <DescriptionIcon fontSize="small" color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {doc.type}
                  </Typography>
                  {doc.expiresAt && (
                    <Typography variant="caption" color="text.secondary">
                      Expires: {new Date(doc.expiresAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {getDocumentStatusIcon(doc)}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '.MuiBox-root:hover > &': { opacity: 1 }
                  }}>
                    <Tooltip title="View Document">
                      <IconButton size="small" href={doc.fileUrl} target="_blank">
                        <DescriptionIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Verify Document">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedDoc(doc);
                          setVerifyDialogOpen(true);
                        }}
                        color={doc.status === 'verified' ? 'success' : 'default'}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share Document">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShareDialogOpen(true);
                        }}
                      >
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View History">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setHistoryDialogOpen(true);
                        }}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Document">
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ mt: 'auto', justifyContent: 'flex-end', gap: 1 }}>
        <Link href={`/subcontractors/${sub.id}/edit`} style={{ textDecoration: 'none' }}>
          <IconButton 
            size="small" 
            color="primary"
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { backgroundColor: 'primary.main', color: 'white' }
            }}
          >
            <EditIcon />
          </IconButton>
        </Link>
      </CardActions>
      
      <DocumentUpload 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        onUpload={async (document, setProgress) => {
          try {
            const formData = new FormData();
            formData.append('file', document.file);
            formData.append('type', document.type);
            if (document.expiresAt) {
              formData.append('expiresAt', document.expiresAt.toISOString());
            }
            
            const xhr = new XMLHttpRequest();
            
            await new Promise<void>((resolve, reject) => {
              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  const progress = Math.round((event.loaded / event.total) * 100);
                  setProgress(progress);
                }
              };
              
              xhr.onload = () => {
                if (xhr.status === 200) {
                  resolve();
                } else {
                  reject(new Error('Upload failed'));
                }
              };
              
              xhr.onerror = () => reject(new Error('Upload failed'));
              
              xhr.open('POST', `${API_BASE}/api/subcontractors/${sub.id}/documents`);
              xhr.send(formData);
            });
            
            // Refresh the subcontractor data
            await mutate('/api/subcontractors');
            setUploadDialogOpen(false);
            setNotification({ 
              type: 'success', 
              message: 'Document uploaded successfully' 
            });
          } catch (err) {
            console.error('Error uploading document:', err);
            setNotification({ 
              type: 'error', 
              message: 'Failed to upload document. Please try again.' 
            });
            throw new Error('Failed to upload document');
          }
        }}
      />
      
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(null)}
          severity={notification?.type || 'info'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          <AlertTitle>{notification?.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          {notification?.message}
        </Alert>
      </Snackbar>

      {/* Verification Dialog */}
      <Dialog 
        open={verifyDialogOpen} 
        onClose={() => setVerifyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Verify Document
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Document Details
            </Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body2">{selectedDoc?.type}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Expiration</Typography>
                  <Typography variant="body2">
                    {selectedDoc?.expiresAt 
                      ? new Date(selectedDoc.expiresAt).toLocaleDateString()
                      : 'No expiration'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    size="small"
                    label={selectedDoc?.status}
                    color={selectedDoc?.status === 'verified' ? 'success' : 'default'}
                  />
                </Box>
              </Stack>
            </Box>

            <TextField
              label="Verification Notes"
              multiline
              rows={3}
              fullWidth
              placeholder="Add any notes about the verification (optional)"
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setVerifyDialogOpen(false)}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={async () => {
              try {
                const res = await fetch(`${API_BASE}/api/documents/${selectedDoc?.id}/verify`, {
                  method: 'POST',
                });
                if (!res.ok) throw new Error('Failed to verify document');
                
                await mutate('/api/subcontractors');
                setVerifyDialogOpen(false);
                setNotification({
                  type: 'success',
                  message: 'Document verified successfully'
                });
              } catch (err) {
                setNotification({
                  type: 'error',
                  message: 'Failed to verify document'
                });
              }
            }}
            startIcon={<CheckCircleIcon />}
          >
            Verify Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            This action cannot be undone. Are you sure you want to delete this document?
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Document Details:
            </Typography>
            <Typography variant="body2">
              Type: {selectedDoc?.type}
              {selectedDoc?.expiresAt && (
                <>, Expires: {new Date(selectedDoc.expiresAt).toLocaleDateString()}</>
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                const res = await fetch(`${API_BASE}/api/documents/${selectedDoc?.id}`, {
                  method: 'DELETE',
                });
                if (!res.ok) throw new Error('Failed to delete document');
                
                await mutate('/api/subcontractors');
                setDeleteDialogOpen(false);
                setNotification({
                  type: 'success',
                  message: 'Document deleted successfully'
                });
              } catch (err) {
                setNotification({
                  type: 'error',
                  message: 'Failed to delete document'
                });
              }
            }}
            startIcon={<DeleteIcon />}
          >
            Delete Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Document</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Email Recipients"
              placeholder="Enter email addresses separated by commas"
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Message"
              placeholder="Add an optional message"
              fullWidth
              multiline
              rows={3}
            />
            <FormControl>
              <FormControlLabel
                control={<Checkbox />}
                label="Generate secure link (expires in 7 days)"
              />
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // TODO: Implement share functionality
              setShareDialogOpen(false);
              setNotification({
                type: 'success',
                message: 'Document shared successfully'
              });
            }}
            startIcon={<ShareIcon />}
          >
            Share Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document History</DialogTitle>
        <DialogContent>
          <Timeline sx={{ mt: 2 }}>
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="primary" />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2">Document Uploaded</Typography>
                <Typography variant="body2" color="text.secondary">
                  Oct 27, 2025 at 2:30 PM
                </Typography>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success" />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2">Document Verified</Typography>
                <Typography variant="body2" color="text.secondary">
                  Oct 27, 2025 at 3:45 PM
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verified by: Admin User
                </Typography>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="warning" />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2">Expiration Notice Sent</Typography>
                <Typography variant="body2" color="text.secondary">
                  Oct 26, 2025 at 9:00 AM
                </Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
    </Card>
  );
}