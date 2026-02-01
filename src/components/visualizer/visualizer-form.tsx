'use client';

/**
 * Visualizer Form
 * Step-by-step form for AI design visualization
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from './photo-upload';
import { RoomTypeSelector, type RoomType } from './room-type-selector';
import { StyleSelector, type DesignStyle } from './style-selector';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';

type Step = 'photo' | 'room' | 'style' | 'constraints' | 'generating' | 'result';

interface FormData {
  photo: string | null;
  photoFile: File | null;
  roomType: RoomType | null;
  style: DesignStyle | null;
  constraints: string;
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'photo', label: 'Upload Photo' },
  { id: 'room', label: 'Room Type' },
  { id: 'style', label: 'Design Style' },
  { id: 'constraints', label: 'Preferences' },
];

export function VisualizerForm() {
  const [currentStep, setCurrentStep] = useState<Step>('photo');
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    photoFile: null,
    roomType: null,
    style: null,
    constraints: '',
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'photo':
        return !!formData.photo;
      case 'room':
        return !!formData.roomType;
      case 'style':
        return !!formData.style;
      case 'constraints':
        return true; // Constraints are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'photo') setCurrentStep('room');
    else if (currentStep === 'room') setCurrentStep('style');
    else if (currentStep === 'style') setCurrentStep('constraints');
    else if (currentStep === 'constraints') handleGenerate();
  };

  const handleBack = () => {
    if (currentStep === 'room') setCurrentStep('photo');
    else if (currentStep === 'style') setCurrentStep('room');
    else if (currentStep === 'constraints') setCurrentStep('style');
  };

  const handleGenerate = () => {
    setCurrentStep('generating');
    // TODO: Call AI generation API in DEV-038+
    // For now, simulate with a timeout
    setTimeout(() => {
      setCurrentStep('result');
    }, 3000);
  };

  const handleStartOver = () => {
    setFormData({
      photo: null,
      photoFile: null,
      roomType: null,
      style: null,
      constraints: '',
    });
    setCurrentStep('photo');
  };

  // Generating state
  if (currentStep === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mt-8">Creating Your Vision</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          Our AI is reimagining your space in the {formData.style} style.
          This usually takes 15-30 seconds.
        </p>
      </div>
    );
  }

  // Result state (placeholder - will be expanded in DEV-038+)
  if (currentStep === 'result') {
    return (
      <div className="flex flex-col items-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Visualization Complete!</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          Your {formData.roomType?.replace('_', ' ')} has been reimagined in the{' '}
          {formData.style} style.
        </p>

        {/* Placeholder for results */}
        <div className="w-full max-w-2xl mt-8 aspect-video rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
          <p className="text-muted-foreground">
            Generated visualization will appear here
          </p>
        </div>

        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={handleStartOver}>
            Start Over
          </Button>
          <Button>
            Get a Quote for This Design
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <span className="text-sm font-medium">
            {STEPS[currentStepIndex]?.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-between mt-3">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-2',
                index <= currentStepIndex
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  index < currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {index < currentStepIndex ? (
                  <Check className="w-3 h-3" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form steps */}
      <div className="mb-8">
        {currentStep === 'photo' && (
          <PhotoUpload
            value={formData.photo}
            onChange={(photo, file) =>
              setFormData((prev) => ({ ...prev, photo, photoFile: file }))
            }
          />
        )}

        {currentStep === 'room' && (
          <RoomTypeSelector
            value={formData.roomType}
            onChange={(roomType) =>
              setFormData((prev) => ({ ...prev, roomType }))
            }
          />
        )}

        {currentStep === 'style' && (
          <StyleSelector
            value={formData.style}
            onChange={(style) => setFormData((prev) => ({ ...prev, style }))}
          />
        )}

        {currentStep === 'constraints' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                Any specific preferences? (Optional)
              </h3>
              <p className="text-sm text-muted-foreground">
                Tell us what to keep, change, or focus on
              </p>
            </div>

            <Textarea
              value={formData.constraints}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  constraints: e.target.value,
                }))
              }
              placeholder="e.g., Keep the existing cabinets but change the countertops. I'd like a marble look. The island should be larger..."
              className="min-h-[150px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.constraints.length}/500 characters
            </p>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border mt-6">
              <h4 className="font-medium text-sm mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Room:</span>{' '}
                  <span className="font-medium capitalize">
                    {formData.roomType?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Style:</span>{' '}
                  <span className="font-medium capitalize">
                    {formData.style}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {currentStep === 'constraints' ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Vision
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
