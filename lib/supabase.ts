import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Get environment variables with fallback for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// Log for debugging (will show in browser console)
if (typeof window !== 'undefined') {
  console.log('Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Supabase Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

