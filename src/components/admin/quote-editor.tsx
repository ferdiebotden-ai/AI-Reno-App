'use client';

/**
 * Quote Editor
 * Full quote editor with line items, totals, and assumptions/exclusions
 * [DEV-054, DEV-055, DEV-056]
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QuoteLineItem, type LineItem } from './quote-line-item';
import type { QuoteDraft, Json } from '@/types/database';
import { Plus, Save, Loader2, FileText, AlertCircle } from 'lucide-react';

// Business constants
const HST_PERCENT = 13;
const DEPOSIT_PERCENT = 50;
const DEFAULT_CONTINGENCY_PERCENT = 10;

// Default templates
const DEFAULT_ASSUMPTIONS = [
  'All work to be completed during regular business hours (Mon-Fri, 8am-5pm)',
  'Customer provides access to work area and utilities',
  'Existing structure is sound and code-compliant',
  'No hidden damage or issues behind walls/floors',
];

const DEFAULT_EXCLUSIONS = [
  'Permit fees (if required)',
  'Moving or storage of customer belongings',
  'Repairs to existing structural damage',
  'Hazardous material removal (asbestos, mold, etc.)',
];

interface QuoteEditorProps {
  leadId: string;
  initialQuote: QuoteDraft | null;
  initialEstimate: Json | null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface ParsedLineItem {
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total?: number;
}

function isLineItemObject(item: Json): item is { [key: string]: Json | undefined } {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

function parseLineItems(lineItems: Json | null): LineItem[] {
  if (!Array.isArray(lineItems)) return [];
  return lineItems
    .filter(isLineItemObject)
    .map((item) => {
      const parsed = item as unknown as ParsedLineItem;
      return {
        id: generateId(),
        description: parsed.description || '',
        category: (parsed.category as LineItem['category']) || 'other',
        quantity: parsed.quantity || 1,
        unit: parsed.unit || 'ea',
        unit_price: parsed.unit_price || 0,
        total: parsed.total || 0,
      };
    });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
}

export function QuoteEditor({
  leadId,
  initialQuote,
  initialEstimate,
}: QuoteEditorProps) {
  // State
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (initialQuote) {
      return parseLineItems(initialQuote.line_items);
    }
    return [];
  });

  const [contingencyPercent, setContingencyPercent] = useState(
    initialQuote?.contingency_percent ?? DEFAULT_CONTINGENCY_PERCENT
  );

  const [assumptions, setAssumptions] = useState<string>(
    (initialQuote?.assumptions || DEFAULT_ASSUMPTIONS).join('\n')
  );

  const [exclusions, setExclusions] = useState<string>(
    (initialQuote?.exclusions || DEFAULT_EXCLUSIONS).join('\n')
  );

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce ref for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const contingencyAmount = subtotal * (contingencyPercent / 100);
  const subtotalWithContingency = subtotal + contingencyAmount;
  const hstAmount = subtotalWithContingency * (HST_PERCENT / 100);
  const total = subtotalWithContingency + hstAmount;
  const depositRequired = total * (DEPOSIT_PERCENT / 100);

  // Save function
  const saveQuote = useCallback(async () => {
    if (lineItems.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items: lineItems.map(({ id, ...item }) => item),
          assumptions: assumptions.split('\n').filter((a) => a.trim()),
          exclusions: exclusions.split('\n').filter((e) => e.trim()),
          contingency_percent: contingencyPercent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save quote');
      }

      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving quote:', err);
      setError('Failed to save quote. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [leadId, lineItems, assumptions, exclusions, contingencyPercent]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!hasChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveQuote();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasChanges, saveQuote]);

  // Mark as changed
  function markChanged() {
    setHasChanges(true);
  }

  // Line item handlers
  function handleAddItem() {
    const newItem: LineItem = {
      id: generateId(),
      description: '',
      category: 'materials',
      quantity: 1,
      unit: 'ea',
      unit_price: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
    markChanged();
  }

  function handleUpdateItem(index: number, updatedItem: LineItem) {
    const newItems = [...lineItems];
    newItems[index] = updatedItem;
    setLineItems(newItems);
    markChanged();
  }

  function handleDeleteItem(index: number) {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    markChanged();
  }

  return (
    <div className="space-y-6">
      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote Line Items
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {hasChanges && !isSaving && (
              <span className="text-xs text-amber-600">Unsaved changes</span>
            )}
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            <Button onClick={saveQuote} disabled={isSaving || !hasChanges} size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Initial estimate info */}
          {initialEstimate && !initialQuote && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                AI Estimate:{' '}
                {formatCurrency((initialEstimate as { estimateLow?: number }).estimateLow || 0)} -{' '}
                {formatCurrency((initialEstimate as { estimateHigh?: number }).estimateHigh || 0)}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Qty</TableHead>
                  <TableHead className="w-[80px]">Unit</TableHead>
                  <TableHead className="w-[120px]">Unit Price</TableHead>
                  <TableHead className="text-right w-[120px]">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <QuoteLineItem
                    key={item.id}
                    item={item}
                    onChange={(updated) => handleUpdateItem(index, updated)}
                    onDelete={() => handleDeleteItem(index)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Line Item
          </Button>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quote Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-md">
            {/* Subtotal */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            {/* Contingency */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Contingency</span>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={contingencyPercent}
                  onChange={(e) => {
                    setContingencyPercent(parseFloat(e.target.value) || 0);
                    markChanged();
                  }}
                  className="w-[70px] h-8"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <span className="font-medium">{formatCurrency(contingencyAmount)}</span>
            </div>

            {/* HST */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">HST ({HST_PERCENT}%)</span>
              <span className="font-medium">{formatCurrency(hstAmount)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between pt-3 border-t">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </div>

            {/* Deposit */}
            <div className="flex justify-between text-primary">
              <span className="font-medium">
                Deposit Required ({DEPOSIT_PERCENT}%)
              </span>
              <span className="font-bold">{formatCurrency(depositRequired)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions & Exclusions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="assumptions" className="text-sm text-muted-foreground">
                One assumption per line
              </Label>
              <Textarea
                id="assumptions"
                value={assumptions}
                onChange={(e) => {
                  setAssumptions(e.target.value);
                  markChanged();
                }}
                placeholder="Enter assumptions..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="exclusions" className="text-sm text-muted-foreground">
                One exclusion per line
              </Label>
              <Textarea
                id="exclusions"
                value={exclusions}
                onChange={(e) => {
                  setExclusions(e.target.value);
                  markChanged();
                }}
                placeholder="Enter exclusions..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
