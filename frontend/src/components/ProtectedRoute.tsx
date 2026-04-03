import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { supabase } from "../lib/supabase";

type Status = "loading" | "authenticated" | "unauthenticated";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    // Check whatever session Supabase already has persisted
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? "authenticated" : "unauthenticated");
    });

    // React to login/logout events (including from other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "authenticated" : "unauthenticated");
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return status === "authenticated" ? <>{children}</> : <Navigate to="/login" replace />;
}
