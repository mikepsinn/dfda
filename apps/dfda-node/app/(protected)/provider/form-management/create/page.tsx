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

export default function CreateForm() {
  const [formTitle, setFormTitle] = useState("Alzheimer's Disease Assessment Scale-Cognitive Subscale (ADAS-Cog)")
  const [formDescription, setFormDescription] = useState(
    "A comprehensive assessment tool for evaluating cognitive impairment in Alzheimer's disease patients.",
  )
  const [activeTab, setActiveTab] = useState("design")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [questions, setQuestions] = useState([
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
        type: "text",
        question: "New Question",
        description: "",
        required: false,
        options: {
          multiline: false,
          placeholder: "",
        },
      },
    ])
  }

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id, updates) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  const renderQuestionPreview = (question) => {
    switch (question.type) {
      case "text":
        return (
          <div className="space-y-2">
            <Label>{question.question}</Label>
            {question.options.multiline ? (
              <Textarea placeholder={question.options.placeholder || "Enter your answer..."} disabled />
            ) : (
              <Input placeholder={question.options.placeholder || "Enter your answer..."} disabled />
            )}
          </div>
        )
      case "multiple-choice":
        return (
          <div className="space-y-2">
            <Label>{question.question}</Label>
            <div className="space-y-2">
              {(question.options?.choices || []).map((choice, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {question.options.allowMultiple ? (
                    <input type="checkbox" disabled />
                  ) : (
                    <input type="radio" name={`question-${question.id}`} disabled />
                  )}
                  <Label>{choice.label}</Label>
                </div>
              ))}
            </div>
          </div>
        )
      case "scale":
        return (
          <div className="space-y-2">
            <Label>{question.question}</Label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{question.options.minLabel || question.options.min}</span>
                <span>{question.options.maxLabel || question.options.max}</span>
              </div>
              <input
                type="range"
                min={question.options.min}
                max={question.options.max}
                step={question.options.step}
                className="w-full"
                disabled
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/app/(protected)/provider/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Form Management</h1>
            </div>

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
                      <Button variant="outline" size="sm">
                        <Copy className="mr-2 h-4 w-4" />
                        Import Template
                      </Button>
                      <Button variant="outline" size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="design">Design</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="design" className="space-y-6 pt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="form-title">Form Title</Label>
                          <Input
                            id="form-title"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Enter form title..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="form-description">Description</Label>
                          <Textarea
                            id="form-description"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Enter form description..."
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Questions</h3>
                          <Button onClick={addQuestion} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Question
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {questions.map((question) => (
                            <Card key={question.id}>
                              <CardHeader className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Grip className="h-5 w-5 text-muted-foreground cursor-move" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{question.question}</h4>
                                        {question.required && (
                                          <Badge variant="outline" className="text-xs">
                                            Required
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">{question.description}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
                                      <Trash className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="space-y-4">
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label htmlFor={`question-${question.id}`}>Question</Label>
                                      <Input
                                        id={`question-${question.id}`}
                                        value={question.question}
                                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`type-${question.id}`}>Question Type</Label>
                                      <Select
                                        value={question.type}
                                        onValueChange={(value) => {
                                          let options = {}
                                          switch (value) {
                                            case "text":
                                              options = { multiline: false, placeholder: "" }
                                              break
                                            case "multiple-choice":
                                              options = {
                                                choices: [
                                                  { value: "1", label: "Option 1" },
                                                  { value: "2", label: "Option 2" },
                                                ],
                                                allowMultiple: false,
                                              }
                                              break
                                            case "scale":
                                              options = { min: 0, max: 10, step: 1, minLabel: "", maxLabel: "" }
                                              break
                                          }
                                          updateQuestion(question.id, { type: value, options })
                                        }}
                                      >
                                        <SelectTrigger id={`type-${question.id}`}>
                                          <SelectValue placeholder="Select question type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="text">Text Input</SelectItem>
                                          <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                          <SelectItem value="scale">Scale</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`description-${question.id}`}>Description (Optional)</Label>
                                    <Input
                                      id={`description-${question.id}`}
                                      value={question.description}
                                      onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                                      placeholder="Add a description or instructions..."
                                    />
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`required-${question.id}`}
                                      checked={question.required}
                                      onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                                    />
                                    <Label htmlFor={`required-${question.id}`}>Required question</Label>
                                  </div>

                                  {question.type === "text" && (
                                    <div className="space-y-4">
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          id={`multiline-${question.id}`}
                                          checked={question.options.multiline}
                                          onCheckedChange={(checked) =>
                                            updateQuestion(question.id, {
                                              options: { ...question.options, multiline: checked },
                                            })
                                          }
                                        />
                                        <Label htmlFor={`multiline-${question.id}`}>Multi-line text input</Label>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor={`placeholder-${question.id}`}>Placeholder Text</Label>
                                        <Input
                                          id={`placeholder-${question.id}`}
                                          value={question.options.placeholder || ""}
                                          onChange={(e) =>
                                            updateQuestion(question.id, {
                                              options: { ...question.options, placeholder: e.target.value },
                                            })
                                          }
                                          placeholder="Enter placeholder text..."
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {question.type === "multiple-choice" && (
                                    <div className="space-y-4">
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          id={`multiple-${question.id}`}
                                          checked={question.options.allowMultiple}
                                          onCheckedChange={(checked) =>
                                            updateQuestion(question.id, {
                                              options: { ...question.options, allowMultiple: checked },
                                            })
                                          }
                                        />
                                        <Label htmlFor={`multiple-${question.id}`}>Allow multiple selections</Label>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Answer Choices</Label>
                                        <div className="space-y-2">
                                          {(question.options?.choices || []).map((choice, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                              <Input
                                                value={choice.label}
                                                onChange={(e) => {
                                                  const newChoices = (question.options?.choices ? (question.options?.choices ? (question.options?.choices ? (question.options?.choices ? [...question.options?.choices] : []) : []) : []) : [])
                                                  newChoices[index] = {
                                                    ...newChoices[index],
                                                    label: e.target.value,
                                                  }
                                                  updateQuestion(question.id, {
                                                    options: { ...question.options, choices: newChoices },
                                                  })
                                                }}
                                                placeholder={`Option ${index + 1}`}
                                              />
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  const newChoices = (question.options?.choices || []).filter(
                                                    (_, i) => i !== index,
                                                  )
                                                  updateQuestion(question.id, {
                                                    options: { ...question.options, choices: newChoices },
                                                  })
                                                }}
                                                disabled={(question.options?.choices || []).length <= 1}
                                              >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove</span>
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newChoices = (question.options?.choices ? (question.options?.choices ? (question.options?.choices ? (question.options?.choices ? [...question.options?.choices] : []) : []) : []) : [])
                                            newChoices.push({
                                              value: `${newChoices.length + 1}`,
                                              label: `Option ${newChoices.length + 1}`,
                                            })
                                            updateQuestion(question.id, {
                                              options: { ...question.options, choices: newChoices },
                                            })
                                          }}
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          Add Choice
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === "scale" && (
                                    <div className="space-y-4">
                                      <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                          <Label htmlFor={`min-${question.id}`}>Minimum Value</Label>
                                          <Input
                                            id={`min-${question.id}`}
                                            type="number"
                                            value={question.options.min}
                                            onChange={(e) =>
                                              updateQuestion(question.id, {
                                                options: { ...question.options, min: Number.parseInt(e.target.value) },
                                              })
                                            }
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`max-${question.id}`}>Maximum Value</Label>
                                          <Input
                                            id={`max-${question.id}`}
                                            type="number"
                                            value={question.options.max}
                                            onChange={(e) =>
                                              updateQuestion(question.id, {
                                                options: { ...question.options, max: Number.parseInt(e.target.value) },
                                              })
                                            }
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`step-${question.id}`}>Step</Label>
                                          <Input
                                            id={`step-${question.id}`}
                                            type="number"
                                            value={question.options.step}
                                            onChange={(e) =>
                                              updateQuestion(question.id, {
                                                options: {
                                                  ...question.options,
                                                  step: Number.parseFloat(e.target.value),
                                                },
                                              })
                                            }
                                          />
                                        </div>
                                      </div>

                                      <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                          <Label htmlFor={`min-label-${question.id}`}>Minimum Label</Label>
                                          <Input
                                            id={`min-label-${question.id}`}
                                            value={question.options.minLabel || ""}
                                            onChange={(e) =>
                                              updateQuestion(question.id, {
                                                options: { ...question.options, minLabel: e.target.value },
                                              })
                                            }
                                            placeholder="Label for minimum value..."
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`max-label-${question.id}`}>Maximum Label</Label>
                                          <Input
                                            id={`max-label-${question.id}`}
                                            value={question.options.maxLabel || ""}
                                            onChange={(e) =>
                                              updateQuestion(question.id, {
                                                options: { ...question.options, maxLabel: e.target.value },
                                              })
                                            }
                                            placeholder="Label for maximum value..."
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          {questions.length === 0 && (
                            <div className="rounded-lg border border-dashed p-8 text-center">
                              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                              <h3 className="mt-2 text-lg font-medium">No questions added</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Add questions to your form using the button above
                              </p>
                              <Button onClick={addQuestion} className="mt-4">
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Question
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="pt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>{formTitle || "Untitled Form"}</CardTitle>
                          {formDescription && <CardDescription>{formDescription}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {questions.map((question) => (
                              <div key={question.id} className="space-y-2">
                                <div className="flex items-center gap-1">
                                  <h3 className="font-medium">{question.question}</h3>
                                  {question.required && <span className="text-red-500">*</span>}
                                </div>
                                {question.description && (
                                  <p className="text-sm text-muted-foreground">{question.description}</p>
                                )}
                                <div className="mt-2">{renderQuestionPreview(question)}</div>
                              </div>
                            ))}

                            {questions.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                No questions to preview. Add questions in the Design tab.
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button disabled className="w-full">
                            Submit (Preview Only)
                          </Button>
                        </CardFooter>
                      </Card>

                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setActiveTab("design")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Return to Editing
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6 pt-4">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Form Settings</h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Collect Patient Identifier</Label>
                              <p className="text-sm text-muted-foreground">
                                Automatically collect patient ID when form is completed
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Timestamp Responses</Label>
                              <p className="text-sm text-muted-foreground">
                                Record the date and time when form is submitted
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Allow Partial Completion</Label>
                              <p className="text-sm text-muted-foreground">
                                Let patients save progress and complete form later
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Show Progress Bar</Label>
                              <p className="text-sm text-muted-foreground">Display progress indicator to patients</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Access Control</h3>

                          <div className="space-y-2">
                            <Label htmlFor="form-access">Who can use this form?</Label>
                            <Select defaultValue="me">
                              <SelectTrigger id="form-access">
                                <SelectValue placeholder="Select access level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="me">Only me</SelectItem>
                                <SelectItem value="practice">My practice</SelectItem>
                                <SelectItem value="trial">All trial investigators</SelectItem>
                                <SelectItem value="public">Public (all platform users)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="form-trials">Associated Trials</Label>
                            <Select defaultValue="alzheimers">
                              <SelectTrigger id="form-trials">
                                <SelectValue placeholder="Select trial" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alzheimers">Lecanemab for Early Alzheimer's Disease</SelectItem>
                                <SelectItem value="parkinsons">ABBV-951 for Advanced Parkinson's Disease</SelectItem>
                                <SelectItem value="ms">Tolebrutinib for Relapsing Multiple Sclerosis</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Notifications</h3>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Email Notifications</Label>
                              <p className="text-sm text-muted-foreground">Receive email when form is completed</p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Dashboard Alerts</Label>
                              <p className="text-sm text-muted-foreground">
                                Show alerts in dashboard for new submissions
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formTitle || questions.length === 0 || isSubmitting}>
                    {isSubmitting ? "Creating Form..." : "Create Form"}
                    {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


