import { supabase } from "./supabase";
import type {
  SavedInterview,
  VapiInterviewConfig,
  VapiAnalysisResult,
  VapiTranscriptEntry,
} from "../types/interview";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInterview(row: any): SavedInterview {
  return {
    id: row.id,
    date: row.created_at,          // frontend expects "date"
    role: row.role,
    questionType: row.question_type,
    config: row.config,
    result: row.result,
    transcript: row.transcript ?? [],
  };
}

const COLUMNS = "id, created_at, role, question_type, config, result, transcript";

export async function saveInterview(
  userId: string,
  config: VapiInterviewConfig,
  result: VapiAnalysisResult,
  transcript: VapiTranscriptEntry[] = [],
): Promise<SavedInterview> {
  const { data, error } = await supabase
    .from("interviews")
    .insert({
      user_id: userId,
      role: config.role,
      question_type: config.questionType,
      config,
      result,
      transcript,
    })
    .select(COLUMNS)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save interview");
  return rowToInterview(data);
}

export async function getInterviews(userId: string): Promise<SavedInterview[]> {
  const { data, error } = await supabase
    .from("interviews")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToInterview);
}

export async function getInterviewById(
  userId: string,
  id: string,
): Promise<SavedInterview | null> {
  const { data, error } = await supabase
    .from("interviews")
    .select(COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToInterview(data);
}

export async function getLatestInterview(userId: string): Promise<SavedInterview | null> {
  const { data, error } = await supabase
    .from("interviews")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToInterview(data);
}
