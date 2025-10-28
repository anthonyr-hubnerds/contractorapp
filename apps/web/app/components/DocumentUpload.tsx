'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface DocumentUploadProps {
  open: boolean;
  onClose: () => void;
  onUpload: (
    document: {
      type: string;
      expiresAt: Date | null;
      file: File;
    },
    setProgress: (progress: number) => void
  ) => Promise<void>;
}

const documentTypes = [
  'Business License',
  'Insurance Certificate',
  'Safety Certification',
  'Workers Compensation',
  'Professional License',
  'Bonding Certificate',
  'Tax Certificate',
  'Other'
];

export default function DocumentUpload({ open, onClose, onUpload }: DocumentUploadProps) {
  const [type, setType] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  // Clear state when dialog closes
  useEffect(() => {
    if (!open) {
      setType('');
      setExpiresAt(null);
      setFile(null);
      setError(null);
      setUploadProgress(0);
      setPreview(null);
    }
  }, [open]);

  // Generate preview for PDF and images
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    if (file.type === 'application/pdf') {
      setPreview('/pdf-preview.png'); // You can add a PDF icon in your public folder
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);
  // (removed duplicate loading state)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // Check file type
      if (!selectedFile.type.match('application/pdf|image/*')) {
        setError('Please upload a PDF or image file');
        return;
      }
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validation
      if (!type) {
        setError('Please select a document type');
        return;
      }
      if (!file) {
        setError('Please select a file to upload');
        return;
      }

      await onUpload(
        {
          type,
          expiresAt,
          file
        },
        setUploadProgress
      );

      // Reset form
      setType('');
      setExpiresAt(null);
      setFile(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Compliance Document</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                label="Document Type"
                required
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Expiration Date"
              value={expiresAt}
              onChange={(newValue: Date | null) => setExpiresAt(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Leave blank if document does not expire'
                }
              }}
            />

            <Box>
              <input
                accept="application/pdf,image/*"
                style={{ display: 'none' }}
                id="document-file"
                type="file"
                onChange={handleFileChange}
                disabled={loading}
              />
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: error ? 'error.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'background.default',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <label
                  htmlFor="document-file"
                  style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {preview ? (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={preview}
                        alt="Document preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 200,
                          objectFit: 'contain',
                          borderRadius: 8
                        }}
                      />
                    </Box>
                  ) : (
                    <CloudUploadIcon
                      sx={{
                        fontSize: 48,
                        color: loading ? 'action.disabled' : 'text.secondary',
                        mb: 2
                      }}
                    />
                  )}
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    color={loading ? 'text.disabled' : 'text.primary'}
                  >
                    {file ? file.name : 'Drag and drop your file here or click to select'}
                  </Typography>
                  <Typography variant="body2" color={loading ? 'text.disabled' : 'text.secondary'}>
                    Supported formats: PDF, PNG, JPG (up to 10MB)
                  </Typography>
                </label>
              </Box>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !file || !type}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
