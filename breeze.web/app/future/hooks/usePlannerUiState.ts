'use client';
import { useCallback, useState } from 'react';

export function usePlannerUiState() {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    accountBreakdown: false,
  });

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  return { collapsedSections, toggleSection };
}

export default usePlannerUiState;
