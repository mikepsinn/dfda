'use server'

import { getModelByName } from '@/lib/utils/modelUtils'
import { text2measurements } from '@/lib/text2measurements'
import { StreamingTextResponse, OpenAIStream } from 'ai'

export async function chatAction(prevState: any, formData: FormData) {
  const messages = JSON.parse(formData.get('messages') as string)
  const imageUrl = formData.get('imageUrl')
  const model = getModelByName('gpt-4')

  const prompt = `You are a helpful health assistant that helps users track their diet, treatments, and symptoms. 
  Ask follow-up questions to gather more details about timing, dosage, and intensity of symptoms.
  
  Current conversation:
  ${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}
  
  ${imageUrl ? 'The user has also shared an image that may contain relevant health information.' : ''}
  `

  const response = await model.chat.completions.create({
    model: 'gpt-4-vision-preview',
    stream: true,
    messages: [
      ...messages,
      {
        role: 'system',
        content: prompt
      },
      ...(imageUrl ? [{
        role: 'user',
        content: [
          { type: 'text', text: messages[messages.length - 1].content },
          { type: 'image_url', image_url: imageUrl }
        ]
      }] : [])
    ]
  })

  // Process measurements from the response
  const currentUtcDateTime = new Date().toISOString()
  const timeZoneOffset = new Date().getTimezoneOffset()
  await text2measurements(messages[messages.length - 1].content, currentUtcDateTime, timeZoneOffset)

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
} 