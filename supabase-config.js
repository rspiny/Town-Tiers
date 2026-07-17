// Supabase configuration
const SUPABASE_URL = 'https://okgnwaeszuihxmmjzbew.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oiVJClYzpLqLCbqQKXNlng_AUJfaXi8';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabaseClient;
