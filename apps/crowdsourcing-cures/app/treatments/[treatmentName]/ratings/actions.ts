'use server'

import { prisma } from '@/lib/prisma'

export async function getTreatmentWithConditionRatings(treatmentName: string) {
  return prisma.dfdaTreatment.findFirst({
    where: {
      name: {
        equals: treatmentName,
        mode: 'insensitive'
      }
    },
    include: {
      conditionTreatments: {
        where: {
          popularity: {
            gt: 10
          }
        },
        include: {
          condition: true
        }
      }
    }
  })
} 