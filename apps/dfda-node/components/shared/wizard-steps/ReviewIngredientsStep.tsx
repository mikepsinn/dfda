'use client'

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // If showing dosage instructions
import { Trash2 } from 'lucide-react';
import { AnalyzedImageResult } from '@/lib/actions/analyze-image';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture';
import { ReviewStepLayout } from './ReviewStepLayout'; // Import the layout

interface ReviewIngredientsStepProps {
  formData: Partial<AnalyzedImageResult>;
  ingredientsImagePreview?: string | null;
  isSaving: boolean;
  isAnalyzing: boolean;
  // Handlers
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; // For dosage instructions
  handleIngredientChange: (
    listKey: 'ingredients' | 'active_ingredients' | 'inactive_ingredients' | 'other_ingredients',
    index: number,
    field: 'name' | 'quantity' | 'unit',
    value: string | number | null
  ) => void;
  addIngredient: (listKey: 'ingredients' | 'active_ingredients' | 'inactive_ingredients' | 'other_ingredients') => void;
  removeIngredient: (listKey: 'ingredients' | 'active_ingredients' | 'inactive_ingredients' | 'other_ingredients', index: number) => void;
  determineNextStep: (currentData: Partial<AnalyzedImageResult>) => ImageType | 'finalReview';
  goToStep: (step: ImageAnalysisStep, nextImageType?: ImageType) => void;
  retakeImage: (type: ImageType) => void;
  onConfirmAndGoToFinal: () => void;
  onSkipStepAndContinue: () => void;
}

