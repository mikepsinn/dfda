import Link from "next/link"

import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"

export default async function OpenSource() {
  await fetch(
    "https://api.github.com/repos/decentralized-fda/decentralized-fda",
    {
      next: { revalidate: 60 },
    }
  )
    .then((res) => res.json())
    .catch((e) => console.error(e))

  const buttonText = `Fork This Website On GitHub!`

  return (
    <section className="neobrutalist-markdown-container">
      <div className="flex flex-col items-center gap-8">
        <div className="neobrutalist-gradient-container neobrutalist-gradient-pink text-center text-white">
          <h1 className="neobrutalist-hero-title">
            Think this website sucks?
          </h1>
          <p className="neobrutalist-description">
            Unlike normal government agencies, you can just fork it and fix it!
          </p>
        </div>
        <Link
          href={siteConfig.links.github}
          target="_blank"
          className="group neobrutalist-button"
        >
          <Icons.star className="h-6 w-6" />
          <span className="text-xl">{buttonText}</span>
        </Link>
      </div>
    </section>
  )
}
