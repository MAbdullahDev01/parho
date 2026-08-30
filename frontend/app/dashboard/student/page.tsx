import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { CalendarClock, Clock3, MessageCircle, ShieldCheck, Star, Users, Video, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { tutors } from '@/lib/Data';
import { getStudentBookings } from './bookings/_actions';

const accentClasses = { emerald: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600' };

function formatSession(value: string) {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default async function StudentOverviewPage() {
  const user = await currentUser();
  const bookings = await getStudentBookings();
  const upcoming = bookings.filter((booking) => booking.status === 'confirmed' && new Date(booking.start_at) > new Date()).slice(0, 3);
  const firstName = user?.firstName ?? 'there';
  const stats = [
    { label: 'Upcoming demos', value: String(upcoming.length), icon: Video, accent: 'emerald' as const },
    { label: 'Booked sessions', value: String(bookings.filter((booking) => booking.status === 'confirmed').length), icon: Users, accent: 'indigo' as const },
    { label: 'Hours completed', value: String((bookings.filter((booking) => booking.status === 'completed').length * 0.5).toFixed(1)), icon: Clock3, accent: 'emerald' as const },
    { label: 'Escrow balance', value: 'PKR 0', icon: Wallet, accent: 'indigo' as const },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening with your tutoring sessions.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="p-5"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses[accent]}`}><Icon className="h-4 w-4" strokeWidth={2.25} /></div><p className="mt-4 font-display text-xl font-semibold text-ink">{value}</p><p className="mt-0.5 text-xs text-slate-500">{label}</p></Card>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-ink">Upcoming sessions</h2><Link href="/dashboard/student/bookings" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all</Link></div>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? <Card className="flex flex-col items-center gap-2 p-8 text-center"><CalendarClock className="h-6 w-6 text-slate-300" /><p className="text-sm text-slate-500">No sessions booked yet — find a tutor to get started.</p><Link href="/dashboard/student/tutors"><Button size="sm" className="mt-2">Find a tutor</Button></Link></Card> : upcoming.map((session) => (
              <Card key={session.id} className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Video className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-display text-sm font-semibold text-ink">Free demo</p><Badge variant="emerald">Confirmed</Badge></div><p className="mt-0.5 text-xs text-slate-500">Tutor session · 30 minutes</p><p className="mt-1 text-xs font-medium text-slate-600">{formatSession(session.start_at)}</p></div><Link href={`/dashboard/student/messages?bookingId=${encodeURIComponent(session.id)}`}><Button size="sm" variant="outline"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Message</Button></Link></Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Recommended for you</h2>
          <div className="mt-4 space-y-3">
            {tutors.slice(0, 3).map((tutor) => <Card key={tutor.id} className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-display text-xs font-semibold text-white">{tutor.initials}</div><div><p className="font-display text-sm font-semibold text-ink">{tutor.name}</p><p className="text-xs text-slate-500">{tutor.university}</p></div></div><ShieldCheck className="h-4 w-4 text-emerald-600" /></div><div className="mt-3 flex flex-wrap gap-1.5">{tutor.subjects.map((s) => <span key={s.name} className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-medium text-slate-600">{s.name}</span>)}</div><div className="mt-3 flex items-center justify-between border-t border-line pt-3"><div className="flex items-center gap-1 text-amber-500"><Star className="h-3.5 w-3.5 fill-current" /><span className="text-xs font-medium text-slate-500">{tutor.rating}</span></div><span className="text-xs font-medium text-slate-500">PKR {tutor.rate.toLocaleString()}/hr</span></div></Card>)}
          </div>
          <Link href="/dashboard/student/tutors"><Button variant="outline" size="sm" className="mt-4 w-full">Browse all tutors</Button></Link>
        </div>
      </div>
    </div>
  );
}
