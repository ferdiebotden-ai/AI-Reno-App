'use client';

/**
 * Style Selector
 * Visual cards for selecting design style
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type DesignStyle =
  | 'modern'
  | 'traditional'
  | 'farmhouse'
  | 'industrial'
  | 'minimalist'
  | 'contemporary';

interface StyleOption {
  id: DesignStyle;
  label: string;
  description: string;
  keywords: string[];
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean lines, minimal ornamentation, sleek finishes',
    keywords: ['minimalist', 'sleek', 'geometric'],
  },
  {
    id: 'traditional',
    label: 'Traditional',
    description: 'Classic details, rich colors, timeless elegance',
    keywords: ['classic', 'elegant', 'ornate'],
  },
  {
    id: 'farmhouse',
    label: 'Farmhouse',
    description: 'Rustic charm, natural textures, warm and welcoming',
    keywords: ['rustic', 'cozy', 'shiplap'],
  },
  {
    id: 'industrial',
    label: 'Industrial',
    description: 'Raw materials, exposed brick, metal accents',
    keywords: ['urban', 'raw', 'edgy'],
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Simple, uncluttered, focus on essential elements',
    keywords: ['simple', 'clean', 'functional'],
  },
  {
    id: 'contemporary',
    label: 'Contemporary',
    description: 'Current trends, bold accents, artistic elements',
    keywords: ['trendy', 'bold', 'artistic'],
  },
];

// Placeholder colors for style cards (would be replaced with actual images)
const STYLE_COLORS: Record<DesignStyle, string> = {
  modern: 'from-slate-800 to-slate-600',
  traditional: 'from-rose-800 to-rose-600',
  farmhouse: 'from-amber-700 to-amber-500',
  industrial: 'from-zinc-700 to-zinc-500',
  minimalist: 'from-neutral-200 to-neutral-100',
  contemporary: 'from-violet-700 to-violet-500',
};

interface StyleSelectorProps {
  value: DesignStyle | null;
  onChange: (value: DesignStyle) => void;
  className?: string;
}

export function StyleSelector({
  value,
  onChange,
  className,
}: StyleSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold">Choose your style</h3>
        <p className="text-sm text-muted-foreground">
          Select the design aesthetic you want to visualize
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STYLE_OPTIONS.map((option) => {
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                'group relative rounded-xl overflow-hidden transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'hover:ring-2 hover:ring-primary/50',
                isSelected && 'ring-2 ring-primary'
              )}
            >
              {/* Background gradient (placeholder for image) */}
              <div
                className={cn(
                  'aspect-[4/3] bg-gradient-to-br',
                  STYLE_COLORS[option.id]
                )}
              >
                {/* Overlay pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
              </div>

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <span className="font-semibold text-white text-sm">
                  {option.label}
                </span>
                <span className="text-xs text-white/80 line-clamp-2 mt-0.5">
                  {option.description}
                </span>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
