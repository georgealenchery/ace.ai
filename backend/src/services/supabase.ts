import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS, used only on the server.
// NEVER expose the service role key to the frontend.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
