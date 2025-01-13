"use client"

import React, { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { comparisonData } from "./dfda-comparison-data"

export default function DFDAComparisonTable() {
  const [selectedItem, setSelectedItem] = useState<number | null>(null)

  const Modal = ({
    item,
    onClose,
  }: {
    item: (typeof comparisonData)[0]
    onClose: () => void
  }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative my-4 w-full max-w-2xl rounded-xl border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-black bg-white p-4">
          <h3 className="text-lg font-bold">{item.category}</h3>
          <button
            onClick={onClose}
            className="rounded-full border-2 border-black p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="prose prose-sm max-w-none sm:prose-base lg:prose-lg">
            <ReactMarkdown>{item.details}</ReactMarkdown>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="overflow-hidden rounded-xl border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-6">
        <motion.h1
          className="mb-4 text-center text-2xl font-black sm:text-3xl md:text-4xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Benefits of the Global Disease Eradication Act
        </motion.h1>

        <motion.h2
          className="mb-6 text-center text-lg font-black sm:text-xl md:text-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Look at all these great features giving patients the right to particpate in decentralized clinical trials! 🚀
   
        </motion.h2>

        {/* Mobile View */}
        <div className="block sm:hidden">
          <div className="rounded-lg border-2 border-black">
            {/* Header */}
            <div className="grid grid-cols-3 gap-2 border-b-2 border-black bg-yellow-300 p-3">
              <div className="font-black">Category</div>
              <div className="font-black">FDA v1</div>
              <div className="font-black">FDA v2</div>
            </div>
            
            {/* Rows */}
            {comparisonData.map((item, index) => (
              <motion.div
                key={index}
                className="grid cursor-pointer grid-cols-3 gap-2 border-b-2 border-black p-3 hover:bg-gray-50 last:border-b-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedItem(index)}
              >
                <div className="font-bold">{item.category}</div>
                <div className="font-medium">{item.regularFDA}</div>
                <div className="font-medium">{item.decentralizedFDA}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b-4 border-black bg-yellow-300">
                  <th className="p-4 text-left font-black">Category</th>
                  <th className="p-4 text-left font-black">FDA v1</th>
                  <th className="p-4 text-left font-black">
                    FDA v2
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <motion.tr
                    key={index}
                    className="cursor-pointer border-b-2 border-black hover:bg-gray-50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedItem(index)}
                  >
                    <td className="p-4 font-bold">{item.category}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 font-medium">
                        {item.regularFDA}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 font-medium">
                        {item.decentralizedFDA}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {selectedItem !== null && (
          <Modal
            item={comparisonData[selectedItem]}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
