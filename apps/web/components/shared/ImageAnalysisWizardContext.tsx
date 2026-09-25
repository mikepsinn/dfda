import React, { createContext, useContext } from 'react';
import { useImageAnalysisWizard } from '@/hooks/useImageAnalysisWizard';
import { AnalyzedImageResult } from '@/lib/actions/analyze-image';

export type ImageAnalysisWizardContextType = ReturnType<typeof useImageAnalysisWizard>;

const ImageAnalysisWizardContext = createContext<ImageAnalysisWizardContextType | null>(null);

interface ProviderProps {
  userId: string;
  onSaveSuccess?: (data: AnalyzedImageResult) => void;
  children: React.ReactNode;
}

export function ImageAnalysisWizardProvider({ userId, onSaveSuccess, children }: ProviderProps) {
  const wizard = useImageAnalysisWizard(userId, onSaveSuccess);
  return (
    <ImageAnalysisWizardContext.Provider value={wizard}>
      {children}
    </ImageAnalysisWizardContext.Provider>
  );
}

export function useImageAnalysisWizardContext(): ImageAnalysisWizardContextType {
  const context = useContext(ImageAnalysisWizardContext);
  if (!context) {
    throw new Error('useImageAnalysisWizardContext must be used within an ImageAnalysisWizardProvider');
  }
  return context;
} 