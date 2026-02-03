'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { AlertTriangle, Check, Clock, Download, ExternalLink, FileText, Loader2, MessageSquare, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { toast } from 'sonner';

interface WorkSubmissionData {
  id: string;
  description: string;
  deliverables: string[];
  files: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  links: string[];
  submittedAt: string;
  reviewDeadline: string;
}

interface WorkReviewProps {
  contractId: string;
  requirements: string[];
  submission: WorkSubmissionData;
  onReviewComplete?: () => void;
  className?: string;
}

export function WorkReview({ 
  contractId, 
  requirements, 
  submission,
  onReviewComplete,
  className 
}: WorkReviewProps) {
  const [loading, setLoading] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'revisions' | 'dispute' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const timeLeft = Math.max(0, new Date(submission.reviewDeadline).getTime() - Date.now());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const daysLeft = Math.floor(hoursLeft / 24);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleActionSelect = (action: 'approve' | 'revisions' | 'dispute') => {
    setReviewAction(action);
    setShowFeedbackForm(true);
    
    // Set default feedback based on action
    if (action === 'approve') {
      setFeedback('Great work! The deliverables meet all requirements.');
    } else {
      setFeedback('');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewAction) return;

    if (reviewAction !== 'approve' && !feedback.trim()) {
      toast.error('Please provide feedback for your decision');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: reviewAction,
          feedback: feedback.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      if (reviewAction === 'approve') {
        toast.success('Work approved! Payment has been released to the freelancer.');
      } else if (reviewAction === 'revisions') {
        toast.success('Revision request sent to freelancer.');
      } else if (reviewAction === 'dispute') {
        toast.success('Dispute filed. Our support team will review the case.');
      }

      onReviewComplete?.();

    } catch (error: any) {
      console.error('Review submission error:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const cancelReview = () => {
    setReviewAction(null);
    setFeedback('');
    setShowFeedbackForm(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Review Submitted Work
            </CardTitle>
            <CardDescription>
              Freelancer has submitted their work for your review
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge variant={daysLeft > 1 ? 'default' : daysLeft > 0 ? 'secondary' : 'destructive'}>
              {daysLeft > 0 ? `${daysLeft} days left` : `${hoursLeft} hours left`}
            </Badge>
            <div className="text-xs text-gray-600 mt-1">
              Auto-approve: {new Date(submission.reviewDeadline).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Submission Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Work Submitted</h3>
          </div>
          <p className="text-sm text-blue-800">
            Submitted on {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
            {new Date(submission.submittedAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Work Description */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Work Description</Label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">{submission.description}</p>
          </div>
        </div>

        {/* Deliverables */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Deliverables</Label>
          <div className="space-y-2">
            {submission.deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{deliverable}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Files */}
        {submission.files.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Files & Attachments</Label>
            <div className="space-y-2">
              {submission.files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={file.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {submission.links.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Additional Links</Label>
            <div className="space-y-2">
              {submission.links.map((link, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <ExternalLink className="w-5 h-5 text-gray-600" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-blue-600 hover:underline truncate"
                  >
                    {link}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Requirements Check */}
        {requirements.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Requirements Verification</h3>
            </div>
            <div className="text-sm text-yellow-800 mb-3">
              Please verify that the submitted work meets all project requirements:
            </div>
            <ul className="space-y-2">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-4 h-4 border border-yellow-600 rounded mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Review Actions */}
        {!showFeedbackForm ? (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Your Decision</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Approve */}
              <Button
                onClick={() => handleActionSelect('approve')}
                className="h-auto p-4 bg-green-600 hover:bg-green-700 text-left flex-col items-start"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-semibold">Approve Work</span>
                </div>
                <span className="text-sm opacity-90">
                  Work meets requirements. Release payment to freelancer.
                </span>
              </Button>

              {/* Request Revisions */}
              <Button
                onClick={() => handleActionSelect('revisions')}
                variant="outline"
                className="h-auto p-4 text-left flex-col items-start border-yellow-300 hover:bg-yellow-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-700">Request Revisions</span>
                </div>
                <span className="text-sm text-yellow-600">
                  Work needs changes. Provide specific feedback for improvements.
                </span>
              </Button>

              {/* File Dispute */}
              <Button
                onClick={() => handleActionSelect('dispute')}
                variant="outline"
                className="h-auto p-4 text-left flex-col items-start border-red-300 hover:bg-red-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-700">File Dispute</span>
                </div>
                <span className="text-sm text-red-600">
                  Work doesn't meet requirements. Admin will review the case.
                </span>
              </Button>
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {reviewAction === 'approve' && 'Approval Feedback'}
                {reviewAction === 'revisions' && 'Revision Requests'}
                {reviewAction === 'dispute' && 'Dispute Details'}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelReview}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>

            <Textarea
              placeholder={
                reviewAction === 'approve'
                  ? 'Optional: Share positive feedback about the work...'
                  : reviewAction === 'revisions'
                  ? 'Describe specific changes needed, reference requirements that need attention...'
                  : 'Explain why the work doesn\'t meet the agreed requirements...'
              }
              value={feedback}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
              rows={4}
              required={reviewAction !== 'approve'}
            />

            <div className="flex gap-3">
              <Button
                onClick={handleSubmitReview}
                disabled={loading || (reviewAction !== 'approve' && !feedback.trim())}
                className={
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : reviewAction === 'revisions'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : reviewAction === 'approve' ? (
                  <ThumbsUp className="w-4 h-4 mr-2" />
                ) : reviewAction === 'revisions' ? (
                  <MessageSquare className="w-4 h-4 mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                
                {loading
                  ? 'Submitting...'
                  : reviewAction === 'approve'
                  ? 'Approve & Release Payment'
                  : reviewAction === 'revisions'
                  ? 'Send Revision Request'
                  : 'File Dispute'
                }
              </Button>
            </div>

            {reviewAction === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  Payment will be released immediately to the freelancer. This action cannot be undone.
                </div>
              </div>
            )}

            {reviewAction === 'dispute' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm text-red-800">
                  A dispute will freeze the payment until our admin team reviews the case and makes a decision.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto-approval Warning */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <strong>Auto-approval:</strong> If no action is taken by{' '}
              {new Date(submission.reviewDeadline).toLocaleDateString()} at{' '}
              {new Date(submission.reviewDeadline).toLocaleTimeString()}, the work will be automatically approved and payment will be released to the freelancer.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}