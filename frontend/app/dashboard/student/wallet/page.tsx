import { WalletCards, ArrowDownToLine, LockKeyhole, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { getStudentWallet } from './_actions';
import AddFundsForm from './AddFundsForm';

function money(amount: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(amount);
}

function label(type: string) {
  if (type === 'deposit') return 'Deposit';
  if (type === 'hold') return 'Session payment held';
  return 'Payment released to tutor';
}

export default async function StudentWalletPage() {
  const { wallet, transactions } = await getStudentWallet();
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-600">Payments</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Wallet</h1>
          <p className="mt-1 text-sm text-slate-500">Add PKR funds securely through Safepay and manage session payments.</p>
        </div>
        <AddFundsForm />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-500"><WalletCards className="h-4 w-4" /> Available balance</div>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">{money(wallet.available_balance)}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-500"><LockKeyhole className="h-4 w-4" /> Held for sessions</div>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">{money(wallet.held_balance)}</p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-5"><h2 className="font-display font-semibold text-ink">Transactions</h2></div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No wallet transactions yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-3 p-5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-500">
                  {transaction.type === 'deposit' ? <ArrowDownToLine className="h-4 w-4" /> : transaction.type === 'hold' ? <LockKeyhole className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink">{label(transaction.type)}</p><p className="mt-0.5 text-xs text-slate-400">{new Date(transaction.created_at).toLocaleString('en-PK')}</p></div>
                <p className="text-sm font-semibold text-ink">{money(transaction.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
