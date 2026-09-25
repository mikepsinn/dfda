'use client'

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // If showing dosage instructions
import { Trash2 } from 'lucide-react';
import { AnalyzedImageResult } from '@/lib/actions/analyze-image';
import { ImageType } from '../ImageAnalysisCapture';
import { ReviewStepLayout } from './ReviewStepLayout'; // Import the layout
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';
import {
  // FoodSchema, // Removed unused import
  // TreatmentSchema, // Removed unused import
  // SupplementSchema, // Removed unused import
  IngredientSchema
} from '@/lib/actions/analyze-image'; // Adjust path if necessary
import { z } from 'zod';

// Define types based on imported schemas
// type FoodType = z.infer<typeof FoodSchema>; // Removed unused type
// type TreatmentType = z.infer<typeof TreatmentSchema>; // Removed unused type
// type SupplementType = z.infer<typeof SupplementSchema>; // Removed unused type
type FullIngredient = z.infer<typeof IngredientSchema>;
type NameOnlyIngredient = { name: string }; // For supplement's other_ingredients

// Union type for any kind of ingredient item that can be in the lists
type AnyIngredient = FullIngredient | NameOnlyIngredient;

// Key type for ingredient lists
type IngredientListKey = 'ingredients' | 'active_ingredients' | 'inactive_ingredients' | 'other_ingredients';

