import { AuthShell } from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/ClerkAppearance";
import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up — Parho",
};

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Join Parho"
      title="Learn from expert tutors whenever you need them."
      subtitle="Sign up to find verified tutors, book free demos, and pay hourly with escrow protection."
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}