import { supabase } from './supabase';

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PORTFOLIOS: 'portfolios',
  DOCUMENTS: 'documents',
  ATTACHMENTS: 'attachments',
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  PORTFOLIO: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
  ATTACHMENT: 50 * 1024 * 1024, // 50MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ARCHIVE: ['application/zip', 'application/x-rar-compressed'],
} as const;

export interface UploadOptions {
  bucket: string;
  file: File;
  path?: string;
  upsert?: boolean;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

// Upload file to Supabase Storage
export async function uploadFile({
  bucket,
  file,
  path,
  upsert = true,
}: UploadOptions): Promise<UploadResult> {
  try {
    // Generate unique filename if path not provided
    const fileName = path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    console.error('Upload exception:', error);
    return { success: false, error: error.message };
  }
}

// Delete file from storage
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

// Upload avatar
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  // Validate file size
  if (file.size > FILE_SIZE_LIMITS.AVATAR) {
    return { success: false, error: 'File size exceeds 5MB limit' };
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.IMAGE.includes(file.type as any)) {
    return { success: false, error: 'Invalid file type. Only images are allowed.' };
  }

  const path = `${userId}/avatar.${file.name.split('.').pop()}`;
  
  return uploadFile({
    bucket: STORAGE_BUCKETS.AVATARS,
    file,
    path,
    upsert: true,
  });
}

// Upload portfolio image
export async function uploadPortfolioImage(
  file: File,
  userId: string,
  index: number
): Promise<UploadResult> {
  // Validate file size
  if (file.size > FILE_SIZE_LIMITS.PORTFOLIO) {
    return { success: false, error: 'File size exceeds 10MB limit' };
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.IMAGE.includes(file.type as any)) {
    return { success: false, error: 'Invalid file type. Only images are allowed.' };
  }

  const path = `${userId}/portfolio-${index}-${Date.now()}.${file.name.split('.').pop()}`;
  
  return uploadFile({
    bucket: STORAGE_BUCKETS.PORTFOLIOS,
    file,
    path,
  });
}

// Upload document (contract, proposal attachment, etc.)
export async function uploadDocument(
  file: File,
  userId: string,
  documentType: string
): Promise<UploadResult> {
  // Validate file size
  if (file.size > FILE_SIZE_LIMITS.DOCUMENT) {
    return { success: false, error: 'File size exceeds 20MB limit' };
  }

  // Validate file type
  const allowedTypes = [...ALLOWED_FILE_TYPES.DOCUMENT, ...ALLOWED_FILE_TYPES.IMAGE];
  if (!allowedTypes.includes(file.type as any)) {
    return { success: false, error: 'Invalid file type.' };
  }

  const path = `${userId}/${documentType}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  return uploadFile({
    bucket: STORAGE_BUCKETS.DOCUMENTS,
    file,
    path,
  });
}

// Upload multiple files
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  userId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file, index) => {
    const path = `${userId}/${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    return uploadFile({ bucket, file, path });
  });

  return Promise.all(uploadPromises);
}

// Get file URL
export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Download file
export async function downloadFile(bucket: string, path: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Download error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Download exception:', error);
    return null;
  }
}

// List files in a directory
export async function listFiles(bucket: string, path: string = '') {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      console.error('List error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('List exception:', error);
    return [];
  }
}

// Validate file before upload
export function validateFile(
  file: File,
  maxSize: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type',
    };
  }

  return { valid: true };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
