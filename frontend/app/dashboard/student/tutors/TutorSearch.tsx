'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const SUBJECTS = [
  "O-Level Mathematics", "O-Level Additional Mathematics", "O-Level Physics",
  "O-Level Chemistry", "O-Level Biology", "O-Level Computer Science",
  "O-Level Economics", "O-Level Business Studies", "O-Level Accounting",
  "O-Level English Language", "O-Level Urdu", "O-Level Pakistan Studies",
  "O-Level Islamiyat", "A-Level Mathematics", "A-Level Further Mathematics",
  "A-Level Physics", "A-Level Chemistry", "A-Level Biology",
  "A-Level Computer Science", "A-Level Economics", "A-Level Business Studies",
  "A-Level Accounting",
];

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
};

function displayLevel(level: Tutor["teaching_level"]) {
  return level === "both" ? "O Level + A Level" : level === "a_level" ? "A Level" : "O Level";
}

export default function TutorSearch() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const subjectGroups = useMemo(() => ({
    o: SUBJECTS.filter((subject) => subject.startsWith("O-Level")),
    a: SUBJECTS.filter((subject) => subject.startsWith("A-Level")),
  }), []);

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject],
    );
  }

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    selectedSubjects.forEach((subject) => params.append("subjects", subject));
    if (level) params.set("level", level);
    params.set("min_rating", minRating);

    setLoading(true);
    setError("");
    fetch(`/api/tutors?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.detail || "Unable to load tutors.");
        return data;
      })
      .then((data) => setTutors(data.tutors ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [selectedSubjects, level, minRating]);

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-stamp">Tutor discovery</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Find a tutor who fits.</h1>
          <p className="mt-3 max-w-2xl text-slate">
            Search verified tutors by the subjects and Cambridge level you actually need.
            Selecting multiple subjects shows tutors who teach at least one of them.
          </p>
        </header>

        <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border bg-card p-5 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => { setSelectedSubjects([]); setLevel(""); setMinRating("0"); }}
                className="font-mono text-xs uppercase tracking-wide text-stamp hover:underline"
              >Reset</button>
            </div>

            <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-slate">Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="mb-7 w-full rounded-xl border bg-page px-3 py-2.5 text-sm">
              <option value="">Any level</option>
              <option value="o_level">O Level</option>
              <option value="a_level">A Level</option>
            </select>

            <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-slate">Minimum rating</label>
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="mb-7 w-full rounded-xl border bg-page px-3 py-2.5 text-sm">
              <option value="0">Any rating</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.8">4.8+</option>
            </select>

            <div className="mb-2 flex items-center justify-between">
              <label className="font-mono text-xs uppercase tracking-wide text-slate">Subjects</label>
              <span className="font-mono text-xs text-graphite">{selectedSubjects.length}/3</span>
            </div>
            <div className="max-h-[440px] space-y-5 overflow-y-auto pr-1">
              {([['O Level', subjectGroups.o], ['A Level', subjectGroups.a]] as const).map(([group, subjects]) => (
                <div key={group}>
                  <p className="mb-2 text-sm font-semibold">{group}</p>
                  <div className="space-y-2">
                    {subjects.map((subject) => {
                      const checked = selectedSubjects.includes(subject);
                      return (
                        <label key={subject} className="flex cursor-pointer items-start gap-2 text-sm text-slate">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!checked && selectedSubjects.length >= 3}
                            onChange={() => toggleSubject(subject)}
                            className="mt-1 accent-stamp"
                          />
                          <span>{subject.replace(`${group}-`, "")}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4 border-b pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-slate">Verified tutors</p>
                <p className="mt-1 text-sm text-graphite">{loading ? "Searching…" : `${tutors.length} tutor${tutors.length === 1 ? "" : "s"} found`}</p>
              </div>
              {selectedSubjects.length > 0 && <p className="text-right text-sm text-slate">Matching at least one selected subject</p>}
            </div>

            {error && <div className="rounded-2xl border border-stamp/30 bg-stamp-50 p-5 text-sm text-stamp-deep">{error}</div>}
            {!loading && !error && tutors.length === 0 && (
              <div className="rounded-2xl border bg-card p-10 text-center shadow-card">
                <h2 className="text-2xl font-semibold">No matching tutors</h2>
                <p className="mt-2 text-sm text-slate">Try removing a filter or selecting a different subject.</p>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tutors.map((tutor) => (
                <article key={tutor.clerk_id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    {tutor.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tutor.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-ink text-bone font-display text-lg">{(tutor.first_name?.[0] ?? "T")}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl font-semibold">{tutor.first_name} {tutor.last_name}</h2>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ledger">Verified tutor</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-y py-3 text-sm">
                    <span>{displayLevel(tutor.teaching_level)}</span>
                    <span className="font-semibold">{tutor.rating.toFixed(1)} <span className="font-normal text-slate">({tutor.rating_count})</span></span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tutor.subjects.slice(0, 4).map((subject) => <span key={subject} className="rounded-full bg-page px-2.5 py-1 text-xs text-slate">{subject.replace(/^(O|A)-Level /, "")}</span>)}
                  </div>
                  <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-6 text-slate">{tutor.bio || "This tutor has not added a bio yet."}</p>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                    <div><span className="text-lg font-semibold">PKR {tutor.hourly_rate.toLocaleString()}</span><span className="text-xs text-slate"> / hour</span></div>
                    <Link href={`/dashboard/student/tutors/${tutor.clerk_id}`} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-bone hover:bg-ink-soft">View profile</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
