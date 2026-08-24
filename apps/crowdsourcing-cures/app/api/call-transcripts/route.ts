import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createScheduledCall, findScheduledCall, updateCallTranscript } from "@/app/lib/scheduledCall";
import { requireApiKey } from "@/app/lib/auth/apiKey";
import { User } from "@prisma/client";

// Schema for POST request
const TranscriptSchema = z.object({
  phoneNumber: z.string(),
  transcript: z.string(),
  callId: z.string().optional(),
  personName: z.string().optional(),
  agentName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userOrResponse = await requireApiKey(req);
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user: User = userOrResponse;

    const body = await req.json();
    const result = TranscriptSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { phoneNumber, transcript, callId, personName, agentName } = result.data;

    if (callId) {
      // If callId provided, find and update existing call
      const found = await findScheduledCall({
        phoneNumber,
        userId: user.id,
        callId,
      });

      if (!found) {
        return NextResponse.json({ error: "Call not found" }, { status: 404 });
      }

      const updatedCall = await updateCallTranscript({
        callId: found.call.id,
        transcript,
      });

      return NextResponse.json(updatedCall);
    } else {
      // Create new call with transcript
      const created = await createScheduledCall({
        phoneNumber,
        transcript,
        userId: user.id,
        personName,
        agentName,
      });

      return NextResponse.json(created.call);
    }
  } catch (error) {
    console.error("Error in POST /api/call-transcripts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const userOrResponse = await requireApiKey(req);
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user: User = userOrResponse;

    // Get phone number from URL
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get("phoneNumber");

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Find person and their calls
    const found = await findScheduledCall({
      phoneNumber,
      userId: user.id,
    });

    if (!found) {
      return NextResponse.json({ error: "No calls found" }, { status: 404 });
    }

    // Get recent calls with transcripts
    const calls = await prisma.scheduledCall.findMany({
      where: {
        schedule: {
          personId: found.person.id,
          userId: user.id,
        },
        transcript: {
          not: null,
        },
      },
      orderBy: {
        scheduledFor: "desc",
      },
      take: 10,
      select: {
        id: true,
        scheduledFor: true,
        transcript: true,
        callSummary: true,
        completedAt: true,
      },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error("Error in GET /api/call-transcripts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 