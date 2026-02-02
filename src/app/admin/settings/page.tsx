'use client';

/**
 * Admin Settings Page
 * Business configuration for quote generation and notifications
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Check, Loader2 } from 'lucide-react';

// Default settings - in a real app, these would be loaded from database
const DEFAULT_SETTINGS = {
  // Notification settings
  notificationEmail: 'admin@redwhitereno.com',
  emailOnNewLead: true,
  emailOnQuoteSent: true,
  emailOnQuoteOpened: true,

  // Quote defaults
  defaultValidityDays: 30,
  defaultContingencyPercent: 10,
  defaultDepositPercent: 50,
  hstPercent: 13,

  // Business info
  businessName: 'Red White Reno',
  businessAddress: 'Stratford, ON',
  businessPhone: '(519) 555-0123',
  businessEmail: 'info@redwhitereno.com',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof typeof settings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, you would save to database here
    // const response = await fetch('/api/admin/settings', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(settings),
    // });

    setIsSaving(false);
    setSaveSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Configure business settings and quote defaults.
        </p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure email notifications for lead and quote events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificationEmail">Notification Email</Label>
            <Input
              id="notificationEmail"
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => handleChange('notificationEmail', e.target.value)}
              placeholder="admin@example.com"
            />
            <p className="text-sm text-muted-foreground">
              Email address for receiving notifications.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New lead notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a new lead is submitted.
                </p>
              </div>
              <Switch
                checked={settings.emailOnNewLead}
                onCheckedChange={(checked) => handleChange('emailOnNewLead', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quote sent notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a quote is sent to a customer.
                </p>
              </div>
              <Switch
                checked={settings.emailOnQuoteSent}
                onCheckedChange={(checked) => handleChange('emailOnQuoteSent', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quote opened notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a customer opens their quote.
                </p>
              </div>
              <Switch
                checked={settings.emailOnQuoteOpened}
                onCheckedChange={(checked) => handleChange('emailOnQuoteOpened', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Defaults</CardTitle>
          <CardDescription>
            Default values used when generating quotes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultValidityDays">Quote Validity (days)</Label>
              <Input
                id="defaultValidityDays"
                type="number"
                min="7"
                max="90"
                value={settings.defaultValidityDays}
                onChange={(e) => handleChange('defaultValidityDays', parseInt(e.target.value, 10))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultContingencyPercent">Contingency (%)</Label>
              <Input
                id="defaultContingencyPercent"
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={settings.defaultContingencyPercent}
                onChange={(e) => handleChange('defaultContingencyPercent', parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultDepositPercent">Required Deposit (%)</Label>
              <Input
                id="defaultDepositPercent"
                type="number"
                min="0"
                max="100"
                value={settings.defaultDepositPercent}
                onChange={(e) => handleChange('defaultDepositPercent', parseInt(e.target.value, 10))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hstPercent">HST (%)</Label>
              <Input
                id="hstPercent"
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={settings.hstPercent}
                onChange={(e) => handleChange('hstPercent', parseFloat(e.target.value))}
                disabled
              />
              <p className="text-xs text-muted-foreground">Ontario HST rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Business details shown on quotes and emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Address</Label>
            <Input
              id="businessAddress"
              value={settings.businessAddress}
              onChange={(e) => handleChange('businessAddress', e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Phone</Label>
              <Input
                id="businessPhone"
                type="tel"
                value={settings.businessPhone}
                onChange={(e) => handleChange('businessPhone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={settings.businessEmail}
                onChange={(e) => handleChange('businessEmail', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        {saveSuccess && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="h-4 w-4" />
            Settings saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
