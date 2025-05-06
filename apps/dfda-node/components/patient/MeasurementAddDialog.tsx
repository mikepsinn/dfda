"use client"

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { UserVariableWithDetails } from "@/lib/actions/user-variables";

interface MeasurementAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userVariables: UserVariableWithDetails[];
  onSubmit: (data: { userVariableId: string; value: number; unit: string; notes?: string }) => Promise<void>;
}

export function MeasurementAddDialog({ isOpen, onClose, userVariables, onSubmit }: MeasurementAddDialogProps) {
  const [selectedVariableId, setSelectedVariableId] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find the selected variable object
  const selectedVariable = useMemo(() => userVariables.find(v => v.id === selectedVariableId), [userVariables, selectedVariableId]);

  // Get unit options for the selected variable
  const unitOptions = useMemo(() => {
    if (!selectedVariable) return [];
    const preferred = selectedVariable.units?.abbreviated_name;
    const defaultUnit = selectedVariable.global_variables?.units?.abbreviated_name;
    // Only show unique, non-empty units
    return [preferred, defaultUnit].filter((u, i, arr) => u && arr.indexOf(u) === i) as string[];
  }, [selectedVariable]);

  // Set default unit when variable changes
  useMemo(() => {
    if (unitOptions.length > 0) setUnit(unitOptions[0]!);
  }, [unitOptions]);

  const handleSubmit = async () => {
    setError("");
    if (!selectedVariableId) {
      setError("Please select a variable.");
      return;
    }
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setError("Please enter a valid number for the value.");
      return;
    }
    if (!unit) {
      setError("Please select a unit.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ userVariableId: selectedVariableId, value: numericValue, unit, notes: notes || undefined });
      setValue("");
      setNotes("");
      setSelectedVariableId("");
      setUnit("");
      onClose();
    } catch (e) {
      setError("Failed to add measurement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Measurement</DialogTitle>
          <DialogDescription>
            Select a variable, enter a value, and optionally add notes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1">Variable</label>
            <Select value={selectedVariableId} onValueChange={setSelectedVariableId}>
              <SelectTrigger>
                <SelectValue placeholder="Select variable" />
              </SelectTrigger>
              <SelectContent>
                {userVariables.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.global_variables?.emoji ? `${v.global_variables.emoji} ` : ""}{v.global_variables?.name || "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <Input type="number" value={value} onChange={e => setValue(e.target.value)} disabled={isSubmitting} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <Select value={unit} onValueChange={setUnit} disabled={unitOptions.length === 0 || isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.length === 0 ? (
                  <SelectItem value="" disabled>No units</SelectItem>
                ) : (
                  unitOptions.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isSubmitting} placeholder="(Optional) Add any relevant notes..." />
          </div>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedVariableId || !value || !unit}>
            {isSubmitting ? "Adding..." : "Add Measurement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 