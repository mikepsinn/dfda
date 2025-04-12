"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronRight, Copy, Edit, Eye, FileText, Grip, Plus, Save, Trash, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

// Define interfaces for question structure (optional but good practice)
interface ChoiceOption {
  value: string;
  label: string;
}

interface BaseQuestionOptions {
  // Base options if any
}

interface TextQuestionOptions extends BaseQuestionOptions {
  multiline?: boolean;
  placeholder?: string;
}

interface MultipleChoiceQuestionOptions extends BaseQuestionOptions {
  choices: ChoiceOption[];
  allowMultiple?: boolean;
}

interface ScaleQuestionOptions extends BaseQuestionOptions {
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
}

interface FormQuestion {
  id: number;
  type: 'text' | 'multiple-choice' | 'scale';
  question: string;
  description?: string;
  required?: boolean;
  options: TextQuestionOptions | MultipleChoiceQuestionOptions | ScaleQuestionOptions;
}

export function CreateFormWizard() {
  const [formTitle, setFormTitle] = useState("Alzheimer's Disease Assessment Scale-Cognitive Subscale (ADAS-Cog)")
  const [formDescription, setFormDescription] = useState(
    "A comprehensive assessment tool for evaluating cognitive impairment in Alzheimer's disease patients.",
  )
  const [activeTab, setActiveTab] = useState("design")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: 1,
      type: "scale",
      question: "Word Recall Task",
      description: "Ability to remember a list of 10 words after three trials",
      required: true,
      options: {
        min: 0,
        max: 10,
        step: 1,
        minLabel: "No words recalled",
        maxLabel: "All words recalled",
      },
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Naming Objects and Fingers",
      description: "Ability to name objects and fingers when prompted",
      required: true,
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
      },
    },
    {
      id: 3,
      type: "multiple-choice",
      question: "Commands",
      description: "Ability to follow simple commands",
      required: true,
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
      },
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Constructional Praxis",
      description: "Ability to copy geometric forms",
      required: true,
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
      },
    },
    {
      id: 5,
      type: "text",
      question: "Clinician Observations",
      description: "Additional observations about patient's cognitive state",
      required: false,
      options: {
        multiline: true,
        placeholder: "Enter any additional observations here...",
      },
    },
  ])

  const addQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1
    setQuestions([
      ...questions,
      {
        id: newId,
        type: "text", // Default new question type
        question: "New Question",
        description: "",
        required: false,
        options: {
          multiline: false,
          placeholder: "",
        },
      } as FormQuestion, // Assertion needed if options type isn't guaranteed initially
    ])
  }

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: number, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  // Function to update nested options (example for text type)
  const updateQuestionOptions = (id: number, optionUpdates: Partial<TextQuestionOptions | MultipleChoiceQuestionOptions | ScaleQuestionOptions>) => {
    setQuestions(questions.map((q) => (
      q.id === id ? { ...q, options: { ...q.options, ...optionUpdates } } : q
    )))
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    console.log("Submitting form:", { title: formTitle, description: formDescription, questions });
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  // Helper function to render question preview
  const renderQuestionPreview = (question: FormQuestion) => {
    switch (question.type) {
      case "text":
        const textOptions = question.options as TextQuestionOptions;
        return (
          <div className="space-y-2">
            <Label>{question.question}{question.required && " *"}</Label>
            {textOptions.multiline ? (
              <Textarea placeholder={textOptions.placeholder || "Enter your answer..."} disabled />
            ) : (
              <Input placeholder={textOptions.placeholder || "Enter your answer..."} disabled />
            )}
            {question.description && <p className="text-xs text-muted-foreground">{question.description}</p>}
          </div>
        )
      case "multiple-choice":
        const mcOptions = question.options as MultipleChoiceQuestionOptions;
        return (
          <div className="space-y-2">
            <Label>{question.question}{question.required && " *"}</Label>
            <div className="space-y-2">
              {(mcOptions.choices || []).map((choice, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {mcOptions.allowMultiple ? (
                    <input type="checkbox" disabled className="form-checkbox h-4 w-4"/>
                  ) : (
                    <input type="radio" name={`preview-question-${question.id}`} disabled className="form-radio h-4 w-4"/>
                  )}
                  <Label className="font-normal">{choice.label}</Label>
                </div>
              ))}
            </div>
            {question.description && <p className="text-xs text-muted-foreground">{question.description}</p>}
          </div>
        )
      case "scale":
        const scaleOptions = question.options as ScaleQuestionOptions;
        return (
          <div className="space-y-2">
            <Label>{question.question}{question.required && " *"}</Label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{scaleOptions.minLabel || scaleOptions.min}</span>
                <span>{scaleOptions.maxLabel || scaleOptions.max}</span>
              </div>
              <input
                type="range"
                min={scaleOptions.min}
                max={scaleOptions.max}
                step={scaleOptions.step || 1}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                disabled
              />
            </div>
            {question.description && <p className="text-xs text-muted-foreground">{question.description}</p>}
          </div>
        )
      default:
        return null
    }
  }

  // Helper function to render question editor controls
  const renderQuestionEditor = (question: FormQuestion) => {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Grip className="h-5 w-5 text-muted-foreground cursor-move" />
            <Select value={question.type} onValueChange={(value) => updateQuestion(question.id, { type: value as FormQuestion["type"] })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Question Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                {/* Add other types */}
              </SelectContent>
            </Select>
            <div className="flex-1"></div> { /* Spacer */}
            <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor={`q-text-${question.id}`}>Question Text</Label>
              <Input
                id={`q-text-${question.id}`}
                value={question.question}
                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                placeholder="Enter the question text"
              />
            </div>
            <div>
              <Label htmlFor={`q-desc-${question.id}`}>Description / Helper Text (Optional)</Label>
              <Textarea
                id={`q-desc-${question.id}`}
                value={question.description || ""}
                onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                placeholder="Enter description or instructions"
                rows={2}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id={`q-required-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
            />
            <Label htmlFor={`q-required-${question.id}`}>Required</Label>
          </div>

          {/* --- Options specific to question type --- */}
          {question.type === "text" && (
            <div className="border-t pt-4 mt-4 space-y-2">
              <h4 className="font-medium text-sm">Text Options</h4>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`q-multiline-${question.id}`}
                  checked={(question.options as TextQuestionOptions).multiline}
                  onCheckedChange={(checked) => updateQuestionOptions(question.id, { multiline: checked })}
                />
                <Label htmlFor={`q-multiline-${question.id}`}>Allow multiple lines (Textarea)</Label>
              </div>
               <div>
                <Label htmlFor={`q-placeholder-${question.id}`}>Placeholder Text</Label>
                <Input
                  id={`q-placeholder-${question.id}`}
                  value={(question.options as TextQuestionOptions).placeholder || ""}
                  onChange={(e) => updateQuestionOptions(question.id, { placeholder: e.target.value })}
                  placeholder="Optional placeholder text"
                />
              </div>
            </div>
          )}

          {question.type === "multiple-choice" && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <h4 className="font-medium text-sm">Multiple Choice Options</h4>
              {(question.options as MultipleChoiceQuestionOptions).choices.map((choice, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={choice.label}
                    onChange={(e) => {
                      const newChoices = [...(question.options as MultipleChoiceQuestionOptions).choices];
                      newChoices[index] = { ...newChoices[index], label: e.target.value };
                      updateQuestionOptions(question.id, { choices: newChoices });
                    }}
                    placeholder={`Choice ${index + 1}`}
                    className="flex-grow"
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                     const newChoices = (question.options as MultipleChoiceQuestionOptions).choices.filter((_, i) => i !== index);
                     updateQuestionOptions(question.id, { choices: newChoices });
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => {
                 const newChoices = [...(question.options as MultipleChoiceQuestionOptions).choices, { value: `option-${Date.now()}`, label: "New Choice" } ]
                 updateQuestionOptions(question.id, { choices: newChoices });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Choice
              </Button>
               <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id={`q-allowMultiple-${question.id}`}
                  checked={(question.options as MultipleChoiceQuestionOptions).allowMultiple}
                  onCheckedChange={(checked) => updateQuestionOptions(question.id, { allowMultiple: checked })}
                />
                <Label htmlFor={`q-allowMultiple-${question.id}`}>Allow multiple selections</Label>
              </div>
            </div>
          )}

          {question.type === "scale" && (
             <div className="border-t pt-4 mt-4 space-y-4">
               <h4 className="font-medium text-sm">Scale Options</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`q-scale-min-${question.id}`}>Min Value</Label>
                    <Input type="number" id={`q-scale-min-${question.id}`} value={(question.options as ScaleQuestionOptions).min} onChange={(e) => updateQuestionOptions(question.id, { min: parseInt(e.target.value, 10) || 0 })} />
                  </div>
                   <div>
                    <Label htmlFor={`q-scale-max-${question.id}`}>Max Value</Label>
                    <Input type="number" id={`q-scale-max-${question.id}`} value={(question.options as ScaleQuestionOptions).max} onChange={(e) => updateQuestionOptions(question.id, { max: parseInt(e.target.value, 10) || 10 })} />
                  </div>
                   <div>
                    <Label htmlFor={`q-scale-minlabel-${question.id}`}>Min Label (Optional)</Label>
                    <Input id={`q-scale-minlabel-${question.id}`} value={(question.options as ScaleQuestionOptions).minLabel || ""} onChange={(e) => updateQuestionOptions(question.id, { minLabel: e.target.value })} placeholder="e.g., \'Worst\'" />
                  </div>
                   <div>
                    <Label htmlFor={`q-scale-maxlabel-${question.id}`}>Max Label (Optional)</Label>
                    <Input id={`q-scale-maxlabel-${question.id}`} value={(question.options as ScaleQuestionOptions).maxLabel || ""} onChange={(e) => updateQuestionOptions(question.id, { maxLabel: e.target.value })} placeholder="e.g., \'Best\'" />
                  </div>
               </div>
             </div>
          )}

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
                <Link href="/app/(protected)/provider/dashboard">
                  <Button variant="outline">Return to Dashboard</Button>
                </Link>
                <Link href="/app/(protected)/provider/form-management">
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
                  <Copy className="mr-2 h-4 w-4" />
                  Import Template
                </Button>
                <Button variant="outline" size="sm" disabled> {/* TODO: Implement */}
                  <Save className="mr-2 h-4 w-4" />
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

                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <Card key={q.id} className="p-4 bg-muted/30">
                      {renderQuestionEditor(q)}
                    </Card>
                  ))}
                </div>

                <Button variant="secondary" onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="preview">
              <CardContent className="space-y-6 pt-6">
                <h3 className="font-semibold text-lg">{formTitle}</h3>
                {formDescription && <p className="text-sm text-muted-foreground mb-4">{formDescription}</p>}
                <Separator />
                {questions.map((q) => (
                  <div key={`preview-${q.id}`} className="py-4">{renderQuestionPreview(q)}</div>
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