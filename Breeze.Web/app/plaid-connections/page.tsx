'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, LinkIcon, RotateCw } from 'lucide-react';
import { PlaidLinkButton } from './components/PlaidLinkButton';

interface PlaidAccount {
  id: string;
  name: string;
  type: string;
  balance: string;
  mask?: string;
}

interface PlaidConnection {
  id: string;
  institutionName: string;
  accounts: PlaidAccount[];
  connectedAt: string;
  lastSync?: string;
}

const PlaidConnections = () => {
  const [connections, setConnections] = useState<PlaidConnection[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handlePlaidSuccess = () => {
    // TODO: Fetch connections from backend after successful token exchange
    setSyncStatus('success');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    try {
      // TODO: Call SYNC_PLAID_CONNECTION mutation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch {
      setSyncStatus('error');
    }
  };

  const handleDisconnect = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Plaid Connections</h1>
        <p className="text-muted-foreground mt-1">
          Connect your bank accounts and investment accounts for automatic sync
        </p>
      </div>

      {/* Status Messages */}
      {syncStatus === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <span>Successfully synced your accounts</span>
          </div>
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800">
            <span>Failed to sync accounts. Please try again.</span>
          </div>
        </div>
      )}

      {/* Connect New Account */}
      <Card>
        <CardHeader>
          <CardTitle>Connect a New Account</CardTitle>
          <CardDescription>
            Use Plaid Link to securely connect your bank and investment accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaidLinkButton onSuccess={handlePlaidSuccess} />
        </CardContent>
      </Card>

      {/* Manual Sync */}
      {connections.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>Manually sync your connected accounts</CardDescription>
            </div>
            <Button
              onClick={handleManualSync}
              disabled={syncStatus === 'syncing'}
              variant="outline"
              size="sm"
            >
              <RotateCw
                className={`mr-2 h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
              />
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Connected Accounts */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Connected Accounts</h2>
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    {connection.institutionName}
                  </CardTitle>
                  <CardDescription>
                    Connected {new Date(connection.connectedAt).toLocaleDateString()}
                    {connection.lastSync &&
                      ` • Last synced ${new Date(connection.lastSync).toLocaleDateString()}`}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleDisconnect(connection.id)}
                  variant="destructive"
                  size="sm"
                >
                  Disconnect
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium">Accounts</h4>
                  <ul className="space-y-1">
                    {connection.accounts.map((account) => (
                      <li key={account.id} className="text-muted-foreground text-sm">
                        {account.name} ({account.type}){account.mask && ` ···· ${account.mask}`}
                        {account.balance && ` - ${account.balance}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {connections.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <LinkIcon className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
            <p className="text-muted-foreground">No connected accounts yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Connect your first account to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlaidConnections;
