import { ContactForm } from './contact-form'; // Use named import
import { getMetadataFromNavKey } from '@/lib/metadata'; // Import the helper
import type { Metadata } from 'next';

// Generate metadata using the helper function
export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey('contact');
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Us</h1>
          <p className="mt-4 text-muted-foreground">
            Have a question or need assistance? Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>
        <ContactForm />
      </div>
    </div>
  )
}
