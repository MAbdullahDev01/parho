'use client';

import * as React from 'react';
import { Loader2, Plus } from 'lucide-react';
import { createSafepayDeposit } from './_actions';

const PRESETS = [500, 1000, 2500, 5000];

export default function AddFundsForm() {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState('1000');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 100) {
      setError('Enter an amount of at least PKR 100.');
      return;
    }
    setLoading(true);
    try {
      const result = await createSafepayDeposit(value);
      window.location.assign(result.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start payment.');
      setLoading(false);
    }
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add funds</button>;
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-4 shadow-sm sm:w-[360px]">
      <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold text-ink">Add funds</p><p className="text-xs text-slate-500">Secure PKR payment via Safepay Sandbox</p></div><button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-slate-500 hover:text-ink">Cancel</button></div>
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((preset) => <button key={preset} type="button" onClick={() => setAmount(String(preset))} className={`rounded-lg border px-2 py-2 text-xs font-medium ${amount === String(preset) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>PKR {preset.toLocaleString()}</button>)}
      </div>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Amount (PKR)</span><input inputMode="decimal" min="100" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button disabled={loading} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Opening Safepay…' : 'Continue to Safepay'}</button>
      </form>
    </div>
  );
}
