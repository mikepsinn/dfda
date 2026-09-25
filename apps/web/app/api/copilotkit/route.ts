import type { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

const serviceAdapter = new ExperimentalEmptyAdapter();

function createRuntime() {
  const deploymentUrl = process.env.LANGGRAPH_DEPLOYMENT_URL;
  const agentName = process.env.NEXT_PUBLIC_COPILOTKIT_AGENT_NAME;

  if (!deploymentUrl || !agentName) {
    return null;
  }

  return new CopilotRuntime({
    agents: {
      [agentName]: new LangGraphAgent({
        deploymentUrl,
        graphId: agentName,
        agentName,
        langsmithApiKey: process.env.LANGSMITH_API_KEY,
      }),
    },
  });
}

export const POST = async (req: NextRequest) => {
  const runtime = createRuntime();

  if (!runtime) {
    return Response.json(
      { error: "CopilotKit is not configured for this node." },
      { status: 503 },
    );
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
