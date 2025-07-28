'use client'

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AnalyzingStepProps {
  type: 'primary' | 'nutrition' | 'ingredients' | 'upc';
}

export function AnalyzingStep({ type }: AnalyzingStepProps) {
  // Get a message based on the type
  const getMessage = () => {
    switch (type) {
      case 'primary':
        return 'Extracting item details.';
      case 'nutrition':
        return 'Updating nutrition information.';
      case 'ingredients':
        return 'Updating ingredient details.';
      case 'upc':
        return 'Reading barcode information.';
      default:
        return 'Analyzing image...';
    }
  };

  const formattedType = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-semibold">Analyzing {formattedType} Image...</p>
      <p className="text-sm text-muted-foreground">{getMessage()}</p>
    </div>
  );
}

export default AnalyzingStep; 