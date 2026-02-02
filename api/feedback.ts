/**
 * Vercel serverless: persiste feedback de FLOWYA en Supabase.
 * Usa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY (o SUPABASE_URL / SUPABASE_ANON_KEY).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

export type FeedbackPayload = {
  message: string;
  url?: string;
  user_id?: string;
  user_email?: string;
  user_agent?: string;
};

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as FeedbackPayload;
    const { message, url, user_id, user_email, user_agent } = body;

    if (!message || typeof message !== 'string') {
      return Response.json({ ok: false, error: 'message required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('Feedback API: missing Supabase config');
      return Response.json({ ok: false }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('feedback').insert({
      message: message.trim(),
      url: url || null,
      user_id: user_id || null,
      user_email: user_email || null,
      user_agent: user_agent || null,
    });

    if (error) {
      console.error('Feedback insert error:', error);
      return Response.json({ ok: false }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Feedback API error:', err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
