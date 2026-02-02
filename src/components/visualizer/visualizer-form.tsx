'use client';

/**
 * Visualizer Form
 * Step-by-step form for AI design visualization
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from './photo-upload';
import { RoomTypeSelector, type RoomType } from './room-type-selector';
import { StyleSelector, type DesignStyle } from './style-selector';
import { ResultDisplay } from './result-display';
import { GenerationLoading } from './generation-loading';
import type {
  VisualizationResponse,
  VisualizationError,
} from '@/lib/schemas/visualization';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';

type Step = 'photo' | 'room' | 'style' | 'constraints' | 'generating' | 'result' | 'error';

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
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('photo');
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    photoFile: null,
    roomType: null,
    style: null,
    constraints: '',
  });
  const [visualization, setVisualization] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<VisualizationError | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

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
    else if (currentStep === 'error') setCurrentStep('constraints');
  };

  const handleGenerate = useCallback(async () => {
    if (!formData.photo || !formData.roomType || !formData.style) return;

    setCurrentStep('generating');
    setGenerationProgress(0);
    setError(null);

    // Simulate progress updates while waiting
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        // Slow down as we approach 90%
        if (prev < 30) return prev + 5;
        if (prev < 60) return prev + 3;
        if (prev < 85) return prev + 1;
        return prev;
      });
    }, 500);

    try {
      // Create AbortController for timeout (100s to account for API processing)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100000);

      const response = await fetch('/api/ai/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: formData.photo,
          roomType: formData.roomType,
          style: formData.style,
          constraints: formData.constraints || undefined,
          count: 4,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData: VisualizationError = await response.json();
        setError(errorData);
        setCurrentStep('error');
        return;
      }

      const data: VisualizationResponse = await response.json();
      setVisualization(data);
      setGenerationProgress(100);

      // Brief delay to show 100% before transitioning
      setTimeout(() => {
        setCurrentStep('result');
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);

      // Check if this is a timeout error
      if (err instanceof Error && err.name === 'AbortError') {
        setError({
          error: 'Generation timed out',
          code: 'TIMEOUT',
          details: 'The visualization took too long. Please try again with a smaller image or simpler settings.',
        });
      } else {
        setError({
          error: 'Failed to connect to visualization service',
          code: 'UNKNOWN',
          details: err instanceof Error ? err.message : 'Unknown error',
        });
      }
      setCurrentStep('error');
    }
  }, [formData]);

  const handleStartOver = () => {
    setFormData({
      photo: null,
      photoFile: null,
      roomType: null,
      style: null,
      constraints: '',
    });
    setVisualization(null);
    setError(null);
    setCurrentStep('photo');
  };

  const handleGetQuote = () => {
    // Navigate to estimate page with visualization context
    const params = new URLSearchParams();
    if (visualization?.id) {
      params.set('visualization', visualization.id);
    }
    router.push(`/estimate?${params.toString()}`);
  };

  const handleRetry = () => {
    handleGenerate();
  };

  // Error state
  if (currentStep === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-center">Generation Failed</h2>
        <p className="text-muted-foreground mt-2 text-center">
          {error?.error || 'Something went wrong while generating your visualization.'}
        </p>
        {error?.details && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {error.details}
          </p>
        )}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={handleRetry}>
            <Sparkles className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Generating state with enhanced loading
  if (currentStep === 'generating') {
    return (
      <GenerationLoading
        style={formData.style || 'modern'}
        roomType={formData.roomType || 'kitchen'}
        progress={generationProgress}
        onCancel={handleStartOver}
      />
    );
  }

  // Result state with before/after comparison
  if (currentStep === 'result' && visualization && formData.photo) {
    return (
      <ResultDisplay
        visualization={visualization}
        originalImage={formData.photo}
        onStartOver={handleStartOver}
        onGetQuote={handleGetQuote}
      />
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
