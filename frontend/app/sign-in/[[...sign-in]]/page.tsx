import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/ClerkAppearance";

export const metadata: Metadata = {
  title: "Log in — Parho",
};

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Pick up right where your <span className="italic">last class</span>{" "}
          left off.
        </>
      }
      subtitle="Log in to message your tutor, review upcoming demos, and track escrow-protected hours."
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}