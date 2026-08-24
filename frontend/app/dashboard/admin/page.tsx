import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getTutorTranscripts, getTutorVerification, getVerificationQueue } from "./_actions";
import { VerificationReview } from "./VerificationReview";

function tutorName(tutor: { first_name: string | null; last_name: string | null; email: string | null }) {
  return [tutor.first_name, tutor.last_name].filter(Boolean).join(" ") || tutor.email || "Unnamed tutor";
}

function screeningLabel(status: string) {
  if (status === "flagged") return "Needs review";
  if (status === "passed") return "Low risk";
  if (status === "running") return "Screening";
  if (status === "error") return "Unavailable";
  return "Not screened";
}

export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tutor?: string }>;
}) {
  const { tutor: selectedClerkId } = await searchParams;
  const queue = await getVerificationQueue();
  const selected = selectedClerkId ? queue.find((item) => item.clerk_id === selectedClerkId) : null;

  if (selected) {
    const [detail, transcripts] = await Promise.all([
      getTutorVerification(selected.clerk_id),
      getTutorTranscripts(selected.clerk_id),
    ]);

    return (
      <div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/admin" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              ← Verification queue
            </Link>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Review tutor</h1>
            <p className="mt-1 text-sm text-slate-500">Inspect the transcript and automated screening signals before making the final decision.</p>
          </div>
        </div>
        <VerificationReview tutor={detail} transcripts={transcripts} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Admin</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Tutor verification</h1>
          <p className="mt-1 text-sm text-slate-500">Review submitted transcripts and make the final verification decision.</p>
        </div>
        <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 sm:flex">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Awaiting review</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{queue.filter((item) => item.verification_status === "pending").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">AI flagged</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{queue.filter((item) => item.auto_verification_status === "flagged").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Needs attention</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{queue.filter((item) => item.verification_status === "rejected").length}</p>
        </Card>
      </div>

      <div className="mt-8 space-y-3">
        {queue.length === 0 ? (
          <Card className="flex flex-col items-center p-10 text-center">
            <ShieldCheck className="h-7 w-7 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-ink">Verification queue is clear</p>
            <p className="mt-1 text-xs text-slate-500">New tutor submissions will appear here.</p>
          </Card>
        ) : (
          queue.map((item) => (
            <Link key={item.clerk_id} href={`/dashboard/admin?tutor=${encodeURIComponent(item.clerk_id)}`}>
              <Card className="mb-3 p-5 transition-colors hover:border-emerald-200 hover:bg-white">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-display text-sm font-semibold text-emerald-700">
                    {tutorName(item).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-semibold text-ink">{tutorName(item)}</p>
                      <Badge variant={item.verification_status === "pending" ? "neutral" : "indigo"}>{item.verification_status}</Badge>
                      <Badge variant={item.auto_verification_status === "flagged" ? "neutral" : "emerald"}>{screeningLabel(item.auto_verification_status)}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.subjects.join(" · ")}</p>
                  </div>
                  <div className="text-right">
                    {item.auto_verification_score !== null && (
                      <p className="text-xs font-medium text-slate-500">Risk {item.auto_verification_score}/100</p>
                    )}
                    <p className="mt-1 text-xs font-semibold text-emerald-600">Review →</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
