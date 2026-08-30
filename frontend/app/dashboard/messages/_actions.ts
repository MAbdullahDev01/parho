'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export type Message = {
  id: string;
  clerk_id_from: string;
  clerk_id_to: string;
  booking_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

function backend(path: string) {
  const base = process.env.BACKEND_INTERNAL_URL;
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!base || !secret) throw new Error('Backend messaging configuration is missing.');
  return { url: `${base.replace(/\/$/, '')}${path}`, headers: { 'x-internal-secret': secret } };
}

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('You must be signed in.');
  return userId;
}

async function parseError(response: Response) {
  try {
    const body = await response.json() as { detail?: unknown };
    if (typeof body.detail === 'string') return body.detail;
  } catch {}
  return response.statusText || `Request failed with status ${response.status}`;
}

export async function getMessages(bookingId: string) {
  const userId = await requireUser();
  const request = backend(`/api/backend/messages/${encodeURIComponent(bookingId)}`);
  const response = await fetch(request.url, {
    headers: { ...request.headers, 'x-user-id': userId },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json() as { messages: Message[] }).messages;
}

export async function sendMessage(bookingId: string, content: string) {
  const userId = await requireUser();
  const request = backend(`/api/backend/messages/${encodeURIComponent(bookingId)}`);
  const response = await fetch(request.url, {
    method: 'POST',
    headers: { ...request.headers, 'content-type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return await response.json() as Message;
}

export async function markMessagesRead(bookingId: string) {
  const userId = await requireUser();
  const request = backend(`/api/backend/messages/${encodeURIComponent(bookingId)}/read`);
  const response = await fetch(request.url, {
    method: 'POST',
    headers: { ...request.headers, 'x-user-id': userId },
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function completeBooking(bookingId: string) {
  const userId = await requireUser();
  const request = backend(`/api/backend/bookings/${encodeURIComponent(bookingId)}/complete`);
  const response = await fetch(request.url, {
    method: 'POST',
    headers: { ...request.headers, 'x-user-id': userId },
  });
  if (!response.ok) throw new Error(await parseError(response));
  revalidatePath('/dashboard/tutor');
  revalidatePath('/dashboard/tutor/bookings');
  return true;
}
