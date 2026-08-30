import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, CalendarClock, MessageCircle, Video } from 'lucide-react';
import Link from 'next/link';
import CompleteBookingButton from '../../messages/CompleteBookingButton';
import { getTutorBookings } from '../../student/bookings/_actions';
import BookingDecisionButtons from './BookingDecisionButtons';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default async function TutorBookingsPage() {
  const bookings = await getTutorBookings();
  const pending = bookings.filter((booking) => booking.status === 'pending');

  return (
    <div>
      <Link href="/dashboard/tutor/students" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back to students</Link>
      <div className="mt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-600">Students</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">Review demo requests, confirm sessions, and message your students.</p>
      </div>

      {pending.length > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-amber-900">{pending.length} demo request{pending.length === 1 ? '' : 's'} awaiting your confirmation.</p>
          <p className="mt-1 text-xs text-amber-800">Confirm a request to open messaging with the student.</p>
        </Card>
      )}

      <div className="mt-7 space-y-3">
        {bookings.length === 0 ? <Card className="flex flex-col items-center p-10 text-center"><CalendarClock className="h-7 w-7 text-slate-300" /><h2 className="mt-3 font-display font-semibold text-ink">No bookings yet</h2><p className="mt-1 max-w-sm text-sm text-slate-500">Once your availability is configured, students can book free demos here.</p><Link href="/dashboard/tutor/availability" className="mt-5 text-sm font-semibold text-emerald-700 hover:underline">Set availability</Link></Card> : bookings.map((booking) => {
          const ended = new Date(booking.end_at) <= new Date();
          return (
            <Card key={booking.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Video className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-display font-semibold text-ink">Free demo</p><Badge variant={booking.status === 'confirmed' ? 'emerald' : booking.status === 'pending' ? 'amber' : 'indigo'}>{booking.status}</Badge></div>
                <p className="mt-1 text-sm text-slate-500">Student reference: {booking.student_clerk_id}</p>
                <p className="mt-1 text-sm font-medium text-ink">{formatDate(booking.start_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {booking.status === 'pending' && <BookingDecisionButtons bookingId={booking.id} />}
                {(booking.status === 'confirmed' || booking.status === 'completed') && <Link href={`/dashboard/tutor/students/messages?bookingId=${encodeURIComponent(booking.id)}`}><Button size="sm" variant="outline"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Message</Button></Link>}
                {booking.status === 'confirmed' && ended && <CompleteBookingButton bookingId={booking.id} />}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
