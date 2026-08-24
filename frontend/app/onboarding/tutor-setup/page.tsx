import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import TutorSetup from "./TutorSetup";

type SessionClaimsWithMetadata = {
  metadata?: {
    role?: string;
  };
};

export default async function TutorSetupPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/onboarding");
  }

  const claims = sessionClaims as SessionClaimsWithMetadata | null;

  if (claims?.metadata?.role !== "tutor") {
    redirect("/onboarding");
  }

  return <TutorSetup clerkId={userId} />;
}