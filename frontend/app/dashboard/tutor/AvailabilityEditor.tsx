'use client';

import { useState, useTransition } from 'react';
import { Clock3, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { saveTutorAvailability } from '../student/bookings/_actions';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
type Window = { day_of_week: number; start_time: string; end_time: string; timezone: string };
type Props = { initialWindows: Window[] };

export default function AvailabilityEditor({ initialWindows }: Props) {
  const [windows, setWindows] = useState<Window[]>(initialWindows.map(({ day_of_week, start_time, end_time, timezone }) => ({ day_of_week, start_time: start_time.slice(0, 5), end_time: end_time.slice(0, 5), timezone })));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWindow = (day: number) => windows.find((window) => window.day_of_week === day);

  const updateDay = (day: number, field: 'start_time' | 'end_time', value: string) => {
    setSaved(false);
    setWindows((current) => {
      const existing = current.find((window) => window.day_of_week === day);
      if (!existing) return [...current, { day_of_week: day, start_time: field === 'start_time' ? value : '16:00', end_time: field === 'end_time' ? value : '20:00', timezone: 'Asia/Karachi' }];
      return current.map((window) => window.day_of_week === day ? { ...window, [field]: value } : window);
    });
  };

  const toggleDay = (day: number) => {
    setSaved(false);
    setWindows((current) => current.some((window) => window.day_of_week === day)
      ? current.filter((window) => window.day_of_week !== day)
      : [...current, { day_of_week: day, start_time: '16:00', end_time: '20:00', timezone: 'Asia/Karachi' }]);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await saveTutorAvailability(windows);
        setSaved(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to save availability.');
      }
    });
  };

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Clock3 className="h-4 w-4" /></div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Weekly availability</h2>
          <p className="mt-0.5 text-sm text-slate-500">Students can book 30-minute demos inside these windows. Times use Pakistan Standard Time.</p>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {DAYS.map((day, index) => {
          const window = getWindow(index);
          return (
            <div key={day} className="grid gap-3 rounded-xl border bg-page p-3 sm:grid-cols-[180px_1fr_1fr] sm:items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" checked={Boolean(window)} onChange={() => toggleDay(index)} className="h-4 w-4 accent-emerald-600" />{day}</label>
              {window ? <><label className="text-xs text-slate-500">Start<input type="time" value={window.start_time} onChange={(event) => updateDay(index, 'start_time', event.target.value)} className="mt-1 block w-full rounded-lg border bg-card px-2.5 py-2 text-sm text-ink" /></label><label className="text-xs text-slate-500">End<input type="time" value={window.end_time} onChange={(event) => updateDay(index, 'end_time', event.target.value)} className="mt-1 block w-full rounded-lg border bg-card px-2.5 py-2 text-sm text-ink" /></label></> : <p className="text-xs text-slate-400 sm:col-span-2">Unavailable</p>}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="mt-4 text-sm font-medium text-emerald-700">Availability saved.</p>}
      <Button className="mt-5" onClick={save} disabled={isPending}>{isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save availability</>}</Button>
    </div>
  );
}
