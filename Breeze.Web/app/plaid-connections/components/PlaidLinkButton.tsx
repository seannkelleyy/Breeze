'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useExchangePlaidToken } from '@/lib/services/hooks/usePlaid';
import { useUser } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Plaid: any;
  }
}

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const PlaidLinkButton = ({ onSuccess, onError }: PlaidLinkButtonProps) => {
  const { user } = useUser();
  const { mutate: exchangeToken, isPending } = useExchangePlaidToken();
  const [isLinkReady, setIsLinkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Plaid SDK from CDN
    if (document.getElementById('plaid-script')) {
      setIsLinkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'plaid-script';
    script.src = 'https://cdn.plaid.com/link/v3/stable/link-initialize.js';
    script.async = true;
    script.onload = () => {
      setIsLinkReady(true);
    };
    script.onerror = () => {
      setError('Failed to load Plaid SDK');
      onError?.('Failed to load Plaid SDK');
    };
    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts
    };
  }, [onError]);

  const handleLinkOpen = useCallback(() => {
    if (!window.Plaid || !user?.id) {
      setError('Plaid SDK not ready or user not authenticated');
      onError?.('Plaid SDK not ready or user not authenticated');
      return;
    }

    // Get link token from API (you'll need to create this endpoint)
    // For now, this is a placeholder - the actual implementation would call your backend
    // to get a link_token from Plaid API
    window.Plaid.create({
      token: '', // This should come from your backend
      onSuccess: (publicToken: string) => {
        exchangeToken(
          { userId: user.id, publicToken },
          {
            onSuccess: () => {
              onSuccess?.();
            },
            onError: (err) => {
              setError('Failed to connect account');
              onError?.('Failed to connect account');
            },
          },
        );
      },
      onExit: () => {
        // User closed the Link flow
      },
      onEvent: (eventName: string) => {
        console.log('Plaid event:', eventName);
      },
    }).open();
  }, [user?.id, exchangeToken, onSuccess, onError]);

  return (
    <>
      <Button
        onClick={handleLinkOpen}
        disabled={!isLinkReady || !user || isPending}
        variant="default"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Institution'
        )}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </>
  );
};
