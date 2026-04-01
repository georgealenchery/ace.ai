import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OPENAI_MODEL } from "../config";
import { buildFollowUpPrompt } from "../prompts/followup";
import { buildEvaluationPrompt } from "../prompts/evaluation";
import { buildBehavioralPrompt } from "../prompts/behavioral";
import { buildTechnicalPrompt } from "../prompts/technical";
import { formatTranscript } from "../utils/formatter";
import type { Message, InterviewConfig, EvaluationResult, VapiTranscriptEntry, VapiInterviewConfig, VapiAnalysisResult, CodingProblem } from "../types/interview";

const openai = new OpenAI();

const DEFAULT_EVALUATION: EvaluationResult = {
  score: 50,
  communication: 50,
  technicalAccuracy: 50,
  problemSolving: 50,
  strengths: ["Unable to fully evaluate"],
  improvements: ["Unable to fully evaluate"],
  nextSteps: ["Retry the interview for a complete evaluation"],
};

/**
 * Generate the opening question for an interview session.
 */
export async function generateFirstQuestion(config: InterviewConfig): Promise<string> {
  const { role, mode, difficulty, experienceLevel } = config;

  const prompt =
    mode === "technical"
      ? buildTechnicalPrompt(role, difficulty, experienceLevel)
      : buildBehavioralPrompt(role, experienceLevel);

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "system", content: prompt }],
  });

  return res.choices[0]?.message.content ?? "";
}

/**
 * Generate a follow-up question based on conversation history.
 */
export async function generateFollowUp(
  messages: Message[],
  config: InterviewConfig,
): Promise<string> {
  const prompt = buildFollowUpPrompt(config.role, config.difficulty);
  const transcript = formatTranscript(messages);

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: transcript },
    ],
  });

  return res.choices[0]?.message.content ?? "";
}

/**
 * Evaluate the full interview transcript and return structured feedback.
 */
export async function evaluateInterview(
  messages: Message[],
  config: InterviewConfig,
): Promise<EvaluationResult> {
  const prompt = buildEvaluationPrompt(config.role, config.questionType);
  const transcript = formatTranscript(messages);

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: transcript },
    ],
  });

  const raw = res.choices[0]?.message.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as Partial<EvaluationResult>;
    return {
      score: parsed.score ?? DEFAULT_EVALUATION.score,
      communication: parsed.communication ?? DEFAULT_EVALUATION.communication,
      technicalAccuracy: parsed.technicalAccuracy ?? DEFAULT_EVALUATION.technicalAccuracy,
      problemSolving: parsed.problemSolving ?? DEFAULT_EVALUATION.problemSolving,
      strengths: parsed.strengths ?? DEFAULT_EVALUATION.strengths,
      improvements: parsed.improvements ?? DEFAULT_EVALUATION.improvements,
      nextSteps: parsed.nextSteps ?? DEFAULT_EVALUATION.nextSteps,
    };
  } catch {
    console.error("Failed to parse evaluation response:", raw);
    return DEFAULT_EVALUATION;
  }
}

const DEFAULT_VAPI_ANALYSIS: VapiAnalysisResult = {
  score: 50,
  communication: 50,
  technicalAccuracy: 50,
  problemSolving: 50,
  strengths: ["Unable to fully evaluate"],
  improvements: ["Unable to fully evaluate"],
  nextSteps: ["Retry the interview for a complete evaluation"],
  questionBreakdown: [],
};

const ROLE_GUIDELINES: Record<string, string> = {
  frontend: "React, JavaScript, state management, performance, CSS",
  backend: "APIs, databases, authentication, system design",
  fullstack: "frontend + backend integration, APIs, data flow",
  machine_learning: "models, training, evaluation, data processing",
  mobile: "React Native, mobile performance, UI/UX, state",
  cybersecurity: "authentication, vulnerabilities, encryption, secure systems",
  systems: "low-level design, OS concepts, concurrency, performance",
  devops: "CI/CD, cloud infrastructure, Docker, deployment systems",
};

