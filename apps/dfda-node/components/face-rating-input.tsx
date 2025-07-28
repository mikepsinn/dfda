'use client'

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label" // Optional: if we want a label inside

interface FaceRatingInputProps {
    value: string | null | undefined; // Current rating value (e.g., "0", "2.5", "5", "7.5", "10", or ""/null)
    onValueChange: (newValue: string) => void; // Callback when a face is clicked
    label?: string; // Optional label
    labelId?: string; // Optional ID for label association
    disabled?: boolean; // Optional disabled state
}

// Define the faces and their corresponding values/labels
const ratingOptions = [ 
    { emoji: '😭', value: '0', label: 'No Impr.' }, // Shortened labels
    { emoji: '😟', value: '2.5', label: 'Slight' },
    { emoji: '😐', value: '5', label: 'Moderate' },
    { emoji: '😊', value: '7.5', label: 'Great' }, // Kept 'Great' based on user's previous changes
    { emoji: '😁', value: '10', label: 'Complete' },
];

export function FaceRatingInput({ 
    value, 
    onValueChange, 
    label,
    labelId,
    disabled = false 
}: FaceRatingInputProps) {
    
    const handleFaceClick = (newValue: string) => {
        if (!disabled) {
            // If clicking the same face again, deselect it (optional behavior)
            // onValueChange(currentValue === newValue ? "" : newValue); 
            onValueChange(newValue); // Just set the new value
        }
    };

    // Convert null/undefined to empty string for comparison
    const currentValue = value ?? "";

    return (
        <div className="grid gap-1"> {/* Reduced gap */}
            {label && <Label htmlFor={labelId} className="text-xs text-muted-foreground">{label}</Label>} {/* Smaller label */}
            <div 
                className="flex justify-around items-end pt-1 space-x-1 px-1" 
                role="radiogroup" 
                aria-labelledby={labelId}
            >
                {ratingOptions.map(({ emoji, value: optionValue, label: optionLabel }) => {
                    const isSelected = currentValue === optionValue;
                    return (
                        <div key={optionValue} className="flex flex-col items-center space-y-1 w-1/5 text-center">
                            <Button
                                type="button" 
                                variant={isSelected ? "secondary" : "ghost"}
                                size="icon"
                                onClick={() => handleFaceClick(optionValue)}
                                className={`text-xl rounded-full p-0 transition-all duration-150 ease-in-out ${isSelected ? 'h-10 w-10 text-2xl ring-2 ring-primary ring-offset-1' : 'h-8 w-8'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`} // Added ring for selected
                                aria-label={`Rate effectiveness as ${optionValue}: ${optionLabel}`}
                                aria-checked={isSelected} // Changed aria-pressed to aria-checked
                                role="radio"
                                disabled={disabled}
                            >
                                {emoji}
                            </Button>
                            <span className={`text-[10px] leading-tight ${isSelected ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                                {optionLabel}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 