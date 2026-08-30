'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader2, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { getMessages, markMessagesRead, sendMessage, type Message } from './_actions';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function MessageThread({
  bookingId,
  currentUserId,
  initialMessages,
  otherLabel,
}: {
  bookingId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherLabel: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void markMessagesRead(bookingId).catch(() => undefined);

    const poll = async () => {
      try {
        const next = await getMessages(bookingId);
        setMessages(next);
        await markMessagesRead(bookingId);
      } catch {
        // Keep the existing conversation visible if a polling request fails.
      }
    };

    const interval = window.setInterval(poll, 3000);
    return () => window.clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isPending) return;

    setError(null);
    startTransition(async () => {
      try {
        const message = await sendMessage(bookingId, content);
        setMessages((current) => [...current, message]);
        setDraft('');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to send message.');
      }
    });
  }

  return (
    <Card className="mt-7 overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-ink">Conversation with {otherLabel}</p>
        <p className="mt-0.5 text-xs text-slate-400">Messages are linked to this demo booking.</p>
      </div>

      <div className="flex min-h-[28rem] flex-col gap-3 overflow-y-auto bg-slate-50/60 p-5">
        {messages.length === 0 ? (
          <div className="m-auto max-w-sm text-center">
            <p className="text-sm font-medium text-slate-600">No messages yet</p>
            <p className="mt-1 text-xs text-slate-400">Send a message to introduce yourself or discuss the demo.</p>
          </div>
        ) : messages.map((message) => {
          const mine = message.clerk_id_from === currentUserId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? 'rounded-br-md bg-emerald-600 text-white' : 'rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-slate-100'}`}>
                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>{formatTime(message.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="border-t border-rose-100 bg-rose-50 px-5 py-2.5 text-xs text-rose-700">{error}</p>}

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-slate-100 bg-white p-4">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Write a message..."
          className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          disabled={isPending}
        />
        <Button type="submit" size="sm" disabled={!draft.trim() || isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </Card>
  );
}
