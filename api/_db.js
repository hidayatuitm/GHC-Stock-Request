import { createClient } from '@supabase/supabase-js';

export function database() {
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) throw new Error('Missing Supabase server environment variables');
  const base = new URL(url);
  if (base.protocol !== 'https:' || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('SUPABASE_URL must be the project base URL (https://...supabase.co)');
  }
  return createClient(base.toString(), secret, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function reply(res, status, data) {
  res.status(status).setHeader('Cache-Control','no-store').json(data);
}
