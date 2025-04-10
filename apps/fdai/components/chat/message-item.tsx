import { UIComponentRenderer } from "./ui-component-renderer"

interface MessageItemProps {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
    toolCall?: {
      name: string
      args: any
      result: any
    }
  }
  saveUserData: (key: string, data: any) => Promise<void>
  append: (message: { role: "user" | "assistant"; content: string }) => void
  setActiveComponent: (component: string | null) => void
}

export function MessageItem({ message, saveUserData, append, setActiveComponent }: MessageItemProps) {
  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-lg px-4 py-3 max-w-[85%] ${
          message.role === "user"
            ? "bg-primary text-primary-foreground chat-message-user"
            : "bg-muted chat-message-assistant"
        }`}
      >
        {message.role === "assistant" ? (
          <UIComponentRenderer
            message={message}
            saveUserData={saveUserData}
            append={append}
            setActiveComponent={setActiveComponent}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: message.content }} />
        )}
      </div>
    </div>
  )
}
