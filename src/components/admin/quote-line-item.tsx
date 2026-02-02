'use client';

/**
 * Quote Line Item
 * Individual editable row in the quote editor
 * [DEV-054]
 */

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export interface LineItem {
  id: string;
  description: string;
  category: 'materials' | 'labor' | 'contract' | 'permit' | 'other';
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

const CATEGORY_OPTIONS = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'contract', label: 'Contract' },
  { value: 'permit', label: 'Permit' },
  { value: 'other', label: 'Other' },
];

interface QuoteLineItemProps {
  item: LineItem;
  onChange: (item: LineItem) => void;
  onDelete: () => void;
}

export function QuoteLineItem({ item, onChange, onDelete }: QuoteLineItemProps) {
  function handleFieldChange<K extends keyof LineItem>(
    field: K,
    value: LineItem[K]
  ) {
    const updated = { ...item, [field]: value };

    // Recalculate total when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updated.total = updated.quantity * updated.unit_price;
    }

    onChange(updated);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(value);
  }

  return (
    <tr className="group">
      {/* Description */}
      <td className="p-2">
        <Input
          value={item.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Item description"
          className="min-w-[200px]"
        />
      </td>

      {/* Category */}
      <td className="p-2">
        <Select
          value={item.category}
          onValueChange={(value) =>
            handleFieldChange('category', value as LineItem['category'])
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* Quantity */}
      <td className="p-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.quantity}
          onChange={(e) =>
            handleFieldChange('quantity', parseFloat(e.target.value) || 0)
          }
          className="w-[80px]"
        />
      </td>

      {/* Unit */}
      <td className="p-2">
        <Input
          value={item.unit}
          onChange={(e) => handleFieldChange('unit', e.target.value)}
          placeholder="ea"
          className="w-[80px]"
        />
      </td>

      {/* Unit Price */}
      <td className="p-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.unit_price}
          onChange={(e) =>
            handleFieldChange('unit_price', parseFloat(e.target.value) || 0)
          }
          className="w-[120px]"
        />
      </td>

      {/* Total (read-only) */}
      <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>

      {/* Delete */}
      <td className="p-2">
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
