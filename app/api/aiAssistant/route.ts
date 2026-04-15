import { NextResponse } from "next/server";
import { access, readdir, readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role?: string;
  content?: string;
};

type RepoFile = {
  relativePath: string;
  raw: string;
};

type SearchHit = RepoFile & {
  score: number;
  matchedTerms: string[];
  snippet: string;
};

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

const MAX_HISTORY = 8;
const MAX_MATCHES = 6;
const MAX_FILE_LIST = 40;
const MAX_FILE_SNIPPET_CHARS = 2200;
const MAX_CONTEXT_CHARS = 18000;
const REPO_CACHE_TTL_MS = 15_000;

const NOISE_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "would",
  "should",
  "could",
  "into",
  "from",
  "have",
  "want",
  "there",
  "some",
  "help",
  "thing",
  "page",
  "screen",
  "called",
  "named",
  "titled",
  "button",
  "please",
  "just",
  "need",
  "make",
  "add",
  "change",
  "update",
  "modify",
  "code",
  "provide",
  "show",
  "write",
  "give",
  "send",
  "can",
  "you",
  "me",
  "to",
  "a",
  "an",
  "of",
  "in",
  "on",
  "at",
  "is",
  "it",
]);

let repoCache: { expiresAt: number; files: RepoFile[] } | null = null;
let resolvedRepoRoot: string | null = null;

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function toRepoPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function safeSliceText(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n/* truncated */`;
}

function getXaiConfig() {
  return {
    apiKey: process.env.XAI_API_KEY?.trim() || "",
    model: process.env.XAI_MODEL?.trim() || "grok-4.20",
    baseUrl: (process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1").replace(/\/$/, ""),
  };
}

async function pathExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveRepoRoot() {
  if (resolvedRepoRoot) return resolvedRepoRoot;

  const candidates = unique([
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
  ]);

  for (const candidate of candidates) {
    const hasPackageJson = await pathExists(path.join(candidate, "package.json"));
    const hasAnyIncludedDir = await Promise.all(
      INCLUDED_DIRS.map((dir) => pathExists(path.join(candidate, dir)))
    ).then((results) => results.some(Boolean));

    if (hasPackageJson && hasAnyIncludedDir) {
      resolvedRepoRoot = candidate;
      return candidate;
    }
  }

  resolvedRepoRoot = process.cwd();
  return resolvedRepoRoot;
}

async function walkRepoDir(
  absDir: string,
  repoRoot: string,
  files: RepoFile[]
): Promise<void> {
  const entries = await readdir(absDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") && !entry.isDirectory()) continue;
    if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;

    const absPath = path.join(absDir, entry.name);

    if (entry.isDirectory()) {
      await walkRepoDir(absPath, repoRoot, files);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!INCLUDED_EXTENSIONS.has(ext)) continue;

    try {
      const raw = await readFile(absPath, "utf8");
      files.push({
        relativePath: toRepoPath(path.relative(repoRoot, absPath)),
        raw,
      });
    } catch {
      // ignore unreadable files
    }
  }
}

async function loadRepoFiles(): Promise<RepoFile[]> {
  const now = Date.now();
  if (repoCache && repoCache.expiresAt > now) {
    return repoCache.files;
  }

  const repoRoot = await resolveRepoRoot();
  const files: RepoFile[] = [];

  for (const dir of INCLUDED_DIRS) {
    const absDir = path.join(repoRoot, dir);
    if (await pathExists(absDir)) {
      await walkRepoDir(absDir, repoRoot, files);
    }
  }

  repoCache = {
    expiresAt: now + REPO_CACHE_TTL_MS,
    files,
  };

  return files;
}

function extractExplicitRepoPaths(message: string) {
  return unique(
    [...message.matchAll(/(?:^|[\s`"(])((?:app|components|lib|prisma|utils)\/[A-Za-z0-9._/-]+)/g)]
      .map((match) => match[1]?.trim())
      .filter(isNonEmptyString)
  );
}

