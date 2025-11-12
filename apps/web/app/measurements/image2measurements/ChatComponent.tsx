import React from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport, tool } from "ai"
import { z } from "zod"

interface ChatComponentProps {
  base64Image: string
}

const CustomDescriptionSchema = z.object({
  prompt: z.string().describe("The prompt to analyze the image with")
})

const ChatComponent: React.FC<ChatComponentProps> = ({ base64Image }) => {
  console.log("Base64 image:", base64Image)

  const getCustomDescriptionTool = tool({
    description: "Get a custom description of the image based on a specific prompt",
    parameters: CustomDescriptionSchema,
    execute: async (args: z.infer<typeof CustomDescriptionSchema>) => {
      const customDescriptionResponse = await fetch("/api/image2measurements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: base64Image,
          prompt: args.prompt,
          max_tokens: 100,
        }),
      })

      const responseData = await customDescriptionResponse.json()
      return responseData.analysis
    }
  } as any)

  const [input, setInput] = React.useState("")
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat-with-functions",
      body: {
        tools: {
          getCustomDescription: getCustomDescriptionTool
        }
      }
    })
  })

  const roleToColorMap: Record<string, string> = {
    system: "red",
    user: "black",
    function: "blue",
    assistant: "green",
    data: "purple",
    tool: "orange",
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput("")
    }
  }

  return (
    <div className="stretch mx-auto flex w-full max-w-md flex-col py-24">
      {messages.length > 0
        ? messages.map((m: UIMessage) => (
            <div
              key={m.id}
              className="whitespace-pre-wrap"
              style={{ color: roleToColorMap[m.role] || "defaultColor" }}
            >
              <strong>{`${m.role}: `}</strong>
              {m.parts.map((part, idx) => 
                part.type === 'text' ? (
                  <span key={idx}>{part.text}</span>
                ) : (
                  <span key={idx}>{JSON.stringify(part)}</span>
                )
              )}
              <br />
              <br />
            </div>
          ))
        : null}
      <div id="chart-goes-here"></div>
      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 mb-8 w-full max-w-md rounded border border-gray-300 p-2 shadow-xl"
          value={input}
          placeholder="Ask a question about your data..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status === 'streaming' || status === 'submitted'}
        />
      </form>
    </div>
  )
}

export default ChatComponent
