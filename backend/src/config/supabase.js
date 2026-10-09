const { createClient } = require('@supabase/supabase-js');

const isConfigured = !!(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_STORAGE_BUCKET
);

// The SERVICE ROLE key, not the anon key — this client only ever runs
// server-side (never shipped to the browser), and needs to write to the
// bucket regardless of any Row Level Security policy, since path/folder
// trust already comes from our own auth context (see upload.service.js's
// resolvePath), not from Supabase's own policy engine.
const supabase = isConfigured
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

module.exports = {
  supabase,
  isSupabaseConfigured: () => isConfigured,
  bucket: () => process.env.SUPABASE_STORAGE_BUCKET,
};
