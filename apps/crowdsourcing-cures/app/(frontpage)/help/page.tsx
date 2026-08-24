import { Shell } from "@/components/layout/shell"
import Link from "next/link"

export default function HelpPage() {
  return (
    <Shell>
      <div className="container mx-auto space-y-8 px-4 py-6 md:px-6 md:py-8">
        <div className="neobrutalist-gradient-container neobrutalist-gradient-pink">
          <h1 className="neobrutalist-title text-white">❓ Help & Support</h1>
          <p className="neobrutalist-description text-white/90">Learn how to use the Decentralized FDA platform</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="neobrutalist-container space-y-4">
            <h2 className="neobrutalist-h2">🚀 Getting Started</h2>
            <ul className="space-y-2">
              <li className="neobrutalist-li">👤 Create an account to start tracking your health data</li>
              <li className="neobrutalist-li">📊 Add measurements to track your symptoms and treatments</li>
              <li className="neobrutalist-li">🔬 Join studies to contribute to medical research</li>
              <li className="neobrutalist-li">💡 Share your experiences with treatments and conditions</li>
            </ul>
          </section>

          <section className="neobrutalist-container space-y-4">
            <h2 className="neobrutalist-h2">✨ Key Features</h2>
            <ul className="space-y-2">
              <li className="neobrutalist-li">📈 Track measurements and symptoms over time</li>
              <li className="neobrutalist-li">🧪 Participate in decentralized clinical studies</li>
              <li className="neobrutalist-li">🤝 Connect with others who share similar conditions</li>
              <li className="neobrutalist-li">🔍 Access aggregated health insights</li>
            </ul>
          </section>

          <section className="neobrutalist-container space-y-4">
            <h2 className="neobrutalist-h2">🔒 Privacy & Security</h2>
            <ul className="space-y-2">
              <li className="neobrutalist-li">🛡️ Your health data is encrypted and secure</li>
              <li className="neobrutalist-li">🎛️ You control what data you share</li>
              <li className="neobrutalist-li">🕶️ Participate in studies anonymously</li>
              <li className="neobrutalist-li">🔐 Choose what information is visible to others</li>
              <li className="neobrutalist-li">
                <a 
                  href="mailto:security@dfda.earth"
                  className="neobrutalist-link"
                >
                  🚨 Report security issues to security@dfda.earth
                </a>
              </li>
            </ul>
          </section>

          <section className="neobrutalist-container space-y-4">
            <h2 className="neobrutalist-h2">💬 Contact Support</h2>
            <p className="neobrutalist-p">Need help? Have questions? We're here to help:</p>
            <ul className="space-y-2">
              <li className="neobrutalist-li">
                <a 
                  href="mailto:support@dfda.earth"
                  className="neobrutalist-link"
                >
                  ✉️ Email: support@dfda.earth
                </a>
              </li>
              <li className="neobrutalist-li">
                <a 
                  href="https://github.com/orgs/decentralized-fda/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neobrutalist-link"
                >
                  👥 Join our community forum
                </a>
              </li>
              <li className="neobrutalist-li">
                <Link href="/docs" className="neobrutalist-link">
                  📚 Check our documentation
                </Link>
              </li>
              <li className="neobrutalist-li">
                <a 
                  href="https://github.com/decentralized-fda/decentralized-fda/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="neobrutalist-link"
                >
                  🐛 Submit an issue on GitHub
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </Shell>
  )
}
