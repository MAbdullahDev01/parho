'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { confirmTutorBooking, declineTutorBooking } from '../../student/bookings/_actions';

export default function BookingDecisionButtons({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(action: 'confirm' | 'decline') {
    setError(null);
    startTransition(async () => {
      try {
        if (action === 'confirm') await confirmTutorBooking(bookingId);
        else await declineTutorBooking(bookingId);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to update the booking.');
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => decide('confirm')} disabled={isPending}>
          {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
          Confirm
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide('decline')} disabled={isPending}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Decline
        </Button>
      </div>
      {error && <span className="max-w-56 text-right text-[10px] text-rose-600">{error}</span>}
    </div>
  );
}
