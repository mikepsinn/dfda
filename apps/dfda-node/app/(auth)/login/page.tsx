// import Link from "next/link"
import { LoginForm } from "./login-form"
import type { Metadata } from 'next';
import { getMetadataFromNavKey } from '@/lib/metadata';

// Generate metadata using the helper function
export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey('login');
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      {/* <Link href="/" className="text-muted-foreground hover:text-foreground">
        Back to Home
      </Link> */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8">
        <LoginForm />
      </div>
    </div>
  );
}

