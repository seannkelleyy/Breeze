'use client';

import { createContext, JSX, useContext, useState } from 'react';
import { ConnectionsDialog } from './ConnectionsDialog';

type ConnectionsDialogContextValue = {
  openConnections: () => void;
};

const ConnectionsDialogContext = createContext<ConnectionsDialogContextValue | null>(null);

/** Global host for the bank-connections dialog so it can be opened from
 * anywhere (user menu, dashboard quick links, empty states) without a route. */
export const ConnectionsDialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [open, setOpen] = useState(false);
  const openConnections = () => setOpen(true);

  return (
    <ConnectionsDialogContext.Provider value={{ openConnections }}>
      {children}
      <ConnectionsDialog open={open} onOpenChange={setOpen} />
    </ConnectionsDialogContext.Provider>
  );
};

export const useConnectionsDialog = () => {
  const context = useContext(ConnectionsDialogContext);

  if (!context) {
    throw new Error('useConnectionsDialog must be used within a ConnectionsDialogProvider');
  }

  return context;
};
