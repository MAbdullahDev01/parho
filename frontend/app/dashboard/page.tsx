import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardEntryPage() {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth();

  if (!isAuthenticated) return redirectToSignIn();

  const role = sessionClaims?.metadata?.role;
  if (!role) redirect("/onboarding");

  redirect(`/dashboard/${role}`);
}