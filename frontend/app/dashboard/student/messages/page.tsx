import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function StudentMessagesPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const { with: tutorClerkId } = await searchParams;

  return (
    <div>
      <Link href="/dashboard/student/bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to bookings
      </Link>
      <div className="mt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-600">Messaging</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Your conversation with the tutor will live here.</p>
      </div>
      <Card className="mt-7 flex min-h-64 flex-col items-center justify-center p-8 text-center">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600"><MessageCircle className="h-5 w-5" /></div>
        <h2 className="mt-4 font-display font-semibold text-ink">Conversation ready</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">{tutorClerkId ? 'This conversation is linked to your demo booking.' : 'Open a tutor conversation from your bookings when messaging is enabled.'}</p>
        {tutorClerkId && <p className="mt-2 text-xs text-slate-400">Tutor reference: {tutorClerkId}</p>}
        <Link href="/dashboard/student/bookings"><Button className="mt-5" size="sm">View bookings</Button></Link>
      </Card>
    </div>
  );
}
