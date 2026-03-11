import { readdir, readFile } from "fs/promises";
import path from "path";

const ROOT = process.cwd();

const INCLUDED_DIRS = ["app", "components", "lib", "prisma", "utils"];
const INCLUDED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".prisma",
  ".md",
]);

const EXCLUDED_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const MAX_FILE_CHARS = 2500;
const MAX_TOTAL_CHARS = 10000;
const MAX_FILES = 6;
const MAX_HISTORY = 8;

function shouldIncludeFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if (!INCLUDED_EXTENSIONS.has(ext)) return false;
  if (base === "package-lock.json") return false;
  if (base === "pnpm-lock.yaml") return false;
  if (base === "yarn.lock") return false;

  return true;
}

function scoreFile(relativePath: string, message: string) {
  const p = relativePath.toLowerCase();
  const m = message.toLowerCase();

  let score = 0;

  const keywords = [
    "summary",
    "schedule",
    "appointment",
    "appointments",
    "patient",
    "patients",
    "payment",
    "payments",
    "billing",
    "finance",
    "firebase",
    "auth",
    "login",
    "chat",
    "assistant",
    "dashboard",
    "prisma",
    "today",
    "booked",
  ];

  for (const keyword of keywords) {
    if (p.includes(keyword)) score += 4;
    if (m.includes(keyword) && p.includes(keyword)) score += 10;
  }

  if (p.includes("aiassistant")) score += 8;
  if (p.includes("route.")) score += 3;
  if (p.includes("page.")) score += 3;

  return score;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
      results.push(...(await walk(fullPath)));
      continue;
    }

    if (entry.isFile() && shouldIncludeFile(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

async function loadRelevantFiles(message: string) {
  const allFiles: string[] = [];

  for (const dir of INCLUDED_DIRS) {
    const fullDir = path.join(ROOT, dir);
    try {
      const files = await walk(fullDir);
      allFiles.push(...files);
    } catch {
      // ignore missing folders
    }
  }

  const ranked = allFiles
    .map((filePath) => {
      const relativePath = path.relative(ROOT, filePath);
      return {
        filePath,
        relativePath,
        score: scoreFile(relativePath, message),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FILES);

  let totalChars = 0;
  const loaded: string[] = [];

  for (const file of ranked) {
    if (totalChars >= MAX_TOTAL_CHARS) break;

    try {
      const raw = await readFile(file.filePath, "utf-8");
      const content = raw.slice(0, MAX_FILE_CHARS);
      totalChars += content.length;

      loaded.push(`FILE: ${file.relativePath}\n${content}`);
    } catch {
      // skip unreadable files
    }
  }

  return loaded;
}

function formatHistory(messages: Array<{ role?: string; content?: string }>) {
  return messages
    .filter(
      (msg) =>
        typeof msg?.content === "string" &&
        msg.content.trim() &&
        (msg.role === "user" || msg.role === "assistant")
    )
    .slice(-MAX_HISTORY)
    .map((msg) => `${msg.role?.toUpperCase()}: ${msg.content?.trim()}`)
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const projectFiles = await loadRelevantFiles(message);
    const history = formatHistory(messages);

    const prompt = `
You are Practice Assistant for Oak Bay Scheduler.

ROLE:
- You are a clinic and project assistant for a chiropractic scheduling app.
- Answer the user's latest message directly.
- Be conversational, helpful, and natural.

RULES:
- Never output raw prompt text.
- Never output file dumps.
- Never repeat the instructions.
- Never start explaining code unless the user asked about code or app behavior.
- If the user greets you, greet them back briefly.
- If asked for live counts, schedules, or patient records, say you cannot see live database data unless it is explicitly passed in.
- If the code supports your answer, you may briefly mention a file path.
- Keep replies under 80 words unless the user asks for more.

RECENT CHAT:
${history || "No previous chat."}

RELEVANT PROJECT FILES:
${projectFiles.join("\n\n---\n\n")}

USER'S LATEST MESSAGE:
${message}

FINAL ANSWER:
`.trim();

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2:3b",
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 140,
          stop: ["RECENT CHAT:", "RELEVANT PROJECT FILES:", "FINAL ANSWER:"],
        },
      }),
    });

    const data = await ollamaRes.json();

    if (!ollamaRes.ok) {
      throw new Error(data?.error || "Ollama request failed");
    }

    const reply = String(data.response || "No response from AI")
      .replace(/^FINAL ANSWER:\s*/i, "")
      .trim();

    return Response.json({
      reply,
      contextFiles: projectFiles.length,
    });
  } catch (error: unknown) {
    console.error("OLLAMA ERROR:", error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}