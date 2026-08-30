import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { CalendarClock, Clock3, MessageCircle, ShieldCheck, Star, Users, Video, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getRecommendedTutors } from './_actions';
import { getStudentBookings } from './bookings/_actions';

const accentClasses = { emerald: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600' };

function formatSession(value: string) {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function tutorName(tutor: { first_name: string | null; last_name: string | null }) {
  return [tutor.first_name, tutor.last_name].filter(Boolean).join(' ') || 'Tutor';
}

export default async function StudentOverviewPage() {
  const user = await currentUser();
  const [bookings, recommendedTutors] = await Promise.all([getStudentBookings(), getRecommendedTutors(3)]);
  const now = new Date();
  const upcoming = bookings.filter((booking) => booking.status === 'confirmed' && new Date(booking.start_at) > now).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()).slice(0, 3);
  const completed = bookings.filter((booking) => booking.status === 'completed');
  const pending = bookings.filter((booking) => booking.status === 'pending');
  const firstName = user?.firstName ?? 'there';
  const stats = [
    { label: 'Upcoming sessions', value: String(upcoming.length), icon: Video, accent: 'emerald' as const },
    { label: 'Active bookings', value: String(bookings.filter((booking) => booking.status === 'pending' || booking.status === 'confirmed').length), icon: Users, accent: 'indigo' as const },
    { label: 'Hours completed', value: String((completed.length * 0.5).toFixed(1)), icon: Clock3, accent: 'emerald' as const },
    { label: 'Escrow balance', value: 'PKR 0', icon: Wallet, accent: 'indigo' as const },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening with your tutoring sessions.</p>
      {pending.length > 0 && <Card className="mt-6 border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-ink">{pending.length} booking{pending.length === 1 ? '' : 's'} waiting for tutor confirmation</p><p className="mt-1 text-xs text-slate-500">You&apos;ll be able to message the tutor as soon as the booking is confirmed.</p><Link href="/dashboard/student/bookings"><Button size="sm" variant="outline" className="mt-3">View bookings</Button></Link></Card>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(({ label, value, icon: Icon, accent }) => <Card key={label} className="p-5"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses[accent]}`}><Icon className="h-4 w-4" strokeWidth={2.25} /></div><p className="mt-4 font-display text-xl font-semibold text-ink">{value}</p><p className="mt-0.5 text-xs text-slate-500">{label}</p></Card>)}</div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-ink">Upcoming sessions</h2><Link href="/dashboard/student/bookings" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all</Link></div><div className="mt-4 space-y-3">{upcoming.length === 0 ? <Card className="flex flex-col items-center gap-2 p-8 text-center"><CalendarClock className="h-6 w-6 text-slate-300" /><p className="text-sm text-slate-500">No confirmed sessions yet.</p><Link href="/dashboard/student/tutors"><Button size="sm" className="mt-2">Find a tutor</Button></Link></Card> : upcoming.map((session) => <Card key={session.id} className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Video className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-display text-sm font-semibold text-ink">Free demo</p><Badge variant="emerald">Confirmed</Badge></div><p className="mt-0.5 text-xs text-slate-500">{formatSession(session.start_at)} · 30 minutes</p></div><Link href={`/dashboard/student/messages?bookingId=${encodeURIComponent(session.id)}`}><Button size="sm" variant="outline"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Message</Button></Link></Card>)}</div></div>
        <div><h2 className="font-display text-lg font-semibold text-ink">Recommended tutors</h2><div className="mt-4 space-y-3">{recommendedTutors.length === 0 ? <Card className="p-6 text-center"><p className="text-sm text-slate-500">No verified tutors are available right now.</p></Card> : recommendedTutors.map((tutor) => <Card key={tutor.clerk_id} className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3">{tutor.avatar_url ? <img src={tutor.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-display text-xs font-semibold text-white">{tutor.first_name?.[0] ?? 'T'}</div>}<div><p className="font-display text-sm font-semibold text-ink">{tutorName(tutor)}</p><p className="text-xs text-slate-500">{tutor.teaching_level === 'both' ? 'O-Level + A-Level' : tutor.teaching_level === 'o_level' ? 'O-Level' : 'A-Level'}</p></div></div><ShieldCheck className="h-4 w-4 text-emerald-600" /></div><div className="mt-3 flex flex-wrap gap-1.5">{tutor.subjects.slice(0, 3).map((subject) => <span key={subject} className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-medium text-slate-600">{subject.replace(/^(O|A)-Level /, '')}</span>)}</div><div className="mt-3 flex items-center justify-between border-t border-line pt-3"><div className="flex items-center gap-1 text-amber-500"><Star className="h-3.5 w-3.5 fill-current" /><span className="text-xs font-medium text-slate-500">{tutor.rating.toFixed(1)} ({tutor.rating_count})</span></div><span className="text-xs font-medium text-slate-500">PKR {tutor.hourly_rate.toLocaleString()}/hr</span></div><Link href={`/dashboard/student/tutors/${tutor.clerk_id}`} className="mt-3 block text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700">View profile</Link></Card>)}</div><Link href="/dashboard/student/tutors"><Button variant="outline" size="sm" className="mt-4 w-full">Browse all tutors</Button></Link></div>
      </div>
    </div>
  );
}
