import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { AlertCircle, CalendarClock, MessageCircle, ShieldCheck, Star, Users, Video, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getTutorDashboardProfile } from './_actions';
import { getTutorBookings } from '../student/bookings/_actions';

const accentClasses = { emerald: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600' };

function formatSession(value: string) {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default async function TutorOverviewPage() {
  const user = await currentUser();
  const [profileResult, bookings] = await Promise.all([getTutorDashboardProfile(), getTutorBookings()]);
  const profile = profileResult.success ? profileResult.data : null;
  const firstName = user?.firstName ?? 'there';
  const now = new Date();
  const activeBookings = bookings.filter((booking) => booking.status === 'pending' || booking.status === 'confirmed');
  const upcoming = bookings.filter((booking) => booking.status === 'confirmed' && new Date(booking.start_at) > now).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()).slice(0, 3);
  const completed = bookings.filter((booking) => booking.status === 'completed');
  const pending = bookings.filter((booking) => booking.status === 'pending');
  const uniqueStudents = new Set(activeBookings.map((booking) => booking.student_clerk_id)).size;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const sessionsThisWeek = bookings.filter((booking) => booking.status === 'confirmed' && new Date(booking.start_at) >= weekStart && new Date(booking.start_at) < weekEnd).length;
  const verificationStatus = profile?.verification_status ?? 'unverified';
  const autoVerificationStatus = profile?.auto_verification_status ?? 'not_run';
  const isVerified = verificationStatus === 'verified';
  const autoVerificationMessage = autoVerificationStatus === 'flagged' ? 'Automated screening found items that need additional human review.' : autoVerificationStatus === 'passed' ? 'Automated screening completed. An admin still makes the final verification decision.' : autoVerificationStatus === 'running' ? 'Your transcript is currently being screened before admin review.' : autoVerificationStatus === 'error' ? 'Automated screening could not be completed. Your admin review can continue normally.' : 'Automated screening will run after your transcript is submitted.';
  const stats = [
    { label: 'This week\'s earnings', value: 'PKR 0', icon: Wallet, accent: 'emerald' as const },
    { label: 'Active students', value: String(uniqueStudents), icon: Users, accent: 'indigo' as const },
    { label: 'Sessions this week', value: String(sessionsThisWeek), icon: Video, accent: 'emerald' as const },
    { label: 'Completed sessions', value: String(completed.length), icon: Star, accent: 'indigo' as const },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-slate-500">Track your students, availability, and earnings.</p>

      {pending.length > 0 && <Card className="mt-6 border-amber-200 bg-amber-50 p-4"><div className="flex flex-wrap items-center gap-3"><div className="flex-1"><p className="text-sm font-semibold text-ink">{pending.length} new booking request{pending.length === 1 ? '' : 's'}</p><p className="mt-1 text-xs text-slate-500">Review your pending demo requests and confirm the sessions you can attend.</p></div><Link href="/dashboard/tutor/students/bookings"><Button size="sm">Review requests</Button></Link></div></Card>}

      {!isVerified && <Card className="mt-6 flex items-center gap-4 border-amber-200 bg-amber-50 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100"><AlertCircle className="h-4 w-4 text-amber-600" strokeWidth={2.25} /></span><div className="flex-1"><p className="text-sm font-semibold text-ink">{verificationStatus === 'pending' ? 'Transcript under review' : verificationStatus === 'rejected' ? 'Verification needs attention' : 'Complete your tutor setup'}</p><p className="mt-0.5 text-xs text-slate-500">{verificationStatus === 'pending' ? 'We\'re verifying your submitted transcript.' : verificationStatus === 'rejected' ? profile?.verification_notes ?? 'Please review your setup and resubmit.' : 'Submit your transcript and choose subjects to start accepting bookings.'}</p></div>{verificationStatus !== 'pending' && <Link href="/onboarding/tutor-setup"><Button size="sm">{verificationStatus === 'rejected' ? 'Review setup' : 'Finish setup'}</Button></Link>}</Card>}

      {profileResult.success && profile && <>
        <div className="mt-6 grid gap-4 sm:grid-cols-3"><Card className="p-4"><p className="text-xs text-slate-500">Subjects</p><p className="mt-1 text-sm font-semibold text-ink">{profile.subjects.join(', ') || 'Not set'}</p></Card><Card className="p-4"><p className="text-xs text-slate-500">Teaching level</p><p className="mt-1 text-sm font-semibold text-ink">{profile.teaching_level === 'both' ? 'O-Level + A-Level' : profile.teaching_level === 'o_level' ? 'O-Level' : 'A-Level'}</p></Card><Card className="p-4"><p className="text-xs text-slate-500">Transcripts submitted</p><p className="mt-1 text-sm font-semibold text-ink">{profile.transcripts.length}</p></Card></div>
        <Card className="mt-4 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automated transcript screening</p><p className="mt-1 text-sm text-slate-600">{autoVerificationMessage}</p></div><Badge variant={autoVerificationStatus === 'passed' ? 'emerald' : 'neutral'}>{autoVerificationStatus === 'passed' ? 'Screened' : autoVerificationStatus === 'flagged' ? 'Additional review' : autoVerificationStatus === 'running' ? 'Screening' : autoVerificationStatus === 'error' ? 'Unavailable' : 'Queued'}</Badge></div></Card>
      </>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(({ label, value, icon: Icon, accent }) => <Card key={label} className="p-5"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses[accent]}`}><Icon className="h-4 w-4" strokeWidth={2.25} /></div><p className="mt-4 font-display text-xl font-semibold text-ink">{value}</p><p className="mt-0.5 text-xs text-slate-500">{label}</p></Card>)}</div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-ink">Upcoming sessions</h2><Link href="/dashboard/tutor/students/bookings" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View bookings</Link></div><div className="mt-4 space-y-3">{upcoming.length === 0 ? <Card className="flex flex-col items-center gap-2 p-8 text-center"><CalendarClock className="h-6 w-6 text-slate-300" /><p className="text-sm text-slate-500">No confirmed sessions yet.</p><Link href="/dashboard/tutor/availability"><Button size="sm" variant="outline" className="mt-2">Manage availability</Button></Link></Card> : upcoming.map((session) => <Card key={session.id} className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-display text-sm font-semibold text-white">S</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-display text-sm font-semibold text-ink">Student</p><Badge variant="emerald">Confirmed</Badge></div><p className="mt-0.5 text-xs text-slate-500">{formatSession(session.start_at)} · 30 minutes</p></div><Link href={`/dashboard/tutor/students/messages?bookingId=${encodeURIComponent(session.id)}`}><Button size="sm" variant="outline"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Message</Button></Link></Card>)}</div></div>
        <div><h2 className="font-display text-lg font-semibold text-ink">Earnings snapshot</h2><Card className="mt-4 p-5"><div className="flex items-center justify-between"><p className="text-xs text-slate-500">Available to withdraw</p><ShieldCheck className="h-4 w-4 text-emerald-600" /></div><p className="mt-2 font-display text-2xl font-semibold text-ink">PKR 0</p><p className="mt-1 text-xs text-slate-500">Earnings will appear here once paid sessions and escrow are available.</p><Button size="sm" className="mt-4 w-full" disabled>Withdraw to JazzCash / EasyPaisa</Button></Card><Card className="mt-4 p-5"><p className="text-xs text-slate-500">Verification status</p><div className="mt-2 flex items-center gap-2"><Badge variant={isVerified ? 'emerald' : 'neutral'}>{isVerified ? 'Verified' : verificationStatus === 'pending' ? 'Pending review' : verificationStatus === 'rejected' ? 'Needs attention' : 'Not started'}</Badge></div><p className="mt-2 text-xs text-slate-500">{isVerified ? 'Your transcript has been confirmed. You\'re visible to students.' : 'Complete transcript submission to start receiving bookings.'}</p></Card><Link href="/dashboard/tutor/earnings"><Button variant="outline" size="sm" className="mt-4 w-full">View full earnings history</Button></Link></div>
      </div>
    </div>
  );
}
