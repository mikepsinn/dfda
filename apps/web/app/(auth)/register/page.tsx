import type { Metadata } from 'next';
import { getMetadataFromNavKey } from '@/lib/metadata';
import { isGoogleSignInEnabled } from '@/lib/auth';
import { SignInCard } from '@/components/auth/sign-in-card';

// Generate metadata using the helper function
export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey('register');
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8">
        <SignInCard mode="register" googleEnabled={isGoogleSignInEnabled} />
      </div>
    </div>
  );
}