function extractFilenameRefs(message: string) {
  return unique(
    [...message.matchAll(/\b([A-Za-z0-9_-]+\.(?:js|jsx|ts|tsx|json|prisma|md))\b/g)]
      .map((match) => normalizeText(match[1] || ""))
      .filter(Boolean)
  );
}

function tokenizeMessage(message: string) {
  return unique(
    normalizeText(message)
      .replace(/[`"'(){}[\],:;!?]/g, " ")
      .split(/[^a-z0-9/_-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2 && !NOISE_WORDS.has(word))
  );
}

function wantsExplicitCode(message: string) {
  const m = normalizeText(message);

  const directPhrases = [
    "show me the code",
    "show me code",
    "write the code",
    "write me the code",
    "write code",
    "give me the code",
    "give me code",
    "provide the code",
    "provide code",
    "can you provide code",
    "can you give me code",
    "send the code",
    "send me the code",
    "exact code",
    "code for this",
    "full code",
    "full implementation",
    "implement this",
    "write the implementation",
    "give me the implementation",
    "provide the implementation",
    "give me a patch",
    "provide a patch",
    "give me the snippet",
    "provide the snippet",
    "return the full updated file",
    "return the full file",
  ];

  if (directPhrases.some((phrase) => m.includes(phrase))) {
    return true;
  }

  const asksForCode =
    m.includes("code") ||
    m.includes("implementation") ||
    m.includes("patch") ||
    m.includes("snippet");

  const requestWords = [
    "give",
    "gimme",
    "show",
    "write",
    "send",
    "need",
    "want",
    "full",
    "exact",
    "implement",
    "provide",
    "create",
    "make",
    "add",
    "can you",
  ];

  return asksForCode && requestWords.some((word) => m.includes(word));
}

function wantsFileInventory(message: string) {
  const m = normalizeText(message);

  return (
    m.includes("what files can you see") ||
    m.includes("what file can you see") ||
    m.includes("what files do you see") ||
    m.includes("what can you see") ||
    m.includes("can you see the file structure") ||
    m.includes("can u see the file structure") ||
    m.includes("file structure") ||
    m.includes("folder structure") ||
    m.includes("project structure") ||
    m.includes("directory structure") ||
    m.includes("repo structure") ||
    m.includes("repository structure") ||
    m.includes("list the files") ||
    m.includes("show the files") ||
    m.includes("repo files") ||
    m.includes("repository files") ||
    m.includes("scan the repo") ||
    m.includes("read the repo")
  );
}

function isLocateQuestion(message: string) {
  const m = normalizeText(message);
  return (
    m.includes("what file") ||
    m.includes("which file") ||
    m.includes("where is") ||
    m.includes("where do i find") ||
    m.includes("where can i find") ||
    m.includes("locate") ||
    m.includes("find the file")
  );
}

function isCasualMessage(message: string) {
  const m = normalizeText(message);
  return (
    m === "hi" ||
    m === "hello" ||
    m === "hey" ||
    m === "yo" ||
    m === "what's up" ||
    m === "whats up"
  );
}

function buildSearchTerms(message: string, messages: ChatMessage[]) {
  const explicitPaths = extractExplicitRepoPaths(message);
  const filenameRefs = extractFilenameRefs(message);
  const currentTerms = tokenizeMessage(message);

  const previousUserTerms = messages
    .filter((msg) => msg.role === "user" && isNonEmptyString(msg.content))
    .slice(-2)
    .flatMap((msg) => tokenizeMessage(msg.content!));

  return unique([
    ...explicitPaths.flatMap((p) => tokenizeMessage(p)),
    ...filenameRefs.flatMap((p) => tokenizeMessage(p)),
    ...currentTerms,
    ...previousUserTerms,
  ]);
}

function makeSnippet(raw: string, terms: string[]) {
  const lower = normalizeText(raw);

  let bestIndex = -1;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
      bestIndex = idx;
    }
  }

  if (bestIndex === -1) {
    return safeSliceText(raw, Math.min(MAX_FILE_SNIPPET_CHARS, raw.length));
  }

  const start = Math.max(0, bestIndex - 500);
  const end = Math.min(raw.length, start + MAX_FILE_SNIPPET_CHARS);
  return raw.slice(start, end);
}

function retrieveRelevantFiles(
  message: string,
  repoFiles: RepoFile[],
  messages: ChatMessage[]
): SearchHit[] {
  const explicitPaths = extractExplicitRepoPaths(message).map(normalizeText);
  const filenameRefs = extractFilenameRefs(message);
  const terms = buildSearchTerms(message, messages);

  const hits: SearchHit[] = [];

  for (const file of repoFiles) {
    const lowerPath = normalizeText(file.relativePath);
    const lowerRaw = normalizeText(file.raw);

    let score = 0;
    const matchedTerms: string[] = [];

    for (const explicitPath of explicitPaths) {
      if (lowerPath === explicitPath) {
        score += 5000;
        matchedTerms.push(explicitPath);
      } else if (lowerPath.includes(explicitPath)) {
        score += 2200;
        matchedTerms.push(explicitPath);
      }
    }

    for (const filename of filenameRefs) {
      if (lowerPath.endsWith(`/${filename}`) || lowerPath === filename) {
        score += 1800;
        matchedTerms.push(filename);
      }
    }

    for (const term of terms) {
      if (!term) continue;

      if (lowerPath.includes(`/${term}/`)) {
        score += 280;
        matchedTerms.push(term);
      } else if (lowerPath.includes(term)) {
        score += 160;
        matchedTerms.push(term);
      }

      if (lowerRaw.includes(term)) {
        score += 14;
        matchedTerms.push(term);
      }
    }

    if (
      message.toLowerCase().includes("summary") &&
      lowerPath.includes("app/summary/page")
    ) {
      score += 600;
      matchedTerms.push("summary");
    }

    if (
      (message.toLowerCase().includes("appointment") ||
        message.toLowerCase().includes("schedule")) &&
      (lowerPath === "app/page.js" ||
        lowerPath === "app/page.tsx" ||
        lowerPath.includes("appointment"))
    ) {
      score += 550;
      matchedTerms.push("appointment");
    }

    if (score <= 0) continue;

    hits.push({
      ...file,
      score,
      matchedTerms: unique(matchedTerms).slice(0, 10),
      snippet: makeSnippet(file.raw, terms),
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, MAX_MATCHES);
}

function summarizeRepo(repoFiles: RepoFile[]) {
  const counts = new Map<string, number>();

  for (const file of repoFiles) {
    const topDir = file.relativePath.split("/")[0] || "root";
    counts.set(topDir, (counts.get(topDir) || 0) + 1);
  }

  const parts = [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dir, count]) => `${dir}/ (${count})`);

  return {
    total: repoFiles.length,
    byDir: parts,
  };
}

function buildInventoryReply(repoFiles: RepoFile[]) {
  const summary = summarizeRepo(repoFiles);
  const sampleFiles = repoFiles
    .map((file) => file.relativePath)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_FILE_LIST);

  return [
    `I can currently see ${summary.total} repo files.`,
    `Directories: ${summary.byDir.join(" • ")}`,
    "",
    "Sample files:",
    ...sampleFiles.map((file) => `- \`${file}\``),
    repoFiles.length > sampleFiles.length
      ? `- ...and ${repoFiles.length - sampleFiles.length} more`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLocateReply(message: string, hits: SearchHit[]) {
  if (hits.length === 0) {
    return [
      "I couldn't verify the target file from the current repo scan.",
      "Try asking again with the exact page title, button label, route, or file name.",
    ].join("\n");
  }

  const lines = [
    `Strongest match for "${message.trim()}":`,
    ...hits.slice(0, 5).map((hit, index) => {
      const why = hit.matchedTerms.length
        ? ` — matched: ${hit.matchedTerms.slice(0, 4).join(", ")}`
        : "";
      return `${index + 1}. \`${hit.relativePath}\`${why}`;
    }),
  ];

  if (!wantsExplicitCode(message)) {
    lines.push("", "Ask for code and I’ll generate the patch from the verified files.");
  }

  return lines.join("\n");
}

function buildVerifiedContext(hits: SearchHit[]) {
  let totalChars = 0;
  const chunks: string[] = [];

  for (const hit of hits) {
    const fileChunk = [
      `FILE: ${hit.relativePath}`,
      `MATCH TERMS: ${hit.matchedTerms.join(", ") || "n/a"}`,
      "CONTENT:",
      safeSliceText(hit.snippet, MAX_FILE_SNIPPET_CHARS),
    ].join("\n");

    if (totalChars + fileChunk.length > MAX_CONTEXT_CHARS) break;
    chunks.push(fileChunk);
    totalChars += fileChunk.length;
  }

  return chunks.join("\n\n---\n\n");
}

function sanitizeHistory(messages: ChatMessage[]) {
  return messages
    .filter(
      (msg) =>
        (msg.role === "user" || msg.role === "assistant") &&
        isNonEmptyString(msg.content)
    )
    .slice(-MAX_HISTORY)
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content!.trim().slice(0, 4000),
    }));
}

