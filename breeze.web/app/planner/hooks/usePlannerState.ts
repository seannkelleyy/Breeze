'use client';
import { useState } from 'react';

export interface PlannerUIState {
  collapsedSections: Record<string, boolean>;
  activeTab: string;
  editingFieldId: string | null;
  validationErrors: Record<string, string>;
}

const DEFAULT_UI_STATE: PlannerUIState = {
  collapsedSections: {
    retirementInputs: false,
    people: false,
    accounts: false,
    projections: false,
    taxPlanning: false,
    retirementLadder: false,
  },
  activeTab: 'inputs',
  editingFieldId: null,
  validationErrors: {},
};

export function usePlannerState() {
  const [uiState, setUiState] = useState<PlannerUIState>(DEFAULT_UI_STATE);

  const toggleSection = (sectionId: string) => {
    setUiState((prev) => ({
      ...prev,
      collapsedSections: {
        ...prev.collapsedSections,
        [sectionId]: !prev.collapsedSections[sectionId],
      },
    }));
  };

  const setActiveTab = (tab: string) => {
    setUiState((prev) => ({ ...prev, activeTab: tab }));
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
    toggleSection,
    setActiveTab,
    setEditingField,
    setValidationError,
    clearValidationErrors,
  };
}

export default usePlannerState;