export function ReviewIngredientsStep() {
  const { state, actions } = useImageAnalysisWizardContext();
  const { formData, isLoading } = state;

  // Handler for confirming this step and proceeding
  const handleConfirmAndNext = useCallback(() => {
    // Call the hook's action to handle the transition logic
    actions.goToNextStepFromReview('ingredients');
  }, [actions]);

  // Handler for going straight to final review
  const handleConfirmAndGoToFinal = useCallback(() => {
    actions.goToStep('finalReview');
  }, [actions]);

  // Handler for skipping this optional step
  const handleSkipStepAndContinue = useCallback(() => {
    // Similar to confirm, but could have different side effects in the future
    actions.goToNextStepFromReview('ingredients');
  }, [actions]);

  // Handler for retaking image - Use a dedicated action
  const handleRetake = useCallback((type: ImageType) => {
    actions.retakeImage(type); // This action should handle state reset and navigation
  }, [actions]);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    actions.updateFormField(name as keyof AnalyzedImageResult, value);
  }, [actions]);

  const handleIngredientChange = useCallback((
    listKey: IngredientListKey,
    index: number,
    field: 'name' | 'quantity' | 'unit',
    value: string | number | null
  ) => {
    const currentList: AnyIngredient[] = (formData as any)[listKey] || [];
    const updatedList = [...currentList];
    if (!updatedList[index]) return;
    const updatedIngredient: Partial<AnyIngredient> = { ...updatedList[index] };

    if (field === 'name') {
      updatedIngredient.name = typeof value === 'string' ? value : '';
    } else if ((listKey === 'ingredients' || listKey === 'active_ingredients')) {
      if (field === 'quantity') {
        (updatedIngredient as Partial<FullIngredient>).quantity = typeof value === 'number' ? value : null;
      } else if (field === 'unit') {
        (updatedIngredient as Partial<FullIngredient>).unit = typeof value === 'string' ? value : null;
      }
    }
    updatedList[index] = updatedIngredient as AnyIngredient;
    actions.updateFormField(listKey as keyof AnalyzedImageResult, updatedList);
  }, [actions, formData]);

  const addIngredient = useCallback((listKey: IngredientListKey) => {
    const currentList: AnyIngredient[] = (formData as any)[listKey] || [];
    const newIngredient: AnyIngredient = (listKey === 'inactive_ingredients' || listKey === 'other_ingredients')
      ? { name: '' }
      : { name: '', quantity: null, unit: null };
    actions.updateFormField(listKey as keyof AnalyzedImageResult, [...currentList, newIngredient]);
  }, [actions, formData]);

  const removeIngredient = useCallback((listKey: IngredientListKey, index: number) => {
    const currentList: AnyIngredient[] = (formData as any)[listKey] || [];
    const updatedList = currentList.filter((_: AnyIngredient, i: number) => i !== index);
    actions.updateFormField(listKey as keyof AnalyzedImageResult, updatedList);
  }, [actions, formData]);

  // Determine disabled states
  const isConfirmDisabled = false; // Can add validation if needed
  const isSkipDisabled = false;

  return (
    <ReviewStepLayout
        stepTitle="Review Ingredients/Dosage"
        stepDescription="Confirm ingredients/dosage extracted."
        // Remove incorrect props, layout uses context
        imageType="ingredients"
        // Correct prop names and pass handlers
        handleConfirmAndNext={handleConfirmAndNext}
        handleConfirmAndGoToFinal={handleConfirmAndGoToFinal}
        handleSkipStepAndContinue={handleSkipStepAndContinue}
        handleRetake={handleRetake}
        // Pass disabled states
        confirmAndNextDisabled={isConfirmDisabled}
        skipStepAndContinueDisabled={isSkipDisabled}
        confirmGoToFinalButtonText="Skip Remaining Images & Finish"
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
                    disabled={isLoading} 
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
                            <Input value={ing.name} onChange={(e) => handleIngredientChange('ingredients', idx, 'name', e.target.value)} placeholder="Ingredient Name" className="flex-grow" disabled={isLoading} />
                            <Button variant="ghost" size="icon" onClick={() => removeIngredient('ingredients', idx)} disabled={isLoading} aria-label="Remove ingredient" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {(!formData.ingredients || formData.ingredients.length === 0) && (<p className="text-xs text-muted-foreground italic">No ingredients found.</p>)}
                </div>
                <Button variant="outline" size="sm" onClick={() => addIngredient('ingredients')} disabled={isLoading}>Add Ingredient</Button>
            </>
        )}
        
         {/* Treatment Active Ingredients */} 
        {formData.type === 'treatment' && (
             <>
                <h4 className="col-span-4 text-sm font-medium mt-1 mb-1">Active Ingredients</h4>
                 <div className="col-span-4 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {formData.active_ingredients && formData.active_ingredients.map((ing, idx) => (
                         <div key={`active-ing-${idx}`} className="flex items-center gap-2">
                             <Input value={ing.name} onChange={(e) => handleIngredientChange('active_ingredients', idx, 'name', e.target.value)} placeholder="Ingredient Name" className="flex-grow" disabled={isLoading} />
                             <Input type="number" value={ing.quantity ?? ''} onChange={(e) => handleIngredientChange('active_ingredients', idx, 'quantity', e.target.value ? Number(e.target.value) : null)} placeholder="Strength" className="w-20" disabled={isLoading}/>
                             <Input value={ing.unit || ''} onChange={(e) => handleIngredientChange('active_ingredients', idx, 'unit', e.target.value)} placeholder="Unit" className="w-16" disabled={isLoading}/>
                             <Button variant="ghost" size="icon" onClick={() => removeIngredient('active_ingredients', idx)} disabled={isLoading} aria-label="Remove active ingredient" className="h-8 w-8">
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                         </div>
                     ))}
                     {(!formData.active_ingredients || formData.active_ingredients.length === 0) && (<p className="text-xs text-muted-foreground italic">No active ingredients found.</p>)}
                 </div>
                  <Button variant="outline" size="sm" onClick={() => addIngredient('active_ingredients')} disabled={isLoading}>Add Active Ingredient</Button>
            </>
        )}

        {/* Treatment Inactive Ingredients */} 
         {formData.type === 'treatment' && (
             <>
                 <h4 className="col-span-4 text-sm font-medium mt-3 mb-1">Inactive Ingredients</h4>
                 <div className="col-span-4 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {formData.inactive_ingredients && formData.inactive_ingredients.map((ing, idx) => (
                        <div key={`inactive-ing-${idx}`} className="flex items-center gap-2">
                            <Input value={ing.name} onChange={(e) => handleIngredientChange('inactive_ingredients', idx, 'name', e.target.value)} placeholder="Ingredient Name" className="flex-grow" disabled={isLoading} />
                             <Button variant="ghost" size="icon" onClick={() => removeIngredient('inactive_ingredients', idx)} disabled={isLoading} aria-label="Remove inactive ingredient" className="h-8 w-8">
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                        </div>
                     ))}
                     {(!formData.inactive_ingredients || formData.inactive_ingredients.length === 0) && (<p className="text-xs text-muted-foreground italic">No inactive ingredients found.</p>)}
                 </div>
                 <Button variant="outline" size="sm" onClick={() => addIngredient('inactive_ingredients')} disabled={isLoading}>Add Inactive Ingredient</Button>
             </>
        )}
      </div>
    </ReviewStepLayout>
  );
}
