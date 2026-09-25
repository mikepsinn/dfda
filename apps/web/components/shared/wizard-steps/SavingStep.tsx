'use client'

import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';
import { Button } from '@/components/ui/button';

export function SavingStep() {
  const { state, actions } = useImageAnalysisWizardContext();
  const { isLoading, error, saveSuccessful } = state;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
      {isLoading && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold">Saving...</p>
        </>
      )}
      
      {saveSuccessful && (
        <>
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold text-green-500">Successfully Saved!</p>
          <p className="text-sm text-muted-foreground text-center">
            Your variable has been saved. This dialog will close automatically.
          </p>
        </>
      )}
      
      {error && (
        <>
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-lg font-semibold text-red-600">Error Saving</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
          <Button 
            onClick={() => actions.retryLastAction()}
            variant="default"
          >
            Retry Save
          </Button>
        </>
      )}
    </div>
  );
}

export default SavingStep; 