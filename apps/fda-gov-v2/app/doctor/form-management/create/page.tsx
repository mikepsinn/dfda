"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Copy, Plus, Save } from "lucide-react"
import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QuestionCard } from "./components/QuestionCard.client"
import { QuestionPreview } from "./components/QuestionPreview"
import { FormSettings } from "./components/FormSettings.client"
import { Question, FormSettings as FormSettingsType } from "./types"

export default function CreateForm() {
  const [formTitle, setFormTitle] = useState("Alzheimer's Disease Assessment Scale-Cognitive Subscale (ADAS-Cog)")
  const [formDescription, setFormDescription] = useState(
    "A comprehensive assessment tool for evaluating cognitive impairment in Alzheimer's disease patients.",
  )
  const [isSuccess, setIsSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("form")
  const [questions, setQuestions] = useState<Question[]>([])
  const [formSettings, setFormSettings] = useState<FormSettingsType>({
    collectPatientIdentifiers: true,
    timestampResponses: true,
    allowPartialCompletion: false,
    showProgressBar: true,
  })

  const handleAddQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1
    const newQuestion: Question = {
      id: newId,
      question: "",
      description: "",
      type: "text",
      required: false,
      options: {
        multiline: false,
        placeholder: "",
      },
    }
    setQuestions([...questions, newQuestion])
  }

  const handleDeleteQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleUpdateQuestion = (index: number, updatedQuestion: Partial<Question>) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updatedQuestion } : q)))
  }

  const handleClick = () => {
    setIsSuccess(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/doctor/form-management" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Create Assessment Form</h1>
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
                      <Link href="/doctor/dashboard">
                        <Button variant="outline">Return to Dashboard</Button>
                      </Link>
                      <Link href="/doctor/form-management">
                        <Button>Manage Forms</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">Create Assessment Form</h1>
                    <p className="text-sm text-muted-foreground">Design custom assessment forms for clinical trial patients</p>
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

                <div>
                  <Tabs defaultValue="form" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="form">Form</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="form" className="space-y-4">
                      <div className="space-y-4">
                        <div className="grid w-full gap-1.5">
                          <Label>Form Title</Label>
                          <Input
                            id="formTitle"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Enter form title"
                          />
                        </div>
                        <div className="grid w-full gap-1.5">
                          <Label>Form Description</Label>
                          <Textarea
                            id="formDescription"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Enter form description"
                          />
                        </div>
                        <div className="space-y-4">
                          <FormSettings settings={formSettings} onUpdate={(updates) => setFormSettings(prev => ({ ...prev, ...updates }))} />
                          <div className="space-y-4">
                            {questions.map((question, index) => (
                              <QuestionCard
                                key={question.id}
                                question={question}
                                index={index}
                                onUpdate={(id, updates) => handleUpdateQuestion(id, updates)}
                                onRemove={(id) => handleDeleteQuestion(id)}
                              />
                            ))}
                          </div>
                          <Button onClick={handleAddQuestion} className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Question
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="preview" className="space-y-4">
                      <div className="space-y-4">
                        {questions.map((question) => (
                          <QuestionPreview key={question.id} question={question} />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleClick}
                >
                  Create Form
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

