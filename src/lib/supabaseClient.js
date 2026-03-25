import { createClient } from '@supabase/supabase-js'

// Database Condiviso: Preventivatore Raines (txsvbwbbhjkymmjlkgqk)
export const supabaseUrl = 'https://txsvbwbbhjkymmjlkgqk.supabase.co';
export const SUPABASE_URL = supabaseUrl;
const supabaseAnonKey = 'sb_publishable_CNlNp1DKpPwYQtmfbTvE-g_Dm_Kp3xQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
