'use client'

import { useState, useEffect, useCallback } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

import { getFormDefinition, submitFormAnswers, FormDefinition } from '@/lib/actions/form-actions'
import { createBrowserClient } from '@/lib/supabase/client'
import { Database, Tables, Enums } from '@/lib/database.types'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FileUploadComponent } from "@/components/core/file-upload"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { logger } from '@/lib/logger'

// Re-use options types from create-form-wizard or define/import centrally
interface ChoiceOption {
  value: string;
  label: string;
}
type TextQuestionOptions = { multiline?: boolean; placeholder?: string };
type ChoiceBasedQuestionOptions = { choices: ChoiceOption[]; allowMultiple?: boolean };
type ScaleQuestionOptions = { min: number; max: number; step?: number; minLabel?: string; maxLabel?: string };
type DateQuestionOptions = {};
type FileUploadQuestionOptions = { allowMultiple?: boolean };
type FormQuestionOptions =
  | TextQuestionOptions | ChoiceBasedQuestionOptions | ScaleQuestionOptions
  | DateQuestionOptions | FileUploadQuestionOptions;

type FormQuestionFE = Tables<'form_questions'> & {
  options: FormQuestionOptions | null;
};

interface FormAnsweringComponentProps {
  formId: string;
  onSubmissionComplete?: () => void; // Optional callback after successful submission
}

