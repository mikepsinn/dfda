"use client"; // Likely needs client interaction for add/edit

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MeasurementWithUnits } from "@/lib/actions/measurements";
import { useState } from "react";
import { PlusCircle, Edit } from "lucide-react";
import { logger } from "@/lib/logger";
import { format } from 'date-fns'; // For formatting dates

// TODO: Define Measurement Form Component
// import { MeasurementForm } from './MeasurementForm'; 

interface MeasurementTimelineProps {
  measurements: MeasurementWithUnits[];
  userVariableId: string;
  variableName: string;
  defaultUnit?: string | null; // Pass unit for display
}

export function MeasurementTimeline({ 
    measurements, 
    userVariableId, 
    variableName, 
    defaultUnit 
}: MeasurementTimelineProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementWithUnits | null>(null);

  const handleAddMeasurement = () => {
    logger.info("MeasurementTimeline: Add button clicked", { userVariableId });
    setEditingMeasurement(null); // Ensure not editing when adding
    setIsAdding(true);
    // TODO: Open a modal or inline form
  };

  const handleEditMeasurement = (measurement: MeasurementWithUnits) => {
     logger.info("MeasurementTimeline: Edit button clicked", { measurementId: measurement.id });
    setIsAdding(false); // Ensure not adding when editing
    setEditingMeasurement(measurement);
    // TODO: Open a modal or inline form with measurement data
  };

  const handleCloseForm = () => {
    setIsAdding(false);
    setEditingMeasurement(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
              <CardTitle>Measurement History</CardTitle>
              <CardDescription>Your recorded {variableName} data.</CardDescription>
          </div>
          <Button size="sm" onClick={handleAddMeasurement}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Measurement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Measurement Form Modal/Inline */} 
        {isAdding && (
            <div className="p-4 border rounded-md bg-muted mb-4">
                <p>Add Measurement Form Placeholder (for {variableName})</p>
                <Button variant="outline" size="sm" onClick={handleCloseForm} className="mt-2">Cancel</Button>
                {/* <MeasurementForm userVariableId={userVariableId} onClose={handleCloseForm} /> */} 
            </div>
        )}
         {editingMeasurement && (
            <div className="p-4 border rounded-md bg-muted mb-4">
                <p>Edit Measurement Form Placeholder (ID: {editingMeasurement.id})</p>
                <Button variant="outline" size="sm" onClick={handleCloseForm} className="mt-2">Cancel</Button>
                 {/* <MeasurementForm measurement={editingMeasurement} userVariableId={userVariableId} onClose={handleCloseForm} /> */}
            </div>
        )}

        {measurements.length === 0 && !isAdding && !editingMeasurement ? (
          <p className="text-sm text-muted-foreground">No measurements recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {measurements.map((m) => (
              <li key={m.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="font-medium">{m.value}</span>
                  <span className="text-xs text-muted-foreground ml-1">{m.units?.abbreviated_name || defaultUnit || ''}</span>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(m.start_at), 'PPpp')} 
                    {m.end_at && ` - ${format(new Date(m.end_at), 'pp')}`}
                  </p>
                   {m.notes && <p className="text-sm mt-1 italic">{m.notes}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEditMeasurement(m)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 