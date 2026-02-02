'use client';

/**
 * Lead Detail Header
 * Shows lead name, status dropdown, and action buttons
 * [DEV-051]
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types/database';
import { ArrowLeft, Mail, Phone, Loader2 } from 'lucide-react';

// Status badge styles
const STATUS_STYLES: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  draft_ready: { label: 'Draft Ready', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  needs_clarification: { label: 'Needs Info', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  sent: { label: 'Sent', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  won: { label: 'Won', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
  lost: { label: 'Lost', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
};

// Status workflow - what statuses can transition to what
const STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['draft_ready', 'needs_clarification', 'lost'],
  draft_ready: ['sent', 'needs_clarification', 'lost'],
  needs_clarification: ['draft_ready', 'lost'],
  sent: ['won', 'lost', 'needs_clarification'],
  won: [],
  lost: ['new'], // Allow reopening
};

interface LeadDetailHeaderProps {
  lead: Lead;
}

export function LeadDetailHeader({ lead }: LeadDetailHeaderProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(lead.status);

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

  async function handleStatusChange(newStatus: LeadStatus) {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        router.refresh();
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/admin/leads"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to leads
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Badge
              variant="secondary"
              className={cn('text-xs', STATUS_STYLES[currentStatus].className)}
            >
              {STATUS_STYLES[currentStatus].label}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          {allowedTransitions.length > 0 && (
            <Select
              value={currentStatus}
              onValueChange={(value) => handleStatusChange(value as LeadStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentStatus} disabled>
                  {STATUS_STYLES[currentStatus].label} (current)
                </SelectItem>
                {allowedTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_STYLES[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Quick actions */}
          {lead.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </a>
            </Button>
          )}
          {lead.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
