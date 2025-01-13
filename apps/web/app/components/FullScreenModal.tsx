"use client"

import { createPortal } from "react-dom"
import { NeoBrutalMarkdown } from "@/components/markdown/neo-brutal-markdown"

interface FullScreenModalProps {
  content: string
  onClose: () => void
}

export const FullScreenModal = ({ content, onClose }: FullScreenModalProps) => createPortal(
  <div className="fixed inset-0 z-[100] flex flex-col bg-white">
    {/* Sticky header with close button */}
    <div className="sticky top-0 z-10 flex justify-end p-4">
      <button
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-red-500 font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none hover:bg-red-600"
        aria-label="Close"
      >
        ×
      </button>
    </div>

    {/* Scrollable content */}
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 pb-8 md:px-8">
        <NeoBrutalMarkdown>{content}</NeoBrutalMarkdown>
        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-lg border-4 border-black bg-red-500 px-6 py-2 font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
) 