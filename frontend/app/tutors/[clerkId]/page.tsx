import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const backendUrl = process.env.BACKEND_INTERNAL_URL;
const internalSecret = process.env.INTERNAL_API_SECRET;

type Tutor = {
  clerk_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  hourly_rate: number;
  rating: number;
  rating_count: number;
  subjects: string[];
  teaching_level: "o_level" | "a_level" | "both";
  verification_status: "verified";
};

async function getTutor(clerkId: string): Promise<Tutor | null> {
  if (!backendUrl || !internalSecret) return null;
  const response = await fetch(`${backendUrl}/api/backend/tutor-discovery/${encodeURIComponent(clerkId)}`, {
    headers: { "x-internal-secret": internalSecret },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load tutor profile");
  return response.json();
}

function levelLabel(level: Tutor["teaching_level"]) {
  return level === "both" ? "O Level + A Level" : level === "a_level" ? "A Level" : "O Level";
}

export default async function TutorProfilePage({ params }: { params: Promise<{ clerkId: string }> }) {
  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
  if (sessionClaims?.metadata?.role !== "student") redirect("/dashboard");

  const { clerkId } = await params;
  const tutor = await getTutor(clerkId);
  if (!tutor) notFound();

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/tutors" className="font-mono text-xs uppercase tracking-[0.16em] text-stamp hover:underline">← Back to tutors</Link>

        <section className="mt-7 rounded-3xl border bg-card p-6 shadow-card sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {tutor.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tutor.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-ink text-2xl text-bone font-display">{tutor.first_name?.[0] ?? "T"}</div>
              )}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-ledger">Verified tutor</p>
                <h1 className="mt-1 text-4xl font-semibold">{tutor.first_name} {tutor.last_name}</h1>
                <p className="mt-2 text-sm text-slate">{levelLabel(tutor.teaching_level)}</p>
              </div>
            </div>

            <div className="stamp-ring rotate-2 px-4 py-2 text-center text-stamp">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest">Verified</p>
              <p className="text-xs">Profile</p>
            </div>
          </div>

          <div className="my-8 tear-line text-line-light" />

          <div className="grid gap-6 sm:grid-cols-3">
            <div><p className="font-mono text-xs uppercase tracking-wide text-slate">Rating</p><p className="mt-1 text-2xl font-semibold">{tutor.rating.toFixed(1)} <span className="text-sm font-normal text-slate">/ 5</span></p><p className="text-xs text-graphite">{tutor.rating_count} reviews</p></div>
            <div><p className="font-mono text-xs uppercase tracking-wide text-slate">Hourly rate</p><p className="mt-1 text-2xl font-semibold">PKR {tutor.hourly_rate.toLocaleString()}</p><p className="text-xs text-graphite">per hour</p></div>
            <div><p className="font-mono text-xs uppercase tracking-wide text-slate">Level</p><p className="mt-1 text-2xl font-semibold">{levelLabel(tutor.teaching_level)}</p><p className="text-xs text-graphite">Cambridge curriculum</p></div>
          </div>

          <div className="mt-9">
            <h2 className="text-2xl font-semibold">About this tutor</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate">{tutor.bio || "This tutor has not added a bio yet."}</p>
          </div>

          <div className="mt-9">
            <h2 className="text-2xl font-semibold">Subjects taught</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tutor.subjects.map((subject) => <span key={subject} className="rounded-full border bg-page px-3 py-1.5 text-sm text-slate">{subject}</span>)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
