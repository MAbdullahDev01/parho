'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { completeBooking } from './_actions';

export default function CompleteBookingButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function complete() {
    setError(null);
    startTransition(async () => {
      try {
        await completeBooking(bookingId);
        setDone(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to complete the demo.');
      }
    });
  }

  if (done) {
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button size="sm" variant="outline" onClick={complete} disabled={isPending}>
        {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
        Mark complete
      </Button>
      {error && <span className="max-w-48 text-right text-[10px] text-rose-600">{error}</span>}
    </div>
  );
}
