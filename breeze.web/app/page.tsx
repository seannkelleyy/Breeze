'use client';
import BreezeAuthButton from '@/components/common/auth/BreezeAuthButton';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { SignUpButton } from '@clerk/clerk-react';
import Link from 'next/link';

const LandingPage = () => {
  const { user, isSignedIn } = useCurrentUser();

  return (
    <section className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <h1 className="w-full text-left text-5xl font-medium">Breeze</h1>
        <p className="w-full text-center">The personal financial planner</p>
        {isSignedIn ? (
          <div className="flex flex-col gap-2">
            <p className="w-full text-center">Welcome, {user?.firstName}</p>
            <Link href="/planner">
              <Button>Go to Dashboard</Button>
            </Link>
            <SignUpButton>
              <Button>Sign Up</Button>
            </SignUpButton>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <BreezeAuthButton />
            <p className="mt-4 w-full text-center text-sm">Don&apos;t have an account?</p>
            <SignUpButton>
              <Button className="w-min self-center">Sign Up</Button>
            </SignUpButton>
          </div>
        )}
      </div>
    </section>
  );
};

export default LandingPage;
