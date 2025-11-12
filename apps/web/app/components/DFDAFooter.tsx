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
        <div id="about" className="mb-4 scroll-mt-20">
          <p className="mb-2">
            The Foundation for the Eradication of Dementia and Mental Illness 
          </p>
          <p className="mb-2">
            Our Mission: 
            Radically accelerate medical research to end the global suffering caused by dementia and mental illness.
          </p>
        </div>
        <div id="contact" className="mb-4 scroll-mt-20">
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
        <div className="mt-4 border-t border-black pt-4 text-xs">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
          <p>
            © {new Date().getFullYear()} The Foundation for the Eradication of
            Dementia and Mental Illness. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}