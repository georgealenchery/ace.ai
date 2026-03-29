import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { SavedInterview, VapiInterviewConfig, VapiAnalysisResult } from "../types/interview";

const DATA_FILE = path.join(__dirname, "../../data/interviews.json");

function readAll(): SavedInterview[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as SavedInterview[];
  } catch {
    return [];
  }
}

function writeAll(data: SavedInterview[]): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function saveInterview(
  config: VapiInterviewConfig,
  result: VapiAnalysisResult,
): SavedInterview {
  const interviews = readAll();
  const entry: SavedInterview = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    role: config.role,
    questionType: config.questionType,
    config,
    result,
  };
  interviews.unshift(entry);
  writeAll(interviews);
  return entry;
}

export function getInterviews(): SavedInterview[] {
  return readAll().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getLatestInterview(): SavedInterview | null {
  const interviews = getInterviews();
  return interviews[0] ?? null;
}
