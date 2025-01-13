"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { NeoBrutalMarkdown } from "@/components/markdown/neo-brutal-markdown"
import { getProblems } from "@/app/dfdaActions"
import type { ProcessedMarkdownFile } from "@/lib/markdown/get-markdown-files"
import { FullScreenModal } from "@/app/components/FullScreenModal"
import { NeoBrutalistBox } from "@/app/components/NeoBrutalistBox"

interface ProblemCardProps {
  name: string
  description?: string
  icon?: string
  onClick: () => void
}

const ProblemCard = ({ name, description, icon, onClick }: ProblemCardProps) => (
  <NeoBrutalistBox onClick={onClick}>
    <div className="mb-4 text-4xl">{icon}</div>
    <h3 className="mb-2 text-xl font-black">{name}</h3>
    <p className="mb-4 font-bold text-gray-700">{description}</p>
  </NeoBrutalistBox>
)

const ProblemsWithCurrentSystem = () => {
  const [problems, setProblems] = useState<ProcessedMarkdownFile[]>([])
  const [selectedProblem, setSelectedProblem] = useState<ProcessedMarkdownFile | null>(null)

  useEffect(() => {
    const loadProblems = async () => {
      try {
        const problemsData = await getProblems()
        setProblems(problemsData)
      } catch (error) {
        console.error("Error loading problems:", error)
      }
    }

    loadProblems()
  }, [])

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 p-2"
    >
      <NeoBrutalistBox className="bg-red-500 text-center">
        <h2 className="mb-4 text-4xl font-black uppercase tracking-tight">
          Problems With The Current System 🏥
        </h2>
      </NeoBrutalistBox>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {problems.map((problem, index) => (
          <ProblemCard
            key={index}
            name={problem.name}
            description={problem.description}
            icon={problem.metadata?.icon}
            onClick={() => setSelectedProblem(problem)}
          />
        ))}
      </div>

      {selectedProblem && (
        <FullScreenModal
          content={selectedProblem.content}
          onClose={() => setSelectedProblem(null)}
        />
      )}
    </motion.section>
  )
}

export default ProblemsWithCurrentSystem
