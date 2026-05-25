import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../_core/hooks/useAuth';

export const EmailPreferences: React.FC = () => {
  const { user } = useAuth();
  const { data: preferences, isLoading } = trpc.emails.getPreferences.useQuery();
  const updateMutation = trpc.emails.updatePreferences.useMutation();
  const testMutation = trpc.emails.sendTestEmail.useMutation();
  const unsubscribeMutation = trpc.emails.unsubscribeAll.useMutation();
  const resubscribeMutation = trpc.emails.resubscribe.useMutation();

  const [localPrefs, setLocalPrefs] = useState(preferences);

  React.useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleToggle = (key: string) => {
    if (!localPrefs) return;
    const newPrefs = { ...localPrefs, [key]: !(localPrefs as any)[key] };
    setLocalPrefs(newPrefs);
  };

  const handleSave = async () => {
    if (!localPrefs) return;
    await updateMutation.mutateAsync({
      newMessages: localPrefs.newMessages,
      newBids: localPrefs.newBids,
      bookingConfirmation: localPrefs.bookingConfirmation,
      listingApproval: localPrefs.listingApproval,
      listingRejection: localPrefs.listingRejection,
      weeklyDigest: localPrefs.weeklyDigest,
      promotionalEmails: localPrefs.promotionalEmails,
      securityAlerts: localPrefs.securityAlerts,
    });
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!localPrefs) {
    return <div>Failed to load preferences</div>;
  }

  const allDisabled = !Object.values(localPrefs).some(
    (v) => v === true && typeof v === 'boolean'
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Preferences</h1>
        <p className="text-gray-600">Manage your email notification settings</p>
      </div>

      {/* Notification Types */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Choose which emails you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Messages */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">New Messages</h3>
              <p className="text-sm text-gray-600">Get notified when you receive a new message</p>
            </div>
            <Switch
              checked={localPrefs.newMessages}
              onCheckedChange={() => handleToggle('newMessages')}
            />
          </div>

          {/* New Bids */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">New Bids</h3>
              <p className="text-sm text-gray-600">Get notified when someone bids on your auction</p>
            </div>
            <Switch
              checked={localPrefs.newBids}
              onCheckedChange={() => handleToggle('newBids')}
            />
          </div>

          {/* Booking Confirmation */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Booking Confirmation</h3>
              <p className="text-sm text-gray-600">Get notified when a booking is confirmed</p>
            </div>
            <Switch
              checked={localPrefs.bookingConfirmation}
              onCheckedChange={() => handleToggle('bookingConfirmation')}
            />
          </div>

          {/* Listing Approval */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Listing Approval</h3>
              <p className="text-sm text-gray-600">Get notified when your listing is approved</p>
            </div>
            <Switch
              checked={localPrefs.listingApproval}
              onCheckedChange={() => handleToggle('listingApproval')}
            />
          </div>

          {/* Listing Rejection */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Listing Rejection</h3>
              <p className="text-sm text-gray-600">Get notified when your listing is rejected</p>
            </div>
            <Switch
              checked={localPrefs.listingRejection}
              onCheckedChange={() => handleToggle('listingRejection')}
            />
          </div>

          {/* Weekly Digest */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Digest</h3>
              <p className="text-sm text-gray-600">Get a weekly summary of your activity</p>
            </div>
            <Switch
              checked={localPrefs.weeklyDigest}
              onCheckedChange={() => handleToggle('weeklyDigest')}
            />
          </div>

          {/* Promotional Emails */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Promotional Emails</h3>
              <p className="text-sm text-gray-600">Get offers and promotions from Sasto Marketplace</p>
            </div>
            <Switch
              checked={localPrefs.promotionalEmails}
              onCheckedChange={() => handleToggle('promotionalEmails')}
            />
          </div>

          {/* Security Alerts */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Security Alerts</h3>
              <p className="text-sm text-gray-600">Get notified of unusual account activity</p>
            </div>
            <Switch
              checked={localPrefs.securityAlerts}
              onCheckedChange={() => handleToggle('securityAlerts')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Email Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>

            <Button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              variant="outline"
            >
              {testMutation.isPending ? 'Sending...' : 'Send Test Email'}
            </Button>

            {!allDisabled ? (
              <Button
                onClick={() => unsubscribeMutation.mutate()}
                disabled={unsubscribeMutation.isPending}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                {unsubscribeMutation.isPending ? 'Unsubscribing...' : 'Unsubscribe from All'}
              </Button>
            ) : (
              <Button
                onClick={() => resubscribeMutation.mutate()}
                disabled={resubscribeMutation.isPending}
                variant="outline"
                className="text-green-600 hover:text-green-700"
              >
                {resubscribeMutation.isPending ? 'Resubscribing...' : 'Resubscribe'}
              </Button>
            )}
          </div>

          {updateMutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✓ Preferences saved successfully
            </div>
          )}

          {testMutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✓ Test email sent to {user?.email}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Security alerts will always be sent regardless of your preferences to keep your account safe.
        </p>
      </div>
    </div>
  );
};

export default EmailPreferences;
