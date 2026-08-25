"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TranscriptType = "cambridge" | "additional";
export type CambridgeTranscriptLevel = "o_level" | "a_level";
export type TeachingLevel = "o_level" | "a_level" | "both";

export type TranscriptRecord = {
  storage_path: string;
  original_filename: string;
  transcript_type: TranscriptType;
  uploaded_at: string;
};

export type TutorProfileRequest = {
  clerk_id: string;
  subjects: string[];
  cambridge_transcript_level: CambridgeTranscriptLevel;
  teaching_level: TeachingLevel;
  transcripts: TranscriptRecord[];
};

export type SavedTutorProfile = TutorProfileRequest & {
  verification_status: "pending" | string;
};

type BackendError = { detail?: string | unknown };

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

type SessionClaimsWithMetadata = {
  metadata?: { role?: string };
};

async function requireTutor() {
  const { userId, sessionClaims } = await auth();

  if (!userId) redirect("/onboarding");

  const claims = sessionClaims as SessionClaimsWithMetadata | null;
  if (claims?.metadata?.role !== "tutor") redirect("/onboarding");

  return userId;
}

/* -------------------------------------------------------------------------- */
/* Backend request helpers                                                    */
/* -------------------------------------------------------------------------- */

function getBackendUrl(path: string) {
  const baseUrl = process.env.BACKEND_INTERNAL_URL;
  if (!baseUrl) throw new Error("BACKEND_INTERNAL_URL is not configured.");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function getBackendHeaders(tutorId: string) {
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!secret) throw new Error("BACKEND_INTERNAL_SECRET is not configured.");
  return {
    "X-Internal-Secret": secret,
    "X-Tutor-Id": tutorId,
  };
}

async function parseBackendError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as BackendError;
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "msg" in item &&
            typeof item.msg === "string"
          ) return item.msg;
          return String(item);
        })
        .join(", ");
    }
    if (body.detail !== undefined) return JSON.stringify(body.detail);
  } catch {}
  return response.statusText || `Request failed with status ${response.status}`;
}

/* -------------------------------------------------------------------------- */
/* Subjects                                                                   */
/* -------------------------------------------------------------------------- */

export async function getTutorSubjects(): Promise<ActionResult<string[]>> {
  const tutorId = await requireTutor();

  try {
    const response = await fetch(getBackendUrl("/api/backend/tutors/subjects"), {
      method: "GET",
      headers: getBackendHeaders(tutorId),
      cache: "no-store",
    });

    if (!response.ok) return { success: false, error: await parseBackendError(response) };

    const subjects = (await response.json()) as string[];
    if (!Array.isArray(subjects)) {
      return { success: false, error: "The server returned an invalid subject list." };
    }

    return { success: true, data: subjects };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to load subjects. Please try again.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Transcript upload                                                          */
/* -------------------------------------------------------------------------- */

export async function uploadTutorTranscript(
  formData: FormData,
): Promise<ActionResult<TranscriptRecord>> {
  const clerkId = await requireTutor();

  try {
    const file = formData.get("file");
    const transcriptType = formData.get("transcript_type");

    if (!(file instanceof File)) return { success: false, error: "Please select a transcript file." };
    if (transcriptType !== "cambridge" && transcriptType !== "additional") {
      return { success: false, error: "Invalid transcript type." };
    }

    const backendFormData = new FormData();
    backendFormData.append("clerk_id", clerkId);
    backendFormData.append("transcript_type", transcriptType);
    backendFormData.append("file", file, file.name);

    const response = await fetch(getBackendUrl("/api/backend/tutors/transcripts"), {
      method: "POST",
      headers: getBackendHeaders(clerkId),
      body: backendFormData,
    });

    if (!response.ok) return { success: false, error: await parseBackendError(response) };

    const body = (await response.json()) as { transcript?: TranscriptRecord };
    if (!body.transcript) {
      return { success: false, error: "The server did not return the uploaded transcript." };
    }

    return { success: true, data: body.transcript };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transcript upload failed. Please try again.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export async function saveTutorProfile(
  profile: Omit<TutorProfileRequest, "clerk_id">,
): Promise<ActionResult<SavedTutorProfile>> {
  const clerkId = await requireTutor();

  try {
    const payload: TutorProfileRequest = {
      clerk_id: clerkId,
      subjects: profile.subjects,
      cambridge_transcript_level: profile.cambridge_transcript_level,
      teaching_level: profile.teaching_level,
      transcripts: profile.transcripts,
    };

    if (
      payload.cambridge_transcript_level === "o_level" &&
      payload.teaching_level !== "o_level"
    ) {
      return {
        success: false,
        error: "An O-Level Cambridge transcript only permits O-Level teaching.",
      };
    }

    if (!payload.transcripts.some((transcript) => transcript.transcript_type === "cambridge")) {
      return { success: false, error: "A Cambridge transcript is required." };
    }

    const response = await fetch(getBackendUrl("/api/backend/tutors/profile"), {
      method: "POST",
      headers: {
        ...getBackendHeaders(clerkId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return { success: false, error: await parseBackendError(response) };

    return { success: true, data: (await response.json()) as SavedTutorProfile };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save your tutor profile.",
    };
  }
}
