import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { auth } from '@clerk/nextjs/server';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { getMessages } from '../../messages/_actions';
import MessageThread from '../../messages/MessageThread';
import { getTutorBookings } from '../../student/bookings/_actions';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default async function TutorMessagesPage({ searchParams }: { searchParams: Promise<{ bookingId?: string }> }) {
  const { bookingId } = await searchParams;
  const { userId } = await auth();

  if (!userId) {
    return <Card className="p-8 text-center"><p className="text-sm text-slate-500">You must be signed in to view messages.</p></Card>;
  }

  if (!bookingId) {
    const bookings = await getTutorBookings();
    const conversations = bookings.filter((booking) => booking.status === 'confirmed' || booking.status === 'completed');

    return (
      <div>
        <Link href="/dashboard/tutor/students" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back to students</Link>
        <div className="mt-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-600">Students</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Messages</h1>
          <p className="mt-1 text-sm text-slate-500">Conversations with students from your confirmed demos.</p>
        </div>
        <div className="mt-7 space-y-3">
          {conversations.length === 0 ? (
            <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 text-indigo-600"><MessageCircle className="h-5 w-5" /></div>
              <h2 className="mt-4 font-display font-semibold text-ink">No conversations yet</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">Confirm a demo request and your conversation with that student will appear here.</p>
              <Link href="/dashboard/tutor/students/bookings"><Button className="mt-5" size="sm">View bookings</Button></Link>
            </Card>
          ) : conversations.map((booking) => (
            <Link key={booking.id} href={`/dashboard/tutor/students/messages?bookingId=${encodeURIComponent(booking.id)}`} className="block">
              <Card className="flex items-center gap-4 p-5 transition-colors hover:bg-black/[0.015]">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600"><MessageCircle className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-display font-semibold text-ink">Student</p><Badge variant={booking.status === 'confirmed' ? 'emerald' : 'indigo'}>{booking.status}</Badge></div>
                  <p className="mt-1 truncate text-xs text-slate-500">Student reference: {booking.student_clerk_id}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{formatDate(booking.start_at)}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700">Open</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const messages = await getMessages(bookingId);

  return (
    <div>
      <Link href="/dashboard/tutor/students/messages" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back to messages</Link>
      <div className="mt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-600">Students</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Chat with the student about this demo session.</p>
      </div>
      <MessageThread bookingId={bookingId} currentUserId={userId} initialMessages={messages} otherLabel="your student" />
    </div>
  );
}
