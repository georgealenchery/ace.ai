export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export function validateEnv(): void {
  const required = [
    "OPENAI_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
