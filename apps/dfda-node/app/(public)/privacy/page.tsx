import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from 'next';
import { getMetadataFromNavKey } from '@/lib/metadata';

// Generate metadata using the helper function
export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey('privacy');
}

export default async function PrivacyPolicy() {

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
            </div>

            <div className="prose prose-slate max-w-none">
              <p className="lead">Last Updated: March 1, 2025</p>

              <p>
                This Privacy Policy describes how FDA.gov v2 collects, uses, and shares your personal information when
                you use our platform. We take your privacy seriously and are committed to protecting your personal and
                health information.
              </p>

              <h2>1. Information We Collect</h2>

              <h3>1.1 Information You Provide</h3>
              <p>We collect information you provide directly to us, including:</p>
              <ul>
                <li>Account information (name, email, password)</li>
                <li>Profile information (demographic data, contact details)</li>
                <li>Health information (medical conditions, medications, symptoms)</li>
                <li>Trial participation data (responses, outcomes, follow-ups)</li>
                <li>Communications with us</li>
              </ul>

              <h3>1.2 Information We Collect Automatically</h3>
              <p>When you use our platform, we automatically collect certain information, including:</p>
              <ul>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Location information (general location based on IP address)</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve our platform</li>
                <li>Match patients with appropriate clinical trials</li>
                <li>Generate comparative effectiveness data</li>
                <li>Create personalized health insights</li>
                <li>Communicate with you about the platform</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Protect the security and integrity of our platform</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2>3. How We Share Your Information</h2>

              <h3>3.1 With Research Partners</h3>
              <p>
                If you enroll in a clinical trial, your data will be shared with the research partner conducting the
                trial. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your health information and trial-related data</li>
                <li>De-identified data for analysis</li>
                <li>Contact information for trial-related communications</li>
              </ul>

              <h3>3.2 With Service Providers</h3>
              <p>
                We may share your information with third-party vendors who provide services on our behalf, such as
                hosting, data analysis, payment processing, and customer service. These providers have access to your
                information only to perform these tasks and are obligated to protect your information.
              </p>

              <h3>3.3 For Research and Analysis</h3>
              <p>
                We use aggregated, anonymized data for research purposes and to generate comparative effectiveness
                insights. This information does not identify individual users.
              </p>

              <h3>3.4 For Legal Reasons</h3>
              <p>We may share information if required by law, regulation, legal process, or governmental request.</p>

              <h2>4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information.
                However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot
                guarantee absolute security.
              </p>

              <h2>5. Your Rights and Choices</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul>
                <li>Accessing your personal information</li>
                <li>Correcting inaccurate information</li>
                <li>Deleting your information</li>
                <li>Restricting or objecting to processing</li>
                <li>Data portability</li>
                <li>Withdrawing consent</li>
              </ul>
              <p>To exercise these rights, please contact us at privacy@fdav2.gov.</p>

              <h2>6. Children's Privacy</h2>
              <p>
                Our platform is not intended for children under 18 years of age. We do not knowingly collect personal
                information from children under 18. If we learn we have collected personal information from a child
                under 18, we will delete that information.
              </p>

              <h2>7. International Data Transfers</h2>
              <p>
                Your information may be transferred to, and processed in, countries other than the country in which you
                reside. These countries may have different data protection laws. We ensure appropriate safeguards are in
                place to protect your information when transferred internationally.
              </p>

              <h2>8. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page and updating the "Last Updated" date.
              </p>

              <h2>9. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at privacy@fdav2.gov.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

