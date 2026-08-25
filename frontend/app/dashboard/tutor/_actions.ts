"use server";

import { auth } from "@clerk/nextjs/server";

export type TutorDashboardProfile = {
  clerk_id: string;
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

type BackendError = { detail?: string | unknown };
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function getBackendUrl(path: string) {
  const baseUrl = process.env.BACKEND_INTERNAL_URL;
  if (!baseUrl) throw new Error("BACKEND_INTERNAL_URL is not configured.");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function getBackendHeaders(tutorId: string) {
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!secret) throw new Error("BACKEND_INTERNAL_SECRET is not configured.");
  return { "X-Internal-Secret": secret, "X-Tutor-Id": tutorId };
}

async function parseBackendError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as BackendError;
    if (typeof body.detail === "string") return body.detail;
  } catch {}
  return response.statusText || `Request failed with status ${response.status}`;
}

export async function getTutorDashboardProfile(): Promise<
  ActionResult<TutorDashboardProfile | null>
> {
  const { userId } = await auth();

  if (!userId) return { success: false, error: "You must be signed in." };

  try {
    const response = await fetch(
      getBackendUrl(`/api/backend/tutors/profile/${encodeURIComponent(userId)}`),
      {
        method: "GET",
        headers: getBackendHeaders(userId),
        cache: "no-store",
      },
    );

    if (response.status === 404) return { success: true, data: null };
    if (!response.ok) return { success: false, error: await parseBackendError(response) };

    return { success: true, data: (await response.json()) as TutorDashboardProfile };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to load your tutor profile.",
    };
  }
}
