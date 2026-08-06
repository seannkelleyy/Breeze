'use client';
import { useState } from 'react';
import { useTabParam } from '@/lib/hooks/useTabParam';

const PLANNER_TABS = ['inputs', 'accounts', 'projections'] as const;
type PlannerTab = (typeof PLANNER_TABS)[number];

export interface PlannerUIState {
  collapsedSections: Record<string, boolean>;
  activeTab: PlannerTab;
  editingFieldId: string | null;
  validationErrors: Record<string, string>;
}

const DEFAULT_UI_STATE: Omit<PlannerUIState, 'activeTab'> = {
  collapsedSections: {
    retirementInputs: false,
    people: false,
    accounts: false,
    projections: false,
    taxPlanning: false,
    retirementLadder: false,
  },
  editingFieldId: null,
  validationErrors: {},
};

export function usePlannerState() {
  const [activeTab, setActiveTab] = useTabParam<PlannerTab>('inputs', PLANNER_TABS);
  const [uiState, setUiState] = useState(DEFAULT_UI_STATE);

  const toggleSection = (sectionId: string) => {
    setUiState((prev) => ({
      ...prev,
      collapsedSections: {
        ...prev.collapsedSections,
        [sectionId]: !prev.collapsedSections[sectionId],
      },
    }));
  };

  const setEditingField = (fieldId: string | null) => {
    setUiState((prev) => ({ ...prev, editingFieldId: fieldId }));
  };

  const setValidationError = (fieldId: string, error: string | null) => {
    setUiState((prev) => {
      const newErrors = { ...prev.validationErrors };
      if (error) {
        newErrors[fieldId] = error;
      } else {
        delete newErrors[fieldId];
      }
      return {
        ...prev,
        validationErrors: newErrors,
      };
    });
  };

  const clearValidationErrors = () => {
    setUiState((prev) => ({ ...prev, validationErrors: {} }));
  };

  return {
    ...uiState,
    activeTab,
    setActiveTab,
    toggleSection,
    setEditingField,
    setValidationError,
    clearValidationErrors,
  };
}

export default usePlannerState;
