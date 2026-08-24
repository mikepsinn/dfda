import { prisma } from "@/lib/prisma"

export async function getAuthorByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      _count: {
        select: { authoredArticles: true }
      }
    }
  })
}

export async function getAuthors() {
  return prisma.user.findMany({
    where: {
      authoredArticles: {
        some: {}
      }
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      _count: {
        select: { authoredArticles: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getAuthorForMetadata(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true
    }
  })
} 