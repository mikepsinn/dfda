'use client'

import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';
import {
  AnalyzedImageResult,
  // FoodSchema, // Removed unused import
  // TreatmentSchema, // Removed unused import
  // SupplementSchema, // Removed unused import
  IngredientSchema
} from '@/lib/actions/analyze-image';
import { z } from 'zod';

// Define types based on imported schemas
// type FoodType = z.infer<typeof FoodSchema>; // Removed unused type
// type TreatmentType = z.infer<typeof TreatmentSchema>; // Removed unused type
// type SupplementType = z.infer<typeof SupplementSchema>; // Removed unused type
type FullIngredient = z.infer<typeof IngredientSchema>;
type NameOnlyIngredient = { name: string }; // For supplement's other_ingredients, assuming IngredientSchema.pick({ name: true })

// Union type for any kind of ingredient item that can be in the lists
type AnyIngredient = FullIngredient | NameOnlyIngredient;

// Key type for ingredient lists
type IngredientListKey = 'ingredients' | 'active_ingredients' | 'inactive_ingredients' | 'other_ingredients';

export function FormFieldsComponent() {
  const { state, actions } = useImageAnalysisWizardContext();
  const { formData, isLoading } = state;
  const { updateFormField } = actions;

  // Form field handlers
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormField(name as keyof Partial<AnalyzedImageResult>, value);
  }, [updateFormField]);

  const handleNumericFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? null : parseFloat(value);
    if (value === '' || (numValue !== null && !isNaN(numValue))) {
      updateFormField(name as keyof Partial<AnalyzedImageResult>, numValue);
    }
  }, [updateFormField]);

  // Ingredient handlers
  const handleIngredientChange = useCallback((
    listKey: IngredientListKey,
    index: number,
    field: 'name' | 'quantity' | 'unit',
    value: string | number | null
  ) => {
    const currentList: AnyIngredient[] = (formData as any)[listKey] || []; 
    const updatedList = [...currentList];
    if (!updatedList[index]) return;
    // Ensure the item being updated conforms to AnyIngredient structure
    const updatedIngredient: Partial<AnyIngredient> = { ...updatedList[index] };

    if (field === 'name') {
      updatedIngredient.name = typeof value === 'string' ? value : '';
    } else if ((listKey === 'ingredients' || listKey === 'active_ingredients')) {
      // These listKey types expect FullIngredient which has quantity and unit
      if (field === 'quantity') {
        (updatedIngredient as Partial<FullIngredient>).quantity = typeof value === 'number' ? value : null;
      } else if (field === 'unit') {
        (updatedIngredient as Partial<FullIngredient>).unit = typeof value === 'string' ? value : null;
      }
    }
    updatedList[index] = updatedIngredient as AnyIngredient; // Cast back to AnyIngredient
    updateFormField(listKey as keyof Partial<AnalyzedImageResult>, updatedList);
  }, [updateFormField, formData]);

  const addIngredient = useCallback((listKey: IngredientListKey) => {
    const currentList: AnyIngredient[] = (formData as any)[listKey] || [];
    const newIngredient: AnyIngredient = (listKey === 'inactive_ingredients' || listKey === 'other_ingredients')
      ? { name: '' } // NameOnlyIngredient compatible
      : { name: '', quantity: null, unit: null }; // FullIngredient
    updateFormField(listKey as keyof Partial<AnalyzedImageResult>, [...currentList, newIngredient]);
  }, [updateFormField, formData]);

  const removeIngredient = useCallback((listKey: IngredientListKey, index: number) => {
    const currentList: AnyIngredient[] = (formData as any)[listKey] || [];
    const updatedList = currentList.filter((_: AnyIngredient, i: number) => i !== index);
    updateFormField(listKey as keyof Partial<AnalyzedImageResult>, updatedList);
  }, [updateFormField, formData]);

  if (!formData.type) return null;

  return (
    <>
      {/* Common Fields */} 
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name*</Label>
        <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., Cheerios, Advil" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="brand" className="text-right">Brand</Label>
        <Input id="brand" name="brand" value={formData.brand || ''} onChange={handleFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., General Mills, Advil" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="upc" className="text-right">UPC</Label>
        <Input id="upc" name="upc" value={formData.upc || ''} onChange={handleFormChange} className="col-span-3" disabled={isLoading} placeholder="Barcode number" />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="details" className="text-right pt-2">Details</Label>
        <Textarea id="details" name="details" value={formData.details || ''} onChange={handleFormChange} className="col-span-3" disabled={isLoading} placeholder="Optional additional info" rows={2} />
      </div>

      {/* Food Specific Fields */} 
      {formData.type === 'food' && (
        <>
          <h4 className="col-span-4 text-sm font-medium mt-3 mb-1 border-t pt-3">Nutrition (Per Serving)</h4>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="servingSize_quantity" className="text-right">Serving Size</Label>
            <Input id="servingSize_quantity" name="servingSize_quantity" type="number" value={formData.servingSize_quantity ?? ''} onChange={handleNumericFormChange} className="col-span-2" disabled={isLoading} placeholder="e.g., 30" />
            <Input id="servingSize_unit" name="servingSize_unit" value={formData.servingSize_unit || ''} onChange={handleFormChange} className="col-span-1" disabled={isLoading} placeholder="e.g., g" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="calories_per_serving" className="text-right">Calories</Label>
            <Input id="calories_per_serving" name="calories_per_serving" type="number" value={formData.calories_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., 110" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fat_per_serving" className="text-right">Fat (g)</Label>
            <Input id="fat_per_serving" name="fat_per_serving" type="number" value={formData.fat_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., 2.5" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="carbs_per_serving" className="text-right">Carbs (g)</Label>
            <Input id="carbs_per_serving" name="carbs_per_serving" type="number" value={formData.carbs_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., 22" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="protein_per_serving" className="text-right">Protein (g)</Label>
            <Input id="protein_per_serving" name="protein_per_serving" type="number" value={formData.protein_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., 4" />
          </div>
          <h4 className="col-span-4 text-sm font-medium mt-3 mb-1 border-t pt-3">Ingredients</h4>
          <div className="col-span-4 space-y-2">
            {formData.ingredients && formData.ingredients.map((ing, idx) => (
              <div key={`food-ing-${idx}`} className="flex items-center gap-2">
                <Input 
                  value={ing.name} 
                  onChange={(e) => handleIngredientChange('ingredients', idx, 'name', e.target.value)} 
                  placeholder="Ingredient Name" 
                  className="flex-grow"
                  disabled={isLoading}
                />
                <Button variant="ghost" size="icon" onClick={() => removeIngredient('ingredients', idx)} disabled={isLoading} aria-label="Remove ingredient">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!formData.ingredients || formData.ingredients.length === 0) && (
              <p className="text-xs text-muted-foreground italic">No ingredients listed.</p>
            )}
            <Button variant="outline" size="sm" onClick={() => addIngredient('ingredients')} disabled={isLoading}>
              Add Ingredient
            </Button>
          </div>
        </>
      )}

      {/* Treatment Specific Fields */} 
      {formData.type === 'treatment' && (
        <>
          <h4 className="col-span-4 text-sm font-medium mt-3 mb-1 border-t pt-3">Dosage & Ingredients</h4>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dosage_form" className="text-right">Dosage Form</Label>
            <Input id="dosage_form" name="dosage_form" value={formData.dosage_form || ''} onChange={handleFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., Tablet, Capsule" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="dosage_instructions" className="text-right pt-2">Instructions</Label>
            <Textarea id="dosage_instructions" name="dosage_instructions" value={formData.dosage_instructions || ''} onChange={handleFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., Take 1 tablet daily" rows={2}/>
          </div>
          
          <h5 className="col-span-4 text-xs font-medium mt-2">Active Ingredients</h5>
          <div className="col-span-4 space-y-2">
            {formData.active_ingredients && formData.active_ingredients.map((ing, idx) => (
              <div key={`active-ing-${idx}`} className="flex items-center gap-2">
                <Input 
                  value={ing.name} 
                  onChange={(e) => handleIngredientChange('active_ingredients', idx, 'name', e.target.value)} 
                  placeholder="Ingredient Name" 
                  className="flex-grow"
                  disabled={isLoading}
                />
                <Input 
                  type="number" 
                  value={ing.quantity ?? ''} 
                  onChange={(e) => handleIngredientChange('active_ingredients', idx, 'quantity', e.target.value ? Number(e.target.value) : null)} 
                  placeholder="Strength" 
                  className="w-20" 
                  disabled={isLoading}
                />
                <Input 
                  value={ing.unit || ''} 
                  onChange={(e) => handleIngredientChange('active_ingredients', idx, 'unit', e.target.value)} 
                  placeholder="Unit" 
                  className="w-16" 
                  disabled={isLoading}
                />
                <Button variant="ghost" size="icon" onClick={() => removeIngredient('active_ingredients', idx)} disabled={isLoading} aria-label="Remove active ingredient">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!formData.active_ingredients || formData.active_ingredients.length === 0) && (
              <p className="text-xs text-muted-foreground italic">No active ingredients listed.</p>
            )}
            <Button variant="outline" size="sm" onClick={() => addIngredient('active_ingredients')} disabled={isLoading}>
              Add Active Ingredient
            </Button>
          </div>

          <h5 className="col-span-4 text-xs font-medium mt-2">Inactive Ingredients</h5>
          <div className="col-span-4 space-y-2">
            {formData.inactive_ingredients && formData.inactive_ingredients.map((ing, idx) => (
              <div key={`inactive-ing-${idx}`} className="flex items-center gap-2">
                <Input 
                  value={ing.name} 
                  onChange={(e) => handleIngredientChange('inactive_ingredients', idx, 'name', e.target.value)} 
                  placeholder="Ingredient Name" 
                  className="flex-grow"
                  disabled={isLoading}
                />
                <Button variant="ghost" size="icon" onClick={() => removeIngredient('inactive_ingredients', idx)} disabled={isLoading} aria-label="Remove inactive ingredient">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!formData.inactive_ingredients || formData.inactive_ingredients.length === 0) && (
              <p className="text-xs text-muted-foreground italic">No inactive ingredients listed.</p>
            )}
            <Button variant="outline" size="sm" onClick={() => addIngredient('inactive_ingredients')} disabled={isLoading}>
              Add Inactive Ingredient
            </Button>
          </div>
        </>
      )}
    </>
  );
}

export default FormFieldsComponent; 