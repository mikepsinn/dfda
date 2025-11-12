/**
 * @jest-environment node
 */
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/call-transcripts/route";
import { User, Person, ApiKey, CallSchedule, ScheduledCall, Agent } from "@prisma/client";

// Helper to create Next.js Request objects for testing
function createRequest(options: {
  method: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}): Request {
  const url = new URL("http://localhost:3000/api/call-transcripts");
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const headers = new Headers(options.headers);
  
  return new Request(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

describe("Call Transcripts API", () => {
  let testData: {
    user1?: User;
    user2?: User;
    apiKey1?: ApiKey;
    person1?: Person;
    person2?: Person;
    schedule1?: CallSchedule;
    call1?: ScheduledCall;
    agent1?: Agent;
  } = {};

  const testTimestamp = new Date().getTime();
  const TEST_PREFIX = "test-user";

  beforeAll(async () => {
    try {
      // Create test users with unique emails
      testData.user1 = await prisma.user.create({
        data: {
          email: `${TEST_PREFIX}-1-${testTimestamp}@example.com`,
          name: `${TEST_PREFIX}-1`,
          username: `${TEST_PREFIX}-1-${testTimestamp}`,
        },
      });

      console.log("Created user1:", testData.user1.id);

      testData.user2 = await prisma.user.create({
        data: {
          email: `${TEST_PREFIX}-2-${testTimestamp}@example.com`,
          name: `${TEST_PREFIX}-2`,
          username: `${TEST_PREFIX}-2-${testTimestamp}`,
        },
      });

      // Ensure users are created before proceeding
      if (!testData.user1?.id || !testData.user2?.id) {
        throw new Error("Failed to create test users");
      }

      // Verify user1 exists
      const verifiedUser1 = await prisma.user.findUnique({
        where: { id: testData.user1.id },
      });

      if (!verifiedUser1) {
        throw new Error("User1 not found after creation");
      }

      console.log("Verified user1 exists:", verifiedUser1.id);

      // Create API key for user1
      testData.apiKey1 = await prisma.apiKey.create({
        data: {
          userId: verifiedUser1.id,
          name: `${TEST_PREFIX}-api-key`,
          displayApiKey: `${TEST_PREFIX}-api-key-${testTimestamp}`,
        },
      });

      // Create people with unique phone numbers
      testData.person1 = await prisma.person.create({
        data: {
          name: `${TEST_PREFIX}-person-1`,
          phoneNumber: `+1${testTimestamp}001`,
          userId: verifiedUser1.id,
        },
      });

      testData.person2 = await prisma.person.create({
        data: {
          name: `${TEST_PREFIX}-person-2`,
          phoneNumber: `+1${testTimestamp}002`,
          userId: testData.user2.id,
        },
      });

      // Create a test agent first
      console.log("Looking for existing agent for user:", verifiedUser1.id);
      const existingAgent = await prisma.agent.findFirst({
        where: {
          userId: verifiedUser1.id,
          name: `${TEST_PREFIX}-agent-${testTimestamp}`,
        },
      });

      if (existingAgent) {
        console.log("Found existing agent:", existingAgent.id);
        testData.agent1 = existingAgent;
      } else {
        console.log("Creating new agent for user:", verifiedUser1.id);
        testData.agent1 = await prisma.agent.create({
          data: {
            name: `${TEST_PREFIX}-agent-${testTimestamp}`,
            userId: verifiedUser1.id,
            description: "Test agent for phone calls",
            isActive: true,
            prompt: "You are a test phone call agent",
            type: "SUPERAGENT", // Add required enum value
          },
        });
        console.log("Created new agent:", testData.agent1.id);
      }

      // Create a call schedule for person1
      testData.schedule1 = await prisma.callSchedule.create({
        data: {
          name: `${TEST_PREFIX}-schedule-${testTimestamp}`,
          userId: testData.user1.id,
          personId: testData.person1.id,
          agentId: testData.agent1.id,
          cronExpression: "0 9 * * *",
        },
      });

      // Create a scheduled call
      testData.call1 = await prisma.scheduledCall.create({
        data: {
          scheduleId: testData.schedule1.id,
          scheduledFor: new Date(),
          status: "SCHEDULED",
        },
      });
    } catch (error) {
      console.error("Error in test setup:", error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data only if it exists
      if (testData.call1) {
        await prisma.scheduledCall.delete({
          where: { id: testData.call1.id },
        });
      }

      if (testData.schedule1) {
        await prisma.callSchedule.delete({
          where: { id: testData.schedule1.id },
        });
      }

      if (testData.agent1) {
        await prisma.agent.delete({
          where: { id: testData.agent1.id },
        });
      }

      if (testData.person1) {
        await prisma.person.delete({
          where: { id: testData.person1.id },
        });
      }

      if (testData.person2) {
        await prisma.person.delete({
          where: { id: testData.person2.id },
        });
      }

      if (testData.apiKey1) {
        await prisma.apiKey.delete({
          where: { id: testData.apiKey1.id },
        });
      }

      if (testData.user1) {
        await prisma.user.delete({
          where: { id: testData.user1.id },
        });
      }

      if (testData.user2) {
        await prisma.user.delete({
          where: { id: testData.user2.id },
        });
      }
    } catch (error) {
      console.error("Error in test cleanup:", error);
    }
  });

  describe("POST /api/call-transcripts", () => {
    it("should require valid API key", async () => {
      const req = createRequest({
        method: "POST",
        headers: {
          "x-api-key": "invalid-key",
          "content-type": "application/json",
        },
        body: {
          phoneNumber: testData.person1?.phoneNumber || "+1234567890",
          transcript: "Test transcript",
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("should add transcript to call for authorized person", async () => {
      if (!testData.person1?.phoneNumber || !testData.apiKey1?.displayApiKey || !testData.call1?.id) {
        throw new Error("Test data not properly initialized");
      }

      const req = createRequest({
        method: "POST",
        headers: {
          "x-api-key": testData.apiKey1.displayApiKey,
          "content-type": "application/json",
        },
        body: {
          phoneNumber: testData.person1.phoneNumber,
          transcript: "Test transcript",
          callId: testData.call1.id,
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify transcript was added
      const updatedCall = await prisma.scheduledCall.findUnique({
        where: { id: testData.call1.id },
      });
      expect(updatedCall?.transcript).toBe("Test transcript");
      expect(updatedCall?.status).toBe("COMPLETED");
    });

    it("should not allow access to calls for unauthorized person", async () => {
      if (!testData.person2?.phoneNumber || !testData.apiKey1?.displayApiKey) {
        throw new Error("Test data not properly initialized");
      }

      const req = createRequest({
        method: "POST",
        headers: {
          "x-api-key": testData.apiKey1.displayApiKey,
          "content-type": "application/json",
        },
        body: {
          phoneNumber: testData.person2.phoneNumber,
          transcript: "Test transcript",
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/call-transcripts", () => {
    it("should require valid API key", async () => {
      if (!testData.person1?.phoneNumber) {
        throw new Error("Test data not properly initialized");
      }

      const req = createRequest({
        method: "GET",
        headers: {
          "x-api-key": "invalid-key",
        },
        query: {
          phoneNumber: testData.person1.phoneNumber,
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("should get transcripts for authorized person", async () => {
      if (!testData.person1?.phoneNumber || !testData.apiKey1?.displayApiKey) {
        throw new Error("Test data not properly initialized");
      }

      const req = createRequest({
        method: "GET",
        headers: {
          "x-api-key": testData.apiKey1.displayApiKey,
        },
        query: {
          phoneNumber: testData.person1.phoneNumber,
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should not allow access to transcripts for unauthorized person", async () => {
      if (!testData.person2?.phoneNumber || !testData.apiKey1?.displayApiKey) {
        throw new Error("Test data not properly initialized");
      }

      const req = createRequest({
        method: "GET",
        headers: {
          "x-api-key": testData.apiKey1.displayApiKey,
        },
        query: {
          phoneNumber: testData.person2.phoneNumber,
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(404);
    });
  });
}); 