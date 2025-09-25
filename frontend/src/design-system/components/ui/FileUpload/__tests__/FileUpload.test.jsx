import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../FileUpload';

// Mock file for testing
const createMockFile = (name, size, type) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUpload', () => {
  const mockOnFilesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders file upload area', () => {
    render(<FileUpload onFilesChange={mockOnFilesChange} />);
    
    expect(screen.getByText('Upload files')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop files here, or click to select')).toBeInTheDocument();
  });

  it('displays custom label and description', () => {
    render(
      <FileUpload 
        onFilesChange={mockOnFilesChange}
        label="Upload documents"
        description="Select your files"
      />
    );
    
    expect(screen.getByText('Upload documents')).toBeInTheDocument();
    expect(screen.getByText('Select your files')).toBeInTheDocument();
  });

  it('shows file size and count limits', () => {
    render(
      <FileUpload 
        onFilesChange={mockOnFilesChange}
        maxFiles={3}
        maxSize={5 * 1024 * 1024} // 5MB
      />
    );
    
    expect(screen.getByText('Max 3 files, 5 MB each')).toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFilesChange={mockOnFilesChange} />);
    
    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    const input = document.querySelector('input[type="file"]');
    
    await user.upload(input, file);
    
    expect(mockOnFilesChange).toHaveBeenCalledWith([file]);
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    render(
      <FileUpload 
        onFilesChange={mockOnFilesChange}
        maxSize={1024} // 1KB limit
      />
    );
    
    const largeFile = createMockFile('large.jpg', 2048, 'image/jpeg'); // 2KB file
    const input = document.querySelector('input[type="file"]');
    
    await user.upload(input, largeFile);
    
    // Should not call onFilesChange with invalid file
    expect(mockOnFilesChange).not.toHaveBeenCalled();
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/File size must be less than/)).toBeInTheDocument();
    });
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    render(
      <FileUpload 
        onFilesChange={mockOnFilesChange}
        allowedTypes={['image/*']}
      />
    );
    
    const textFile = createMockFile('document.txt', 1024, 'text/plain');
    const input = document.querySelector('input[type="file"]');
    
    await user.upload(input, textFile);
    
    // Should not call onFilesChange with invalid file type
    expect(mockOnFilesChange).not.toHaveBeenCalled();
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/File type not allowed/)).toBeInTheDocument();
    });
  });

  it('enforces maximum file count', async () => {
    const user = userEvent.setup();
    render(
      <FileUpload 
        onFilesChange={mockOnFilesChange}
        maxFiles={2}
        files={[createMockFile('existing.jpg', 1024, 'image/jpeg')]}
      />
    );
    
    const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
    const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');
    const input = document.querySelector('input[type="file"]');
    
    await user.upload(input, [file1, file2]);
    
    // Should only accept one more file (maxFiles=2, already have 1)
    expect(mockOnFilesChange).toHaveBeenCalledWith([
      createMockFile('existing.jpg', 1024, 'image/jpeg'),
      file1
    ]);
  });

  it('displays selected files', () => {
    const files = [
      createMockFile('test1.jpg', 1024, 'image/jpeg'),
      createMockFile('test2.pdf', 2048, 'application/pdf')
    ];
    
    render(<FileUpload onFilesChange={mockOnFilesChange} files={files} />);
    
    expect(screen.getByText('Selected Files (2/5)')).toBeInTheDocument();
    expect(screen.getByText('test1.jpg')).toBeInTheDocument();
    expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  it('allows file removal', async () => {
    const user = userEvent.setup();
    const files = [createMockFile('test.jpg', 1024, 'image/jpeg')];
    
    render(<FileUpload onFilesChange={mockOnFilesChange} files={files} />);
    
    const removeButton = screen.getByLabelText('Remove test.jpg');
    await user.click(removeButton);
    
    expect(mockOnFilesChange).toHaveBeenCalledWith([]);
  });

  it('handles drag and drop', async () => {
    render(<FileUpload onFilesChange={mockOnFilesChange} />);
    
    const dropZone = screen.getByText('Upload files').closest('div');
    const file = createMockFile('dropped.jpg', 1024, 'image/jpeg');
    
    // Simulate drag enter
    fireEvent.dragEnter(dropZone, {
      dataTransfer: { files: [file] }
    });
    
    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    });
    
    expect(mockOnFilesChange).toHaveBeenCalledWith([file]);
  });

  it('shows error state', () => {
    render(
      <FileUpload 
        onFilesChange={mockOnFilesChange}
        error="Upload failed"
      />
    );
    
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('disables upload when disabled prop is true', () => {
    render(<FileUpload onFilesChange={mockOnFilesChange} disabled />);
    
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });

  it('supports multiple file selection', async () => {
    const user = userEvent.setup();
    render(<FileUpload onFilesChange={mockOnFilesChange} multiple />);
    
    const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
    const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');
    const input = document.querySelector('input[type="file"]');
    
    await user.upload(input, [file1, file2]);
    
    expect(mockOnFilesChange).toHaveBeenCalledWith([file1, file2]);
  });

  it('shows file validation errors', async () => {
    const user = userEvent.setup();
    const files = [createMockFile('test.exe', 1024, 'application/x-executable')];
    
    render(
      <FileUpload 
        onFilesChange={mockOnFilesChange}
        files={files}
        allowedTypes={['image/*']}
      />
    );
    
    // Simulate adding an invalid file that gets rejected
    const invalidFile = createMockFile('invalid.exe', 1024, 'application/x-executable');
    const input = document.querySelector('input[type="file"]');
    
    await user.upload(input, invalidFile);
    
    await waitFor(() => {
      expect(screen.getByText(/File type not allowed/)).toBeInTheDocument();
    });
  });
});