import { createClient } from '@supabase/supabase-js'

// Hardcoded for Vercel deployment stability
// NOTE: Ideally these should be Env Vars in Vercel Dashboard, but for immediate fix we embed them.
export const supabaseUrl = 'https://txsvbwbbhjkymmjlkgqk.supabase.co';
export const SUPABASE_URL = supabaseUrl;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4c3Zid2JiaGpreW1tamxrZ3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjA1MzEsImV4cCI6MjA4NzkzNjUzMX0.Qmewu0yiHZO6TR-MKIlVjSszctIuqs15PjCNbmnsCKk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
