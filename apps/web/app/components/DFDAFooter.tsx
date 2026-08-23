"use client"

import Link from "next/link"

export default function DFDAFooter() {
  return (
    <footer className="mt-12 rounded-xl border-4 border-black bg-white p-4 text-center font-bold shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* <div className="mb-4">
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
      </div> */}
      <div className="border-black pt-4 text-sm font-normal">
        <div id="contact" className="mb-4 scroll-mt-20">
          <p>
            <strong>Contact:</strong>{" "}
            <a
              href="mailto:grants@crowdsourcingcures.org"
              className="hover:underline"
            >
              hello@crowdsourcingcures.org
            </a>
          </p>
        </div>
        <div className="mt-4 border-t border-black pt-4 text-xs">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
