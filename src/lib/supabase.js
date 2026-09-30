// Supabase client (CP2.1).
// Reads the public project URL and anon key from Vite env variables.
// Real values go only in .env.local (git-ignored). See .env.example.
// Never use the service_role key in frontend code.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase config: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local ' +
      '(see .env.example), then restart the dev server.'
  )
}

// No authentication in this app, so no session is stored or refreshed.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
