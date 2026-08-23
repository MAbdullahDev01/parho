import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/ClerkAppearance";

export const metadata: Metadata = {
  title: "Create your account — Parho",
};

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Join Parho"
      title={
        <>
          Every tutor, <span className="italic">verified</span> on paper.
        </>
      }
      subtitle="Create an account in under a minute — book a free 15-minute demo before a single rupee changes hands."
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={clerkAppearance}
      />
      <p className="mt-5 text-center text-sm text-slate">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-stamp transition-colors hover:text-stamp-deep"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
