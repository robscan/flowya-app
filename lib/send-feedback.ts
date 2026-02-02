/**
 * Envía feedback de FLOWYA al endpoint serverless.
 * Persiste en Supabase (tabla feedback).
 * No expone errores técnicos; devuelve ok/error genérico.
 * En desarrollo (localhost): simula éxito y log en consola.
 */

export type SendFeedbackPayload = {
  message: string;
  url?: string;
  user_id?: string;
  user_email?: string;
  user_agent?: string;
};

export type SendFeedbackResult =
  | { ok: true }
  | { ok: false; message?: string };

function isDev(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || (typeof __DEV__ !== 'undefined' && __DEV__);
}

export async function sendFeedback(payload: SendFeedbackPayload): Promise<SendFeedbackResult> {
  const body = {
    message: payload.message.trim(),
    url: payload.url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
    user_id: payload.user_id ?? undefined,
    user_email: payload.user_email ?? undefined,
    user_agent:
      payload.user_agent ??
      (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
  };

  if (isDev()) {
    console.log('[FLOWYA Feedback - dev]', body);
    return { ok: true };
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch(`${origin}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { ok?: boolean };
    if (res.ok && data.ok) {
      return { ok: true };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
