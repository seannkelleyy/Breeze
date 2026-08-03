'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useExchangePlaidToken, useCreateLinkToken } from '@/lib/services/hooks/usePlaid';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Plaid: any;
  }
}

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const PlaidLinkButton = ({ onSuccess, onError }: PlaidLinkButtonProps) => {
  const { userId } = useCurrentUser();
  const { mutate: exchangeToken, isPending: isExchanging } = useExchangePlaidToken();
  const { mutate: createLinkToken, isPending: isCreatingToken } = useCreateLinkToken();
  const [isLinkReady, setIsLinkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document.getElementById('plaid-script')) {
      setIsLinkReady(true); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    const script = document.createElement('script');
    script.id = 'plaid-script';
    script.src = 'https://cdn.plaid.com/link/v3/stable/link-initialize.js';
    script.async = true;
    script.onload = () => setIsLinkReady(true); // eslint-disable-line react-hooks/set-state-in-effect
    script.onerror = () => {
      setError('Failed to load Plaid SDK');
      onError?.('Failed to load Plaid SDK');
    };
    document.head.appendChild(script);
  }, [onError]);

  const handleLinkOpen = useCallback(() => {
    if (!window.Plaid || !userId) {
      setError('Plaid SDK not ready or user not authenticated');
      onError?.('Plaid SDK not ready or user not authenticated');
      return;
    }

    createLinkToken(userId, {
      onSuccess: (data) => {
        const handler = window.Plaid.create({
          token: data.createPlaidLinkToken,
          onSuccess: (publicToken: string) => {
            exchangeToken(
              { userId, publicToken },
              {
                onSuccess: () => onSuccess?.(),
                onError: () => {
                  setError('Failed to connect account');
                  onError?.('Failed to connect account');
                },
              },
            );
          },
          onExit: () => {},
        });
        handler.open();
      },
      onError: () => {
        setError('Failed to create link token');
        onError?.('Failed to create link token');
      },
    });
  }, [userId, createLinkToken, exchangeToken, onSuccess, onError]);

  const isLoading = isExchanging || isCreatingToken;

  return (
    <>
      <Button
        onClick={handleLinkOpen}
        disabled={!isLinkReady || !userId || isLoading}
        variant="default"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Institution'
        )}
      </Button>
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </>
  );
};
