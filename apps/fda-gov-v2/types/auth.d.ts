import { User as NextAuthUser } from "next-auth"

type UserId = string

declare module "next-auth/jwt" {
  interface JWT {
    id: UserId
  }
}

declare module "next-auth" {
  interface Session {
    user: NextAuthUser & {
      id: UserId
    }
  }
}

export interface ExtendedUser extends NextAuthUser {
  id: UserId
} 