import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import TutorSearch from "./TutorSearch";

export default async function TutorsPage() {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth();

  if (!isAuthenticated) return redirectToSignIn();

  if (sessionClaims?.metadata?.role !== "student" && sessionClaims?.metadata?.is_admin !== true) {
    redirect("/dashboard");
  }

  return <TutorSearch />;
}
