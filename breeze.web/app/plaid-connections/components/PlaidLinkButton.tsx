'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { useExchangePlaidToken, useCreateLinkToken } from '@/lib/services/hooks/usePlaid';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { Loader2 } from 'lucide-react';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const PlaidLinkButton = ({ onSuccess, onError }: PlaidLinkButtonProps) => {
  const { userId } = useCurrentUser();
  const { mutate: exchangeToken, isPending: isExchanging } = useExchangePlaidToken();
  const { mutate: createLinkToken, isPending: isCreatingToken } = useCreateLinkToken();
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!userId) return;

    createLinkToken(userId, {
      onSuccess: (token) => setLinkToken(token),
      onError: () => {
        onErrorRef.current?.('Failed to create link token');
      },
    });
  }, [userId, createLinkToken]);

  const onPlaidSuccess = useCallback(
    (publicToken: string | null) => {
      if (!userId || !publicToken) return;

      exchangeToken(
        { userId, publicToken },
        {
          onSuccess: () => onSuccessRef.current?.(),
          onError: () => onErrorRef.current?.('Failed to connect account'),
        },
      );
    },
    [userId, exchangeToken],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  const isLoading = isExchanging || isCreatingToken;

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || !linkToken || isLoading}
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
  );
};
