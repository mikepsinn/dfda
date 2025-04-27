import { getDailyTimelineItemsAction } from "@/lib/actions/timeline";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Check, X, Edit, Undo } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// TODO: Create client components for interaction (MarkTakenButton, SkipButton, UndoButton, EditMeasurementButton)

interface ScheduleTimelineProps {
  userId: string;
  userVariableIds: string[];
  targetDate: string; // YYYY-MM-DD
}

// Helper function to format time
const formatTime = (isoString: string) => {
    try {
        return format(new Date(isoString), 'hh:mm a');
    } catch {
        logger.warn("formatTime: Invalid date string", { isoString });
        return "Invalid Time";
    }
};

export async function ScheduleTimeline({ userId, userVariableIds, targetDate }: ScheduleTimelineProps) {
  
  const { data: timelineItems, error, success } = await getDailyTimelineItemsAction(userId, userVariableIds, targetDate);

  if (!success || error) {
    logger.error("ScheduleTimeline: Failed to load timeline items", { userId, userVariableIds, targetDate, error });
    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Timeline</AlertTitle>
                    <AlertDescription>
                        There was an error loading the timeline data for this day. {error}
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  if (!timelineItems || timelineItems.length === 0) {
     return (
        <Card>
            <CardHeader>
                 {/* TODO: Add Date Navigation Header Here */}
                <CardTitle>Daily Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">No measurements or scheduled reminders for this day.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
             {/* TODO: Add Date Navigation Header Here */}
            <CardTitle>Daily Timeline</CardTitle>
             {/* Display formatted targetDate? */}
        </CardHeader>
        <CardContent>
            <ul className="space-y-4">
                {timelineItems.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="relative flex gap-x-4">
                        {/* Vertical Line */}
                        <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                            <div className="w-px bg-muted-foreground/20"></div>
                        </div>

                        {/* Icon */}
                        <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-background">
                           <div className="h-4 w-4 text-muted-foreground" >{item.variableEmoji || ' B ' }</div> {/* Placeholder for emoji */} 
                        </div>

                        {/* Content */}
                        <div className="flex-auto py-0.5 text-sm leading-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-medium mr-2">{item.variableName}</span>
                                     <span className="text-muted-foreground">{formatTime(item.timestamp)}</span>
                                    {item.type === 'measurement' && (
                                        <p>
                                            Value: <span className="font-semibold">{item.measurementValue} {item.unitName}</span>
                                            {item.measurementNotes && <span className="italic text-muted-foreground"> - {item.measurementNotes}</span>}
                                        </p>
                                    )}
                                    {item.type === 'reminder' && item.status !== 'pending' && (
                                         <Badge variant={item.status === 'completed' ? 'success' : item.status === 'skipped' ? 'secondary' : 'outline'} className="ml-2 capitalize">{item.status}</Badge>
                                    )}
                                     {item.type === 'reminder' && item.status === 'pending' && (
                                         <Badge variant="outline" className="ml-2 capitalize text-blue-600 border-blue-600">Pending</Badge>
                                    )}
                                </div>
                                {/* Action Buttons */} 
                                <div className="flex items-center space-x-1">
                                   {item.type === 'measurement' && item.status === 'recorded' && (
                                        <>
                                             {/* TODO: Edit Measurement Button - Needs Client Component */}
                                            <Button variant="ghost" size="icon" title="Edit measurement"><Edit className="h-4 w-4" /></Button>
                                            {/* TODO: Delete Measurement Button? */}
                                        </>
                                   )}
                                   {item.type === 'reminder' && (item.status === 'completed' || item.status === 'skipped') && (
                                       <>
                                           {/* TODO: Undo Button - Needs Client Component */}
                                            <Button variant="ghost" size="sm" title="Undo status"><Undo className="h-4 w-4 mr-1"/> Undo</Button>
                                       </>
                                   )}
                                   {/* Buttons for Pending Reminders will be handled by client components */} 
                                </div>
                            </div>
                            {item.type === 'reminder' && item.status === 'pending' && (
                                <div className="mt-2 flex space-x-2">
                                    {/* TODO: Replace with actual Client Components calling actions */}
                                    <Button size="sm" variant="secondary" title="Mark as taken"><Check className="h-4 w-4 mr-1" /> Taken</Button>
                                    <Button size="sm" variant="secondary" title="Mark as skipped"><X className="h-4 w-4 mr-1"/> Skipped</Button>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
  );
} 