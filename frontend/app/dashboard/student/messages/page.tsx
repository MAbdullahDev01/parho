import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import MessageThread from '../../messages/MessageThread';
import { getMessages } from '../../messages/_actions';

export default async function StudentMessagesPage({ searchParams }: { searchParams: Promise<{ bookingId?: string }> }) {
  const { bookingId } = await searchParams;
  const { userId } = await auth();

  if (!userId) {
    return <Card className="p-8 text-center"><p className="text-sm text-slate-500">You must be signed in to view messages.</p></Card>;
  }

  if (!bookingId) {
    return (
      <div>
        <Link href="/dashboard/student/bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back to bookings</Link>
        <Card className="mt-7 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600"><MessageCircle className="h-5 w-5" /></div>
          <h1 className="mt-4 font-display font-semibold text-ink">Choose a booking</h1>
          <p className="mt-1 max-w-md text-sm text-slate-500">Open a conversation from one of your booked demos.</p>
          <Link href="/dashboard/student/bookings"><Button className="mt-5" size="sm">View bookings</Button></Link>
        </Card>
      </div>
    );
  }

  const messages = await getMessages(bookingId);

  return (
    <div>
      <Link href="/dashboard/student/bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back to bookings</Link>
      <div className="mt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-600">Messaging</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Chat with your tutor about this demo session.</p>
      </div>
      <MessageThread bookingId={bookingId} currentUserId={userId} initialMessages={messages} otherLabel="your tutor" />
    </div>
  );
}
