import { createClient } from '@supabase/supabase-js';

// Fallback values for development - these will be overridden by environment variables in production
const FALLBACK_URL = 'https://xtvwtmwqjbjyycifixfz.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dnd0bXdxamJqeXljaWZpeGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1OTU1MzMsImV4cCI6MjA0MjE3MTUzM30.zpu_rxZLt0M-0JFonBMgPVE9VhqGZrXlko2PqQ5S8wM';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);