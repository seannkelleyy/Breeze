'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { usePlaidConnections, usePlaidAccounts } from '@/lib/services/hooks/usePlaid';
import {
  useLinkAssetToPlaidAccount,
  useUnlinkAssetFromPlaidAccount,
  useLinkLiabilityToPlaidAccount,
  useUnlinkLiabilityFromPlaidAccount,
} from '@/lib/services/hooks/usePlaidLinking';
import { Loader2, LinkIcon, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaidAccountLinkerProps {
  accountId: string;
  isLiability: boolean;
  plaidAccountId: string | null;
}

const NONE_VALUE = '__none__';

export const PlaidAccountLinker = ({
  accountId,
  isLiability,
  plaidAccountId,
}: PlaidAccountLinkerProps) => {
  const { userId } = useCurrentUser();
  const { data: connections, isLoading: connectionsLoading } = usePlaidConnections(userId);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(() => {
    return connections?.[0]?.id ?? null;
  });

  useEffect(() => {
    if (connections && connections.length > 0 && selectedConnectionId === null) {
      setSelectedConnectionId(connections[0].id); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [connections, selectedConnectionId]);

  const { data: plaidAccounts, isLoading: accountsLoading } =
    usePlaidAccounts(selectedConnectionId);

  const linkAsset = useLinkAssetToPlaidAccount();
  const unlinkAsset = useUnlinkAssetFromPlaidAccount();
  const linkLiability = useLinkLiabilityToPlaidAccount();
  const unlinkLiability = useUnlinkLiabilityFromPlaidAccount();

  const isLinking =
    linkAsset.isPending ||
    unlinkAsset.isPending ||
    linkLiability.isPending ||
    unlinkLiability.isPending;

  const handleLink = (plaidAccId: string) => {
    if (plaidAccId === NONE_VALUE) {
      if (isLiability) {
        unlinkLiability.mutate(accountId);
      } else {
        unlinkAsset.mutate(accountId);
      }
    } else {
      if (isLiability) {
        linkLiability.mutate({ liabilityId: accountId, plaidAccountId: plaidAccId });
      } else {
        linkAsset.mutate({ assetId: accountId, plaidAccountId: plaidAccId });
      }
    }
  };

  if (connectionsLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading Plaid connections...
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return null;
  }

  const linkedAccount = plaidAccounts?.find((a) => a.id === plaidAccountId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <LinkIcon className="h-3.5 w-3.5" />
          Plaid Account
        </Label>
        {plaidAccountId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleLink(NONE_VALUE)}
            disabled={isLinking}
          >
            <Unlink className="mr-1 h-3 w-3" />
            Unlink
          </Button>
        )}
      </div>

      {connections.length > 1 && (
        <Select value={selectedConnectionId ?? ''} onValueChange={setSelectedConnectionId}>
          <SelectTrigger>
            <SelectValue placeholder="Select institution" />
          </SelectTrigger>
          <SelectContent>
            {connections.map((conn) => (
              <SelectItem key={conn.id} value={conn.id}>
                {conn.institutionName || 'Connected Institution'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={plaidAccountId ?? NONE_VALUE}
        onValueChange={handleLink}
        disabled={accountsLoading || isLinking}
      >
        <SelectTrigger>
          <SelectValue placeholder="Link to Plaid account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>Not linked</SelectItem>
          {plaidAccounts?.map((acc) => (
            <SelectItem key={acc.id} value={acc.id}>
              {acc.name}
              {acc.subtype ? ` (${acc.subtype})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {linkedAccount && (
        <p className="text-muted-foreground text-xs">
          Linked to: {linkedAccount.name}
          {linkedAccount.currentBalance &&
            ` — $${Number(linkedAccount.currentBalance).toLocaleString()}`}
        </p>
      )}
    </div>
  );
};
