import Link from "next/link"

import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"

export default async function OpenSource() {
  const { stargazers_count: stars } = await fetch(
    "https://api.github.com/repos/dfda/dfda",
    {
      next: { revalidate: 60 },
    }
  )
    .then((res) => res.json())
    .catch((e) => console.error(e))

  const buttonText = `Fork Me On GitHub!`

  return (
    <section className="neobrutalist-markdown-container">
      <div className="flex flex-col items-center gap-8">
        <div className="neobrutalist-gradient-container neobrutalist-gradient-pink text-center text-white">
          <h1 className="neobrutalist-hero-title">
            Think the dFDA sucks?
          </h1>
          <p className="neobrutalist-description">
            Unlike normal government agencies, you can just fork it and make a better one!
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
