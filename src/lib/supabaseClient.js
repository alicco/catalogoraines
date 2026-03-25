import { createClient } from '@supabase/supabase-js'

// Correct Project: ProgettoRaines (pbzeuxbmiawnjwpnbwkh)
export const supabaseUrl = 'https://pbzeuxbmiawnjwpnbwkh.supabase.co';
export const SUPABASE_URL = supabaseUrl;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczNzcsImV4cCI6MjA4MzgxMzM3N30.YeGT5vQm2-LAdtCmWcX7EfTWyqIoyVJaO1mfCir2HgI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
