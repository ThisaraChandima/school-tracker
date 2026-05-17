import { createClient } from '@supabase/supabase-js'

// Use Supabase connection pooler URL (port 6543) instead of direct (port 5432)
// This handles 134+ concurrent connections on free tier
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

// Replace :5432 with :6543 and add pgbouncer mode if using direct URL
const poolerUrl = supabaseUrl?.replace(
  'db.',
  'aws-0-ap-southeast-1.pooler.'  // change region to match your Supabase project region
) || supabaseUrl

const supabase = createClient(poolerUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-my-custom-header': 'school-tracker' },
  },
  // Disable realtime to save connections
  realtime: {
    params: {
      eventsPerSecond: -1,
    },
  },
})

export default supabase