export function FormAnsweringComponent({ formId, onSubmissionComplete }: FormAnsweringComponentProps) {
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createBrowserClient();

  // Generate validation schema and default values based on formDefinition
  const { schema, defaultValues } = useMemo(() => {
    if (!formDefinition) return { schema: z.object({}), defaultValues: {} };

    const shape: { [key: string]: z.ZodTypeAny } = {};
    const defaults: { [key: string]: any } = {};

    formDefinition.form_questions.forEach((q) => {
      const questionId = q.id;
      let fieldSchema: z.ZodTypeAny;

      switch (q.type) {
        case 'text':
          fieldSchema = z.string();
          if (!q.is_required) fieldSchema = fieldSchema.optional().nullable();
          else fieldSchema = fieldSchema.min(1, { message: "This field is required" });
          defaults[questionId] = '';
          break;
        case 'multiple-choice':
        case 'dropdown':
          fieldSchema = z.string();
          if (!q.is_required) fieldSchema = fieldSchema.optional().nullable();
          else fieldSchema = fieldSchema.min(1, { message: "Please select an option" });
          defaults[questionId] = undefined;
          break;
        case 'checkbox':
          // Represent checkboxes as an array of selected string values
          fieldSchema = z.array(z.string());
          if (q.is_required) fieldSchema = fieldSchema.min(1, { message: "Please select at least one option" });
          else fieldSchema = fieldSchema.optional();
          defaults[questionId] = [];
          break;
        case 'scale':
          // Store scale as a number
          fieldSchema = z.number();
          const scaleOpts = q.options as ScaleQuestionOptions | null;
          if (scaleOpts) {
             fieldSchema = fieldSchema.min(scaleOpts.min).max(scaleOpts.max);
          }
          if (!q.is_required) fieldSchema = fieldSchema.optional().nullable();
          // Default value might be tricky, leave undefined or set to min?
          defaults[questionId] = undefined; 
          break;
        case 'date':
          fieldSchema = z.date();
          if (!q.is_required) fieldSchema = fieldSchema.optional().nullable();
          defaults[questionId] = undefined;
          break;
        case 'file_upload':
          // Store file upload as the ID (string/UUID) of the uploaded_files record
          const fileOpts = q.options as FileUploadQuestionOptions | null;
          if (fileOpts?.allowMultiple) {
             fieldSchema = z.array(z.string().uuid()).optional(); // Array of UUIDs
              if (q.is_required) fieldSchema = fieldSchema.min(1, { message: "Please upload at least one file" });
          } else {
             fieldSchema = z.string().uuid(); // Single UUID
             if (!q.is_required) fieldSchema = fieldSchema.optional().nullable();
             else fieldSchema = fieldSchema.refine(val => !!val, { message: "File upload is required" });
          }
          defaults[questionId] = fileOpts?.allowMultiple ? [] : undefined;
          break;
        default:
          // Fallback for unknown types - treat as optional string
          fieldSchema = z.string().optional().nullable();
          defaults[questionId] = undefined;
      }
      shape[questionId] = fieldSchema;
    });

    return { schema: z.object(shape), defaultValues: defaults };
  }, [formDefinition]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange", // Or "onBlur" or "onSubmit"
  });

  // Fetch user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
         setError("Could not identify user. Please login again.");
         logger.error('FormAnsweringComponent: User not found');
      }
    };
    getUser();
  }, [supabase]);

  // Fetch form definition
  useEffect(() => {
    if (!formId) {
      setError("No Form ID provided.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getFormDefinition(formId)
      .then(data => {
        if (data) {
          setFormDefinition(data);
          setError(null);
           // Reset form with potentially new default values when definition loads
          form.reset(defaultValues);
        } else {
          setError("Form not found or access denied.");
          logger.warn('Form definition fetch returned null', { formId });
        }
      })
      .catch(err => {
        setError("Failed to load form definition.");
        logger.error('Error fetching form definition', { formId, error: err });
      })
      .finally(() => setIsLoading(false));
  }, [formId, form, defaultValues]); // Add form and defaultValues to dependency array

  const handleFileUploadComplete = useCallback((questionId: string, uploadedFileId: string) => {
    // For single file upload, set the value
    // For multiple, need to append to array (requires different state handling)
    form.setValue(questionId, uploadedFileId, { shouldValidate: true, shouldDirty: true });
    logger.info('File upload completed for question', { questionId, uploadedFileId });
  }, [form]);


  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    logger.info('Form submission started', { formId });
    // console.log("Form Data:", data);

    const success = await submitFormAnswers(formId, data);
    
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Success", description: "Form submitted successfully." });
      logger.info('Form submission successful', { formId });
      form.reset(); // Reset form after successful submission
      onSubmissionComplete?.(); // Call optional callback
    } else {
      toast({ title: "Error", description: "Failed to submit form. Please try again.", variant: "destructive" });
      logger.error('Form submission failed', { formId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Form...</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!formDefinition) {
    // This case should theoretically be covered by error state, but added for safety
    return <Card><CardContent><p>Form could not be loaded.</p></CardContent></Card>;
  }

  // Helper to render the correct input based on question type
  const renderQuestionInput = (question: FormQuestionFE) => {
    const questionId = question.id;
    const opts = question.options;
    const fieldError = form.formState.errors[questionId];

    switch (question.type) {
      case 'text':
        const textOpts = opts as TextQuestionOptions | null;
        return (
          <Controller
            name={questionId}
            control={form.control}
            render={({ field }) => (
              textOpts?.multiline
                ? <Textarea {...field} placeholder={textOpts.placeholder} rows={4} />
                : <Input {...field} placeholder={textOpts?.placeholder} />
            )}
          />
        );

      case 'multiple-choice':
        const mcOpts = opts as ChoiceBasedQuestionOptions | null;
        return (
          <Controller
            name={questionId}
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="space-y-2"
              >
                {(mcOpts?.choices || []).map((choice) => (
                  <div key={choice.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={choice.value} id={`${questionId}-${choice.value}`} />
                    <Label htmlFor={`${questionId}-${choice.value}`} className="font-normal">
                      {choice.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        );
        
       case 'checkbox':
          const cbOpts = opts as ChoiceBasedQuestionOptions | null;
          return (
             <div className="space-y-2">
               {(cbOpts?.choices || []).map((choice) => (
                  <Controller
                     key={choice.value}
                     name={questionId}
                     control={form.control}
                     render={({ field }) => {
                        const currentValues = Array.isArray(field.value) ? field.value : [];
                        return (
                           <div className="flex items-center space-x-2">
                              <Checkbox
                                 id={`${questionId}-${choice.value}`}
                                 checked={currentValues.includes(choice.value)}
                                 onCheckedChange={(checked) => {
                                    if (checked) {
                                       field.onChange([...currentValues, choice.value]);
                                    } else {
                                       field.onChange(currentValues.filter(v => v !== choice.value));
                                    }
                                 }}
                              />
                              <Label htmlFor={`${questionId}-${choice.value}`} className="font-normal">
                                 {choice.label}
                              </Label>
                           </div>
                        );
                     }}
                  />
               ))}
            </div>
          );

      case 'dropdown':
          const ddOpts = opts as ChoiceBasedQuestionOptions | null;
          return (
             <Controller
                name={questionId}
                control={form.control}
                render={({ field }) => (
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                         <SelectValue placeholder={`Select ${question.question_text}...`} />
                      </SelectTrigger>
                      <SelectContent>
                         {(ddOpts?.choices || []).map((choice) => (
                            <SelectItem key={choice.value} value={choice.value}>{choice.label}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                )}
             />
          );
          
      case 'scale':
        const scaleOpts = opts as ScaleQuestionOptions | null;
        const min = scaleOpts?.min ?? 0;
        const max = scaleOpts?.max ?? 5;
        // Simple radio button implementation for scale for now
        return (
           <Controller
             name={questionId}
             control={form.control}
             render={({ field }) => (
                <RadioGroup
                  onValueChange={(val) => field.onChange(parseInt(val, 10))} // Store as number
                  defaultValue={field.value?.toString()} // Convert number back to string for RadioGroup value
                  className="flex flex-wrap gap-x-4 gap-y-2"
                >
                   {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((val) => (
                      <div key={val} className="flex items-center space-x-2">
                         <RadioGroupItem value={val.toString()} id={`${questionId}-${val}`} />
                         <Label htmlFor={`${questionId}-${val}`} className="font-normal">
                           {val}
                         </Label>
                      </div>
                   ))}
                </RadioGroup>
             )}
           />
        );

      case 'date':
        return (
          <Controller
            name={questionId}
            control={form.control}
            render={({ field }) => (
               <Popover>
                  <PopoverTrigger asChild>
                     <Button
                        variant={"outline"}
                        className={cn(
                           "w-[280px] justify-start text-left font-normal",
                           !field.value && "text-muted-foreground"
                        )}
                     >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                     </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                     <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                     />
                  </PopoverContent>
               </Popover>
            )}
          />
        );

      case 'file_upload':
         const fileOpts = opts as FileUploadQuestionOptions | null;
         if (!userId) {
            return <p className="text-destructive">Error: User ID not available for upload.</p>;
         }
         // TODO: Handle multiple file uploads if fileOpts.allowMultiple is true
         return (
            <Controller
               name={questionId}
               control={form.control}
               render={({ field }) => (
                  // Pass questionId to the callback
                  <FileUploadComponent 
                     userId={userId} 
                     onUploadComplete={(uploadedId) => handleFileUploadComplete(questionId, uploadedId)} 
                  />
                  // TODO: Display uploaded file info if field.value (uploadedFileId) exists?
               )}
            />
         );

      default:
        return <p className="text-muted-foreground">Unsupported question type: {question.type}</p>;
    }
  };

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>{formDefinition.title}</CardTitle>
          {formDefinition.description && (
            <CardDescription>{formDefinition.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {formDefinition.form_questions.map((question) => (
            <div key={question.id} className="space-y-2 pb-4 border-b last:border-b-0">
              <Label htmlFor={question.id} className="font-semibold">
                {question.question_text}
                {question.is_required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {question.description && (
                <p className="text-sm text-muted-foreground pb-1">{question.description}</p>
              )}
              {renderQuestionInput(question)}
              {form.formState.errors[question.id] && (
                  <p className="text-sm font-medium text-destructive pt-1">
                      {form.formState.errors[question.id]?.message?.toString()}
                  </p>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit Answers"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 