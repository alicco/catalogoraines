import { createClient } from '@supabase/supabase-js'

// Hardcoded for Vercel deployment stability
// NOTE: Ideally these should be Env Vars in Vercel Dashboard, but for immediate fix we embed them.
const supabaseUrl = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczNzcsImV4cCI6MjA4MzgxMzM3N30.YeGT5vQm2-LAdtCmWcX7EfTWyqIoyVJaO1mfCir2HgI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
