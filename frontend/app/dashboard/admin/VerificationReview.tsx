"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { decideTutorVerification, type AdminTutor, type AdminTranscript } from "./_actions";

function fullName(tutor: AdminTutor) {
  const name = [tutor.first_name, tutor.last_name].filter(Boolean).join(" ");
  return name || tutor.email || "Unnamed tutor";
}

function autoBadge(status: AdminTutor["auto_verification_status"]) {
  if (status === "flagged") return <Badge variant="neutral">Needs review</Badge>;
  if (status === "passed") return <Badge variant="emerald">Low risk</Badge>;
  if (status === "running") return <Badge variant="neutral">Screening</Badge>;
  if (status === "error") return <Badge variant="neutral">Screening unavailable</Badge>;
  return <Badge variant="neutral">Not screened</Badge>;
}

export function VerificationReview({ tutor, transcripts }: { tutor: AdminTutor; transcripts: AdminTranscript[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const decide = (decision: "verified" | "rejected") => {
    setError(null);
    startTransition(async () => {
      try {
        await decideTutorVerification(tutor.clerk_id, decision, notes);
        router.push("/dashboard/admin");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save the decision.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tutor</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">{fullName(tutor)}</h2>
            <p className="mt-1 text-sm text-slate-500">{tutor.email ?? "No email available"}</p>
          </div>
          <div className="flex items-center gap-2">
            {autoBadge(tutor.auto_verification_status)}
            <Badge variant={tutor.verification_status === "pending" ? "neutral" : "indigo"}>
              {tutor.verification_status}
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-mist p-4">
            <p className="text-xs text-slate-500">Subjects</p>
            <p className="mt-1 text-sm font-semibold text-ink">{tutor.subjects.join(", ")}</p>
          </div>
          <div className="rounded-xl bg-mist p-4">
            <p className="text-xs text-slate-500">Cambridge level</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {tutor.cambridge_transcript_level === "o_level" ? "O-Level" : "A-Level"}
            </p>
          </div>
          <div className="rounded-xl bg-mist p-4">
            <p className="text-xs text-slate-500">Teaching level</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {tutor.teaching_level === "both" ? "O-Level + A-Level" : tutor.teaching_level === "o_level" ? "O-Level" : "A-Level"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Automated screening</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-ink">AI review signals</h3>
          </div>
          {tutor.auto_verification_score !== null && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Risk score</p>
              <p className="font-display text-xl font-semibold text-ink">{tutor.auto_verification_score}/100</p>
            </div>
          )}
        </div>

        {tutor.auto_verification_summary && (
          <p className="mt-4 text-sm leading-6 text-slate-600">{tutor.auto_verification_summary}</p>
        )}

        {tutor.auto_verification_flags.length > 0 ? (
          <div className="mt-4 space-y-3">
            {tutor.auto_verification_flags.map((flag, index) => (
              <div key={`${flag.code ?? "flag"}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {flag.code ?? "Review flag"}{flag.severity ? ` · ${flag.severity}` : ""}
                    </p>
                    {flag.filename && <p className="mt-0.5 text-xs text-slate-500">{flag.filename}</p>}
                    {flag.evidence && <p className="mt-2 text-sm text-slate-600">{flag.evidence}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            No material screening flags were returned. Admin review is still required.
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Documents</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">Submitted transcripts</h3>
        </div>
        <div className="mt-4 space-y-2">
          {transcripts.map(({ transcript, url }) => (
            <a
              key={transcript.storage_path}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-mist"
            >
              <FileText className="h-5 w-5 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{transcript.original_filename}</p>
                <p className="text-xs text-slate-500">
                  {transcript.transcript_type === "cambridge" ? "Cambridge transcript" : "Additional transcript"}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
            </a>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Admin decision</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">Review the evidence independently</h3>
        <p className="mt-1 text-sm text-slate-500">AI flags are advisory. Do not approve or reject a tutor solely from the automated score.</p>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional verification notes..."
          rows={4}
          className="mt-4 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" disabled={isPending} onClick={() => decide("verified")}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Approve tutor"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => decide("rejected")}>
            <XCircle className="mr-2 h-4 w-4" />
            Reject tutor
          </Button>
        </div>
      </Card>
    </div>
  );
}
