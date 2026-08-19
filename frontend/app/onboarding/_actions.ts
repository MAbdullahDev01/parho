'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

export async function selectRole(role: 'student' | 'tutor') {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) return { ok: false };

  const client = await clerkClient();

  // Fast path — updates the session claim middleware reads
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  });

  // Persist to Supabase via your FastAPI backend
  await fetch(`${process.env.BACKEND_INTERNAL_URL}/api/backend/users/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerk_id: userId, role }),
  });

  return { ok: true };
}