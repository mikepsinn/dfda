import { dfdaPOST } from "./api-client"
import { Effectiveness } from "@prisma/client"
import { prisma } from "@/lib/db"

export async function fetchDfdaConditions() {
  return prisma.dfdaCondition.findMany()
}

export async function searchRatedConditions(query: string) {
  return prisma.dfdaCondition.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
    take: 5,
  })
}

export async function addTreatment(
  userId: string,
  conditionName: string,
  treatmentName: string,
  effectiveness: Effectiveness
) {
  const treatment = await prisma.dfdaTreatment.findUnique({
    where: {
      name: treatmentName,
    },
  })

  if (!treatment) {
    throw new Error("Treatment not found")
  }

  const condition = await prisma.dfdaCondition.findUnique({
    where: {
      name: conditionName,
    },
  })

  if (!condition) {
    throw new Error("Condition not found")
  }

  const userTreatment = await prisma.dfdaUserTreatmentReport.create({
    data: {
      userId,
      conditionId: condition.id,
      treatmentId: treatment.id,
      effectiveness,
      tried: true,
    },
  })

  return userTreatment
}

export async function updateTreatmentReport(
  userId: string,
  conditionName: string,
  treatmentName: string,
  effectiveness: Effectiveness
) {
  const treatment = await prisma.dfdaTreatment.findUnique({
    where: {
      name: treatmentName,
    },
  })

  if (!treatment) {
    throw new Error("Treatment not found")
  }

  const condition = await prisma.dfdaCondition.findUnique({
    where: {
      name: conditionName,
    },
  })

  if (!condition) {
    throw new Error("Condition not found")
  }

  const userTreatment = await prisma.dfdaUserTreatmentReport.update({
    where: {
      userId_treatmentId_conditionId: {
        userId,
        conditionId: condition.id,
        treatmentId: treatment.id,
      },
    },
    data: {
      effectiveness,
    },
  })

  return userTreatment
}

export async function searchReviewedTreatmentsAndConditions(query: string) {
  const treatments = await prisma.dfdaTreatment.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      featuredImage: true,
    },
    take: 5,
  })

  const conditions = await prisma.dfdaCondition.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
    take: 5,
  })

  return [
    ...treatments.map((t) => ({ ...t, type: "treatment" })),
    ...conditions.map((c) => ({ ...c, type: "condition" })),
  ]
}

export async function getConditionByNameWithTreatmentRatings(name: string) {
  return prisma.dfdaCondition.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    include: {
      conditionTreatments: {
        where: {
          popularity: {
            gt: 10,
          },
        },
        include: {
          treatment: true,
        },
        orderBy: [{ popularity: "desc" }, { averageEffect: "desc" }],
      },
    },
  })
}

export async function createDfdaApplication(
  name: string,
  description: string,
  redirectUri: string
): Promise<string> {
  const response = await dfdaPOST("apps/create", {
    appDisplayName: name,
    appDescription: description,
    homepageUrl: redirectUri,
    qmClientId: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
  })
  const data = response
  return data.clientId || data.qmClientId
}

export async function postMeasurements(measurements: any, yourUserId: any) {
  return dfdaPOST("measurements", measurements, yourUserId)
} 