"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export type AdminTutor = {
  clerk_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  subjects: string[];
  cambridge_transcript_level: "o_level" | "a_level";
  teaching_level: "o_level" | "a_level" | "both";
  transcripts: Array<{
    storage_path: string;
    original_filename: string;
    transcript_type: "cambridge" | "additional";
    uploaded_at: string;
  }>;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  verification_notes: string | null;
  auto_verification_status: "not_run" | "running" | "passed" | "flagged" | "error";
  auto_verification_score: number | null;
  auto_verification_flags: Array<{
    filename?: string;
    code?: string;
    severity?: "low" | "medium" | "high";
    evidence?: string;
  }>;
  auto_verification_summary: string | null;
  auto_verified_at: string | null;
};

type BackendError = { detail?: unknown };

export type AdminTranscript = {
  transcript: AdminTutor["transcripts"][number];
  url: string;
};

function getBackendUrl(path: string) {
  const baseUrl = process.env.BACKEND_INTERNAL_URL;
  if (!baseUrl) throw new Error("BACKEND_INTERNAL_URL is not configured.");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function getBackendHeaders() {
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!secret) throw new Error("BACKEND_INTERNAL_SECRET is not configured.");
  return { "X-Internal-Secret": secret };
}

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("You must be signed in.");
  if (sessionClaims?.metadata?.is_admin !== true) throw new Error("Admin access required.");
  return userId;
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as BackendError;
    if (typeof body.detail === "string") return body.detail;
  } catch {}
  return response.statusText || `Request failed with status ${response.status}`;
}

export async function getVerificationQueue() {
  await requireAdmin();
  const response = await fetch(getBackendUrl("/api/backend/admin/tutors/verification"), {
    headers: getBackendHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as AdminTutor[];
}

export async function getTutorVerification(clerkId: string) {
  await requireAdmin();
  const response = await fetch(
    getBackendUrl(`/api/backend/admin/tutors/${encodeURIComponent(clerkId)}/verification`),
    { headers: getBackendHeaders(), cache: "no-store" },
  );
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as AdminTutor;
}

export async function getTutorTranscripts(clerkId: string) {
  await requireAdmin();
  const response = await fetch(
    getBackendUrl(`/api/backend/admin/tutors/${encodeURIComponent(clerkId)}/transcripts`),
    { headers: getBackendHeaders(), cache: "no-store" },
  );
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as AdminTranscript[];
}

export async function decideTutorVerification(
  clerkId: string,
  decision: "verified" | "rejected",
  notes: string,
) {
  await requireAdmin();
  const response = await fetch(
    getBackendUrl(`/api/backend/admin/tutors/${encodeURIComponent(clerkId)}/verification`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getBackendHeaders() },
      body: JSON.stringify({ decision, notes: notes.trim() || null }),
    },
  );
  if (!response.ok) throw new Error(await parseError(response));
  const result = (await response.json()) as {
    clerk_id: string;
    verification_status: "verified" | "rejected";
    verification_notes: string | null;
  };
  revalidatePath("/dashboard/admin");
  return result;
}
