"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Check,
  ClipboardList,
  PlusCircle,
  Trash2,
  Settings,
  Eye,
  Grip,
  Edit,
  UploadCloud,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// --- Import Database Types ---
import { Database, Tables, Enums } from "@/lib/database.types";

// --- Define specific option types expected within the JSONB --- 
interface ChoiceOption {
  value: string; // Consider if value should be distinct from label later
  label: string;
}

type TextQuestionOptions = {
  multiline?: boolean;
  placeholder?: string;
};

type ChoiceBasedQuestionOptions = {
  choices: ChoiceOption[];
  allowMultiple?: boolean; // Differentiates checkbox from radio/dropdown
};

type ScaleQuestionOptions = {
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
};

type DateQuestionOptions = {
  // Future options: date range limits, etc.
};

type FileUploadQuestionOptions = {
  allowMultiple?: boolean;
  // Future options: allowedTypes, maxSizeMB etc.
};

// Combine specific options into a union type
type FormQuestionOptions = 
  | TextQuestionOptions 
  | ChoiceBasedQuestionOptions 
  | ScaleQuestionOptions 
  | DateQuestionOptions
  | FileUploadQuestionOptions;

// --- Define the Frontend Form Question Type ---
// Use DB Row type but override options and handle temporary IDs
type FormQuestionFE = Omit<Tables<'form_questions'>, 'id' | 'options' | 'created_at' | 'updated_at' | 'form_id'> & {
  id: string | number; // Use UUID string from DB or temporary number for new questions
  options: FormQuestionOptions | null; // Use our specific options union
};

type FormQuestionType = Enums<'form_question_type'>;

