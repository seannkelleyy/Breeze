'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, LinkIcon, RotateCw, Trash2, Loader2 } from 'lucide-react';
import { PlaidLinkButton } from './components/PlaidLinkButton';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import {
  usePlaidConnections,
  usePlaidAccounts,
  useSyncPlaidConnection,
  useDeletePlaidConnection,
} from '@/lib/services/hooks/usePlaid';
import { PageHeader } from '@/components/common/PageHeader';

const formatBalance = (balance: string | null, currency: string | null) => {
  if (!balance) return '—';
  const num = Number(balance);
  if (Number.isNaN(num)) return balance;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  }).format(num);
};

const ConnectionAccounts = ({ connectionId }: { connectionId: string }) => {
  const { data: accounts, isLoading } = usePlaidAccounts(connectionId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading accounts...
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return <p className="text-muted-foreground text-sm">No accounts found. Try syncing.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Accounts</h4>
      <ul className="space-y-1">
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {account.name}
              {account.subtype && ` (${account.subtype})`}
            </span>
            <span className="font-mono">
              {formatBalance(account.currentBalance, account.isoCurrencyCode)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PlaidConnections = () => {
  const { userId } = useCurrentUser();
  const { data: connections, isLoading } = usePlaidConnections(userId);
  const { mutate: syncConnection, isPending: isSyncing } = useSyncPlaidConnection();
  const { mutate: deleteConnection, isPending: isDeleting } = useDeletePlaidConnection();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSync = (connectionId: string) => {
    syncConnection(connectionId, {
      onSuccess: () => {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      },
      onError: () => {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      },
    });
  };

  const handleDisconnect = (connectionId: string) => {
    deleteConnection(connectionId);
  };

  const connectionList = connections || [];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pt-24 pb-12">
      <PageHeader
        icon={LinkIcon}
        title="Plaid Connections"
        subtitle="Connect your bank accounts and investment accounts for automatic sync."
      />

      {syncStatus === 'success' && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span>Successfully synced your accounts</span>
          </div>
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <span>Failed to sync accounts. Please try again.</span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connect a New Account</CardTitle>
          <CardDescription>
            Use Plaid Link to securely connect your bank and investment accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaidLinkButton />
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : connectionList.length > 0 ? (
        <div className="space-y-4">
          {connectionList.map((connection) => (
            <Card key={connection.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    {connection.institutionName || 'Connected Institution'}
                  </CardTitle>
                  <CardDescription>
                    Connected {new Date(connection.createdAt).toLocaleDateString()}
                    {connection.environment && ` · ${connection.environment}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSync(connection.id)}
                    disabled={isSyncing}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                  <Button
                    onClick={() => handleDisconnect(connection.id)}
                    disabled={isDeleting}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ConnectionAccounts connectionId={connection.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
