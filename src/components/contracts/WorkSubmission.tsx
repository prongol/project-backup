'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { AlertTriangle, Check, Clock, FileText, Link, Loader2, Send, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface WorkSubmissionProps {
  contractId: string;
  requirements: string[];
  onSubmissionComplete?: () => void;
  className?: string;
}

interface FileUpload {
  file: File;
  id: string;
  uploading: boolean;
  url?: string;
}

export function WorkSubmission({ 
  contractId, 
  requirements, 
  onSubmissionComplete,
  className 
}: WorkSubmissionProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>(['']);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [links, setLinks] = useState<string[]>(['']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDeliverable = () => {
    setDeliverables([...deliverables, '']);
  };

  const updateDeliverable = (index: number, value: string) => {
    const updated = [...deliverables];
    updated[index] = value;
    setDeliverables(updated);
  };

  const removeDeliverable = (index: number) => {
    if (deliverables.length > 1) {
      setDeliverables(deliverables.filter((_, i) => i !== index));
    }
  };

  const addLink = () => {
    setLinks([...links, '']);
  };

  const updateLink = (index: number, value: string) => {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    for (const file of selectedFiles) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }

      const fileUpload: FileUpload = {
        file,
        id: Date.now() + Math.random().toString(),
        uploading: true
      };

      setFiles(prev => [...prev, fileUpload]);

      try {
        // Create upload URL
        const uploadResponse = await fetch('/api/upload/create-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            contractId
          }),
        });

        const uploadData = await uploadResponse.json();
        
        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || 'Failed to create upload URL');
        }

        // Upload file
        const uploadResult = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResult.ok) {
          throw new Error('Failed to upload file');
        }

        // Update file with URL
        setFiles(prev =>
          prev.map(f =>
            f.id === fileUpload.id
              ? { ...f, uploading: false, url: uploadData.fileUrl }
              : f
          )
        );

        toast.success(`File "${file.name}" uploaded successfully`);

      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload "${file.name}": ${error.message}`);
        
        // Remove failed upload
        setFiles(prev => prev.filter(f => f.id !== fileUpload.id));
      }
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Please provide a description of your work');
      return;
    }

    const validDeliverables = deliverables.filter(d => d.trim());
    if (validDeliverables.length === 0) {
      toast.error('Please list at least one deliverable');
      return;
    }

    // Check if any files are still uploading
    const uploadingFiles = files.filter(f => f.uploading);
    if (uploadingFiles.length > 0) {
      toast.error('Please wait for all files to finish uploading');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          deliverables: validDeliverables,
          files: files.map(f => ({
            name: f.file.name,
            url: f.url,
            type: f.file.type,
            size: f.file.size
          })),
          links: links.filter(l => l.trim())
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit work');
      }

      toast.success('Work submitted successfully! Client has 3 days to review.');
      onSubmissionComplete?.();

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit work');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Submit Your Work
        </CardTitle>
        <CardDescription>
          Submit your completed work for client review. The client will have 3 days to approve or request revisions.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requirements Checklist */}
          {requirements.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Project Requirements</h3>
              </div>
              <div className="text-sm text-blue-800 mb-3">
                Please ensure your submission addresses all requirements:
              </div>
              <ul className="space-y-2">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Work Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Work Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what you have completed, how it meets the requirements, and any important notes for the client..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-gray-600">
              Provide a clear summary of what you've delivered and how it meets the project requirements.
            </p>
          </div>

          {/* Deliverables */}
          <div className="space-y-2">
            <Label>Deliverables *</Label>
            {deliverables.map((deliverable, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="e.g., Website homepage, Logo design, Source code..."
                  value={deliverable}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDeliverable(index, e.target.value)}
                />
                {deliverables.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeDeliverable(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDeliverable}
              className="w-full"
            >
              + Add Another Deliverable
            </Button>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Files & Attachments</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            />

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((fileUpload) => (
                  <div key={fileUpload.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{fileUpload.file.name}</div>
                      <div className="text-sm text-gray-600">
                        {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    {fileUpload.uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeFile(fileUpload.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-600">
              Supported formats: Images, PDF, Word documents, text files, ZIP archives. Max 10MB per file.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <Label>Additional Links</Label>
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="e.g., https://github.com/yourrepo, https://demo-site.com..."
                  value={link}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink(index, e.target.value)}
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeLink(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
              className="w-full"
            >
              + Add Another Link
            </Button>
            <p className="text-xs text-gray-600">
              Include links to live demos, repositories, or other relevant resources.
            </p>
          </div>

          <Separator />

          {/* Review Process Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-semibold text-yellow-900 mb-1">What happens after submission:</h4>
                <ul className="space-y-1 text-yellow-800">
                  <li>• Client has 3 days to review your work</li>
                  <li>• Payment is automatically released if no action is taken</li>
                  <li>• Client can approve, request revisions, or file a dispute</li>
                  <li>• You'll be notified of any feedback or requests</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || files.some(f => f.uploading)}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Work...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Work for Review
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}