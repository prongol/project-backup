'use client';

import { useState } from 'react';
import { uploadMultipleFiles, validateFile, formatFileSize, FILE_SIZE_LIMITS, ALLOWED_FILE_TYPES, STORAGE_BUCKETS } from '@/lib/storage';
import { toast } from 'sonner';

interface FileUploadProps {
  userId: string;
  maxFiles?: number;
  onUploadComplete?: (urls: string[]) => void;
}

export function FileUpload({ userId, maxFiles = 5, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate all files
    for (const file of selectedFiles) {
      const validation = validateFile(
        file,
        FILE_SIZE_LIMITS.PORTFOLIO,
        ALLOWED_FILE_TYPES.IMAGE as any
      );
      
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        return;
      }
    }

    // Generate previews
    const newPreviews: string[] = [];
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === selectedFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    const results = await uploadMultipleFiles(files, STORAGE_BUCKETS.PORTFOLIOS, userId);
    setUploading(false);

    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);

    if (successfulUploads.length > 0) {
      toast.success(`${successfulUploads.length} file(s) uploaded successfully!`);
      const urls = successfulUploads.map(r => r.url!);
      onUploadComplete?.(urls);
      setFiles([]);
      setPreviews([]);
    }

    if (failedUploads.length > 0) {
      toast.error(`${failedUploads.length} file(s) failed to upload`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#0CF574] transition-colors">
        <input
          type="file"
          multiple
          accept={ALLOWED_FILE_TYPES.IMAGE.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={uploading || files.length >= maxFiles}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Click to upload or drag and drop
          </span>
          <span className="text-xs text-gray-500">
            PNG, JPG, WebP up to {formatFileSize(FILE_SIZE_LIMITS.PORTFOLIO)}
          </span>
          <span className="text-xs text-gray-500">
            ({files.length}/{maxFiles} files selected)
          </span>
        </label>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity truncate">
                {files[index]?.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 bg-[#0CF574] text-white font-semibold rounded-lg hover:bg-[#0CF574]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload {files.length} File(s)
            </>
          )}
        </button>
      )}
    </div>
  );
}