export function CreateFormWizard() {
  const [formTitle, setFormTitle] = useState("Alzheimer's Disease Assessment Scale-Cognitive Subscale (ADAS-Cog)")
  const [formDescription, setFormDescription] = useState(
    "A comprehensive assessment tool for evaluating cognitive impairment in Alzheimer's disease patients.",
  )
  const [activeTab, setActiveTab] = useState("design")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [questions, setQuestions] = useState<FormQuestionFE[]>([
    // Initial state adapted to new types/field names
    {
      id: 1, // Temp ID
      type: "scale",
      order: 1,
      question_text: "Word Recall Task",
      description: "Ability to remember a list of 10 words after three trials",
      is_required: true,
      options: {
        min: 0,
        max: 10,
        step: 1,
        minLabel: "No words recalled",
        maxLabel: "All words recalled",
      } as ScaleQuestionOptions,
    },
    {
      id: 2,
      type: "multiple-choice",
      order: 2,
      question_text: "Naming Objects and Fingers",
      description: "Ability to name objects and fingers when prompted",
      is_required: true,
      options: {
        choices: [
          { value: "0", label: "0 - No impairment" },
          { value: "1", label: "1 - Very mild impairment" },
          { value: "2", label: "2 - Mild impairment" },
          { value: "3", label: "3 - Moderate impairment" },
          { value: "4", label: "4 - Moderately severe impairment" },
          { value: "5", label: "5 - Severe impairment" },
        ],
        allowMultiple: false,
      } as ChoiceBasedQuestionOptions,
    },
    {
      id: 3,
      type: "multiple-choice",
      order: 3,
      question_text: "Commands",
      description: "Ability to follow simple commands",
      is_required: true,
      options: {
        choices: [
          { value: "0", label: "0 - No impairment" },
          { value: "1", label: "1 - Very mild impairment" },
          { value: "2", label: "2 - Mild impairment" },
          { value: "3", label: "3 - Moderate impairment" },
          { value: "4", label: "4 - Moderately severe impairment" },
          { value: "5", label: "5 - Severe impairment" },
        ],
        allowMultiple: false,
      } as ChoiceBasedQuestionOptions,
    },
    {
      id: 4,
      type: "multiple-choice",
      order: 4,
      question_text: "Constructional Praxis",
      description: "Ability to copy geometric forms",
      is_required: true,
      options: {
        choices: [
          { value: "0", label: "0 - No impairment" },
          { value: "1", label: "1 - Very mild impairment" },
          { value: "2", label: "2 - Mild impairment" },
          { value: "3", label: "3 - Moderate impairment" },
          { value: "4", label: "4 - Moderately severe impairment" },
          { value: "5", label: "5 - Severe impairment" },
        ],
        allowMultiple: false,
      } as ChoiceBasedQuestionOptions,
    },
    {
      id: 5,
      type: "text",
      order: 5,
      question_text: "Clinician Observations",
      description: "Additional observations about patient's cognitive state",
      is_required: false,
      options: {
        multiline: true,
        placeholder: "Enter any additional observations here...",
      } as TextQuestionOptions,
    },
    {
        id: 6,
        type: "file_upload",
        order: 6,
        question_text: "Upload recent Lab Report (PDF)",
        description: "Please upload your latest blood test results.",
        is_required: false,
        options: {
            allowMultiple: false,
        } as FileUploadQuestionOptions
    }
  ])

  const addQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map((q) => typeof q.id === 'number' ? q.id : 0)) + 1 : 1;
    const newOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.order)) + 1 : 1;
    setQuestions([
      ...questions,
      {
        id: newId,
        type: "text", 
        order: newOrder,
        question_text: "New Question",
        description: "",
        is_required: false,
        options: {
          multiline: false,
          placeholder: "",
        } as TextQuestionOptions,
      } as FormQuestionFE,
    ])
  }

  const removeQuestion = (id: string | number) => {
    setQuestions(questions.filter((q) => q.id !== id))
    // TODO: Re-order questions sequentially after removal?
  }

  const updateQuestion = (id: string | number, updates: Partial<FormQuestionFE>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  // Function to update nested options 
  const updateQuestionOptions = (id: string | number, optionUpdates: Partial<FormQuestionOptions>) => {
    setQuestions(questions.map((q) => {
      if (q.id !== id) return q;
      // Ensure options is not null before spreading
      const currentOptions = q.options || {}; 
      return { ...q, options: { ...currentOptions, ...optionUpdates } };
    }))
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    // TODO: Prepare data for API: Convert temp IDs, structure options for JSONB
    console.log("Submitting form:", { title: formTitle, description: formDescription, questions });
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  // Helper function to render question preview
  const renderQuestionPreview = (question: FormQuestionFE) => {
    switch (question.type) {
      case "text":
        const textOptions = question.options as TextQuestionOptions | null;
        return (
          <div className="space-y-2">
            <Label>{question.question_text}{question.is_required && " *"}</Label>
            {textOptions?.multiline ? (
              <Textarea placeholder={textOptions?.placeholder || "Enter your answer..."} disabled rows={3} />
            ) : (
              <Input placeholder={textOptions?.placeholder || "Enter your answer..."} disabled />
            )}
            {question.description && <p className="text-xs text-muted-foreground pt-1">{question.description}</p>}
          </div>
        )
      case "multiple-choice":
      case "checkbox": // Checkbox and Dropdown use ChoiceBased options too
      case "dropdown":
        const mcOptions = question.options as ChoiceBasedQuestionOptions | null;
        const isMultiple = question.type === 'checkbox'; // Or check mcOptions.allowMultiple which should align
        return (
          <div className="space-y-2">
            <Label>{question.question_text}{question.is_required && " *"}</Label>
            <div className="space-y-2 pt-1">
              {(mcOptions?.choices || []).map((choice, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {isMultiple ? (
                    <input type="checkbox" disabled className="form-checkbox h-4 w-4"/>
                  ) : (
                    <input type="radio" name={`preview-question-${question.id}`} disabled className="form-radio h-4 w-4"/>
                  )}
                  <Label className="font-normal">{choice.label}</Label>
                </div>
              ))}
            </div>
            {question.description && <p className="text-xs text-muted-foreground pt-1">{question.description}</p>}
          </div>
        )
      case "scale":
        const scaleOptions = question.options as ScaleQuestionOptions | null;
        return (
          <div className="space-y-2">
            <Label>{question.question_text}{question.is_required && " *"}</Label>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-sm">
                <span>{scaleOptions?.minLabel || (scaleOptions?.min ?? 0)}</span>
                <span>{scaleOptions?.maxLabel || (scaleOptions?.max ?? 10)}</span>
              </div>
              <input
                type="range"
                min={scaleOptions?.min ?? 0}
                max={scaleOptions?.max ?? 10}
                step={scaleOptions?.step || 1}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                disabled
              />
            </div>
            {question.description && <p className="text-xs text-muted-foreground pt-1">{question.description}</p>}
          </div>
        )
      case 'file_upload': 
        const fileOptions = question.options as FileUploadQuestionOptions | null;
        return (
          <div className="space-y-2">
            <Label>{question.question_text}{question.is_required && " *"}</Label>
            {question.description && <p className="text-xs text-muted-foreground pt-1 pb-2">{question.description}</p>}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-muted-foreground/50">
                <UploadCloud className="h-10 w-10 mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground/80">
                  {fileOptions?.allowMultiple ? 'File upload area for multiple files' : 'File upload area'}
                </p>
            </div>
          </div>
        )
      // TODO: Add case for 'date'
      default:
        return (
          <div className="space-y-2">
            <Label>{question.question_text}{question.is_required && " *"}</Label>
            <Input placeholder={`Answer for ${question.type}...`} disabled />
            {question.description && <p className="text-xs text-muted-foreground pt-1">{question.description}</p>}
          </div>
        )
    }
  }

  // Helper function to render question editor controls
  const renderQuestionEditor = (question: FormQuestionFE) => {
    const questionId = question.id;
    const questionOptions = question.options;

    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Grip className="h-5 w-5 text-muted-foreground cursor-move" /> {/* TODO: Implement drag & drop reordering */} 
            <Select 
              value={question.type} 
              onValueChange={(value: FormQuestionType) => {
                  let defaultOptions: FormQuestionOptions | null = {};
                  switch(value) {
                    case 'text': 
                      defaultOptions = { multiline: false, placeholder: '' } as TextQuestionOptions;
                      break;
                    case 'multiple-choice':
                    case 'checkbox':
                    case 'dropdown':
                      defaultOptions = { choices: [{value: 'option1', label: 'Option 1'}], allowMultiple: value === 'checkbox' } as ChoiceBasedQuestionOptions;
                      break;
                    case 'scale':
                      defaultOptions = { min: 0, max: 5 } as ScaleQuestionOptions;
                      break;
                    case 'file_upload':
                      defaultOptions = { allowMultiple: false } as FileUploadQuestionOptions;
                      break;
                    case 'date':
                       defaultOptions = {} as DateQuestionOptions; // No specific options yet
                       break;
                    default: 
                       defaultOptions = null; // Or empty object?
                  }
                  updateQuestion(questionId, { type: value, options: defaultOptions });
              }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Question Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="checkbox">Checkboxes</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="file_upload">File Upload</SelectItem> 
              </SelectContent>
            </Select>
            <div className="flex-1"></div> { /* Spacer */}
            <Button variant="ghost" size="icon" onClick={() => removeQuestion(questionId)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor={`q-text-${questionId}`}>Question Text</Label>
              <Input
                id={`q-text-${questionId}`}
                value={question.question_text}
                onChange={(e) => updateQuestion(questionId, { question_text: e.target.value })}
                placeholder="Enter the question text"
              />
            </div>
            <div>
              <Label htmlFor={`q-desc-${questionId}`}>Description / Helper Text (Optional)</Label>
              <Textarea
                id={`q-desc-${questionId}`}
                value={question.description || ""}
                onChange={(e) => updateQuestion(questionId, { description: e.target.value })}
                placeholder="Enter description or instructions"
                rows={2}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id={`q-required-${questionId}`}
              checked={question.is_required}
              onCheckedChange={(checked) => updateQuestion(questionId, { is_required: checked })}
            />
            <Label htmlFor={`q-required-${questionId}`}>Required</Label>
          </div>

          {/* --- Options specific to question type --- */}
          {question.type === "text" && questionOptions && 'multiline' in questionOptions && (
            <div className="border-t pt-4 mt-4 space-y-2">
              <h4 className="font-medium text-sm">Text Options</h4>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`q-multiline-${questionId}`}
                  checked={(questionOptions as TextQuestionOptions).multiline}
                  onCheckedChange={(checked) => updateQuestionOptions(questionId, { multiline: checked })}
                />
                <Label htmlFor={`q-multiline-${questionId}`}>Allow multiple lines (Textarea)</Label>
              </div>
               <div>
                <Label htmlFor={`q-placeholder-${questionId}`}>Placeholder Text</Label>
                <Input
                  id={`q-placeholder-${questionId}`}
                  value={(questionOptions as TextQuestionOptions).placeholder || ""}
                  onChange={(e) => updateQuestionOptions(questionId, { placeholder: e.target.value })}
                  placeholder="Optional placeholder text"
                />
              </div>
            </div>
          )}

          {(question.type === "multiple-choice" || question.type === "checkbox" || question.type === "dropdown") && 
           questionOptions && 'choices' in questionOptions && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <h4 className="font-medium text-sm">Choice Options</h4>
              {(questionOptions as ChoiceBasedQuestionOptions).choices.map((choice, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={choice.label}
                    onChange={(e) => {
                      const currentChoices = (questionOptions as ChoiceBasedQuestionOptions).choices;
                      const newChoices = [...currentChoices];
                      // Keep value same as label for simplicity for now 
                      newChoices[index] = { ...newChoices[index], label: e.target.value, value: e.target.value }; 
                      updateQuestionOptions(questionId, { choices: newChoices });
                    }}
                    placeholder={`Choice ${index + 1}`}
                    className="flex-grow"
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                     const currentChoices = (questionOptions as ChoiceBasedQuestionOptions).choices;
                     const newChoices = currentChoices.filter((_, i) => i !== index);
                     updateQuestionOptions(questionId, { choices: newChoices });
                  }} className="shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => {
                 const currentChoices = (questionOptions as ChoiceBasedQuestionOptions).choices;
                 const newChoices = [...currentChoices, { value: `New Choice ${Date.now()}`, label: "New Choice" } ]
                 updateQuestionOptions(questionId, { choices: newChoices });
              }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Choice
              </Button>
               {/* Allow multiple switch only relevant for Checkbox type, but logic is coupled now */}
               {question.type === 'checkbox' && (
                 <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id={`q-allowMultiple-${questionId}`}
                    checked={(questionOptions as ChoiceBasedQuestionOptions).allowMultiple}
                    onCheckedChange={(checked) => updateQuestionOptions(questionId, { allowMultiple: checked })}
                    disabled // Should always be true for checkbox type?
                  />
                  <Label htmlFor={`q-allowMultiple-${questionId}`}>Allow multiple selections</Label>
                 </div>
               )}
            </div>
          )}

          {question.type === "scale" && questionOptions && 'min' in questionOptions && (
             <div className="border-t pt-4 mt-4 space-y-4">
               <h4 className="font-medium text-sm">Scale Options</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`q-scale-min-${questionId}`}>Min Value</Label>
                    <Input type="number" id={`q-scale-min-${questionId}`} value={(questionOptions as ScaleQuestionOptions).min} onChange={(e) => updateQuestionOptions(questionId, { min: parseInt(e.target.value, 10) || 0 })} />
                  </div>
                   <div>
                    <Label htmlFor={`q-scale-max-${questionId}`}>Max Value</Label>
                    <Input type="number" id={`q-scale-max-${questionId}`} value={(questionOptions as ScaleQuestionOptions).max} onChange={(e) => updateQuestionOptions(questionId, { max: parseInt(e.target.value, 10) || 10 })} />
                  </div>
                   <div>
                    <Label htmlFor={`q-scale-minlabel-${questionId}`}>Min Label (Optional)</Label>
                    <Input id={`q-scale-minlabel-${questionId}`} value={(questionOptions as ScaleQuestionOptions).minLabel || ""} onChange={(e) => updateQuestionOptions(questionId, { minLabel: e.target.value })} placeholder="e.g., 'Worst'" />
                  </div>
                   <div>
                    <Label htmlFor={`q-scale-maxlabel-${questionId}`}>Max Label (Optional)</Label>
                    <Input id={`q-scale-maxlabel-${questionId}`} value={(questionOptions as ScaleQuestionOptions).maxLabel || ""} onChange={(e) => updateQuestionOptions(questionId, { maxLabel: e.target.value })} placeholder="e.g., 'Best'" />
                  </div>
               </div>
             </div>
          )}

          {question.type === 'file_upload' && questionOptions && (
            <div className="border-t pt-4 mt-4 space-y-2">
                <h4 className="font-medium text-sm">File Upload Options</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`q-allowMultiple-file-${questionId}`}
                    checked={(questionOptions as FileUploadQuestionOptions).allowMultiple}
                    onCheckedChange={(checked) => updateQuestionOptions(questionId, { allowMultiple: checked })}
                    disabled // TODO: Implement multiple file upload in FileUploadComponent first
                  />
                  <Label htmlFor={`q-allowMultiple-file-${questionId}`}>Allow multiple files (Coming Soon)</Label>
                </div>
                {/* TODO: Add options for allowed file types, max size */}
            </div>
          )}

          {/* TODO: Add editors for date */} 

        </div>
      </>
    )
  }
  
  return (
    <>
      {isSuccess ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Form Created Successfully</h2>
              <p className="mt-2 text-muted-foreground">
                Your form "{formTitle}" has been created and is ready to be assigned to patients.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/provider/">
                  <Button variant="outline">Return to Dashboard</Button>
                </Link>
                <Link href="/provider/form-management">
                  <Button>Manage Forms</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Create Assessment Form</CardTitle>
                <CardDescription>Design custom assessment forms for clinical trial patients</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled> {/* TODO: Implement */}
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Import Template
                </Button>
                <Button variant="outline" size="sm" disabled> {/* TODO: Implement */}
                  <Settings className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
              </div>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardContent className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="design"> <Edit className="mr-2 h-4 w-4" /> Design</TabsTrigger>
                <TabsTrigger value="preview"> <Eye className="mr-2 h-4 w-4" /> Preview</TabsTrigger>
              </TabsList>
            </CardContent>

            <TabsContent value="design">
              <CardContent className="space-y-6 pt-6">
                {/* Form Title and Description Inputs */}
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input
                    id="form-title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter form title (e.g., Quality of Life Survey)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-description">Form Description (Optional)</Label>
                  <Textarea
                    id="form-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter a brief description of the form"
                    rows={3}
                  />
                </div>

                <Separator />

                {/* Question Editor List */}
                <div className="space-y-4">
                  {questions.map((q) => (
                    <Card key={q.id} className="p-4 bg-muted/30">
                      {renderQuestionEditor(q)}
                    </Card>
                  ))}
                </div>

                <Button variant="secondary" onClick={addQuestion}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="preview">
              <CardContent className="space-y-6 pt-6">
                <h3 className="font-semibold text-lg">{formTitle}</h3>
                {formDescription && <p className="text-sm text-muted-foreground mb-4">{formDescription}</p>}
                <Separator />
                {/* Question Preview List */}
                {questions.map((q) => (
                  <div key={`preview-${q.id}`} className="py-4 border-b last:border-b-0">{renderQuestionPreview(q)}</div>
                ))}
                {questions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No questions added yet. Switch to the Design tab.</p>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>

          <CardFooter className="border-t pt-6 flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting || questions.length === 0}>
              {isSubmitting ? "Creating Form..." : "Create & Finalize Form"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  )
}