'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export type Booking = {
  id: string;
  student_clerk_id: string;
  tutor_clerk_id: string;
  student_first_name: string | null;
  student_last_name: string | null;
  tutor_first_name: string | null;
  tutor_last_name: string | null;
  booking_type: 'demo';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  start_at: string;
  end_at: string;
  created_at: string;
  updated_at: string;
};

export type AvailableSlot = { start_at: string; end_at: string };
export type AvailabilityWindow = { id: string | null; tutor_clerk_id: string; day_of_week: number; start_time: string; end_time: string; timezone: string };

function backend(path: string) {
  const base = process.env.BACKEND_INTERNAL_URL;
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!base || !secret) throw new Error('Backend booking configuration is missing.');
  return { url: `${base.replace(/\/$/, '')}${path}`, headers: { 'x-internal-secret': secret } };
}

async function requireUser(expectedRole?: 'student' | 'tutor') {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error('You must be signed in.');
  if (expectedRole && sessionClaims?.metadata?.role !== expectedRole && sessionClaims?.metadata?.is_admin !== true) {
    throw new Error(`${expectedRole[0].toUpperCase()}${expectedRole.slice(1)} access required.`);
  }
  return userId;
}

async function parseError(response: Response) {
  try {
    const body = await response.json() as { detail?: unknown };
    if (typeof body.detail === 'string') return body.detail;
  } catch {}
  return response.statusText || `Request failed with status ${response.status}`;
}

export async function getAvailableDemoSlots(tutorClerkId: string, date: string) {
  await requireUser('student');
  const request = backend(`/api/backend/bookings/tutors/${encodeURIComponent(tutorClerkId)}/availability?target_date=${encodeURIComponent(date)}`);
  const response = await fetch(request.url, { headers: request.headers, cache: 'no-store' });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { date: string; slots: AvailableSlot[] };
}

export async function bookDemo(tutorClerkId: string, startAt: string) {
  const userId = await requireUser('student');
  const request = backend('/api/backend/bookings');
  const response = await fetch(request.url, {
    method: 'POST',
    headers: { ...request.headers, 'content-type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ tutor_clerk_id: tutorClerkId, start_at: startAt, duration_minutes: 30, booking_type: 'demo' }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  const booking = await response.json() as Booking;
  revalidatePath('/dashboard/student');
  revalidatePath('/dashboard/student/bookings');
  return booking;
}

export async function getStudentBookings() {
  const userId = await requireUser('student');
  const request = backend('/api/backend/bookings/student');
  const response = await fetch(request.url, { headers: { ...request.headers, 'x-user-id': userId }, cache: 'no-store' });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json() as { bookings: Booking[] }).bookings;
}

export async function getTutorBookings() {
  const userId = await requireUser('tutor');
  const request = backend('/api/backend/bookings/tutor');
  const response = await fetch(request.url, { headers: { ...request.headers, 'x-user-id': userId }, cache: 'no-store' });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json() as { bookings: Booking[] }).bookings;
}

export async function confirmTutorBooking(bookingId: string) {
  const userId = await requireUser('tutor');
  const request = backend(`/api/backend/bookings/${encodeURIComponent(bookingId)}/confirm`);
  const response = await fetch(request.url, { method: 'POST', headers: { ...request.headers, 'x-user-id': userId } });
  if (!response.ok) throw new Error(await parseError(response));
  const booking = await response.json() as Booking;
  revalidatePath('/dashboard/tutor');
  revalidatePath('/dashboard/tutor/students');
  revalidatePath('/dashboard/tutor/students/bookings');
  revalidatePath('/dashboard/tutor/students/messages');
  revalidatePath('/dashboard/student');
  revalidatePath('/dashboard/student/bookings');
  return booking;
}

export async function declineTutorBooking(bookingId: string) {
  const userId = await requireUser('tutor');
  const request = backend(`/api/backend/bookings/${encodeURIComponent(bookingId)}/decline`);
  const response = await fetch(request.url, { method: 'POST', headers: { ...request.headers, 'x-user-id': userId } });
  if (!response.ok) throw new Error(await parseError(response));
  const booking = await response.json() as Booking;
  revalidatePath('/dashboard/tutor');
  revalidatePath('/dashboard/tutor/students');
  revalidatePath('/dashboard/tutor/students/bookings');
  revalidatePath('/dashboard/student');
  revalidatePath('/dashboard/student/bookings');
  return booking;
}

export async function getTutorAvailabilityWindows() {
  const userId = await requireUser('tutor');
  const request = backend(`/api/backend/bookings/tutors/${encodeURIComponent(userId)}/availability/windows`);
  const response = await fetch(request.url, { headers: request.headers, cache: 'no-store' });
  if (!response.ok) throw new Error(await parseError(response));
  return await response.json() as AvailabilityWindow[];
}

export async function saveTutorAvailability(windows: Array<{ day_of_week: number; start_time: string; end_time: string; timezone: string }>) {
  const userId = await requireUser('tutor');
  const request = backend(`/api/backend/bookings/tutors/${encodeURIComponent(userId)}/availability`);
  const response = await fetch(request.url, {
    method: 'PUT',
    headers: { ...request.headers, 'content-type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ windows }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  revalidatePath('/dashboard/tutor');
  revalidatePath('/dashboard/tutor/availability');
  return true;
}