export function ReviewIngredientsStep({
  formData,
  ingredientsImagePreview,
  isSaving,
  isAnalyzing,
  handleFormChange,
  handleIngredientChange,
  addIngredient,
  removeIngredient,
  determineNextStep,
  goToStep,
  retakeImage,
  onConfirmAndGoToFinal,
  onSkipStepAndContinue,
}: ReviewIngredientsStepProps) {

  const handleConfirmAndNext = () => {
    const next = determineNextStep(formData);
    if (next === 'finalReview') {
        goToStep('finalReview');
    } else {
        // Determine the capture step based on the image type
        const nextCaptureStep = `capture${next.charAt(0).toUpperCase() + next.slice(1)}` as ImageAnalysisStep;
        goToStep(nextCaptureStep, next);
    }
  };

  return (
    <ReviewStepLayout
        stepTitle="Step 6: Review Ingredients"
        stepDescription="Confirm the ingredients (and dosage/supplement facts if applicable) extracted from the image."
        imagePreviewUrl={ingredientsImagePreview}
        imageType="ingredients"
        isSaving={isSaving}
        isAnalyzing={isAnalyzing}
        onConfirmAndNext={handleConfirmAndNext}
        onConfirmAndGoToFinal={onConfirmAndGoToFinal}
        onSkipStepAndContinue={onSkipStepAndContinue}
        onRetake={retakeImage}
    >
      {/* Editable Fields Relevant to Ingredients Analysis */}
      <div className="w-full max-w-md space-y-3">
        {/* Treatment specific: Dosage Instructions (if applicable) */} 
        {formData.type === 'treatment' && (
             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="dosage_instructions-ing" className="text-right pt-2">Instructions</Label>
                <Textarea 
                    id="dosage_instructions-ing" 
                    name="dosage_instructions" 
                    value={formData.dosage_instructions || ''} 
                    onChange={handleFormChange} 
                    className="col-span-3" 
                    disabled={isSaving || isAnalyzing} 
                    placeholder="Confirm or enter instructions" rows={2}/>
            </div>
        )}

        {/* Food Ingredients */} 
        {formData.type === 'food' && (
            <>
                <h4 className="col-span-4 text-sm font-medium mt-1 mb-1">Ingredients</h4>
                <div className="col-span-4 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {formData.ingredients && formData.ingredients.map((ing, idx) => (
                        <div key={`food-ing-${idx}`} className="flex items-center gap-2">
                            <Input value={ing.name} onChange={(e) => handleIngredientChange('ingredients', idx, 'name', e.target.value)} placeholder="Ingredient Name" className="flex-grow" disabled={isSaving || isAnalyzing} />
                            <Button variant="ghost" size="icon" onClick={() => removeIngredient('ingredients', idx)} disabled={isSaving || isAnalyzing} aria-label="Remove ingredient" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {(!formData.ingredients || formData.ingredients.length === 0) && (<p className="text-xs text-muted-foreground italic">No ingredients found.</p>)}
                </div>
                <Button variant="outline" size="sm" onClick={() => addIngredient('ingredients')} disabled={isSaving || isAnalyzing}>Add Ingredient</Button>
            </>
        )}
        
         {/* Treatment Active Ingredients */} 
        {formData.type === 'treatment' && (
             <>
                <h4 className="col-span-4 text-sm font-medium mt-1 mb-1">Active Ingredients</h4>
                 <div className="col-span-4 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {formData.active_ingredients && formData.active_ingredients.map((ing, idx) => (
                         <div key={`active-ing-${idx}`} className="flex items-center gap-2">
                             <Input value={ing.name} onChange={(e) => handleIngredientChange('active_ingredients', idx, 'name', e.target.value)} placeholder="Ingredient Name" className="flex-grow" disabled={isSaving || isAnalyzing} />
                             <Input type="number" value={ing.quantity ?? ''} onChange={(e) => handleIngredientChange('active_ingredients', idx, 'quantity', e.target.value ? Number(e.target.value) : null)} placeholder="Strength" className="w-20" disabled={isSaving || isAnalyzing}/>
                             <Input value={ing.unit || ''} onChange={(e) => handleIngredientChange('active_ingredients', idx, 'unit', e.target.value)} placeholder="Unit" className="w-16" disabled={isSaving || isAnalyzing}/>
                             <Button variant="ghost" size="icon" onClick={() => removeIngredient('active_ingredients', idx)} disabled={isSaving || isAnalyzing} aria-label="Remove active ingredient" className="h-8 w-8">
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                         </div>
                     ))}
                     {(!formData.active_ingredients || formData.active_ingredients.length === 0) && (<p className="text-xs text-muted-foreground italic">No active ingredients found.</p>)}
                 </div>
                  <Button variant="outline" size="sm" onClick={() => addIngredient('active_ingredients')} disabled={isSaving || isAnalyzing}>Add Active Ingredient</Button>
            </>
        )}

        {/* Treatment Inactive Ingredients */} 
         {formData.type === 'treatment' && (
             <>
                 <h4 className="col-span-4 text-sm font-medium mt-3 mb-1">Inactive Ingredients</h4>
                 <div className="col-span-4 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {formData.inactive_ingredients && formData.inactive_ingredients.map((ing, idx) => (
                        <div key={`inactive-ing-${idx}`} className="flex items-center gap-2">
                            <Input value={ing.name} onChange={(e) => handleIngredientChange('inactive_ingredients', idx, 'name', e.target.value)} placeholder="Ingredient Name" className="flex-grow" disabled={isSaving || isAnalyzing} />
                             <Button variant="ghost" size="icon" onClick={() => removeIngredient('inactive_ingredients', idx)} disabled={isSaving || isAnalyzing} aria-label="Remove inactive ingredient" className="h-8 w-8">
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                        </div>
                     ))}
                     {(!formData.inactive_ingredients || formData.inactive_ingredients.length === 0) && (<p className="text-xs text-muted-foreground italic">No inactive ingredients found.</p>)}
                 </div>
                 <Button variant="outline" size="sm" onClick={() => addIngredient('inactive_ingredients')} disabled={isSaving || isAnalyzing}>Add Inactive Ingredient</Button>
             </>
        )}
      </div>
    </ReviewStepLayout>
  );
} 