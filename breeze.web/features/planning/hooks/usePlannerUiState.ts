'use client';
import { useState } from 'react';

export function usePlannerUiState() {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    accountBreakdown: false,
  });

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return { collapsedSections, toggleSection };
}