function extractAssistantText(apiJson: any) {
  const content = apiJson?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();

    if (joined) return joined;
  }

  return "";
}

function isProviderAuthError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const text = error.message.toLowerCase();

  return (
    text.includes("401") ||
    text.includes("invalid api key") ||
    text.includes("unauthorized") ||
    text.includes("authentication")
  );
}

function buildProviderFailureReply(
  message: string,
  hits: SearchHit[],
  error: unknown
) {
  const strongest = hits.slice(0, 3).map((hit) => `- \`${hit.relativePath}\``);
  const authIssue = isProviderAuthError(error);

  const intro = authIssue
    ? "I can still inspect this repo locally, but I could not use Grok because the configured xAI API key was rejected."
    : "I can still inspect this repo locally, but I could not reach Grok for this request.";

  const reason = authIssue
    ? "That usually means XAI_API_KEY is missing, wrong, rotated, or the dev server needs a restart after changing `.env.local`."
    : error instanceof Error
      ? `Grok returned: ${error.message}`
      : "The provider request failed for an unknown reason.";

  const context =
    strongest.length > 0
      ? `Verified files for this request:\n${strongest.join("\n")}`
      : "I did not get strong verified file matches for this request.";

  const help = wantsExplicitCode(message)
    ? "I can still help with file discovery and exact target selection, but model-backed code generation will not work until xAI auth is fixed."
    : "Local repo discovery still works. Questions like file structure and file location do not need Grok.";

  return [intro, reason, "", context, "", help].join("\n");
}

