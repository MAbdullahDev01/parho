import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import AvailabilityEditor from '../AvailabilityEditor';
import { getTutorAvailabilityWindows } from '../../student/bookings/_actions';

export default async function TutorAvailabilityPage() {
  const windows = await getTutorAvailabilityWindows();
  return <div><Link href="/dashboard/tutor" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard</Link><div className="mt-5"><h1 className="font-display text-2xl font-semibold text-ink">Availability</h1><p className="mt-1 text-sm text-slate-500">Set the weekly times students can book a free demo with you.</p></div><Card className="mt-7 p-5 sm:p-7"><AvailabilityEditor initialWindows={windows} /></Card></div>;
}
