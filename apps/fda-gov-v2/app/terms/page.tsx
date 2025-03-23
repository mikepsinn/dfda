import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Terms of Service</h1>
            </div>

            <div className="prose prose-slate max-w-none">
              <p className="lead">Last Updated: March 1, 2025</p>

              <p>
                Welcome to FDA.gov v2. These Terms of Service ("Terms") govern your access to and use of the FDA.gov v2
                platform, including any content, functionality, and services offered on or through the platform.
              </p>

              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using the FDA.gov v2 platform, you agree to be bound by these Terms. If you do not agree
                to these Terms, you must not access or use the platform.
              </p>

              <h2>2. Changes to Terms</h2>
              <p>
                We may revise these Terms from time to time. The most current version will always be posted on this
                page. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking
                effect.
              </p>

              <h2>3. Platform Access and Security</h2>
              <p>
                You are responsible for safeguarding your account information and for all activities that occur under
                your account. You agree to notify us immediately of any unauthorized access to or use of your account.
              </p>

              <h2>4. User Responsibilities</h2>
              <h3>4.1 For Trial Sponsors</h3>
              <p>As a trial sponsor, you are responsible for:</p>
              <ul>
                <li>Providing accurate and complete information about your clinical trials</li>
                <li>Ensuring all trial protocols comply with applicable laws and regulations</li>
                <li>Maintaining appropriate insurance coverage for trial participants</li>
                <li>Protecting participant data in accordance with privacy laws</li>
                <li>Accurately reporting trial results</li>
              </ul>

              <h3>4.2 For Patients</h3>
              <p>As a patient participant, you are responsible for:</p>
              <ul>
                <li>Providing accurate personal and health information</li>
                <li>Following trial protocols as agreed upon enrollment</li>
                <li>Reporting adverse events promptly</li>
                <li>Completing required follow-ups and data submissions</li>
              </ul>

              <h2>5. Data Privacy and Security</h2>
              <p>
                We take data privacy and security seriously. All personal and health information is handled in
                accordance with our Privacy Policy and applicable laws. Trial sponsors must adhere to strict data
                protection standards.
              </p>

              <h2>6. Intellectual Property</h2>
              <p>
                The FDA.gov v2 platform and its original content, features, and functionality are owned by FDA.gov v2
                and are protected by international copyright, trademark, patent, trade secret, and other intellectual
                property laws.
              </p>

              <h2>7. User Content</h2>
              <p>
                By submitting content to the platform, you grant us a worldwide, non-exclusive, royalty-free license to
                use, reproduce, modify, adapt, publish, translate, and distribute your content in any existing or future
                media formats.
              </p>

              <h2>8. Prohibited Uses</h2>
              <p>You may not use the FDA.gov v2 platform:</p>
              <ul>
                <li>In any way that violates applicable laws or regulations</li>
                <li>To impersonate or attempt to impersonate another person or entity</li>
                <li>To engage in any conduct that restricts or inhibits anyone's use of the platform</li>
                <li>To attempt to gain unauthorized access to the platform or user accounts</li>
                <li>To transmit any malicious code or viruses</li>
              </ul>

              <h2>9. Limitation of Liability</h2>
              <p>
                FDA.gov v2 shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                resulting from your access to or use of, or inability to access or use, the platform or any content
                thereon.
              </p>

              <h2>10. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States, without
                regard to its conflict of law provisions.
              </p>

              <h2>11. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us at legal@fdav2.gov.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

