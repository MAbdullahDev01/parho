'use client';

import { useMemo, useState, useTransition } from 'react';
import { CalendarDays, Check, Clock3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { bookDemo, getAvailableDemoSlots } from '../../bookings/_actions';

type Props = { tutorClerkId: string };

function localDateValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatSlot(value: string) {
  return new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function BookDemo({ tutorClerkId }: Props) {
  const initialDate = useMemo(() => localDateValue(new Date(Date.now() + 24 * 60 * 60 * 1000)), []);
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Array<{ start_at: string; end_at: string }>>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [bookingId, setBookingId] = useState<string | null>(null);

  const loadSlots = (nextDate: string) => {
    setDate(nextDate);
    setSelected(null);
    setError(null);
    setIsLoadingSlots(true);
    getAvailableDemoSlots(tutorClerkId, nextDate)
      .then((result) => setSlots(result.slots))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load available times.'))
      .finally(() => setIsLoadingSlots(false));
  };

  const submit = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        const booking = await bookDemo(tutorClerkId, selected);
        setBookingId(booking.id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to book this demo.');
      }
    });
  };

  if (bookingId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><Check className="h-4 w-4" /></div>
          <div>
            <h3 className="font-display font-semibold text-ink">Demo booked</h3>
            <p className="mt-1 text-sm text-slate-600">Your free 30-minute demo is confirmed. You can find it in your bookings.</p>
            <a href="/dashboard/student/bookings" className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">View booking</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-page p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-emerald-600" />
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">Book a free demo</h3>
          <p className="text-xs text-slate-500">Choose a 30-minute time that works for you.</p>
        </div>
      </div>

      <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="demo-date">Date</label>
      <input
        id="demo-date"
        type="date"
        value={date}
        min={localDateValue(new Date())}
        max={localDateValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
        onChange={(event) => loadSlots(event.target.value)}
        className="mt-2 w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
      />

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available times</p>
        {isLoadingSlots ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading times…</div>
        ) : slots.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No demo times are available on this date.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => (
              <button
                type="button"
                key={slot.start_at}
                onClick={() => setSelected(slot.start_at)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${selected === slot.start_at ? 'border-emerald-600 bg-emerald-600 text-white' : 'bg-card text-slate-700 hover:border-emerald-400'}`}
              >
                <Clock3 className="h-3.5 w-3.5" />
                {formatSlot(slot.start_at)}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Button type="button" className="mt-5 w-full" disabled={!selected || isPending || isLoadingSlots} onClick={submit}>
        {isPending ? 'Booking…' : 'Confirm free demo'}
      </Button>
      <p className="mt-2 text-center text-[11px] text-slate-400">No payment is required for the demo.</p>
    </div>
  );
}
