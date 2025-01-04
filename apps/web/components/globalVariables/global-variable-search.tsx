"use client"

import { FC } from "react"

import { GenericVariableSearch } from "@/components/genericVariables/generic-variable-search"

type GlobalVariableSearchProps = {
  user: {
    id: string
  }
}

export const GlobalVariableSearch: FC<GlobalVariableSearchProps> = ({
  user,
}: {
  user: any
}) => <GenericVariableSearch user={user} includePublic={true} />
