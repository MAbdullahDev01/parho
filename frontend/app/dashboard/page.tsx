import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardEntryPage() {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth();

  if (!isAuthenticated) return redirectToSignIn();

  const role = sessionClaims?.metadata?.role;
  const isAdmin = sessionClaims?.metadata?.is_admin === true;
  
  if (!role) redirect("/onboarding");

  if (!isAdmin) {
    redirect(`/dashboard/${role}`);
  }
}