const FALLBACK_PROBLEMS: CodingProblem[] = [
  {
    prompt: "Write a function that takes an array of numbers and returns the two numbers that add up to a given target sum. Return them as an array in the order they appear.",
    functionName: "twoSum",
    functionSignature: "function twoSum(nums, target) {\n  // Your implementation here\n}",
    testCases: [
      { input: [[2, 7, 11, 15], 9], expectedOutput: [2, 7] },
      { input: [[3, 2, 4], 6], expectedOutput: [2, 4] },
      { input: [[1, 5, 3, 7], 8], expectedOutput: [1, 7] },
    ],
  },
  {
    prompt: "Write a function that takes a string and returns true if it is a valid palindrome (ignoring non-alphanumeric characters and case), false otherwise.",
    functionName: "isPalindrome",
    functionSignature: "function isPalindrome(s) {\n  // Your implementation here\n}",
    testCases: [
      { input: ["A man, a plan, a canal: Panama"], expectedOutput: true },
      { input: ["race a car"], expectedOutput: false },
      { input: ["Was it a car or a cat I saw?"], expectedOutput: true },
    ],
  },
  {
    prompt: "Write a function that takes an array of integers and returns the maximum sum of any contiguous subarray.",
    functionName: "maxSubarraySum",
    functionSignature: "function maxSubarraySum(nums) {\n  // Your implementation here\n}",
    testCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expectedOutput: 6 },
      { input: [[1]], expectedOutput: 1 },
      { input: [[5, 4, -1, 7, 8]], expectedOutput: 23 },
    ],
  },
];

// ── Machine Learning question generation ─────────────────────────────────────

const ML_CATEGORIES = [
  "data preprocessing",
  "model evaluation",
  "loss functions",
  "gradient updates",
  "feature engineering",
  "overfitting detection",
  "basic model logic",
];

// Keywords whose presence in a prompt strongly indicates a generic algorithm
// problem rather than an ML concept problem.
const ML_GENERIC_KEYWORDS = [
  "linked list",
  "binary tree",
  "graph traversal",
  "depth-first",
  "breadth-first",
  "two sum",
  "fibonacci",
  "merge sort",
  "quicksort",
  "heapsort",
  "trie",
  "dynamic programming",
];

function mlProblemsAreValid(problems: CodingProblem[]): boolean {
  return problems.every((p) => {
    const text = `${p.prompt} ${p.functionName}`.toLowerCase();
    return !ML_GENERIC_KEYWORDS.some((kw) => text.includes(kw));
  });
}

const ML_FALLBACK_PROBLEMS: CodingProblem[] = [
  {
    prompt:
      "Implement min-max normalization for a list of numerical values. " +
      "Given a list of numbers, return a new list where every value is scaled " +
      "to the range [0, 1] using the formula: (x - min) / (max - min). " +
      "If all values are identical, return a list of zeros.",
    functionName: "min_max_normalize",
    functionSignature:
      "def min_max_normalize(values):\n    # Your implementation here\n    pass",
    testCases: [
      { input: [[0, 5, 10]], expectedOutput: [0.0, 0.5, 1.0] },
      { input: [[3, 3, 3]], expectedOutput: [0.0, 0.0, 0.0] },
      { input: [[-10, 0, 10]], expectedOutput: [0.0, 0.5, 1.0] },
      { input: [[1, 2, 3, 4, 5]], expectedOutput: [0.0, 0.25, 0.5, 0.75, 1.0] },
    ],
  },
  {
    prompt:
      "Implement a function that computes classification accuracy, precision, " +
      "and recall given two lists: the true labels and the predicted labels " +
      "(binary: 0 or 1). Return a dict with keys 'accuracy', 'precision', and " +
      "'recall', each rounded to 2 decimal places. " +
      "If there are no positive predictions, precision is 0. " +
      "If there are no actual positives, recall is 0.",
    functionName: "classification_metrics",
    functionSignature:
      "def classification_metrics(y_true, y_pred):\n    # Your implementation here\n    pass",
    testCases: [
      {
        input: [[1, 0, 1, 1], [1, 0, 0, 1]],
        expectedOutput: { accuracy: 0.75, precision: 1.0, recall: 0.67 },
      },
      {
        input: [[1, 1, 0, 0], [1, 0, 0, 0]],
        expectedOutput: { accuracy: 0.75, precision: 1.0, recall: 0.5 },
      },
      {
        input: [[0, 0, 0], [0, 0, 0]],
        expectedOutput: { accuracy: 1.0, precision: 0.0, recall: 0.0 },
      },
    ],
  },
  {
    prompt:
      "Implement a single gradient descent weight update. Given the current " +
      "weights (a list of floats), the corresponding gradients (a list of floats), " +
      "and a learning rate (float), return the updated weights after one step: " +
      "w = w - learning_rate * gradient. Return each weight rounded to 4 decimal places.",
    functionName: "gradient_descent_step",
    functionSignature:
      "def gradient_descent_step(weights, gradients, learning_rate):\n    # Your implementation here\n    pass",
    testCases: [
      { input: [[1.0, 2.0], [0.5, 0.5], 0.1], expectedOutput: [0.95, 1.95] },
      { input: [[0.0, 0.0], [1.0, -1.0], 0.01], expectedOutput: [-0.01, 0.01] },
      { input: [[5.0], [2.0], 0.5], expectedOutput: [4.0] },
    ],
  },
];

