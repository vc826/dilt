import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, Message } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import { MessageSquare, Send } from 'lucide-react';

type Props = {
  messages: Message[];
  onRefresh: () => void;
};

export default function MessagesTab({ messages, onRefresh }: Props) {
  const { customer } = useAuth();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleSend = async () => {
    if (!customer || !body.trim()) return;
    setSending(true);
    await supabase.from('messages').insert({
      customer_id: customer.id,
      sender: 'customer',
      body: body.trim(),
      read: false,
    });
    setBody('');
    setSending(false);
    onRefresh();
  };

  const handleMarkRead = async (id: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Messages</h1>
        <p className="text-gray-500 text-sm">Instant chat with Alliance Global Bank support.</p>
      </div>

      <div className="glass-card p-6 flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide mb-4">
          {sorted.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No messages yet. Start a conversation below.</p>
            </div>
          ) : (
            sorted.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                onClick={() => !msg.read && msg.sender === 'admin' && handleMarkRead(msg.id)}
              >
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender === 'customer'
                    ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 rounded-br-sm'
                    : 'bg-ink-700 text-white rounded-bl-sm'
                }`}>
                  {msg.body}
                  <div className={`text-[10px] mt-1 ${msg.sender === 'customer' ? 'text-ink-950/60' : 'text-gray-500'}`}>
                    {formatDateTime(msg.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 border-t border-white/5 pt-4">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message…"
            className="input-field flex-1"
          />
          <button onClick={handleSend} disabled={sending || !body.trim()} className="btn-primary px-4 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
