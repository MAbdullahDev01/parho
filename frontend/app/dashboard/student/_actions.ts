'use server';

import { auth } from '@clerk/nextjs/server';

export type DashboardTutor = {
  clerk_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  hourly_rate: number;
  rating: number;
  rating_count: number;
  subjects: string[];
  teaching_level: 'o_level' | 'a_level' | 'both';
};

function backend(path: string) {
  const base = process.env.BACKEND_INTERNAL_URL;
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!base || !secret) throw new Error('Tutor discovery configuration is missing.');
  return {
    url: `${base.replace(/\/$/, '')}${path}`,
    headers: { 'x-internal-secret': secret },
  };
}

async function requireStudent() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error('You must be signed in.');
  if (sessionClaims?.metadata?.role !== 'student' && sessionClaims?.metadata?.is_admin !== true) {
    throw new Error('Student access required.');
  }
  return userId;
}

export async function getRecommendedTutors(limit = 3) {
  await requireStudent();
  const request = backend(`/api/backend/tutor-discovery?limit=${limit}`);
  const response = await fetch(request.url, { headers: request.headers, cache: 'no-store' });
  if (!response.ok) {
    let message = 'Unable to load recommended tutors.';
    try {
      const body = await response.json() as { detail?: unknown; error?: unknown };
      if (typeof body.detail === 'string') message = body.detail;
      else if (typeof body.error === 'string') message = body.error;
    } catch {}
    throw new Error(message);
  }
  return (await response.json() as { tutors: DashboardTutor[] }).tutors;
}