function buildMLPrompt(difficulty: string, level: string): string {
  const categories = ML_CATEGORIES.slice().sort(() => Math.random() - 0.5).slice(0, 3);

  return `You are conducting a machine learning technical interview at ${level} level, ${difficulty} difficulty.

Generate EXACTLY 3 coding problems. Each problem must cover a DIFFERENT ML concept from this list:
${categories.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

Each problem must:
- Be solvable in 5–10 minutes
- Require writing a Python function
- Have a clear, bounded problem statement (not an open-ended project)
- Test genuine understanding of the ML concept, not just general programming
- Include 3–5 concrete test cases with specific numeric inputs and expected outputs

STRICTLY FORBIDDEN — do not generate problems about:
- Generic algorithms: sorting, searching, arrays, linked lists, binary trees, graphs
- LeetCode-style puzzles (two-sum, fibonacci, palindromes, etc.)
- Full model training pipelines
- Multi-step ML projects

Good examples of allowed problems:
- "Implement min-max normalization on a list of floats"
- "Compute precision and recall given two label lists"
- "Apply one gradient descent step given weights, gradients, and learning rate"
- "Detect whether a model is overfitting given train/val loss curves"
- "Compute the cross-entropy loss for a set of predictions"

Difficulty guide:
- easy: straightforward formula implementation, one clear concept, simple test cases
- medium: requires combining two concepts or handling edge cases (e.g. divide-by-zero, empty arrays)
- hard: requires deeper understanding, multiple edge cases, performance considerations

Function signature format (Python):
def func_name(param1, param2):
    # Your implementation here
    pass

Return ONLY valid JSON — no markdown, no explanation, no extra text.`;
}

// ─────────────────────────────────────────────────────────────────────────────

const SIGNATURE_GUIDE: Record<string, string> = {
  JavaScript: 'function funcName(param1, param2) {\\n  // Your implementation here\\n}',
  "Node.js":  'function funcName(param1, param2) {\\n  // Your implementation here\\n}',
  TypeScript: 'function funcName(param1: Type1, param2: Type2): ReturnType {\\n  // Your implementation here\\n}',
  Python:     'def func_name(param1, param2):\\n    # Your implementation here\\n    pass',
  Java:       'public static ReturnType funcName(Type1 param1, Type2 param2) {\\n    // Your implementation here\\n}',
  "C++":      'ReturnType funcName(Type1 param1, Type2 param2) {\\n    // Your implementation here\\n}',
  Bash:       '#!/bin/bash\\n\\n# Your implementation here',
};

/**
 * Generate 3 role-aware, language-specific coding interview problems.
 */
