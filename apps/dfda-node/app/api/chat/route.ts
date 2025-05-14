import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, type CoreMessage } from 'ai';

// IMPORTANT: Set the GOOGLE_GENERATIVE_AI_API_KEY environment variable
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const dynamic = 'force-dynamic'; // Prefer dynamic handling for API routes

export async function POST(req: Request) {
  try {
    const { messages, data }: { messages: CoreMessage[]; data?: { openApiSpec?: string } } = await req.json();

    const openApiSpec = data?.openApiSpec;

    let systemMessageContent = 'You are an expert API assistant. A user will ask you questions about an API described by the following OpenAPI specification. Help them understand how to use the API. Be concise and provide code examples where helpful. If the spec is not provided, inform the user that you need the API specification to help.';

    if (openApiSpec) {
      systemMessageContent += `\n\nHere is the OpenAPI v3 specification:\n\n\`\`\`json\n${openApiSpec}\n\`\`\`\n`;
    }

    const processedMessages: CoreMessage[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add the system message to the beginning if it's not already there
    // or if you want to ensure it's always the most up-to-date version.
    const finalMessages: CoreMessage[] = [
      { role: 'system', content: systemMessageContent },
      ...processedMessages.filter(m => m.role !== 'system') // Remove any existing system messages to avoid duplication
    ];

    const result = await streamText({
      model: google('models/gemini-pro'),
      messages: finalMessages,
      tools: {},
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('[API Chat] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'An error occurred processing your chat request.',
        details: error.message,
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
} 