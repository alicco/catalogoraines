import { createClient } from '@supabase/supabase-js'

// Hardcoded for Vercel deployment stability
export const SUPABASE_URL = 'https://txsvbwbbhjkymmjlkgqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4c3Zid2JiaGpreW1tamtscWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczOTI5MDcsImV4cCI6MjA1Mjk2ODkwN30.Hl1pX8X9X4pX8X9X4pX8X9X4pX8X9X4pX8X9X4pX8'; // Restricted anon key

export const supabase = createClient(SUPABASE_URL, supabaseAnonKey);
