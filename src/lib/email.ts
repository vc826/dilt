import { supabase } from '@/lib/supabase';

const RESEND_FUNCTION = 'send-email-alert';

export async function notifyEmail(to: string, subject: string, body: string): Promise<void> {
  if (!to) return;

  const { data, error } = await supabase.functions.invoke(RESEND_FUNCTION, {
    body: { to, subject, message: body },
  });

  if (error) {
    console.error('Email alert request failed:', error);
    return;
  }

  if (!data?.success) {
    console.error('Email alert was not accepted by the function:', data);
  }
}
