"use client"

import Link from "next/link"
import { NavItem } from "@/types"

interface DFDAFooterProps {
  navItems?: NavItem[]
}

export default function DFDAFooter({ navItems = [] }: DFDAFooterProps) {
  return (
    <footer className="mt-12 rounded-xl border-4 border-black bg-white p-4 text-center font-bold shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-4">
        <ul className="flex flex-wrap justify-center gap-4">
          {navItems.map((item, index) => (
            <li key={index}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {item.title}
                </a>
              ) : (
                <Link href={item.href} className="hover:underline">
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
      <p className="mb-4">
      </p>
      <div className="mt-4 border-t-2 border-black pt-4 text-sm font-normal">
        <p className="mb-2">
          The Foundation for the Eradication of Dementia and Mental Illness (FEDMI) is a private family foundation supporting projects that accelerate medical research, open science, and public health innovation.
        </p>
        <p className="mb-2">
          <strong>Mission:</strong> Support projects accelerating medical research and open science to reduce the global burden of dementia and mental illness.
        </p>
        <p>
          <strong>Contact:</strong>{" "}
          <a
            href="mailto:grants@crowdsourcingcures.org"
            className="hover:underline"
          >
            grants@crowdsourcingcures.org
          </a>
        </p>
      </div>
    </footer>
  )
}