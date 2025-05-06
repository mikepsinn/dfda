"use client"

import type React from "react"
import { Clock, Pill, Activity, Heart, MoreHorizontal, Settings, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories"
import { formatInTimeZone } from 'date-fns-tz';
import { useState, useEffect } from "react"
import { getVariableInputType, getRatingRange } from "@/lib/variable-helpers"
import { Smile, Frown, Meh } from "lucide-react"
import type { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";

const ratingFaces: Record<number, React.ReactNode> = {
  1: <Frown className="h-5 w-5" />, 2: <Meh className="h-5 w-5" />, 3: <Smile className="h-5 w-5" />, 4: <Smile className="h-5 w-5 text-yellow-500" />, 5: <Smile className="h-5 w-5 text-green-500" />,
};

export type VariableCategoryId = Database["public"]["Tables"]["variable_categories"]["Row"]["id"];

export interface MeasurementCardData {
  id: string;
  globalVariableId: string;
  userVariableId?: string;
  variableCategoryId: VariableCategoryId;
  name: string;
  start_at: string;
  end_at?: string | null;
  value: number | null;
  unit: string;
  unitId: string;
  unitName?: string;
  notes?: string;
  isEditable?: boolean;
  emoji?: string | null;
}

export interface MeasurementCardProps {
  measurement: MeasurementCardData;
  userTimezone: string;
  isEditing?: boolean;
  editValue?: number | null;
  editUnit?: string | null;
  editNotes?: string;
  onEdit?: (measurement: MeasurementCardData) => void;
  onSaveEdit?: (measurement: MeasurementCardData) => void;
  onCancelEdit?: () => void;
  onNavigateToVariableSettings?: (measurement: MeasurementCardData) => void;
  onUpdateMeasurement?: (measurement: MeasurementCardData, value: number) => void;
}

const renderValueDisplay = (measurement: MeasurementCardData) => {
  return <span className="font-medium">{(measurement.value !== null && measurement.value !== undefined) ? measurement.value : '-'}{` ${measurement.unitName || measurement.unit}`}</span>
}

const getTypeIcon = (categoryId: VariableCategoryId, emoji?: string | null) => {
  if (emoji) return <span className="text-lg">{emoji}</span>;
  const iconSizeClass = "h-4 w-4";
  switch (categoryId) {
    case VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS: return <Pill className={iconSizeClass} />;
    case VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY: return <Heart className={iconSizeClass} />;
    case VARIABLE_CATEGORY_IDS.ACTIVITY_AND_BEHAVIOR: return <Activity className={iconSizeClass} />;
    default: return <Clock className={iconSizeClass} />;
  }
}

export function MeasurementCard({
  measurement,
  userTimezone,
  isEditing = false,
  editValue,
  editUnit,
  editNotes,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onNavigateToVariableSettings,
  onUpdateMeasurement,
}: MeasurementCardProps) {
  if (measurement.value === null || measurement.value === undefined) {
    logger.warn(`MeasurementCard: Measurement has no value. ID: ${measurement.id}`);
  }

  let displayTime = "--:--";
  try {
    const tz = userTimezone && userTimezone.length > 0 ? userTimezone : 'UTC';
    const date = new Date(measurement.start_at);
    if (measurement.start_at && !isNaN(date.getTime())) {
      displayTime = formatInTimeZone(date, tz, 'h:mm a');
    }
  } catch (error) {
    logger.error("Error formatting time for measurement card:", { measurementId: measurement.id, userTimezone, error });
  }

  const handleEditClick = () => onEdit?.(measurement);
  const handleSaveEditClick = () => onSaveEdit?.(measurement);
  const handleCancelEditClick = () => onCancelEdit?.();
  const handleSettingsClick = () => onNavigateToVariableSettings?.(measurement);

  const [localInputValue, setLocalInputValue] = useState<string>(() => (measurement.value != null ? measurement.value.toString() : ""));
  const [selectedRating, setSelectedRating] = useState<number | null>(() => (measurement.value != null ? measurement.value : null));

  useEffect(() => {
    setLocalInputValue(measurement.value != null ? measurement.value.toString() : "");
    setSelectedRating(measurement.value != null ? measurement.value : null);
  }, [measurement.value]);

  const inputType = getVariableInputType({ unitId: measurement.unitId, variableCategory: measurement.variableCategoryId });
  const ratingRange = getRatingRange(inputType);

  const handleSubmitValue = (value: number) => {
    if (onUpdateMeasurement) {
      onUpdateMeasurement(measurement, value);
    } else {
      logger.warn("MeasurementCard: handleSubmitValue called but onUpdateMeasurement is not provided.");
    }
    setSelectedRating(value);
  };

  const renderActionButtons = () => {
    if (isEditing) return null;
    const actionButtonText = 'Update';

    if (inputType === "boolean_yes_no") {
      return (
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleSubmitValue(1)} >Yes</Button>
          <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleSubmitValue(0)} >No</Button>
        </div>
      );
    }
    if (ratingRange) {
      return (
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {Array.from({ length: ratingRange[1] - ratingRange[0] + 1 }, (_, i) => ratingRange[0] + i).map((r) => (
              <Button
                key={r}
                variant={r === selectedRating ? "default" : "outline"}
                size="sm"
                className="h-7 w-7 p-0 text-xs font-medium"
                onClick={() => handleSubmitValue(r)}
                aria-label={`Rate ${r}`}
              >
                {inputType === "rating_1_5" && ratingFaces[r] ? ratingFaces[r] : r}
              </Button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="flex gap-2 items-center pt-1">
        <Input
          type="number"
          placeholder={`${measurement.unitName || measurement.unit}`}
          value={localInputValue}
          onChange={(e) => setLocalInputValue(e.target.value)}
          className="h-7 text-xs flex-grow max-w-[150px]"
        />
        <span className="text-xs text-muted-foreground self-center ml-2">{measurement.unitName || measurement.unit}</span>
        <Button
          variant="outline"
          size="sm"
          className="h-7"
          onClick={() => {
            const v = parseFloat(localInputValue);
            if (!isNaN(v)) {
              handleSubmitValue(v);
            }
          }}
          disabled={!localInputValue || isNaN(parseFloat(localInputValue))}
        >
          {actionButtonText}
        </Button>
      </div>
    );
  };

  const menuProps = { measurement, isEditing, handleEditClick, handleSettingsClick };

  return (
    <div className="border-b">
      <div className="flex flex-col md:flex-row p-4 gap-4 items-start">
        <div className="flex items-start gap-3 w-full md:w-auto flex-shrink-0">
          <div className={cn("relative flex items-center justify-center rounded-full mr-0", "w-10 h-10", "bg-background")}>{getTypeIcon(measurement.variableCategoryId, measurement.emoji)}</div>
          <div className="flex-1 flex justify-between items-start">
            <div>
              <div className="font-medium text-sm">{measurement.name}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {displayTime}
              </div>
            </div>
            <div className="md:hidden">{renderMenuContent(menuProps)}</div>
          </div>
        </div>
        <div className="w-full md:flex-1 flex flex-col">
           <div className="hidden md:flex self-end space-x-1 mb-2">{renderMenuContent(menuProps)}</div>
           <div className="mt-2 md:mt-0">
             <div className="mt-1 text-xs">{renderValueDisplay(measurement)}</div>
             {measurement.notes && (<div className="text-xs mt-1 italic text-muted-foreground md:hidden">{measurement.notes}</div>)}
             {isEditing ? (
               <div className="mt-3 space-y-3 p-3 rounded-md border border-dashed md:mt-0">
                 <div className="flex items-center space-x-2">
                   <Input type="number" value={editValue ?? localInputValue ?? ""} onChange={(e) => setLocalInputValue(e.target.value)} className="w-20 h-8 text-sm" />
                   <Select value={editUnit || measurement.unitId} onValueChange={() => { }}>
                     <SelectTrigger className="w-32 h-8 text-sm">
                       <SelectValue placeholder="Unit" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value={measurement.unitId}>{measurement.unitName || measurement.unit}</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Input placeholder="Notes (optional)" value={editNotes || measurement.notes || ""} onChange={() => { /* Call prop if notes change is part of edit */}} className="w-full h-8 text-sm" />
                 </div>
                 <div className="flex justify-end space-x-2">
                   <Button size="sm" className="h-8" onClick={handleSaveEditClick} disabled={editValue === null || !editUnit}>
                     Save Changes
                   </Button>
                   <Button variant="outline" size="sm" className="h-8" onClick={handleCancelEditClick}>
                     Cancel
                   </Button>
                 </div>
               </div>
             ) : (
               <div className="mt-2 md:mt-0">{renderActionButtons()}</div>
             )}
           </div>
         </div>
      </div>
    </div>
  )
}

const renderMenuContent = (props: {
    measurement: MeasurementCardData;
    isEditing: boolean;
    handleEditClick: () => void;
    handleSettingsClick: () => void;
  }) => {
    const { measurement, isEditing, handleEditClick, handleSettingsClick } = props;
    return (
        <div className="flex space-x-1">
          {(measurement.isEditable ?? true) && (
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-7 w-7">
                   <MoreHorizontal className="h-3.5 w-3.5" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={handleEditClick} disabled={!measurement.isEditable || isEditing}>
                   <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                 </DropdownMenuItem>
                 {measurement.userVariableId && (
                   <DropdownMenuItem onClick={handleSettingsClick}>
                     <Settings className="mr-2 h-3.5 w-3.5" /> Manage Variable
                   </DropdownMenuItem>
                 )}
               </DropdownMenuContent>
             </DropdownMenu>
          )}
        </div>
    );
}; 