'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export type WalletTransaction = {
  id: string; clerk_id: string; amount: number; type: 'deposit' | 'hold' | 'release'; booking_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'disputed'; provider: string | null; provider_reference: string | null;
  metadata: Record<string, unknown>; created_at: string;
};
export type Wallet = { clerk_id: string; currency: 'PKR'; available_balance: number; held_balance: number };

function backend(path: string) {
  const base = process.env.BACKEND_INTERNAL_URL;
  const secret = process.env.BACKEND_INTERNAL_SECRET;
  if (!base || !secret) throw new Error('Backend wallet configuration is missing.');
  return { url: `${base.replace(/\/$/, '')}${path}`, headers: { 'x-internal-secret': secret } };
}
async function userId() { const { userId } = await auth(); if (!userId) throw new Error('You must be signed in.'); return userId; }

export async function getStudentWallet() {
  const id = await userId(); const request = backend('/api/backend/wallet');
  const response = await fetch(request.url, { headers: { ...request.headers, 'x-user-id': id }, cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load wallet.');
  return await response.json() as { wallet: Wallet; transactions: WalletTransaction[] };
}

export async function createSafepayDeposit(amount: number) {
  const id = await userId();
  const request = backend('/api/backend/payments/safepay/checkout');
  const response = await fetch(request.url, { method: 'POST', headers: { ...request.headers, 'x-user-id': id, 'content-type': 'application/json' }, body: JSON.stringify({ amount }) });
  const data = await response.json().catch(() => null) as { checkout_url?: string; detail?: string } | null;
  if (!response.ok || !data?.checkout_url) throw new Error(data?.detail || 'Unable to start Safepay checkout.');
  return { checkout_url: data.checkout_url };
}

export async function holdBookingPayment(bookingId: string, amount: number) {
  const id = await userId(); const request = backend(`/api/backend/wallet/bookings/${encodeURIComponent(bookingId)}/hold?amount=${encodeURIComponent(amount)}`);
  const response = await fetch(request.url, { method: 'POST', headers: { ...request.headers, 'x-user-id': id } });
  if (!response.ok) throw new Error('Unable to place payment hold.');
  revalidatePath('/dashboard/student/wallet'); revalidatePath('/dashboard/student/bookings'); return await response.json() as WalletTransaction;
}
export async function releaseBookingPayment(bookingId: string) {
  const id = await userId(); const request = backend(`/api/backend/wallet/bookings/${encodeURIComponent(bookingId)}/release`);
  const response = await fetch(request.url, { method: 'POST', headers: { ...request.headers, 'x-user-id': id } });
  if (!response.ok) throw new Error('Unable to release payment.');
  revalidatePath('/dashboard/student/wallet'); revalidatePath('/dashboard/student/bookings'); return await response.json() as WalletTransaction;
}
