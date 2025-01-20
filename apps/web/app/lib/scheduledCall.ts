import { prisma } from "@/lib/prisma";
import { CallStatus } from "@prisma/client";

type CreateScheduledCallInput = {
  phoneNumber: string;
  transcript?: string;
  userId: string;
  personName?: string;
  agentName?: string;
  scheduledFor?: Date;
};

export async function createScheduledCall({
  phoneNumber,
  transcript,
  userId,
  personName = "Phone Call Recipient",
  agentName = "Phone Call Agent",
  scheduledFor = new Date(),
}: CreateScheduledCallInput) {
  // Find or create person
  let person = await prisma.person.findFirst({
    where: {
      phoneNumber,
    },
  });

  if (!person) {
    person = await prisma.person.create({
      data: {
        name: personName,
        phoneNumber,
        userId,
      },
    });
  }

  // Find or create agent
  let agent = await prisma.agent.findFirst({
    where: {
      userId,
      name: agentName,
    },
  });

  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        userId,
        name: agentName,
        description: "Auto-created agent for phone calls",
        isActive: true,
        prompt: "You are a helpful phone call agent",
      },
    });
  }

  // Find or create call schedule
  let schedule = await prisma.callSchedule.findFirst({
    where: {
      userId,
      personId: person.id,
      agentId: agent.id,
    },
  });

  if (!schedule) {
    schedule = await prisma.callSchedule.create({
      data: {
        name: `Calls with ${person.name}`,
        userId,
        personId: person.id,
        agentId: agent.id,
        cronExpression: "0 9 * * *", // Default to 9am daily
        enabled: true,
      },
    });
  }

  // Create scheduled call
  const call = await prisma.scheduledCall.create({
    data: {
      scheduleId: schedule.id,
      scheduledFor,
      status: transcript ? CallStatus.COMPLETED : CallStatus.SCHEDULED,
      transcript,
      completedAt: transcript ? new Date() : null,
    },
  });

  return {
    call,
    person,
    agent,
    schedule,
  };
}

export async function findScheduledCall({
  phoneNumber,
  userId,
  callId,
}: {
  phoneNumber: string;
  userId: string;
  callId?: string;
}) {
  // Find person
  const person = await prisma.person.findFirst({
    where: {
      phoneNumber,
      userId,
    },
  });

  if (!person) {
    return null;
  }

  // Find specific call or most recent
  const call = await prisma.scheduledCall.findFirst({
    where: {
      ...(callId ? { id: callId } : {}),
      schedule: {
        personId: person.id,
        userId,
      },
    },
    orderBy: callId ? undefined : {
      scheduledFor: "desc",
    },
    include: {
      schedule: {
        include: {
          person: true,
          agent: true,
        },
      },
    },
  });

  if (!call) {
    return null;
  }

  return {
    call,
    person: call.schedule.person,
    agent: call.schedule.agent,
    schedule: call.schedule,
  };
}

export async function updateCallTranscript({
  callId,
  transcript,
}: {
  callId: string;
  transcript: string;
}) {
  return prisma.scheduledCall.update({
    where: { id: callId },
    data: {
      transcript,
      status: CallStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
} 