'use client';

/**
 * Submit Request Modal
 * Confirmation dialog for submitting a renovation request
 * Shows summary of collected data and captures contact info if needed
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2, ArrowLeft, PartyPopper } from 'lucide-react';
import type { ProjectSummaryData } from './estimate-sidebar';

interface SubmitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectSummaryData;
  messages: Array<{ role: string; content: string }>;
  onSubmit: (contactInfo: ContactInfo) => Promise<void>;
}

interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  kitchen: 'Kitchen Renovation',
  bathroom: 'Bathroom Renovation',
  basement: 'Basement Finishing',
  flooring: 'Flooring Installation',
  painting: 'Painting',
  exterior: 'Exterior Work',
  other: 'General Renovation',
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: 'ASAP',
  '1-3mo': '1-3 months',
  '3-6mo': '3-6 months',
  '6-12mo': '6-12 months',
  planning: 'Just planning',
};

const FINISH_LABELS: Record<string, string> = {
  economy: 'Economy',
  standard: 'Standard',
  premium: 'Premium',
};

type Step = 'review' | 'contact' | 'success';

export function SubmitRequestModal({
  isOpen,
  onClose,
  projectData,
  onSubmit,
}: SubmitRequestModalProps) {
  const [step, setStep] = useState<Step>('review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: projectData.contactName || '',
    email: projectData.contactEmail || '',
    phone: projectData.contactPhone || '',
  });

  const handleSubmit = async () => {
    // Validate contact info
    if (!contactInfo.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!contactInfo.email.trim() || !contactInfo.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(contactInfo);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setStep('review');
    setError(null);
    onClose();
  };

  // Check if we already have contact info
  const hasContactInfo =
    projectData.contactName && projectData.contactEmail;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'review' && (
          <>
            <DialogHeader>
              <DialogTitle>Ready to submit your request?</DialogTitle>
              <DialogDescription>
                Review your project details below. You can still chat to add more information.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {/* Project Summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                {projectData.projectType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Project</span>
                    <span className="font-medium">
                      {PROJECT_TYPE_LABELS[projectData.projectType] || projectData.projectType}
                    </span>
                  </div>
                )}
                {projectData.areaSqft && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">~{projectData.areaSqft} sqft</span>
                  </div>
                )}
                {projectData.timeline && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Timeline</span>
                    <span className="font-medium">
                      {TIMELINE_LABELS[projectData.timeline] || projectData.timeline}
                    </span>
                  </div>
                )}
                {projectData.finishLevel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Finish Level</span>
                    <span className="font-medium">
                      {FINISH_LABELS[projectData.finishLevel] || projectData.finishLevel}
                    </span>
                  </div>
                )}
                {(projectData.photosCount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Photos</span>
                    <span className="font-medium flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      {projectData.photosCount} uploaded
                    </span>
                  </div>
                )}
              </div>

              {projectData.goals && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Goals: </span>
                  <span className="line-clamp-2">{projectData.goals}</span>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="sm:flex-1">
                Add More Details
              </Button>
              <Button
                onClick={() => setStep(hasContactInfo ? 'contact' : 'contact')}
                className="sm:flex-1 bg-[#D32F2F] hover:bg-[#B71C1C]"
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'contact' && (
          <>
            <DialogHeader>
              <DialogTitle>Your contact information</DialogTitle>
              <DialogDescription>
                We&apos;ll send your detailed quote to this email within 24 hours.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={contactInfo.name}
                  onChange={(e) =>
                    setContactInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={contactInfo.email}
                  onChange={(e) =>
                    setContactInfo((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contactInfo.phone}
                  onChange={(e) =>
                    setContactInfo((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('review')}
                className="sm:flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="sm:flex-1 bg-[#D32F2F] hover:bg-[#B71C1C]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <PartyPopper className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle>Request submitted!</DialogTitle>
              <DialogDescription className="text-center">
                Thanks{contactInfo.name ? `, ${contactInfo.name.split(' ')[0]}` : ''}! Red White Reno will
                review your project and contact you within 24 hours.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Confirmation sent to{' '}
                <span className="font-medium text-foreground">{contactInfo.email}</span>
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
