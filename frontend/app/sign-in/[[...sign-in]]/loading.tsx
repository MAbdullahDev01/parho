import { GraduationCap } from "lucide-react";

export default function Loading() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <div className="hidden bg-ink lg:block" />
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <span className="flex h-8 w-8 animate-pulse items-center justify-center rounded-lg bg-emerald-600">
            <GraduationCap className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </span>
          <div className="w-full space-y-3">
            <div className="h-5 w-2/3 animate-pulse rounded bg-mist" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-mist" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-mist" />
            <div className="h-11 w-full animate-pulse rounded-full bg-emerald-100" />
          </div>
        </div>
      </div>
    </main>
  );
}