import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Question } from "../types"

interface QuestionPreviewProps {
  question: Question
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
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
            {question.options.choices?.map((choice, index) => (
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