export async function generateInterviewQuestions(
  role: string,
  difficulty: string,
  level: string,
  language = "JavaScript",
): Promise<CodingProblem[]> {
  console.log("Role:", role);
  console.log("Language:", language);
  console.log("Difficulty:", difficulty);
  console.log("Level:", level);

  // ── ML-specific path ───────────────────────────────────────────────────────
  const isML = role === "ml" || role === "machine_learning";
  if (isML) {
    // ML interviews are always in Python regardless of what the client passed
    const mlPrompt = buildMLPrompt(difficulty, level);

    const callML = async (): Promise<CodingProblem[] | null> => {
      const res = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a machine learning interview problem generator. " +
              "Always return a JSON object with a 'problems' array containing exactly 3 ML coding problems in Python.",
          },
          { role: "user", content: mlPrompt + '\n\nWrap the array in: { "problems": [...] }' },
        ],
      });

      const raw = res.choices[0]?.message.content ?? "{}";
      try {
        const parsed = JSON.parse(raw) as { problems?: CodingProblem[] };
        const problems = parsed.problems;
        if (!Array.isArray(problems) || problems.length !== 3) return null;
        const structurallyValid = problems.every(
          (p) =>
            typeof p.prompt === "string" &&
            typeof p.functionName === "string" &&
            typeof p.functionSignature === "string" &&
            Array.isArray(p.testCases) &&
            p.testCases.length >= 1,
        );
        if (!structurallyValid) return null;
        if (!mlProblemsAreValid(problems)) {
          console.warn("ML problems failed keyword validation — retrying");
          return null;
        }
        return problems;
      } catch {
        return null;
      }
    };

    // First attempt
    let mlProblems = await callML();

    // One retry if the first attempt produced generic problems
    if (!mlProblems) {
      console.warn("ML question generation attempt 1 failed, retrying…");
      mlProblems = await callML();
    }

    if (!mlProblems) {
      console.error("ML question generation failed after retry — using fallback problems");
      return ML_FALLBACK_PROBLEMS;
    }

    console.log("ML questions generated:", mlProblems);
    return mlProblems;
  }
  // ──────────────────────────────────────────────────────────────────────────

  const guidelines = ROLE_GUIDELINES[role] ?? "software engineering fundamentals";
  const signatureExample = SIGNATURE_GUIDE[language] ?? SIGNATURE_GUIDE["JavaScript"]!;

  const prompt = `You are a senior ${role} engineer creating a ${level}-level ${difficulty} technical coding interview.

The candidate must write code in ${language} ONLY. Do not use any other programming language.

Focus on: ${guidelines}

Generate EXACTLY 3 coding problems. Each problem must:
- Be a realistic, role-relevant coding challenge (not a pure abstract algorithm)
- Require writing a ${language} function/solution
- Be solvable in 10-20 minutes at the ${difficulty} difficulty
- Test different concepts
- Have 3-5 concrete test cases with actual input values and expected outputs

Function signature format for ${language}:
${signatureExample}

Difficulty guide:
- easy: straightforward logic, no complex algorithms, clear requirements
- medium: requires some problem-solving, moderate complexity
- hard: requires optimized solutions, edge-case handling, or advanced patterns

Return ONLY valid JSON in this exact format (no markdown, no extra text):
[
  {
    "prompt": "Clear problem description with context and requirements...",
    "functionName": "funcName",
    "functionSignature": "<valid ${language} function signature with placeholder body>",
    "testCases": [
      { "input": [arg1, arg2], "expectedOutput": result },
      { "input": [arg1, arg2], "expectedOutput": result },
      { "input": [arg1, arg2], "expectedOutput": result }
    ]
  }
]`;

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a coding interview problem generator. Always return a JSON object with a 'problems' array containing exactly 3 coding problems.",
      },
      { role: "user", content: prompt + '\n\nWrap the array in: { "problems": [...] }' },
    ],
  });

  const raw = res.choices[0]?.message.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as { problems?: CodingProblem[] };
    const problems = parsed.problems;

    if (!Array.isArray(problems) || problems.length !== 3) {
      console.error("Expected 3 problems, got:", problems?.length);
      return FALLBACK_PROBLEMS;
    }

    const valid = problems.every(
      (p) =>
        typeof p.prompt === "string" &&
        typeof p.functionName === "string" &&
        typeof p.functionSignature === "string" &&
        Array.isArray(p.testCases) &&
        p.testCases.length >= 1,
    );

    if (!valid) {
      console.error("Invalid problem structure in response");
      return FALLBACK_PROBLEMS;
    }

    console.log("Generated coding problems:", problems);
    return problems;
  } catch {
    console.error("Failed to parse coding problems response:", raw);
    return FALLBACK_PROBLEMS;
  }
}

