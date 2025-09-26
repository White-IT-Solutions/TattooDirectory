"use client";

import React, { forwardRef, useState, useCallback } from 'react';
import { cva } from '../../../utils/cn';

// File upload variant configurations
const fileUploadVariants = cva(
  [
    'relative w-full transition-all duration-200 ease-out',
    'border-2 border-dashed rounded-[var(--radius-lg)]',
    'focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--focus-ring)] focus-within:ring-offset-2'
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'border-[var(--border-primary)]',
          'bg-[var(--background-secondary)]',
          'hover:border-[var(--border-strong)]',
          'hover:bg-[var(--background-tertiary)]'
        ].join(' '),
        error: [
          'border-[var(--feedback-error)]',
          'bg-[var(--feedback-error-bg)]'
        ].join(' '),
        success: [
          'border-[var(--feedback-success)]',
          'bg-[var(--feedback-success-bg)]'
        ].join(' ')
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
      },
      dragActive: {
        true: [
          'border-[var(--interactive-primary)]',
          'bg-[var(--interactive-primary-bg)]',
          'scale-[1.02]'
        ].join(' '),
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      dragActive: false
    }
  }
);

// Upload icon
const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// File icon
const FileIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Remove icon
const RemoveIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// File size formatter
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// File validation
const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
    maxFiles = 5
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${formatFileSize(maxSize)}`);
  }

  // Check file type
  const isAllowed = allowedTypes.some(type => {
    if (type.includes('*')) {
      return file.type.startsWith(type.replace('*', ''));
    }
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    }
    return file.type === type;
  });

  if (!isAllowed) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return errors;
};

// File preview component
const FilePreview = ({ file, onRemove, error }) => (
  <div className={`flex items-center justify-between p-3 rounded-[var(--radius)] border ${
    error ? 'border-[var(--feedback-error)] bg-[var(--feedback-error-bg)]' : 'border-[var(--border-primary)] bg-[var(--background-primary)]'
  }`}>
    <div className="flex items-center space-x-3">
      <FileIcon className="h-8 w-8 text-[var(--text-secondary)]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {file.name}
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          {formatFileSize(file.size)}
        </p>
        {error && (
          <p className="text-xs text-[var(--feedback-error)] mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
    <button
      type="button"
      onClick={() => onRemove(file)}
      className="p-1 text-[var(--text-secondary)] hover:text-[var(--feedback-error)] transition-colors"
      aria-label={`Remove ${file.name}`}
    >
      <RemoveIcon className="h-4 w-4" />
    </button>
  </div>
);

// Main FileUpload component
const FileUpload = forwardRef(({
  className,
  variant = 'default',
  size = 'md',
  multiple = false,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  files = [],
  onFilesChange,
  error,
  disabled = false,
  label = "Upload files",
  description = "Drag and drop files here, or click to select",
  ...props
}, ref) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileErrors, setFileErrors] = useState({});

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [disabled, maxFiles, files]);

  // Handle file input change
  const handleChange = useCallback((e) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  }, [disabled, maxFiles, files]);

  // Process files
  const handleFiles = useCallback((newFiles) => {
    const errors = {};
    const validFiles = [];

    // Check total file count
    const totalFiles = files.length + newFiles.length;
    if (totalFiles > maxFiles) {
      // Take only the files that fit within the limit
      const availableSlots = maxFiles - files.length;
      newFiles = newFiles.slice(0, availableSlots);
    }

    newFiles.forEach((file) => {
      const fileErrors = validateFile(file, { maxSize, allowedTypes, maxFiles });
      if (fileErrors.length > 0) {
        errors[file.name] = fileErrors[0]; // Show first error
      } else {
        validFiles.push(file);
      }
    });

    setFileErrors(prev => ({ ...prev, ...errors }));
    
    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      onFilesChange?.(updatedFiles);
    }
  }, [files, maxFiles, maxSize, allowedTypes, multiple, onFilesChange]);

  // Remove file
  const removeFile = useCallback((fileToRemove) => {
    const updatedFiles = files.filter(file => file !== fileToRemove);
    onFilesChange?.(updatedFiles);
    
    // Remove error for this file
    setFileErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileToRemove.name];
      return newErrors;
    });
  }, [files, onFilesChange]);

  const resolvedVariant = error ? 'error' : variant;

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={fileUploadVariants({ 
          variant: resolvedVariant, 
          size, 
          dragActive,
          className 
        })}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={ref}
          type="file"
          multiple={multiple}
          accept={accept || allowedTypes.join(',')}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          {...props}
        />
        
        <div className="text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-[var(--text-secondary)] mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {label}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {description}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Max {maxFiles} files, {formatFileSize(maxSize)} each
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-[var(--feedback-error)]" role="alert">
          {error}
        </p>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Selected Files ({files.length}/{maxFiles})
          </p>
          {files.map((file, index) => (
            <FilePreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={removeFile}
              error={fileErrors[file.name]}
            />
          ))}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

export default FileUpload;
export { FileUpload, formatFileSize, validateFile };