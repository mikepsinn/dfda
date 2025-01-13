"use client"

import React, { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"

import { comparisonData } from "./dfda-comparison-data"

export default function DFDAComparisonTable() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const DetailPanel = ({ 
    category,
    regularContent,
    decentralizedContent,
    regularIcon,
    decentralizedIcon
  }: { 
    category: string
    regularContent: string
    decentralizedContent: string
    regularIcon?: string
    decentralizedIcon?: string
  }) => (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden bg-gray-50 px-2 py-3 sm:px-4 sm:py-6"
    >
      <div className="grid gap-3 sm:gap-6 md:grid-cols-3">
        <div className="rounded-lg border-2 border-black bg-yellow-100 p-3 sm:rounded-xl sm:p-4">
          <h4 className="mb-2 flex items-center gap-2 font-black text-sm sm:text-base">
            {regularIcon && <span className="text-xl sm:text-2xl">{regularIcon}</span>}
            Current Process
          </h4>
          <div className="space-y-2 text-sm sm:text-base">
            <p className="font-bold">Current Timeline:</p>
            <ul className="ml-4 list-disc space-y-1">
              {regularContent.split('\n').filter(line => line.trim().startsWith('-')).map((line, i) => (
                <li key={i}>{line.trim().substring(1).trim()}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border-2 border-black bg-green-100 p-3 sm:rounded-xl sm:p-4">
          <h4 className="mb-2 flex items-center gap-2 font-black text-sm sm:text-base">
            {decentralizedIcon && <span className="text-xl sm:text-2xl">{decentralizedIcon}</span>}
            Improvements
          </h4>
          <div className="space-y-2 text-sm sm:text-base">
            <p className="font-bold">New Approach:</p>
            <ul className="ml-4 list-disc space-y-1">
              {decentralizedContent.split('\n').filter(line => line.trim().startsWith('-')).map((line, i) => (
                <li key={i}>{line.trim().substring(1).trim()}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border-2 border-black bg-blue-100 p-3 sm:rounded-xl sm:p-4">
          <h4 className="mb-2 flex items-center gap-2 font-black text-sm sm:text-base">
            💡 Key Benefits
          </h4>
          <div className="space-y-2 text-sm sm:text-base">
            <ul className="ml-4 list-disc space-y-1">
              <li>Faster development and approval</li>
              <li>Lower costs and better access</li>
              <li>Improved patient outcomes</li>
              <li>Real-world data collection</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="overflow-hidden rounded-lg border-2 sm:rounded-xl sm:border-4 border-black bg-white p-2 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <motion.h1
          className="mb-2 sm:mb-4 text-center text-xl font-black sm:text-3xl md:text-4xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Benefits of the Global Disease Eradication Act
        </motion.h1>

        <motion.h2
          className="mb-4 sm:mb-6 text-center text-base font-black sm:text-xl md:text-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Look at all these great features giving patients the right to effortlessly particpate in decentralized clinical trials! 🚀
        </motion.h2>

        <div className="-mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b-2 sm:border-b-4 border-black bg-yellow-300">
                    <th className="p-2 sm:p-4 text-left font-black text-sm sm:text-base">Category</th>
                    <th className="p-2 sm:p-4 text-right font-black text-sm sm:text-base">FDA v1</th>
                    <th className="p-2 sm:p-4 text-right font-black text-sm sm:text-base">FDA v2</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item, index) => (
                    <React.Fragment key={item.category}>
                      <motion.tr
                        className={`cursor-pointer border-b border-black sm:border-b-2 hover:bg-gray-50 ${
                          expandedItem === item.category ? "bg-gray-50" : ""
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() =>
                          setExpandedItem(
                            expandedItem === item.category ? null : item.category
                          )
                        }
                      >
                        <td className="p-2 sm:p-4">
                          <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                            {item.category}
                            {expandedItem === item.category ? (
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 text-right">
                          <span className="inline-flex items-center gap-1 sm:gap-2 rounded border-2 border-black bg-white px-2 py-0.5 sm:px-3 sm:py-1 text-sm sm:text-base font-medium shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {item.regularFDA.value}
                          </span>
                        </td>
                        <td className="p-2 sm:p-4 text-right">
                          <span className="inline-flex items-center gap-1 sm:gap-2 rounded border-2 border-black bg-white px-2 py-0.5 sm:px-3 sm:py-1 text-sm sm:text-base font-medium shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {item.decentralizedFDA.value}
                          </span>
                        </td>
                      </motion.tr>
                      <tr>
                        <td colSpan={3} className="p-0">
                          <AnimatePresence>
                            {expandedItem === item.category && (
                              <DetailPanel
                                category={item.category}
                                regularContent={item.regularFDA.content}
                                decentralizedContent={item.decentralizedFDA.content}
                                regularIcon={item.regularFDA.icon}
                                decentralizedIcon={item.decentralizedFDA.icon}
                              />
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 rounded-lg sm:rounded-xl border-2 border-black bg-blue-100 p-3 sm:p-4">
          <h3 className="mb-2 font-black text-sm sm:text-base">💡 Key Benefits</h3>
          <ul className="list-inside list-disc space-y-1 sm:space-y-2 text-sm sm:text-base">
            <li>Dramatically faster access to treatments</li>
            <li>96% reduction in research costs</li>
            <li>Universal access to clinical trials</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