/**
 * Analyze a completed Vapi voice interview transcript.
 */
export async function analyzeVapiTranscript(
  transcript: VapiTranscriptEntry[],
  config: VapiInterviewConfig,
): Promise<VapiAnalysisResult> {
  const roleLabel = config.role.charAt(0).toUpperCase() + config.role.slice(1);

  const difficultyLabel =
    config.difficulty <= 30 ? "easy" : config.difficulty <= 60 ? "medium" : "hard";
  const strictnessLabel =
    config.strictness <= 30 ? "lenient" : config.strictness <= 60 ? "fair" : "strict";
  const experienceLabel =
    config.experienceLevel <= 30 ? "junior" : config.experienceLevel <= 60 ? "mid-level" : "senior";

  const formattedTranscript = transcript
    .map((entry) => `${entry.role === "assistant" ? "Interviewer" : "Candidate"}: ${entry.text}`)
    .join("\n");

  const prompt = `You are an expert interview evaluator. Analyze the following ${roleLabel} engineering interview transcript.

Interview settings:
- Role: ${roleLabel} engineer
- Question type: ${config.questionType}
- Difficulty: ${difficultyLabel} (${config.difficulty}/100)
- Candidate experience level: ${experienceLabel} (${config.experienceLevel}/100)
- Interviewer strictness: ${strictnessLabel} (${config.strictness}/100)

Evaluate the candidate's performance considering the difficulty and experience level. A junior candidate answering easy questions should be graded relative to junior expectations. A senior candidate answering hard questions should be graded relative to senior expectations.

Return a JSON object with exactly this structure:
{
  "score": <number 0-100, overall interview performance>,
  "communication": <number 0-100, clarity, articulation, conciseness of answers>,
  "technicalAccuracy": <number 0-100, correctness of technical content>,
  "problemSolving": <number 0-100, logical thinking, approach to problems>,
  "strengths": [<3-5 strings, specific strengths with brief examples from the transcript>],
  "improvements": [<3-5 strings, specific areas to improve with examples from the transcript>],
  "nextSteps": [<3-5 strings, actionable study or practice recommendations>],
  "questionBreakdown": [
    {
      "question": <the interviewer's question>,
      "candidateAnswer": <summary of the candidate's answer>,
      "score": <number 0-100>,
      "feedback": <specific feedback on this answer>
    }
  ]
}

Include every question-answer pair in questionBreakdown. Be specific and reference the candidate's actual words. Do not be generic.`;

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: formattedTranscript },
    ],
  });

  const raw = res.choices[0]?.message.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as Partial<VapiAnalysisResult>;
    return {
      score: parsed.score ?? DEFAULT_VAPI_ANALYSIS.score,
      communication: parsed.communication ?? DEFAULT_VAPI_ANALYSIS.communication,
      technicalAccuracy: parsed.technicalAccuracy ?? DEFAULT_VAPI_ANALYSIS.technicalAccuracy,
      problemSolving: parsed.problemSolving ?? DEFAULT_VAPI_ANALYSIS.problemSolving,
      strengths: parsed.strengths ?? DEFAULT_VAPI_ANALYSIS.strengths,
      improvements: parsed.improvements ?? DEFAULT_VAPI_ANALYSIS.improvements,
      nextSteps: parsed.nextSteps ?? DEFAULT_VAPI_ANALYSIS.nextSteps,
      questionBreakdown: parsed.questionBreakdown ?? DEFAULT_VAPI_ANALYSIS.questionBreakdown,
    };
  } catch {
    console.error("Failed to parse Vapi analysis response:", raw);
    return DEFAULT_VAPI_ANALYSIS;
  }
}
