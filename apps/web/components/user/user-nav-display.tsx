import React from "react"
import { NavItem } from "@/types"
import { User } from "next-auth"

import { UserAccountNav } from "./user-account-nav"

interface UserNavDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image" | "email">
  avatarNavItems?: NavItem[]
}

export function UserNavDisplay({
  user,
  avatarNavItems,
}: UserNavDisplayProps) {
  // if (!user.email) {
  //   return (
  //     <LoginPromptButton
  //       buttonText="Sign in"
  //       buttonVariant={buttonVariant}
  //       buttonSize="sm"
  //     />
  //   )
  // }
  if (!user.email) {
    return null
  }

  return (
    <UserAccountNav
      user={{
        name: user.name,
        image: user.image,
        email: user.email,
      }}
      avatarNavItems={avatarNavItems}
    />
  )
}