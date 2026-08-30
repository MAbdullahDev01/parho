import Link from 'next/link';
import { CalendarClock, MessageCircle, Video } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getStudentBookings } from './_actions';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default async function StudentBookingsPage() {
  const bookings = await getStudentBookings();
  const upcoming = bookings.filter((booking) => booking.status === 'confirmed' && new Date(booking.start_at) > new Date());

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-600">Your sessions</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Your free demos and upcoming tutoring sessions.</p>
        </div>
        <Link href="/dashboard/student/tutors"><Button size="sm">Find a tutor</Button></Link>
      </div>

      <div className="mt-8 space-y-3">
        {bookings.length === 0 ? (
          <Card className="flex flex-col items-center p-10 text-center">
            <CalendarClock className="h-7 w-7 text-slate-300" />
            <h2 className="mt-3 font-display font-semibold text-ink">No bookings yet</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Choose a verified tutor and book a free 30-minute demo to get started.</p>
            <Link href="/dashboard/student/tutors"><Button className="mt-5" size="sm">Browse tutors</Button></Link>
          </Card>
        ) : bookings.map((booking) => (
          <Card key={booking.id} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Video className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-display font-semibold text-ink">Free demo</h2><Badge variant={booking.status === 'confirmed' ? 'emerald' : 'indigo'}>{booking.status}</Badge></div>
                <p className="mt-1 text-sm text-slate-500">Tutor session · 30 minutes</p>
                <p className="mt-2 text-sm font-medium text-ink">{formatDate(booking.start_at)}</p>
              </div>
              {(booking.status === 'confirmed' || booking.status === 'completed') && (
                <Link href={`/dashboard/student/messages?bookingId=${encodeURIComponent(booking.id)}`} className="shrink-0">
                  <Button size="sm" variant="outline"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Message tutor</Button>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>

      {upcoming.length > 0 && <p className="mt-5 text-xs text-slate-400">You have {upcoming.length} upcoming session{upcoming.length === 1 ? '' : 's'}.</p>}
    </div>
  );
}
