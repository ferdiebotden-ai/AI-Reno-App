'use client';

/**
 * Estimate Sidebar
 * Live estimate panel that updates as the conversation progresses
 * Sticky on desktop, collapsible card on mobile
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface EstimateData {
  projectType?: string;
  areaSqft?: number;
  finishLevel?: 'economy' | 'standard' | 'premium';
  estimateLow?: number;
  estimateHigh?: number;
  breakdown?: {
    materials: number;
    labor: number;
    hst: number;
  };
}

interface EstimateSidebarProps {
  data: EstimateData;
  isLoading?: boolean;
  className?: string;
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

const FINISH_LEVEL_LABELS: Record<string, string> = {
  economy: 'Economy',
  standard: 'Standard',
  premium: 'Premium',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EstimateSidebar({ data, isLoading, className }: EstimateSidebarProps) {
  const hasEstimate = data.estimateLow && data.estimateHigh;
  const hasProjectType = !!data.projectType;
  const hasSize = !!data.areaSqft;
  const hasFinishLevel = !!data.finishLevel;

  return (
    <Card className={cn('bg-card', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Your Estimate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project details */}
        <div className="space-y-2">
          {/* Project Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Project Type</span>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : hasProjectType ? (
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="text-sm font-medium">
                  {PROJECT_TYPE_LABELS[data.projectType!] || data.projectType}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          {/* Size */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Size</span>
            {isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : hasSize ? (
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="text-sm font-medium">~{data.areaSqft} sqft</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          {/* Finish Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Finish Level</span>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : hasFinishLevel ? (
              <Badge variant="secondary" className="font-medium">
                {FINISH_LEVEL_LABELS[data.finishLevel!]}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* Estimate */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-sm text-muted-foreground block mb-1">Estimated Range</span>
            {isLoading ? (
              <Skeleton className="h-8 w-40 mx-auto" />
            ) : hasEstimate ? (
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(data.estimateLow!)} – {formatCurrency(data.estimateHigh!)}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">
                Answer a few questions to see your estimate
              </p>
            )}
          </div>

          {/* Breakdown */}
          {hasEstimate && data.breakdown && (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materials</span>
                <span>{formatCurrency(data.breakdown.materials)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labor</span>
                <span>{formatCurrency(data.breakdown.labor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">HST (13%)</span>
                <span>{formatCurrency(data.breakdown.hst)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        {hasEstimate && (
          <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Preliminary estimate only. Final pricing requires in-person assessment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
