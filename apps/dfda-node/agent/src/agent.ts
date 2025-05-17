/**
 * This is the main entry point for the agent.
 * It defines the workflow graph, state, tools, nodes and edges.
 */

import { z } from "zod";
import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { convertMCPToolsToActions, MCPTool } from "@copilotkit/runtime";

// 1. Import necessary helpers for CopilotKit actions
// import { convertActionsToDynamicStructuredTools } from "@copilotkit/sdk-js/langgraph"; // REMOVED
// import { CopilotKitStateAnnotation } from "@copilotkit/sdk-js/langgraph"; // REMOVED
 
// Define a basic type for CopilotKit actions
// This might need to be more specific based on actual action structure
type CopilotKitAction = { 
  name: string;
  description?: string;
  parameters?: any[]; // Or a more specific Zod schema
  handler?: (...args: any[]) => any;
  [key: string]: any; 
};

// 2. Define our agent state, which includes CopilotKit state to
//    provide actions to the state.
export const AgentStateAnnotation = Annotation.Root({
    messages: Annotation<(SystemMessage | AIMessage)[]>(), // Corrected to be an array
    language: Annotation<string | undefined>(), // Made type allow undefined for optionality
    proverbs: Annotation<string[]>,
    copilotkit: Annotation<{
        actions?: CopilotKitAction[]; 
    } | undefined>(), // Made copilotkit itself potentially undefined
});

// 3. Define the type for our agent state
export type AgentState = typeof AgentStateAnnotation.State;

// 4. Define a simple tool to get the weather statically
const getWeather = tool(
  (args) => {
    return `The weather for ${args.location} is 70 degrees, clear skies, 45% humidity, 5 mph wind, and feels like 72 degrees.`;
  },
  {
    name: "getWeather",
    description: "Get the weather for a given location.",
    schema: z.object({
      location: z.string().describe("The location to get weather for"),
    }),
  }
);

// 5. Put our tools into an array
const tools = [getWeather];

// 6. Define the chat node, which will handle the chat logic
async function chat_node(state: AgentState, config: RunnableConfig) {
  // 6.1 Define the model, lower temperature for deterministic responses
  const model = new ChatOpenAI({ temperature: 0, model: "gpt-4o" });

  // 6.2 Bind the tools to the model, include CopilotKit actions. This allows
  //     the model to call tools that are defined in CopilotKit by the frontend.
  
  // Convert CopilotKitAction[] to Record<string, MCPTool> for convertMCPToolsToActions
  const mcpToolsFromState: Record<string, MCPTool> = (state.copilotkit?.actions || []).reduce((acc, action) => {
    // Assert that action is a CopilotKitAction and not just any object
    const currentAction = action as CopilotKitAction;
    acc[currentAction.name] = {
      description: currentAction.description,
      // schema field is optional in MCPTool. For now, let's construct it if parameters exist.
      // This assumes currentAction.parameters is a valid JSONSchema object if provided.
      // If it's not, this part might need more complex conversion or to be omitted.
      schema: currentAction.parameters ? { parameters: { jsonSchema: currentAction.parameters } } : undefined,
      execute: async (options: { params: any; }) => {
        if (currentAction.handler) {
          // Assuming the handler expects an object of parameters, similar to how useCopilotAction handlers receive args.
          return currentAction.handler(options.params);
        }
        // Or, if the handler expects positional arguments, and params is an array:
        // if (currentAction.handler && Array.isArray(options.params)) {
        //   return currentAction.handler(...options.params);
        // }
        throw new Error(`No handler defined for action ${currentAction.name}`);
      }
    };
    return acc;
  }, {} as Record<string, MCPTool>);

  // Placeholder for the actual MCP endpoint
  const mcpEndpoint = "http://localhost:3000/api/copilotkit"; // TODO: Use actual configured endpoint

  const modelWithTools = model.bindTools!(
    [
      ...(convertMCPToolsToActions(mcpToolsFromState, mcpEndpoint)), // Added mcpEndpoint and transformed actions
      ...tools,
    ],
  );

  // 6.3 Define the system message, which will be used to guide the model, in this case
  //     we also add in the language to use from the state.
  const systemMessage = new SystemMessage({
    content: `You are a helpful assistant. Talk in ${state.language || "english"}.`,
  });

  // 6.4 Invoke the model with the system message and the messages in the state
  const response = await modelWithTools.invoke(
    [systemMessage, ...state.messages],
    config
  );

  // 6.5 Return the response, which will be added to the state
  return {
    messages: response,
  };
}

// 7. Define the function that determines whether to continue or not,
//    this is used to determine the next node to run
function shouldContinue({ messages, copilotkit }: AgentState) {
  // 7.1 Get the last message from the state
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // 7.2 If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    const actions = copilotkit?.actions;
    const toolCallName = lastMessage.tool_calls![0].name;

    // 7.3 Only route to the tool node if the tool call is not a CopilotKit action
    if (!actions || actions.every((action: CopilotKitAction) => action.name !== toolCallName)) {
      return "tool_node"
    }
  }

  // 7.4 Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the workflow graph
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("chat_node", chat_node)
  .addNode("tool_node", new ToolNode(tools))
  .addEdge(START, "chat_node")
  .addEdge("tool_node", "chat_node")
  .addConditionalEdges("chat_node", shouldContinue as any);

const memory = new MemorySaver();

export const graph = workflow.compile({
  checkpointer: memory,
});
