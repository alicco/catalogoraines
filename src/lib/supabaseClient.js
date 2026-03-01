import { createClient } from '@supabase/supabase-js'

// Hardcoded for Vercel deployment stability
// NOTE: Ideally these should be Env Vars in Vercel Dashboard, but for immediate fix we embed them.
const supabaseUrl = 'https://txsvbwbbhjkymmjlkgqk.supabase.co';
const supabaseAnonKey = 'sb_publishable_CNlNp1DKpPwYQtmfbTvE-g_Dm_Kp3xQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
