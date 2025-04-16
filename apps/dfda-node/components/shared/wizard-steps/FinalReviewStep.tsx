'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, ImageIcon, Trash2 } from 'lucide-react';
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';
import { ImageType } from '../ImageAnalysisCapture';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormFieldsComponent from './FormFieldsComponent';

interface ImageStateWithPreview {
  file?: File;
  previewUrl: string;
}

export function FinalReviewStep() {
  const { state, actions } = useImageAnalysisWizardContext();
  const { imageStates, formData, isLoading, error } = state;

  const handleSelectChange = (value: string) => {
    if (['food', 'treatment', 'supplement', 'other'].includes(value)) {
      actions.updateFormField('type', value);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* Left Column: Image Previews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Images</h3>
        {/* Use state.imageStates to render previews */}
        {Object.entries(imageStates).filter(([_, imgState]) => imgState && 'previewUrl' in imgState).map(([type, imgState]) => (
          <div key={type} className="border p-3 rounded-md space-y-2 bg-muted/30">
            <div className="flex justify-between items-center">
              <Label htmlFor={`image-review-${type}`} className="capitalize font-medium flex items-center">
                <ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/> {type}
              </Label>
              {/* Add remove button using context action */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => actions.removeImage(type as ImageType)} 
                aria-label={`Remove ${type} image`} 
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative w-full h-32 mt-1">
              <Image
                src={(imgState as ImageStateWithPreview).previewUrl}
                alt={`${type} preview`}
                fill
                className="rounded-md border object-contain bg-background"
                sizes="(max-width: 768px) 50vw, 250px"
              />
            </div>
          </div>
        ))}
        {Object.keys(imageStates).length === 0 && (
          <p className="text-xs text-muted-foreground italic">No images uploaded.</p>
        )}
      </div>

      {/* Right Column: Full Form */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Details</h3>
        {/* Type Selection - Allow final confirmation/change */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type-review" className="text-right">Type*</Label>
          <Select
            name="type"
            value={formData.type || ''}
            onValueChange={handleSelectChange}
            disabled={isLoading}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="supplement">Supplement</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Render the actual form fields */}
        {formData.type ? (
          <FormFieldsComponent />
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Select a type to see details.
          </p>
        )}
        
        {/* Display Error if present */}
        {error && (
          <div className="col-span-full text-red-600 text-sm flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md mt-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-grow">Error: {error}</span>
            <Button variant="secondary" size="sm" onClick={actions.retryLastAction}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinalReviewStep; 