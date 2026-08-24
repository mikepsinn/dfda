'use client'

import React from "react"
import { motion } from "framer-motion"
import { 
  Skull, 
  Clock, 
  Ban,
  Users,
  FileX,
  FlaskConical
} from "lucide-react"

export default function ProblemSection() {
  const problems = [
    {
      icon: <Skull className="h-12 w-12" />,
      title: "150,000 People Die Every Day",
      description: "From possibly preventable degenerative diseases. This is equivalent to FIFTY-ONE September 11th attacks every day.",
      image: "https://static.crowdsourcingcures.org/dfda/assets/deaths-from-disease-vs-deaths-from-terrorism-chart.png"
    },
    {
      icon: <Users className="h-12 w-12" />,
      title: "Trials Exclude 85% of Patients",
      description: "Only 14.5% of patients with major depressive disorder would qualify for antidepressant trials. Results don't represent real patients.",
      image: "https://static.crowdsourcingcures.org/dfda/assets/wellbutrin-effectiveness-small-sample-size.png"
    },
    {
      icon: <FileX className="h-12 w-12" />,
      title: "Negative Results Hidden",
      description: "57% of clinical trials go unpublished, leading to billions wasted repeating failed research.",
      stats: {
        highlight: "$100M",
        subtext: "could be saved by better predicting failures"
      }
    },
    {
      icon: <FlaskConical className="h-12 w-12" />,
      title: "We Know Almost Nothing",
      description: "We've only studied 21,000 out of 166 billion possible medicinal compounds.",
      image: "https://static.crowdsourcingcures.org/dfda/assets/number-of-molecules-with-drug-like-properties (1).png"
    },
    {
      icon: <Clock className="h-12 w-12" />,
      title: "10+ Years to Market",
      description: "It takes over 10 years and $1.6 billion to bring a drug to market (including failed attempts).",
      stats: {
        highlight: "$20M",
        subtext: "saved by catching failures earlier"
      }
    },
    {
      icon: <Ban className="h-12 w-12" />,
      title: "No Data on Most Molecules",
      description: "We know nothing about the long-term effects of 99.9% of the 7,000+ chemicals you consume daily.",
      image: "https://static.crowdsourcingcures.org/dfda/assets/how-much-we-know.png"
    }
  ]

  return (
    <section className="neobrutalist-container space-y-8">
      <motion.h2 
        className="neobrutalist-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        The Problem: You and Everyone You Love Will Suffer and Die
      </motion.h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {problems.map((problem, index) => (
          <motion.div
            key={problem.title}
            className="neobrutalist-gradient-container neobrutalist-gradient-pink"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              {problem.icon}
              <h3 className="text-2xl font-black">{problem.title}</h3>
              <p className="font-bold">{problem.description}</p>
              {problem.image && (
                <img 
                  src={problem.image} 
                  alt={problem.title}
                  className="w-full rounded-lg border-2 border-black"
                />
              )}
              {problem.stats && (
                <div className="mt-4 rounded-xl border-4 border-black bg-white p-4">
                  <p className="text-3xl font-black text-[#FF3366]">{problem.stats.highlight}</p>
                  <p className="font-bold">{problem.stats.subtext}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="neobrutalist-gradient-container neobrutalist-gradient-green"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex flex-col items-center gap-6">
          <h3 className="text-2xl font-black">The Scale of What We Don't Know</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <p className="text-4xl font-black">7,000+</p>
              <p className="font-bold">Known diseases affecting humans</p>
              <img 
                src="https://static.crowdsourcingcures.org/dfda/assets/rare-diseases.jpg"
                alt="Rare diseases diagram"
                className="w-full rounded-lg border-2 border-black"
              />
            </div>
            <div className="space-y-4">
              <p className="text-4xl font-black">166 Billion</p>
              <p className="font-bold">Untested compounds with drug-like properties</p>
              <div className="rounded-xl border-4 border-black bg-white p-4">
                <p className="text-3xl font-black text-[#FF3366]">0.000000002%</p>
                <p className="font-bold">of possible treatments studied so far</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
} 