async function callChatProvider(args: {
  systemPrompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userPrompt: string;
}) {
  const xai = getXaiConfig();

  if (!xai.apiKey) {
    throw new Error("Missing XAI_API_KEY.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const res = await fetch(`${xai.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xai.apiKey}`,
      },
      body: JSON.stringify({
        model: xai.model,
        temperature: 0.15,
        max_tokens: 1400,
        messages: [
          { role: "system", content: args.systemPrompt },
          ...args.history,
          { role: "user", content: args.userPrompt },
        ],
      }),
    });

    const text = await res.text();
    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const providerMessage =
        data?.error?.message ||
        data?.error ||
        data?.message ||
        text ||
        `xAI request failed with status ${res.status}`;

      throw new Error(`Grok API error (${res.status}): ${providerMessage}`);
    }

    const reply = extractAssistantText(data);
    if (!reply) {
      throw new Error("Grok response did not include message content.");
    }

    return {
      provider: "grok",
      model: xai.model,
      reply,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildSystemPrompt(repoFiles: RepoFile[]) {
  const repoSummary = summarizeRepo(repoFiles);

  return [
    "You are the Oak Bay Scheduler passover developer assistant.",
    "Your job is to help future students or maintainers understand and change this codebase safely.",
    "Stay grounded in the verified repo context I provide.",
    "Never invent file paths, routes, components, or APIs.",
    "If the user asks for code, provide concrete code, not just advice.",
    "When you give code:",
    "- name the file(s)",
    "- keep changes minimal and practical",
    "- prefer patches that fit the existing code style",
    "- explain only briefly",
    "If the target file is not verified, say that clearly.",
    `Repo summary: ${repoSummary.total} files across ${repoSummary.byDir.join(", ")}.`,
  ].join("\n");
}

function buildUserPrompt(args: {
  message: string;
  repoFiles: RepoFile[];
  hits: SearchHit[];
}) {
  const repoSummary = summarizeRepo(args.repoFiles);
  const verifiedContext = buildVerifiedContext(args.hits);

  return [
    `USER REQUEST:\n${args.message.trim()}`,
    "",
    `VERIFIED REPO SUMMARY:\nTotal files: ${repoSummary.total}\nDirectories: ${repoSummary.byDir.join(", ")}`,
    "",
    args.hits.length > 0
      ? `VERIFIED FILES:\n${args.hits.map((hit) => `- ${hit.relativePath}`).join("\n")}`
      : "VERIFIED FILES:\n- none strongly matched",
    "",
    verifiedContext ? `VERIFIED CONTEXT:\n${verifiedContext}` : "VERIFIED CONTEXT:\n- none",
    "",
    "RESPONSE RULES:",
    "- If asked for code, return the code.",
    "- If a file is the strongest match, say so.",
    "- Keep the answer grounded in the verified files above.",
    "- Do not claim you changed files; only provide the patch.",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = isNonEmptyString(body?.message) ? body.message.trim() : "";
    const messages = Array.isArray(body?.messages)
      ? (body.messages as ChatMessage[])
      : [];

    if (!message) {
      return NextResponse.json(
        { error: "Missing 'message' in request body." },
        { status: 400 }
      );
    }

    if (isCasualMessage(message)) {
      return NextResponse.json({
        reply: "Hey — what do you want to work on in Oak Bay Scheduler?",
      });
    }

    const repoFiles = await loadRepoFiles();

    if (repoFiles.length === 0) {
      return NextResponse.json({
        reply:
          "I could not see any repo files from the server runtime. If this only happens in deployment, make sure app/components/lib/prisma/utils are included in the server bundle.",
      });
    }

    if (wantsFileInventory(message)) {
      return NextResponse.json({
        reply: buildInventoryReply(repoFiles),
      });
    }

    const hits = retrieveRelevantFiles(message, repoFiles, messages);

    if (isLocateQuestion(message) && !wantsExplicitCode(message)) {
      return NextResponse.json({
        reply: buildLocateReply(message, hits),
        meta: {
          matchedFiles: hits.map((hit) => hit.relativePath),
        },
      });
    }

    const systemPrompt = buildSystemPrompt(repoFiles);
    const userPrompt = buildUserPrompt({ message, repoFiles, hits });
    const history = sanitizeHistory(messages);

    try {
      const result = await callChatProvider({
        systemPrompt,
        history,
        userPrompt,
      });

      return NextResponse.json({
        reply: result.reply,
        meta: {
          provider: result.provider,
          model: result.model,
          matchedFiles: hits.map((hit) => hit.relativePath),
        },
      });
    } catch (providerError) {
      return NextResponse.json({
        reply: buildProviderFailureReply(message, hits, providerError),
        meta: {
          provider: "grok_unavailable",
          matchedFiles: hits.map((hit) => hit.relativePath),
        },
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI assistant error";

    return NextResponse.json({
      reply: `I hit a server-side problem while processing that request: ${message}`,
    });
  }
}