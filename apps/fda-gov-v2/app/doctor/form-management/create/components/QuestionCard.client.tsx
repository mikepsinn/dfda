"use client"

import { Edit, Grip, Trash } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Question, QuestionOption } from "../types"

interface QuestionCardProps {
  question: Question
  index: number
  onUpdate: (id: number, updates: Partial<Question>) => void
  onRemove: (id: number) => void
}

export function QuestionCard({ question, index, onUpdate, onRemove }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader className="relative">
        <div className="flex items-center gap-2">
          <Grip className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Question {index + 1}</Badge>
              {question.required && <Badge variant="default">Required</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onRemove(question.id)}>
              <Trash className="h-4 w-4" />
              <span className="sr-only">Remove question</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit question</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor={`question-${question.id}`}>Question</Label>
            <Input
              id={`question-${question.id}`}
              value={question.question}
              onChange={(e) => onUpdate(question.id, { question: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor={`description-${question.id}`}>Description</Label>
            <Textarea
              id={`description-${question.id}`}
              value={question.description}
              onChange={(e) => onUpdate(question.id, { description: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`type-${question.id}`}>Question Type</Label>
              <Select
                value={question.type}
                onValueChange={(value) =>
                  onUpdate(question.id, {
                    type: value as "text" | "multiple-choice" | "scale",
                    options: getDefaultOptions(value as "text" | "multiple-choice" | "scale"),
                  })
                }
              >
                <SelectTrigger id={`type-${question.id}`} className="mt-1.5">
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`required-${question.id}`}>Required</Label>
                <Switch
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={(checked) => onUpdate(question.id, { required: checked })}
                />
              </div>
            </div>
          </div>
          {question.type === "text" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`multiline-${question.id}`}>Multi-line Text</Label>
                <Switch
                  id={`multiline-${question.id}`}
                  checked={question.options.multiline}
                  onCheckedChange={(checked) =>
                    onUpdate(question.id, {
                      options: { ...question.options, multiline: checked },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor={`placeholder-${question.id}`}>Placeholder Text</Label>
                <Input
                  id={`placeholder-${question.id}`}
                  value={question.options.placeholder || ""}
                  onChange={(e) =>
                    onUpdate(question.id, {
                      options: { ...question.options, placeholder: e.target.value },
                    })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          )}
          {question.type === "multiple-choice" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`multiple-${question.id}`}>Allow Multiple Selections</Label>
                <Switch
                  id={`multiple-${question.id}`}
                  checked={question.options.allowMultiple}
                  onCheckedChange={(checked) =>
                    onUpdate(question.id, {
                      options: { ...question.options, allowMultiple: checked },
                    })
                  }
                />
              </div>
              <div>
                <Label>Choices</Label>
                <div className="mt-1.5 space-y-2">
                  {question.options.choices?.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="flex gap-2">
                      <Input
                        value={choice.label}
                        onChange={(e) => {
                          const newChoices = [...(question.options.choices || [])]
                          newChoices[choiceIndex] = {
                            value: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                            label: e.target.value,
                          }
                          onUpdate(question.id, {
                            options: { ...question.options, choices: newChoices },
                          })
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newChoices = [...(question.options.choices || [])]
                          newChoices.splice(choiceIndex, 1)
                          onUpdate(question.id, {
                            options: { ...question.options, choices: newChoices },
                          })
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remove choice</span>
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newChoices = [...(question.options.choices || [])]
                      newChoices.push({ value: "", label: "" })
                      onUpdate(question.id, {
                        options: { ...question.options, choices: newChoices },
                      })
                    }}
                  >
                    Add Choice
                  </Button>
                </div>
              </div>
            </div>
          )}
          {question.type === "scale" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor={`min-${question.id}`}>Minimum Value</Label>
                  <Input
                    id={`min-${question.id}`}
                    type="number"
                    value={question.options.min}
                    onChange={(e) =>
                      onUpdate(question.id, {
                        options: { ...question.options, min: parseInt(e.target.value) },
                      })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor={`max-${question.id}`}>Maximum Value</Label>
                  <Input
                    id={`max-${question.id}`}
                    type="number"
                    value={question.options.max}
                    onChange={(e) =>
                      onUpdate(question.id, {
                        options: { ...question.options, max: parseInt(e.target.value) },
                      })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor={`step-${question.id}`}>Step</Label>
                  <Input
                    id={`step-${question.id}`}
                    type="number"
                    value={question.options.step}
                    onChange={(e) =>
                      onUpdate(question.id, {
                        options: { ...question.options, step: parseInt(e.target.value) },
                      })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`min-label-${question.id}`}>Minimum Label</Label>
                  <Input
                    id={`min-label-${question.id}`}
                    value={question.options.minLabel}
                    onChange={(e) =>
                      onUpdate(question.id, {
                        options: { ...question.options, minLabel: e.target.value },
                      })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor={`max-label-${question.id}`}>Maximum Label</Label>
                  <Input
                    id={`max-label-${question.id}`}
                    value={question.options.maxLabel}
                    onChange={(e) =>
                      onUpdate(question.id, {
                        options: { ...question.options, maxLabel: e.target.value },
                      })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getDefaultOptions(type: "text" | "multiple-choice" | "scale"): QuestionOption {
  switch (type) {
    case "text":
      return {
        multiline: false,
        placeholder: "",
      }
    case "multiple-choice":
      return {
        choices: [{ value: "option-1", label: "Option 1" }],
        allowMultiple: false,
      }
    case "scale":
      return {
        min: 0,
        max: 10,
        step: 1,
        minLabel: "",
        maxLabel: "",
      }
  }
} 