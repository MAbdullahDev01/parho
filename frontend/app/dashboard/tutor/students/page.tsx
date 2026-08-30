import { CalendarClock, MessageCircle, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getTutorBookings } from '../../student/bookings/_actions';

function formatSession(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

type StudentSummary = {
  id: string;
  pending: number;
  confirmed: number;
  completed: number;
  nextSession: string | null;
};

export default async function TutorStudentsPage() {
  const bookings = await getTutorBookings();
  const now = new Date();
  const students = new Map<string, StudentSummary>();

  for (const booking of bookings) {
    const existing = students.get(booking.student_clerk_id) ?? {
      id: booking.student_clerk_id,
      pending: 0,
      confirmed: 0,
      completed: 0,
      nextSession: null,
    };

    if (booking.status === 'pending') existing.pending += 1;
    if (booking.status === 'confirmed') existing.confirmed += 1;
    if (booking.status === 'completed') existing.completed += 1;

    const start = new Date(booking.start_at);
    if (booking.status === 'confirmed' && start > now && (!existing.nextSession || start < new Date(existing.nextSession))) {
      existing.nextSession = booking.start_at;
    }

    students.set(booking.student_clerk_id, existing);
  }

  const studentList = Array.from(students.values()).sort((a, b) => {
    if (a.nextSession && b.nextSession) return new Date(a.nextSession).getTime() - new Date(b.nextSession).getTime();
    if (a.nextSession) return -1;
    if (b.nextSession) return 1;
    return a.id.localeCompare(b.id);
  });

  const activeStudents = studentList.filter((student) => student.confirmed > 0 || student.pending > 0).length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-600">Students</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">My Students</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your student relationships, bookings, and conversations.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/tutor/students/bookings"><Button size="sm" variant="outline"><CalendarClock className="mr-1.5 h-3.5 w-3.5" />Bookings</Button></Link>
          <Link href="/dashboard/tutor/students/messages"><Button size="sm"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Messages</Button></Link>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><Users className="h-5 w-5 text-indigo-600" /><p className="mt-4 font-display text-2xl font-semibold text-ink">{activeStudents}</p><p className="mt-0.5 text-xs text-slate-500">Active students</p></Card>
        <Card className="p-5"><CalendarClock className="h-5 w-5 text-emerald-600" /><p className="mt-4 font-display text-2xl font-semibold text-ink">{bookings.filter((booking) => booking.status === 'pending').length}</p><p className="mt-0.5 text-xs text-slate-500">Pending requests</p></Card>
        <Card className="p-5"><Video className="h-5 w-5 text-indigo-600" /><p className="mt-4 font-display text-2xl font-semibold text-ink">{bookings.filter((booking) => booking.status === 'completed').length}</p><p className="mt-0.5 text-xs text-slate-500">Completed sessions</p></Card>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-ink">Student list</h2><span className="text-xs text-slate-500">{studentList.length} total</span></div>
        <div className="mt-4 space-y-3">
          {studentList.length === 0 ? (
            <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Users className="h-5 w-5" /></div>
              <h2 className="mt-4 font-display font-semibold text-ink">No students yet</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">Students will appear here after they book one of your demo sessions.</p>
              <Link href="/dashboard/tutor/availability" className="mt-5"><Button size="sm" variant="outline">Manage availability</Button></Link>
            </Card>
          ) : studentList.map((student) => (
            <Card key={student.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">S</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-display font-semibold text-ink">Student</p>{student.pending > 0 && <Badge variant="amber">Pending</Badge>}{student.confirmed > 0 && <Badge variant="emerald">Confirmed</Badge>}</div>
                <p className="mt-1 truncate text-xs text-slate-500">Student reference: {student.id}</p>
                <p className="mt-1 text-xs text-slate-500">{student.completed} completed · {student.confirmed} confirmed · {student.pending} pending</p>
                {student.nextSession && <p className="mt-1 text-xs font-medium text-ink">Next session: {formatSession(student.nextSession)}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href="/dashboard/tutor/students/bookings"><Button size="sm" variant="outline">Bookings</Button></Link>
                {student.confirmed > 0 && <Link href="/dashboard/tutor/students/messages"><Button size="sm"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Messages</Button></Link>}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
