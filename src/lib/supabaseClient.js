import { createClient } from '@supabase/supabase-js'

// Hardcoded for Vercel deployment stability
// NOTE: Ideally these should be Env Vars in Vercel Dashboard, but for immediate fix we embed them.
const supabaseUrl = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
const supabaseAnonKey = 'sb_publishable_15cw1tEon8R4okoEu7Bc0Q_CZcGA8ME';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
