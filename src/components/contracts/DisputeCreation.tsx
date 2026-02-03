'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { AlertTriangle, FileText, Loader2, Scale, Shield, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface DisputeCreationProps {
  contractId: string;
  requirements: string[];
  userType: 'client' | 'freelancer';
  onDisputeCreated?: () => void;
  className?: string;
}

const disputeReasons = {
  client: [
    'Work does not meet agreed requirements',
    'Poor quality of deliverables',
    'Missed project deadlines',
    'Freelancer not responsive to feedback',
    'Work contains plagiarized content',
    'Freelancer abandoned the project',
    'Other quality or delivery issues'
  ],
  freelancer: [
    'Client changed requirements after agreement',
    'Client requesting work beyond original scope',
    'Payment terms not honored',
    'Client unresponsive to communications',
    'Unreasonable revision requests',
    'Client provided false/misleading information',
    'Other contractual disagreements'
  ]
};

export function DisputeCreation({ 
  contractId, 
  requirements, 
  userType,
  onDisputeCreated,
  className 
}: DisputeCreationProps) {
  const [loading, setLoading] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [step, setStep] = useState(1);

  const reasons = disputeReasons[userType];

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limit to 10 files and 5MB each
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    }).slice(0, 10);

    setEvidenceFiles(prev => [...prev, ...validFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (selectedReasons.length === 0) {
      toast.error('Please select at least one reason for the dispute');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please provide a detailed description of the issue');
      return;
    }

    setLoading(true);

    try {
      // Create form data for file uploads
      const formData = new FormData();
      formData.append('contractId', contractId);
      formData.append('reasons', JSON.stringify(selectedReasons));
      formData.append('description', description.trim());
      
      evidenceFiles.forEach((file, index) => {
        formData.append(`evidence_${index}`, file);
      });

      const response = await fetch(`/api/contracts/${contractId}/dispute`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create dispute');
      }

      toast.success('Dispute filed successfully. Our admin team will review your case within 24 hours.');
      onDisputeCreated?.();

    } catch (error: any) {
      console.error('Dispute creation error:', error);
      toast.error(error.message || 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            File a Dispute
          </CardTitle>
          <CardDescription>
            Step 1 of 2: Select the reasons for your dispute
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-semibold text-red-900 mb-1">Important Notice</h4>
                <p className="text-red-800">
                  Filing a dispute will freeze the payment until our admin team reviews the case. 
                  Please ensure you have attempted to resolve the issue directly with the other party first.
                </p>
              </div>
            </div>
          </div>

          {/* Dispute Reasons */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              What issues are you experiencing? (Select all that apply)
            </Label>
            
            <div className="space-y-3">
              {reasons.map((reason, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Checkbox
                    id={`reason-${index}`}
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={() => handleReasonToggle(reason)}
                  />
                  <label
                    htmlFor={`reason-${index}`}
                    className="text-sm cursor-pointer leading-relaxed"
                  >
                    {reason}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Project Requirements Reference */}
          {requirements.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Original Requirements</h3>
              </div>
              <ul className="space-y-1 text-sm text-blue-800">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={selectedReasons.length === 0}
            >
              Next: Provide Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-blue-600" />
          File a Dispute
        </CardTitle>
        <CardDescription>
          Step 2 of 2: Provide detailed information and evidence
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selected Reasons Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Selected Issues:</h3>
          <ul className="space-y-1 text-sm">
            {selectedReasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(1)}
            className="mt-2"
          >
            Change Selection
          </Button>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Detailed Description *</Label>
          <Textarea
            id="description"
            placeholder={
              userType === 'client'
                ? 'Provide specific details about how the delivered work fails to meet the agreed requirements. Reference specific deliverables, quality issues, or timeline problems...'
                : 'Explain how the client\'s actions violate the original agreement. Provide details about scope changes, payment issues, or communication problems...'
            }
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            rows={6}
            required
          />
          <p className="text-xs text-gray-600">
            Be specific and factual. This information will be reviewed by our admin team to make a fair decision.
          </p>
        </div>

        {/* Evidence Upload */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Evidence Files (Optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('evidence-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Evidence
            </Button>
          </div>

          <input
            id="evidence-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {evidenceFiles.length > 0 && (
            <div className="space-y-2">
              {evidenceFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-600">
            Upload screenshots, documents, or other evidence supporting your dispute. 
            Max 10 files, 5MB each. Formats: images, PDF, Word, text.
          </p>
        </div>

        <Separator />

        {/* Admin Review Process */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-semibold text-blue-900 mb-1">Dispute Resolution Process:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Payment is frozen until resolution</li>
                <li>• Admin team reviews all evidence within 24 hours</li>
                <li>• Both parties may be contacted for additional information</li>
                <li>• Decision is made based on original contract terms</li>
                <li>• Payment is released according to admin decision</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !description.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Filing Dispute...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 mr-2" />
                File Dispute
              </>
            )}
          </Button>
        </div>

        {/* Final Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-800">
            <strong>Final Notice:</strong> By filing this dispute, you confirm that you have attempted to resolve the issue directly and believe admin intervention is necessary. False or frivolous disputes may result in account penalties.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}