import { access, readdir, readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_BASE_URL =
  process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

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

const MAX_SNIPPET_CHARS = 2200;
const MAX_TOTAL_CHARS = 10000;
const MAX_FILES = 4;
const MAX_HISTORY = 6;
const REPO_CACHE_TTL_MS = 15_000;

const MIN_STRONG_MATCH_SCORE = 60;
const MIN_STRONG_MATCH_GAP = 20;

type AssistantMode =
  | "chat"
  | "debug"
  | "architecture"
  | "implementation"
  | "explain"
  | "locate"
  | "clarify";

type ChatMessage = {
  role?: string;
  content?: string;
};

type RepoFile = {
  relativePath: string;
  raw: string;
};

type RetrievedFile = {
  relativePath: string;
  raw: string;
  snippet: string;
  score: number;
  matchedTerms: string[];
  bestIndex: number;
};

type QuerySignals = {
  explicitRepoPaths: string[];
  fileReferences: string[];
  quotedPhrases: string[];
  pagePhrases: string[];
  routePaths: string[];
  sourcePagePhrases: string[];
  destinationPagePhrases: string[];
  sourcePageTargets: string[];
  destinationPageTargets: string[];
  terms: string[];
  wantsPage: boolean;
  wantsButton: boolean;
  wantsNavigation: boolean;
};

const NOISE_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "for",
  "with",
  "without",
  "that",
  "this",
  "these",
  "those",
  "would",
  "should",
  "could",
  "can",
  "into",
  "from",
  "have",
  "has",
  "had",
  "want",
  "wanted",
  "need",
  "there",
  "here",
  "file",
  "files",
  "repo",
  "repository",
  "project",
  "some",
  "help",
  "thing",
  "page",
  "pages",
  "screen",
  "view",
  "route",
  "called",
  "named",
  "titled",
  "button",
  "buttons",
  "please",
  "just",
  "like",
  "sort",
  "functionality",
  "what",
  "which",
  "where",
  "when",
  "why",
  "how",
  "who",
  "if",
  "i",
  "me",
  "my",
  "you",
  "your",
  "we",
  "our",
  "they",
  "their",
  "it",
  "its",
  "in",
  "on",
  "at",
  "to",
  "by",
  "of",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "done",
  "go",
  "goes",
  "going",
  "take",
  "takes",
  "taking",
  "bring",
  "brings",
  "bringing",
  "send",
  "sends",
  "sending",
  "open",
  "opens",
  "using",
  "use",
  "used",
  "add",
  "build",
  "create",
  "make",
  "implement",
  "edit",
  "change",
  "update",
  "modify",
  "work",
  "working",
]);

const AI_ROUTE_HINTS = [
  "ai assistant",
  "practice assistant",
  "groq",
  "ollama",
  "route.ts",
  "api route",
  "app/api/aiassistant",
  "chatbot",
  "retrieval",
];

const IMPLEMENTATION_INTENT_MARKERS = [
  "add",
  "build",
  "create",
  "make",
  "implement",
  "generate",
  "feature",
  "edit",
  "change",
  "update",
  "modify",
  "work on",
  "help with",
  "help me",
  "want to add",
  "want to build",
  "want to create",
  "want to implement",
  "wanted to add",
  "wanted to build",
  "wanted to create",
  "wanted to implement",
];

let repoCache:
  | {
      expiresAt: number;
      files: RepoFile[];
    }
  | null = null;

let resolvedRepoRoot: string | null = null;

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function toRepoPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function fileStem(value: string) {
  return normalizeText(value).replace(/\.[^.]+$/, "");
}

function includesAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function getScopeKind(relativePath: string): "page" | "route" | "component" | "file" {
  const lower = normalizeText(relativePath);

  if (/\/page\.(?:js|jsx|ts|tsx)$/i.test(lower)) return "page";
  if (/\/route\.(?:js|ts)$/i.test(lower)) return "route";
  if (lower.startsWith("components/")) return "component";
  return "file";
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
    const hasApp = await pathExists(path.join(candidate, "app"));
    const hasComponents = await pathExists(path.join(candidate, "components"));
    const hasPackageJson = await pathExists(path.join(candidate, "package.json"));

    if ((hasApp || hasComponents) && hasPackageJson) {
      resolvedRepoRoot = candidate;
      return candidate;
    }
  }

  resolvedRepoRoot = process.cwd();
  return resolvedRepoRoot;
}

function shouldIncludeFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if (!INCLUDED_EXTENSIONS.has(ext)) return false;
  if (base === "package-lock.json") return false;
  if (base === "pnpm-lock.yaml") return false;
  if (base === "yarn.lock") return false;

  return true;
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

function isAiRouteQuery(message: string) {
  const m = normalizeText(message);
  return AI_ROUTE_HINTS.some((hint) => m.includes(hint));
}

function shouldSuppressFile(relativePath: string, message: string) {
  const lower = normalizeText(relativePath);
  return lower === "app/api/aiassistant/route.ts" && !isAiRouteQuery(message);
}

async function getRepoFiles() {
  if (repoCache && repoCache.expiresAt > Date.now()) {
    return repoCache.files;
  }

  const root = await resolveRepoRoot();
  const allPaths: string[] = [];

  for (const dir of INCLUDED_DIRS) {
    const fullDir = path.join(root, dir);

    try {
      const files = await walk(fullDir);
      allPaths.push(...files);
    } catch {
      // ignore missing folders
    }
  }

  const repoFiles: RepoFile[] = [];

  for (const filePath of allPaths) {
    try {
      repoFiles.push({
        relativePath: toRepoPath(path.relative(root, filePath)),
        raw: await readFile(filePath, "utf-8"),
      });
    } catch {
      // skip unreadable files
    }
  }

  repoCache = {
    expiresAt: Date.now() + REPO_CACHE_TTL_MS,
    files: repoFiles,
  };

  return repoFiles;
}

function getDirectoryPriority(relativePath: string) {
  const lower = normalizeText(relativePath);

  if (lower.startsWith("app/")) return 0;
  if (lower.startsWith("components/")) return 1;
  if (lower.startsWith("lib/")) return 2;
  if (lower.startsWith("utils/")) return 3;
  if (lower.startsWith("prisma/")) return 4;
  return 5;
}

function routeFromPageFile(relativePath: string) {
  const match = relativePath.match(/^app(?:\/(.*))?\/page\.(?:js|jsx|ts|tsx)$/i);
  if (!match) return null;
  const routePart = match[1] || "";
  return routePart ? `/${routePart}` : "/";
}

function routeFromRouteFile(relativePath: string) {
  const match = relativePath.match(/^app\/(.*)\/route\.(?:js|ts)$/i);
  if (!match) return null;
  return `/${match[1]}`;
}

function buildArchitectureReply(repoFiles: RepoFile[]) {
  if (repoFiles.length === 0) {
    return "I can’t map the project architecture yet because the repo scan did not return any files.";
  }

  const dirCount = (dir: string) =>
    repoFiles.filter((file) => file.relativePath.startsWith(`${dir}/`)).length;

  const pageRoutes = repoFiles
    .map((file) => {
      const route = routeFromPageFile(file.relativePath);
      return route ? { route, file: file.relativePath } : null;
    })
    .filter((value): value is { route: string; file: string } => Boolean(value))
    .sort((a, b) => a.route.localeCompare(b.route));

  const apiRoutes = repoFiles
    .map((file) => {
      const route = routeFromRouteFile(file.relativePath);
      return route ? { route, file: file.relativePath } : null;
    })
    .filter((value): value is { route: string; file: string } => Boolean(value))
    .sort((a, b) => a.route.localeCompare(b.route));

  const componentExamples = repoFiles
    .filter((file) => file.relativePath.startsWith("components/"))
    .map((file) => `\`${file.relativePath}\``)
    .slice(0, 8);

  const lines = [
    "This looks like a Next.js app-router project.",
    "",
    "High-level structure:",
    `- \`app/\` contains pages and route handlers (${dirCount("app")} files).`,
    `- \`components/\` contains shared UI pieces (${dirCount("components")} files).`,
    `- \`lib/\` contains app logic and helpers (${dirCount("lib")} files).`,
    `- \`utils/\` contains utility helpers (${dirCount("utils")} files).`,
    `- \`prisma/\` contains database-related files (${dirCount("prisma")} files).`,
    "",
    "Main page routes:",
  ];

  if (pageRoutes.length === 0) {
    lines.push("- I did not find any app-router page files.");
  } else {
    for (const entry of pageRoutes.slice(0, 12)) {
      lines.push(`- \`${entry.route}\` → \`${entry.file}\``);
    }
  }

  lines.push("", "API routes:");

  if (apiRoutes.length === 0) {
    lines.push("- I did not find any route handler files.");
  } else {
    for (const entry of apiRoutes.slice(0, 10)) {
      lines.push(`- \`${entry.route}\` → \`${entry.file}\``);
    }
  }

  lines.push("", "Shared component examples:");

  if (componentExamples.length === 0) {
    lines.push("- I did not find shared components in `components/`.");
  } else {
    lines.push(...componentExamples.map((entry) => `- ${entry}`));
  }

  lines.push(
    "",
    `Overall, I scanned ${repoFiles.length} repo files, so this answer is grounded in the repo scan instead of guessed paths.`
  );

  return lines.join("\n");
}

function getQuickChatReply(message: string) {
  const m = normalizeText(message);

  if (m === "hi" || m === "hello" || m === "hey" || m === "yo") {
    return "Hey — what do you want to work on in Oak Bay Scheduler?";
  }

  if (
    m.includes("how are you") ||
    m.includes("how u doing") ||
    m.includes("what's up")
  ) {
    return "I’m doing good 😄 What do you want to work on in Oak Bay Scheduler?";
  }

  return null;
}

function getLastAssistantMessage(messages: ChatMessage[]) {
  return [...messages]
    .reverse()
    .find(
      (msg) =>
        msg.role === "assistant" &&
        typeof msg.content === "string" &&
        msg.content.trim()
    )?.content;
}

function extractRepoPathsFromText(value: string) {
  return unique(
    [...value.matchAll(/(?:^|[\s`"(])((?:app|components|lib|prisma|utils)\/[A-Za-z0-9._/-]+)/g)]
      .map((match) => normalizeText(match[1]))
      .filter(Boolean)
  );
}

function getLastAssistantReferencedFile(messages: ChatMessage[]) {
  const lastAssistant = getLastAssistantMessage(messages) || "";
  return extractRepoPathsFromText(lastAssistant)[0] || null;
}

function getPreviousUserMessage(messages: ChatMessage[], currentMessage: string) {
  const current = normalizeText(currentMessage);

  const userMessages = messages
    .filter(
      (msg) =>
        msg.role === "user" &&
        typeof msg.content === "string" &&
        msg.content.trim()
    )
    .map((msg) => msg.content!.trim());

  for (let i = userMessages.length - 1; i >= 0; i -= 1) {
    if (normalizeText(userMessages[i]) === current) continue;
    return userMessages[i];
  }

  return null;
}

function lastAssistantInvitedCode(messages: ChatMessage[]) {
  const last = normalizeText(getLastAssistantMessage(messages) || "");

  return (
    last.includes("want me to write the code") ||
    last.includes("say code") ||
    last.includes("ask for code") ||
    last.includes("write the code for that")
  );
}

function isShortAffirmation(message: string) {
  const m = normalizeText(message)
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const exactAffirmations = new Set([
    "yes",
    "yes please",
    "yeah",
    "yeah please",
    "yep",
    "yep please",
    "sure",
    "sure please",
    "ok",
    "ok please",
    "okay",
    "okay please",
    "please",
    "do it",
    "do it please",
    "go ahead",
    "go ahead please",
    "sounds good",
    "sounds good please",
    "that works",
    "that works please",
    "write it",
    "write it please",
    "write that",
    "write that please",
    "do that",
    "do that please",
    "lets do it",
    "let's do it",
    "lets do it please",
    "let's do it please",
    "that",
    "this",
    "it",
  ]);

  return exactAffirmations.has(m);
}

function isAffirmativeCodeFollowUp(message: string, messages: ChatMessage[] = []) {
  return lastAssistantInvitedCode(messages) && isShortAffirmation(message);
}

function resolveFollowUpCodeRequest(message: string, messages: ChatMessage[] = []) {
  if (!isAffirmativeCodeFollowUp(message, messages)) {
    return message;
  }

  const previousUser = getPreviousUserMessage(messages, message)?.trim();

  if (previousUser) {
    return `Write the code for this request: ${previousUser}`;
  }

  return "Write the code for the previous request.";
}

function hasCodeKeyword(message: string) {
  return /^(?:code|generate code|generate the code|write code|show code)\b[:\-\s]*/i.test(
    message.trim()
  );
}

function stripCodeKeyword(message: string) {
  return message
    .replace(/^(?:code|generate code|generate the code|write code|show code)\b[:\-\s]*/i, "")
    .trim();
}

function isDirectCodeGenerationRequest(message: string) {
  const m = normalizeText(message);

  if (!m) return false;

  const directStarters = [
    "generate code",
    "generate the code",
    "generate a patch",
    "generate the patch",
    "write code",
    "write the code",
    "show code",
    "show me code",
    "make the code",
    "create the code",
  ];

  if (directStarters.some((phrase) => m.startsWith(phrase))) {
    return true;
  }

  return (
    (m.includes("code") || m.includes("implementation") || m.includes("patch")) &&
    (
      m.includes("generate") ||
      m.includes("write") ||
      m.includes("show") ||
      m.includes("give") ||
      m.includes("gimme") ||
      m.includes("send") ||
      m.includes("make") ||
      m.includes("create") ||
      m.includes("implement") ||
      m.includes("patch")
    )
  );
}

function wantsExplicitCode(message: string, messages: ChatMessage[] = []) {
  const m = normalizeText(message);

  const directPhrases = [
    "show me the code",
    "show me code",
    "write the code",
    "write me the code",
    "write code",
    "give me the code",
    "give me code",
    "gimme the code",
    "gimme code",
    "send the code",
    "send me the code",
    "exact code",
    "code for this",
    "full code",
    "full implementation",
    "implement this",
    "write the implementation",
    "give me the implementation",
    "lets code",
    "let's code",
    "code it",
    "patch it",
    "write the patch",
    "show the patch",
    "give me the patch",
    "generate code",
    "generate the code",
    "generate a patch",
    "generate the patch",
    "make the code",
    "create the code",
  ];

  if (directPhrases.some((phrase) => m.includes(phrase)) || isDirectCodeGenerationRequest(message)) {
    return true;
  }

  if (isAffirmativeCodeFollowUp(message, messages)) {
    return true;
  }

  const asksForCode =
    m.includes("code") || m.includes("implementation") || m.includes("patch");
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
    "patch",
    "do",
    "lets",
    "let's",
    "generate",
    "make",
    "create",
  ];

  return asksForCode && requestWords.some((word) => m.includes(word));
}

function currentMessageNeedsScopedContext(message: string) {
  const m = normalizeText(message);

  const alreadyScopedMarkers = [
    "page",
    "screen",
    "route",
    "view",
    "component",
    "file",
    "settings",
    "summary",
    "login",
    "appointment",
    "appointments",
    "billing",
    "patient",
    "patients",
    "practitioner",
    "practitioners",
  ];

  if (alreadyScopedMarkers.some((marker) => m.includes(marker))) {
    return false;
  }

  const followUpIntentMarkers = [
    "add",
    "change",
    "update",
    "modify",
    "edit",
    "button",
    "link",
    "field",
    "form",
    "save",
    "submit",
    "delete",
    "remove",
    "show",
    "hide",
    "move",
    "rename",
    "explain",
    "what does",
    "how does",
    "code:",
    "code it",
    "patch it",
    "write the patch",
    "lets code",
    "let's code",
    "do it",
    "that",
    "this",
    "it",
  ];

  return followUpIntentMarkers.some((marker) => m.includes(marker));
}

function buildRetrievalQuery(currentMessage: string, messages: ChatMessage[]) {
  const resolvedMessage = resolveFollowUpCodeRequest(currentMessage, messages);
  const scopedFile = getLastAssistantReferencedFile(messages);
  const shouldCarryScope =
    currentMessageNeedsScopedContext(currentMessage) ||
    isAffirmativeCodeFollowUp(currentMessage, messages);

  const parts: string[] = [];

  if (scopedFile && shouldCarryScope) {
    parts.push(scopedFile);
  }

  if (shouldCarryScope) {
    const previousUser = getPreviousUserMessage(messages, currentMessage);
    if (previousUser) {
      parts.push(previousUser.trim());
    }
  }

  parts.push(resolvedMessage.trim());

  return unique(parts.filter(Boolean)).join("\n").trim();
}

function extractExplicitRepoPaths(message: string) {
  return unique(
    [...message.matchAll(/(?:^|[\s`"(])((?:app|components|lib|prisma|utils)\/[A-Za-z0-9._/-]+)/g)]
      .map((match) => match[1].trim())
      .filter(Boolean)
  );
}

function extractFilenameReferences(message: string) {
  return unique(
    [...message.matchAll(/\b([A-Za-z0-9._-]+\.(?:js|jsx|ts|tsx|json|prisma|md))\b/g)]
      .map((match) => normalizeText(match[1]))
      .filter(Boolean)
  );
}

function extractQuotedPhrases(message: string) {
  return unique(
    [...message.matchAll(/["“]([^"”]{2,80})["”]/g)]
      .map((match) => normalizeText(match[1].trim()))
      .filter(Boolean)
  );
}

function extractRoutePaths(message: string) {
  return unique(
    [...message.matchAll(/\/[A-Za-z0-9/_-]*/g)]
      .map((match) => normalizeText(match[0].trim()))
      .filter((value) => value.length > 1)
  );
}

function extractPagePhrases(message: string) {
  return unique(
    [...message.matchAll(/\b((?:[a-z0-9]+(?:\s+|[-_/])){0,3}[a-z0-9]+\s(?:page|screen|view))\b/gi)]
      .map((match) => normalizeText(match[1]))
      .filter(Boolean)
      .map((phrase) =>
        phrase
          .replace(/\b(page|screen|view)\b/g, "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean)
  );
}

function singularizeToken(token: string) {
  const value = normalizeText(token);

  if (value.endsWith("ies") && value.length > 3) {
    return `${value.slice(0, -3)}y`;
  }

  if (value.endsWith("s") && !value.endsWith("ss") && value.length > 3) {
    return value.slice(0, -1);
  }

  return value;
}

function splitIdentifierParts(value: string) {
  return unique(
    value
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .split(/\s+/)
      .map((part) => singularizeToken(part))
      .map((part) => normalizeText(part))
      .filter(Boolean)
      .filter((part) => part.length >= 2)
  );
}

function getPathTerms(relativePath: string) {
  return unique(
    toRepoPath(relativePath)
      .split("/")
      .flatMap((part) => splitIdentifierParts(part))
      .filter(Boolean)
  );
}

function cleanPagePhrase(value: string) {
  return normalizeText(value)
    .replace(/(page|screen|view)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNavigationPagePhrases(message: string) {
  const source: string[] = [];
  const destination: string[] = [];

  const patterns = [
    /in the ([a-z0-9/_ -]+?) page[\s\S]{0,120}?(?:to|into|towards?|over to)\s+the ([a-z0-9/_ -]+?) page/i,
    /on the ([a-z0-9/_ -]+?) page[\s\S]{0,120}?(?:to|into|towards?|over to)\s+the ([a-z0-9/_ -]+?) page/i,
    /from the ([a-z0-9/_ -]+?) page[\s\S]{0,120}?to\s+the ([a-z0-9/_ -]+?) page/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;

    const from = cleanPagePhrase(match[1] || "");
    const to = cleanPagePhrase(match[2] || "");

    if (from) source.push(from);
    if (to) destination.push(to);
  }

  return {
    source: unique(source),
    destination: unique(destination),
  };
}

function tokenizeMessage(message: string) {
  return unique(
    normalizeText(message)
      .replace(/[^a-z0-9/_ .-]+/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean)
      .flatMap((word) => word.split(/[/._:-]+/))
      .filter(Boolean)
      .map((word) => singularizeToken(word))
      .filter((word) => word.length >= 2)
      .filter((word) => !NOISE_WORDS.has(word))
  );
}

function buildQuerySignals(message: string): QuerySignals {
  const lower = normalizeText(message);
  const explicitRepoPaths = extractExplicitRepoPaths(message).map(normalizeText);
  const fileReferences = extractFilenameReferences(message);
  const quotedPhrases = extractQuotedPhrases(message);
  const pagePhrases = extractPagePhrases(message);
  const routePaths = extractRoutePaths(message);
  const navigationPhrases = extractNavigationPagePhrases(message);

  const sourcePagePhrases = navigationPhrases.source;
  const destinationPagePhrases = navigationPhrases.destination;
  const sourcePageTargets = unique(
    sourcePagePhrases.flatMap((phrase) => tokenizeMessage(phrase)).filter(Boolean)
  );
  const destinationPageTargets = unique(
    destinationPagePhrases.flatMap((phrase) => tokenizeMessage(phrase)).filter(Boolean)
  );

  const terms = unique(
    [
      ...tokenizeMessage(message),
      ...quotedPhrases.flatMap((phrase) => tokenizeMessage(phrase)),
      ...pagePhrases.flatMap((phrase) => tokenizeMessage(phrase)),
      ...sourcePageTargets,
      ...destinationPageTargets,
      ...fileReferences,
      ...fileReferences.map(fileStem),
      ...routePaths.flatMap((route) => tokenizeMessage(route)),
    ].filter(Boolean)
  );

  return {
    explicitRepoPaths,
    fileReferences,
    quotedPhrases,
    pagePhrases,
    routePaths,
    sourcePagePhrases,
    destinationPagePhrases,
    sourcePageTargets,
    destinationPageTargets,
    terms,
    wantsPage:
      lower.includes("page") ||
      lower.includes("screen") ||
      lower.includes("view"),
    wantsButton:
      lower.includes("button") ||
      lower.includes("btn") ||
      lower.includes("cta"),
    wantsNavigation:
      lower.includes("link") ||
      lower.includes("navigate") ||
      lower.includes("redirect") ||
      lower.includes("go to") ||
      lower.includes("take me") ||
      lower.includes("takes me") ||
      lower.includes("send me") ||
      lower.includes("sends me") ||
      lower.includes("route to") ||
      lower.includes("routes to") ||
      lower.includes("bring me to") ||
      lower.includes("brings me to") ||
      lower.includes("href") ||
      routePaths.length > 0,
  };
}

function selectSnippet(raw: string, bestIndex: number) {
  if (bestIndex < 0) {
    return raw.slice(0, MAX_SNIPPET_CHARS);
  }

  const start = Math.max(0, bestIndex - 900);
  const end = Math.min(raw.length, bestIndex + 1800);
  return raw.slice(start, end);
}

function analyzeFile(relativePath: string, raw: string, message: string) {
  const p = normalizeText(relativePath);
  const c = normalizeText(raw);
  const signals = buildQuerySignals(message);

  let score = 0;
  let bestIndex = -1;
  const matchedTerms = new Set<string>();
  const baseName = path.basename(p);
  const stemName = fileStem(baseName);
  const pathSegments = getPathTerms(relativePath);

  function addMatch(label: string, points: number, index = -1) {
    score += points;
    matchedTerms.add(label);

    if (index >= 0 && (bestIndex < 0 || index < bestIndex)) {
      bestIndex = index;
    }
  }

  for (const explicitPath of signals.explicitRepoPaths) {
    if (p === explicitPath) addMatch(`explicit:${explicitPath}`, 2200, 0);
    else if (p.includes(explicitPath)) addMatch(`path:${explicitPath}`, 240, 0);
  }

  for (const fileRef of signals.fileReferences) {
    const refStem = fileStem(fileRef);

    if (baseName === fileRef) addMatch(`file:${fileRef}`, 950, 0);
    if (stemName === refStem) addMatch(`stem:${refStem}`, 700, 0);
  }

  for (const phrase of [...signals.quotedPhrases, ...signals.pagePhrases]) {
    if (!phrase) continue;

    if (p.includes(phrase.replace(/\s+/g, "/"))) {
      addMatch(`path-phrase:${phrase}`, 180, 0);
    }

    const idx = c.indexOf(phrase);
    if (idx >= 0) {
      addMatch(`content-phrase:${phrase}`, 300, idx);
    }
  }

  for (const routePath of signals.routePaths) {
    if (!routePath) continue;

    if (p.includes(routePath.replace(/^\//, ""))) {
      addMatch(`route-path:${routePath}`, 120, 0);
    }

    const idx = c.indexOf(routePath);
    if (idx >= 0) {
      addMatch(`route-content:${routePath}`, 220, idx);
    }
  }

  for (const term of signals.sourcePageTargets) {
    if (!term || NOISE_WORDS.has(term)) continue;

    if (pathSegments.includes(term)) {
      addMatch(`source-segment:${term}`, 160, 0);
    } else if (p.includes(term)) {
      addMatch(`source-path:${term}`, 80, 0);
    }

    const idx = c.indexOf(term);
    if (idx >= 0) {
      addMatch(`source-content:${term}`, 16, idx);
    }
  }

  for (const term of signals.destinationPageTargets) {
    if (!term || NOISE_WORDS.has(term)) continue;

    if (pathSegments.includes(term)) {
      addMatch(`destination-segment:${term}`, 70, 0);
    } else if (p.includes(term)) {
      addMatch(`destination-path:${term}`, 36, 0);
    }

    const idx = c.indexOf(term);
    if (idx >= 0) {
      addMatch(`destination-content:${term}`, 10, idx);
    }
  }

  for (const term of signals.terms) {
    if (!term || NOISE_WORDS.has(term)) continue;

    if (pathSegments.includes(term)) {
      addMatch(`segment:${term}`, 70, 0);
    } else if (p.includes(term)) {
      addMatch(`path:${term}`, 32, 0);
    }

    const idx = c.indexOf(term);
    if (idx >= 0) {
      addMatch(`content:${term}`, 18, idx);
    }
  }

  if (signals.wantsPage && /\/page\.(?:js|jsx|ts|tsx)$/i.test(relativePath)) {
    addMatch("page-file", 45, 0);
  }

  if (
    signals.wantsButton &&
    (c.includes("<button") || c.includes("button") || c.includes("onclick"))
  ) {
    addMatch("button-ui", 20, c.indexOf("button"));
  }

  if (
    signals.wantsNavigation &&
    (c.includes("next/link") ||
      c.includes("href=") ||
      c.includes("router.push") ||
      c.includes("pathname"))
  ) {
    const navIndex = Math.max(
      c.indexOf("next/link"),
      c.indexOf("href="),
      c.indexOf("router.push"),
      c.indexOf("pathname")
    );
    addMatch("navigation-ui", 20, navIndex);
  }

  if (isAiRouteQuery(message) && p === "app/api/aiassistant/route.ts") {
    addMatch("ai-route", 200, 0);
  }

  return {
    score,
    bestIndex,
    matchedTerms: [...matchedTerms],
  };
}

async function loadRelevantFiles(message: string) {
  const repoFiles = await getRepoFiles();
  const ranked: RetrievedFile[] = [];

  for (const file of repoFiles) {
    if (shouldSuppressFile(file.relativePath, message)) continue;

    const analysis = analyzeFile(file.relativePath, file.raw, message);
    if (analysis.score <= 0) continue;

    ranked.push({
      relativePath: file.relativePath,
      raw: file.raw,
      snippet: selectSnippet(file.raw, analysis.bestIndex),
      score: analysis.score,
      matchedTerms: analysis.matchedTerms,
      bestIndex: analysis.bestIndex,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  let totalChars = 0;
  const selected: RetrievedFile[] = [];

  for (const file of ranked.slice(0, MAX_FILES)) {
    if (totalChars >= MAX_TOTAL_CHARS) break;

    const remaining = Math.max(0, MAX_TOTAL_CHARS - totalChars);
    const finalSnippet = file.snippet.slice(0, remaining);

    totalChars += finalSnippet.length;
    selected.push({
      ...file,
      snippet: finalSnippet,
    });
  }

  return selected;
}

function hasStrongPrimaryMatch(files: RetrievedFile[]) {
  if (files.length === 0) return false;

  const first = files[0];
  const second = files[1];

  if (!second) return first.score >= MIN_STRONG_MATCH_SCORE;

  return (
    first.score >= MIN_STRONG_MATCH_SCORE &&
    first.score - second.score >= MIN_STRONG_MATCH_GAP
  );
}

function isFileListingQuestion(message: string) {
  const m = normalizeText(message);

  const mentionsFiles =
    /\b(file|files|repo|repository|codebase|project)\b/.test(m);

  const asksToListOrShow =
    /\b(show|list|print|display|dump|see|visible|access|scan|name|what|which)\b/.test(
      m
    );

  const strongFileListPhrases = [
    "what files can you see",
    "which files can you see",
    "show me the files",
    "show me all the files",
    "show me a list of all the files",
    "list the files",
    "list all files",
    "print the files",
    "print all files",
    "what files do you have access to",
    "which files do you have access to",
    "what repo files can you see",
    "show repo files",
    "file list",
    "all files",
    "visible files",
  ];

  return includesAny(m, strongFileListPhrases) || (mentionsFiles && asksToListOrShow);
}

function isArchitectureQuestion(message: string) {
  const m = normalizeText(message);

  const architecturePhrases = [
    "architecture",
    "project structure",
    "folder structure",
    "codebase structure",
    "repo structure",
    "project overview",
    "overview of the project",
    "how is the project organized",
    "how is this project organized",
    "what does the architecture",
    "what does the project look like",
  ];

  return architecturePhrases.some((phrase) => m.includes(phrase));
}

function isRepoAccessQuestion(message: string) {
  const m = normalizeText(message);

  return (
    m.includes("have access to the files") ||
    m.includes("access to the files") ||
    m.includes("should have the file path") ||
    m.includes("can you access the files")
  );
}

function isLocateQuestion(message: string) {
  const m = normalizeText(message);

  const locatePhrases = [
    "where is",
    "where can i find",
    "where do i find",
    "where would i go",
    "which file",
    "what file",
    "find the file",
    "locate",
  ];

  return locatePhrases.some((phrase) => m.includes(phrase));
}


function isImplementationPlanningQuestion(message: string) {
  const m = normalizeText(message);
  const signals = buildQuerySignals(message);

  const asksHowToBuild =
    m.includes("how would i do this") ||
    m.includes("how do i do this") ||
    m.includes("how would i add") ||
    m.includes("how do i add") ||
    m.includes("what would i do") ||
    m.includes("what should i do") ||
    m.includes("how would i implement") ||
    m.includes("how do i implement");

  const hasImplementationIntent = [
    "add",
    "build",
    "create",
    "make",
    "implement",
    "change",
    "update",
    "modify",
    "edit",
    "generate",
  ].some((word) => m.includes(word));

  const hasUiOrNavigationTarget =
    ["button", "link", "cta"].some((word) => m.includes(word)) ||
    [
      "navigate",
      "navigation",
      "redirect",
      "route",
      "go to",
      "take me",
      "takes me",
      "bring me",
      "brings me",
      "open",
    ].some((word) => m.includes(word));

  const hasPageReference =
    ["page", "screen", "view"].some((word) => m.includes(word)) ||
    signals.sourcePageTargets.length > 0 ||
    signals.destinationPageTargets.length > 0;

  const isCodeGenerationRequest = isDirectCodeGenerationRequest(message);

  return (
    (hasImplementationIntent && hasUiOrNavigationTarget && hasPageReference) ||
    (asksHowToBuild && hasPageReference) ||
    (isCodeGenerationRequest && (hasUiOrNavigationTarget || hasPageReference))
  );
}

function inferMode(
  currentMessage: string,
  forceCodeMode: boolean,
  explicitCodeRequest: boolean,
  retrievalQuery: string
): AssistantMode {
  const current = normalizeText(currentMessage);
  const retrieval = normalizeText(retrievalQuery);

  const casualWords = [
    "hi",
    "hello",
    "hey",
    "yo",
    "sup",
    "how are you",
    "how u doing",
    "what's up",
  ];

  const debugWords = [
    "bug",
    "broken",
    "error",
    "fix",
    "debug",
    "not working",
    "fails",
    "failing",
    "crash",
    "500",
    "why is",
  ];

  const explainWords = ["how does", "explain", "what does", "walk me through"];

  if (casualWords.some((word) => current.includes(word))) return "chat";
  if (forceCodeMode || explicitCodeRequest || isDirectCodeGenerationRequest(currentMessage)) {
    return "implementation";
  }
  if (debugWords.some((word) => retrieval.includes(word))) return "debug";
  if (isArchitectureQuestion(retrieval)) return "architecture";
  if (
    isImplementationPlanningQuestion(currentMessage) ||
    IMPLEMENTATION_INTENT_MARKERS.some((word) => retrieval.includes(word)) ||
    current.includes("functionality")
  ) {
    return "implementation";
  }
  if (isLocateQuestion(current)) return "locate";
  if (explainWords.some((word) => retrieval.includes(word))) return "explain";
  return "chat";
}

function buildVisibleFilesReply(
  repoFiles: RepoFile[],
  startIndex = 0
) {
  if (repoFiles.length === 0) {
    return "I can’t list visible files yet because the repo scan did not return any files.";
  }

  const sorted = [...repoFiles].sort((a, b) => {
    const priorityDiff =
      getDirectoryPriority(a.relativePath) - getDirectoryPriority(b.relativePath);

    if (priorityDiff !== 0) return priorityDiff;
    return a.relativePath.localeCompare(b.relativePath);
  });

  const visible = sorted.slice(startIndex);

  if (visible.length === 0) {
    return [
      `I can currently see ${repoFiles.length} repo files.`,
      "",
      "I already showed all of the files returned by the repo scan.",
    ].join("\n");
  }

  const grouped = new Map<string, string[]>();

  for (const file of visible) {
    const bucket = file.relativePath.split("/")[0] || "root";
    if (!grouped.has(bucket)) {
      grouped.set(bucket, []);
    }
    grouped.get(bucket)!.push(file.relativePath);
  }

  const lines: string[] = [
    `I can currently see ${repoFiles.length} repo files.`,
    "",
    "Files:",
  ];

  for (const [bucket, paths] of grouped.entries()) {
    lines.push("");
    lines.push(`${bucket}/ (${paths.length})`);
    for (const relativePath of paths) {
      lines.push(`- \`${relativePath}\``);
    }
  }

  return lines.join("\n");
}

function buildRepoAccessReply(repoRoot: string, repoFileCount: number) {
  return [
    "I should have access to the files.",
    repoFileCount > 0
      ? `The repo scan is working and found ${repoFileCount} files under \`${repoRoot}\`.`
      : `Right now the repo scan is not finding files under \`${repoRoot}\`, so runtime file access is the issue.`,
    repoFileCount > 0
      ? "If I still ask for a file path after that, the request routing or matching logic needs work."
      : "That is why the assistant falls back to vague answers instead of pointing at the right file.",
  ].join("\n");
}

function buildHowToGoAboutItReply(
  primaryPath: string,
  scopeKind: "page" | "route" | "component" | "file",
  otherPaths: string[] = []
) {
  const scopeLabel =
    scopeKind === "page"
      ? "page"
      : scopeKind === "route"
        ? "route"
        : scopeKind === "component"
          ? "component"
          : "file";

  return [
    `The strongest match is \`${primaryPath}\`.`,
    `Start in that ${scopeLabel} first.`,
    "How to go about it:",
    `1. Add the UI or behavior in \`${primaryPath}\`.`,
    scopeKind === "page"
      ? "2. Keep the page focused on wiring things up. Pull reusable UI into `components/` if the new feature grows."
      : "2. Keep the change scoped to this file unless it clearly belongs in a shared component or helper.",
    "3. If the feature changes data flow, hook it into the existing handlers or the relevant `lib/` or route logic.",
    "4. Test that flow on the page after the change.",
    ...(otherPaths.length > 0
      ? [`Other likely matches: ${otherPaths.join(", ")}.`]
      : []),
    "Want me to write the code for that?",
  ].join("\n");
}

function findPageCandidates(
  message: string,
  repoFiles: RepoFile[],
  retrievedFiles: RetrievedFile[] = []
) {
  const signals = buildQuerySignals(message);
  const primaryTerms =
    signals.sourcePageTargets.length > 0
      ? signals.sourcePageTargets
      : signals.pagePhrases.flatMap((phrase) => tokenizeMessage(phrase));
  const secondaryTerms = signals.destinationPageTargets;

  const candidates: Array<{
    relativePath: string;
    score: number;
    matchedPrimary: boolean;
    matchedSecondary: boolean;
  }> = [];

  for (const file of repoFiles) {
    if (!/\/page\.(?:js|jsx|ts|tsx)$/i.test(file.relativePath)) continue;

    const lowerPath = normalizeText(file.relativePath);
    const lowerRaw = normalizeText(file.raw);
    const route = normalizeText(routeFromPageFile(file.relativePath) || "");
    const pathSegments = getPathTerms(file.relativePath);
    const retrievedBoost = retrievedFiles.find(
      (entry) => normalizeText(entry.relativePath) === lowerPath
    )?.score || 0;

    let score = retrievedBoost > 0 ? Math.min(180, retrievedBoost) : 0;
    let matchedPrimary = false;
    let matchedSecondary = false;

    const scoreTerm = (term: string, weight: "primary" | "secondary") => {
      const pathWeight = weight === "primary" ? 220 : 90;
      const exactRouteWeight = weight === "primary" ? 260 : 110;
      const partialRouteWeight = weight === "primary" ? 180 : 75;
      const contentWeight = weight === "primary" ? 22 : 10;

      let matched = false;

      if (pathSegments.includes(term)) {
        score += pathWeight;
        matched = true;
      }
      if (lowerPath.includes(`/${term}/page.`)) {
        score += exactRouteWeight;
        matched = true;
      }
      if (route === `/${term}`) {
        score += exactRouteWeight;
        matched = true;
      }
      if (route.endsWith(`/${term}`) || route.includes(`/${term}/`)) {
        score += partialRouteWeight;
        matched = true;
      }

      const contentIndex = lowerRaw.indexOf(term);
      if (contentIndex !== -1) {
        score += contentWeight;
        if (contentIndex < 3000) score += Math.ceil(contentWeight / 2);
      }

      return matched;
    };

    for (const term of primaryTerms) {
      if (!term || NOISE_WORDS.has(term)) continue;
      if (scoreTerm(term, "primary")) matchedPrimary = true;
    }

    for (const term of secondaryTerms) {
      if (!term || NOISE_WORDS.has(term)) continue;
      if (scoreTerm(term, "secondary")) matchedSecondary = true;
    }

    if (primaryTerms.length > 0 && !matchedPrimary) {
      if (!matchedSecondary) {
        continue;
      }
      score -= 120;
    }

    if (score > 0) {
      candidates.push({
        relativePath: file.relativePath,
        score,
        matchedPrimary,
        matchedSecondary,
      });
    }
  }

  if (primaryTerms.length > 0 && !candidates.some((candidate) => candidate.matchedPrimary)) {
    return [];
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ relativePath, score }) => ({ relativePath, score }));
}

function buildPageScopeReply(
  message: string,
  repoFiles: RepoFile[],
  retrievedFiles: RetrievedFile[] = []
) {
  const m = normalizeText(message);
  const signals = buildQuerySignals(message);

  const mentionsPageScope =
    m.includes("page") ||
    m.includes("screen") ||
    m.includes("view") ||
    includesAny(m, IMPLEMENTATION_INTENT_MARKERS) ||
    isLocateQuestion(m);

  if (!mentionsPageScope) return null;

  const candidates = findPageCandidates(message, repoFiles, retrievedFiles);

  if (candidates.length === 0 && signals.sourcePageTargets.length > 0) {
    const related = retrievedFiles
      .filter((file) =>
        signals.sourcePageTargets.some((term) => {
          const lowerPath = normalizeText(file.relativePath);
          return lowerPath.includes(term) || file.matchedTerms.some((match) => match.includes(term));
        })
      )
      .slice(0, 3)
      .map((file) => `\`${file.relativePath}\``);

    if (related.length > 0) {
      const sourceLabel = signals.sourcePagePhrases[0] || signals.sourcePageTargets[0] || "that";

      return [
        `I don’t see a dedicated \`${sourceLabel}\` page file in \`app/\`.`,
        `Start with the closest related files: ${related.join(", ")}.`,
        "Wire the button where that UI is rendered, then point it at the destination page route.",
        "Want me to write the code for that?",
      ].join("\n");
    }
  }

  if (candidates.length === 0) return null;

  const primary = candidates[0];
  const others = candidates.slice(1).map((file) => `\`${file.relativePath}\``);

  if (includesAny(m, IMPLEMENTATION_INTENT_MARKERS) || m.includes("functionality")) {
    return buildHowToGoAboutItReply(primary.relativePath, "page", others);
  }

  if (isLocateQuestion(m)) {
    return others.length > 0
      ? `The strongest match is \`${primary.relativePath}\`. Other likely page files are ${others.join(", ")}.`
      : `The strongest match is \`${primary.relativePath}\`. Start there first.`;
  }

  return null;
}

function buildDeterministicImplementationReply(files: RetrievedFile[]) {
  if (files.length === 0) return null;

  const pageFirst = files.find((file) => getScopeKind(file.relativePath) === "page");
  const primary = pageFirst || files[0];
  const others = files
    .filter((file) => file.relativePath !== primary.relativePath)
    .slice(0, 2)
    .map((file) => `\`${file.relativePath}\``);

  return buildHowToGoAboutItReply(
    primary.relativePath,
    getScopeKind(primary.relativePath),
    others
  );
}

function buildLocateReply(files: RetrievedFile[]) {
  if (files.length === 0) {
    return "I couldn’t find a strong match in app, components, lib, prisma, or utils.";
  }

  const primary = files[0];
  const others = files.slice(1, 4).map((file) => `\`${file.relativePath}\``);

  if (others.length === 0) {
    return `The strongest match is \`${primary.relativePath}\`. Start there first.`;
  }

  return `The strongest match is \`${primary.relativePath}\`. Other likely files are ${others.join(", ")}.`;
}

function formatHistory(messages: ChatMessage[]) {
  return messages
    .filter(
      (msg) =>
        typeof msg.content === "string" &&
        msg.content.trim() &&
        (msg.role === "user" || msg.role === "assistant")
    )
    .slice(-MAX_HISTORY)
    .map((msg) => `${msg.role?.toUpperCase()}: ${msg.content?.trim()}`)
    .join("\n");
}

function buildKnownRoutes(repoFiles: RepoFile[]) {
  return unique(
    repoFiles
      .map((file) => routeFromPageFile(file.relativePath))
      .filter((value): value is string => Boolean(value))
  ).slice(0, 30);
}

function buildPrompt({
  message,
  history,
  files,
  mode,
}: {
  message: string;
  history: string;
  files: RetrievedFile[];
  mode: AssistantMode;
}) {
  const filePaths = files.map((file) => file.relativePath).join("\n");

  const fileBlocks = files
    .map(
      (file) =>
        `FILE: ${file.relativePath}
MATCHED TERMS: ${file.matchedTerms.join(", ") || "none"}
SNIPPET:
${file.snippet}`
    )
    .join("\n\n---\n\n");

  const primaryHint = files[0]
    ? `Top ranked file: ${files[0].relativePath}`
    : "No strong file match found.";

  return `
You are Oak Bay Scheduler's repo assistant.

ROLE:
- Help users understand, debug, and improve this codebase.
- This is a Next.js app using the app directory.
- Use the retrieved repo context instead of guessing.

CURRENT MODE:
- ${mode}

RULES:
- Answer the user's latest message directly.
- Use the ranked files and snippets as the source of truth.
- Mention file paths only if they appear in RETRIEVED FILE PATHS.
- Never invent file paths.
- Keep the reply grounded and concise.
- If certainty is limited, say "the strongest match is..." instead of guessing.
- Do not say "based on the snippets" or "it appears that".

RECENT CHAT:
${history || "No previous chat."}

SEARCH RESULT:
- ${primaryHint}

RETRIEVED FILE PATHS:
${filePaths || "No files retrieved."}

RELEVANT PROJECT FILES:
${fileBlocks || "No project files found."}

USER'S LATEST MESSAGE:
${message}

FINAL ANSWER:
`.trim();
}

function buildCodePrompt({
  message,
  history,
  files,
  knownRoutes,
  strictPatchOnly,
}: {
  message: string;
  history: string;
  files: RetrievedFile[];
  knownRoutes: string[];
  strictPatchOnly: boolean;
}) {
  const filePaths = files.map((file) => file.relativePath).join("\n");

  const fileBlocks = files
    .map(
      (file) =>
        `FILE: ${file.relativePath}
MATCHED TERMS: ${file.matchedTerms.join(", ") || "none"}
SNIPPET:
${file.snippet}`
    )
    .join("\n\n---\n\n");

  return `
You are Oak Bay Scheduler's repo assistant.

Your job is to return production-usable code for the strongest matched file.

RESPONSE RULES:
- Answer the user's latest message directly.
- Use only verified file paths from RETRIEVED FILE PATHS.
- Do not invent file paths.
- Do not ask a follow-up question.
- Prefer the smallest possible change.
- Prefer this order:
  1. small insertion or replacement snippet
  2. minimal patch-style code block
  3. full file only if absolutely necessary
- If an import is needed, include only the import line that needs to be added or changed.
- If a route is needed, use a route from KNOWN PAGE ROUTES when possible.
- If route certainty is low, keep it obvious with a TODO comment instead of inventing a path.
- Return code in fenced markdown blocks.
- Keep the explanation short.
${strictPatchOnly ? "- Return only a minimal patch/snippet for the strongest matched file." : ""}

OUTPUT FORMAT:
TARGET FILE: <one verified file path>
WHY: <one short sentence>
CHANGE:
\`\`\`tsx
<minimal code>
\`\`\`
NOTES: <only if route or import uncertainty matters>

RECENT CHAT:
${history || "No previous chat."}

RETRIEVED FILE PATHS:
${filePaths || "No files retrieved."}

KNOWN PAGE ROUTES:
${knownRoutes.join("\n") || "No page routes found."}

RELEVANT PROJECT FILES:
${fileBlocks || "No project files found."}

USER'S LATEST MESSAGE:
${message}

FINAL ANSWER:
`.trim();
}

function groqContentToText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;

        if (part && typeof part === "object") {
          const maybePart = part as { text?: unknown; content?: unknown };
          const value = maybePart.text ?? maybePart.content;
          return typeof value === "string" ? value : "";
        }

        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

async function parseGroqResponse(res: Response) {
  const text = await res.text();
  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(text || "Groq request failed");
    }

    return { response: text };
  }

  if (!res.ok) {
    throw new Error(
      data?.error?.message || data?.error || text || "Groq request failed"
    );
  }

  const response = groqContentToText(data?.choices?.[0]?.message?.content);

  return {
    ...data,
    response,
  };
}

async function callGroq(prompt: string, maxTokens: number) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const groqRes = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.05,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    return await parseGroqResponse(groqRes);
  } finally {
    clearTimeout(timeout);
  }
}

function finalizeReply(reply: string, allowCode: boolean) {
  let cleaned = String(reply || "")
    .replace(/^FINAL ANSWER:\s*/i, "")
    .trim();

  if (!allowCode) {
    cleaned = cleaned.replace(/```[\s\S]*?```/g, "").trim();
  }

  return cleaned || "I found the right area, but the model didn’t return a usable reply.";
}

function hasCodeBlock(reply: string) {
  return /```[\s\S]*?```/.test(reply);
}

function extractFirstCodeBlock(reply: string) {
  const match = reply.match(/```(?:[a-z]+)?\n([\s\S]*?)```/i);
  return match?.[1]?.trim() || "";
}

function looksLikeCode(reply: string) {
  const value = reply.trim();
  if (!value) return false;

  const codeMarkers = [
    "import ",
    "export default",
    "const ",
    "function ",
    "return (",
    "<Button",
    "<Link",
    "router.push",
    "href=",
  ];

  const lineCount = value.split(/\r?\n/).length;
  return lineCount >= 3 && codeMarkers.some((marker) => value.includes(marker));
}

function getCodeFenceLanguage(relativePath?: string) {
  const lower = normalizeText(relativePath || "");
  if (lower.endsWith(".tsx") || lower.endsWith(".jsx")) return "tsx";
  if (lower.endsWith(".ts") || lower.endsWith(".js")) return "ts";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".prisma")) return "prisma";
  return "tsx";
}

function normalizeCodeReply(reply: string, primaryFile?: string) {
  const cleaned = String(reply || "").trim();
  if (!cleaned) return cleaned;
  if (hasCodeBlock(cleaned)) return cleaned;
  if (!looksLikeCode(cleaned)) return cleaned;

  const lang = getCodeFenceLanguage(primaryFile);
  return `\`\`\`${lang}\n${cleaned}\n\`\`\``;
}

function isFullFileStyleReply(reply: string) {
  const block = extractFirstCodeBlock(reply) || reply;
  const normalized = normalizeText(block);
  const importCount = (block.match(/^import\s/mg) || []).length;

  return (
    (block.length > 3000 && importCount >= 3) ||
    normalized.includes("export default function") ||
    (normalized.includes('"use client"') && importCount >= 2)
  );
}

function isLowValueReply(reply: string) {
  const cleaned = normalizeText(reply)
    .replace(/[.!?]+$/g, "")
    .trim();

  if (!cleaned) return true;

  const lowValueReplies = new Set([
    "done",
    "ok",
    "okay",
    "sure",
    "sounds good",
    "got it",
    "alright",
    "all right",
  ]);

  return lowValueReplies.has(cleaned);
}

function extractMentionedPaths(reply: string) {
  return unique(
    [...reply.matchAll(/(?:^|[\s`"(])((?:app|components|lib|prisma|utils)\/[A-Za-z0-9._/-]+)/g)]
      .map((match) => normalizeText(match[1]))
      .filter(Boolean)
  );
}

function getInvalidMentionedPaths(reply: string, retrievedFiles: string[]) {
  const mentionedPaths = extractMentionedPaths(reply);
  if (mentionedPaths.length === 0) return [];

  const allowed = new Set(retrievedFiles.map(normalizeText));
  return mentionedPaths.filter((pathValue) => !allowed.has(pathValue));
}

function hasInvalidMentionedPath(reply: string, retrievedFiles: string[]) {
  return getInvalidMentionedPaths(reply, retrievedFiles).length > 0;
}

function buildSafeFallbackReply(files: RetrievedFile[], allowCode: boolean) {
  if (files.length === 0) {
    return allowCode
      ? "I couldn’t verify the target file strongly enough to return safe code yet. Ask again with the exact page name, button label, route, or file path."
      : "I couldn’t verify the target file strongly enough yet. Ask again with the exact page name, button label, route, or file path.";
  }

  const primary = files[0];
  const others = files
    .slice(1, 3)
    .map((file) => `\`${file.relativePath}\``)
    .join(", ");

  return allowCode
    ? `The strongest match is \`${primary.relativePath}\`. I’m holding code until the target is verified cleanly.${others ? ` Other likely matches: ${others}.` : ""}`
    : `The strongest match is \`${primary.relativePath}\`. Start there first.${others ? ` Other likely matches: ${others}.` : ""}`;
}

function buildVerifiedFallbackReply(
  files: RetrievedFile[],
  allowCode: boolean,
  reason: "low_confidence" | "invalid_paths" = "low_confidence"
) {
  if (files.length === 0) {
    return allowCode
      ? "I need a verified file match before I return code. Ask again with the exact page name, route, or file path."
      : "I need a verified file match before I can answer safely. Ask again with the exact page name, route, or file path.";
  }

  const primary = files[0];
  const others = files
    .slice(1, 3)
    .map((file) => `\`${file.relativePath}\``)
    .join(", ");

  const reasonLine =
    reason === "invalid_paths"
      ? "I blocked unverified file paths from the reply."
      : "The repo match was not strong enough to safely trust the generated reply.";

  return allowCode
    ? [
        `The strongest match is \`${primary.relativePath}\`.`,
        reasonLine,
        others ? `Other likely matches: ${others}.` : "",
        "Ask again with the exact UI text or route and I’ll write the patch against the verified file.",
      ]
        .filter(Boolean)
        .join("\n")
    : [
        `The strongest match is \`${primary.relativePath}\`.`,
        reasonLine,
        others ? `Other likely matches: ${others}.` : "",
      ]
        .filter(Boolean)
        .join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawMessage =
      typeof body?.message === "string" ? body.message.trim() : "";
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
      : [];

    if (!rawMessage) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const quickReply = getQuickChatReply(rawMessage);
    if (quickReply) {
      return Response.json({
        reply: quickReply,
        contextFiles: 0,
        mode: "chat",
        retrievedFiles: [],
        primaryTarget: null,
        answerSource: "deterministic_chat",
      });
    }

    const forceCodeMode = hasCodeKeyword(rawMessage);
    const message = forceCodeMode ? stripCodeKeyword(rawMessage) : rawMessage;
    const explicitCodeRequest = wantsExplicitCode(message, messages);
    const implementationPlanningQuestion = isImplementationPlanningQuestion(message);
    const resolvedMessage = resolveFollowUpCodeRequest(message, messages);
    const retrievalQuery = buildRetrievalQuery(message, messages);

    const repoRoot = await resolveRepoRoot();
    const repoFiles = await getRepoFiles();
    const repoFileCount = repoFiles.length;

    if (isFileListingQuestion(message)) {
      return Response.json({
        reply: buildVisibleFilesReply(repoFiles),
        contextFiles: 0,
        mode: "explain",
        retrievedFiles: [],
        primaryTarget: null,
        answerSource: "deterministic_file_inventory",
        debug: {
          repoRoot,
          repoFileCount,
        },
      });
    }

    if (isArchitectureQuestion(message)) {
      return Response.json({
        reply: buildArchitectureReply(repoFiles),
        contextFiles: 0,
        mode: "architecture",
        retrievedFiles: [],
        primaryTarget: null,
        answerSource: "deterministic_architecture",
        debug: {
          repoRoot,
          repoFileCount,
        },
      });
    }

    const mode = inferMode(
      resolvedMessage,
      forceCodeMode,
      explicitCodeRequest,
      retrievalQuery
    );

    if (isRepoAccessQuestion(message)) {
      return Response.json({
        reply: buildRepoAccessReply(repoRoot, repoFileCount),
        contextFiles: 0,
        mode: "explain",
        retrievedFiles: [],
        primaryTarget: null,
        answerSource: "deterministic_access",
        debug: {
          repoRoot,
          repoFileCount,
        },
      });
    }

    const files = await loadRelevantFiles(retrievalQuery);
    const retrievedFiles = files.map((file) => file.relativePath);
    const primaryTarget = files[0]?.relativePath || null;
    const strongPrimaryMatch = hasStrongPrimaryMatch(files);

    if (
      !forceCodeMode &&
      !explicitCodeRequest &&
      (mode === "implementation" || implementationPlanningQuestion)
    ) {
      const reply =
        buildPageScopeReply(message, repoFiles, files) ||
        buildDeterministicImplementationReply(files) ||
        buildSafeFallbackReply(files, false);

      return Response.json({
        reply,
        contextFiles: files.length,
        mode,
        retrievedFiles,
        primaryTarget,
        answerSource: "deterministic_implementation",
        debug: {
          repoRoot,
          repoFileCount,
          strongPrimaryMatch,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    if (mode === "locate") {
      const pageScopeReply = buildPageScopeReply(message, repoFiles, files);

      return Response.json({
        reply: pageScopeReply || buildLocateReply(files),
        contextFiles: files.length,
        mode,
        retrievedFiles,
        primaryTarget,
        answerSource: pageScopeReply ? "deterministic_page_scope" : "deterministic_locate",
        debug: {
          repoRoot,
          repoFileCount,
          strongPrimaryMatch,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    const allowCodeMode = forceCodeMode || explicitCodeRequest;

    if (allowCodeMode && files.length === 0) {
      return Response.json({
        reply: buildVerifiedFallbackReply(files, true, "low_confidence"),
        contextFiles: 0,
        mode,
        retrievedFiles: [],
        primaryTarget: null,
        answerSource: "verified_low_confidence",
        debug: {
          repoRoot,
          repoFileCount,
          strongPrimaryMatch,
          rankedFiles: [],
        },
      });
    }

    const history = formatHistory(messages);
    const knownRoutes = buildKnownRoutes(repoFiles);

    const prompt = allowCodeMode
      ? buildCodePrompt({
          message: resolvedMessage,
          history,
          files,
          knownRoutes,
          strictPatchOnly: false,
        })
      : buildPrompt({
          message: resolvedMessage,
          history,
          files,
          mode,
        });

    let data = await callGroq(prompt, allowCodeMode ? 700 : mode === "debug" ? 420 : 260);
    let reply = finalizeReply(data?.response || data?.reply || "", allowCodeMode);

    if (allowCodeMode) {
      reply = normalizeCodeReply(reply, primaryTarget || undefined);

      if (!hasCodeBlock(reply) || isFullFileStyleReply(reply)) {
        const retryPrompt = buildCodePrompt({
          message: resolvedMessage,
          history,
          files,
          knownRoutes,
          strictPatchOnly: true,
        });

        data = await callGroq(retryPrompt, 700);
        const retriedReply = normalizeCodeReply(
          finalizeReply(data?.response || data?.reply || "", true),
          primaryTarget || undefined
        );

        if (
          hasCodeBlock(retriedReply) &&
          (!isFullFileStyleReply(retriedReply) || !hasCodeBlock(reply))
        ) {
          reply = retriedReply;
        }
      }
    }

    if (!allowCodeMode && isLowValueReply(reply)) {
      reply =
        buildPageScopeReply(message, repoFiles, files) ||
        buildLocateReply(files) ||
        buildSafeFallbackReply(files, false);
    }

    const invalidMentionedPaths = getInvalidMentionedPaths(reply, retrievedFiles);

    if (
      allowCodeMode &&
      (!hasCodeBlock(reply) ||
        isLowValueReply(reply) ||
        hasInvalidMentionedPath(reply, retrievedFiles))
    ) {
      return Response.json({
        reply: buildVerifiedFallbackReply(
          files,
          true,
          hasInvalidMentionedPath(reply, retrievedFiles)
            ? "invalid_paths"
            : "low_confidence"
        ),
        contextFiles: files.length,
        mode,
        retrievedFiles,
        primaryTarget,
        answerSource: "verified_code_fallback",
        debug: {
          repoRoot,
          repoFileCount,
          strongPrimaryMatch,
          invalidMentionedPaths,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    if (!allowCodeMode && hasInvalidMentionedPath(reply, retrievedFiles)) {
      return Response.json({
        reply: buildVerifiedFallbackReply(files, false, "invalid_paths"),
        contextFiles: files.length,
        mode,
        retrievedFiles,
        primaryTarget,
        answerSource: "verified_invalid_path_block",
        debug: {
          repoRoot,
          repoFileCount,
          strongPrimaryMatch,
          invalidMentionedPaths,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    return Response.json({
      reply,
      contextFiles: files.length,
      mode,
      retrievedFiles,
      primaryTarget,
      answerSource: allowCodeMode ? "llm_code_verified" : "llm_verified",
      debug: {
        repoRoot,
        repoFileCount,
        strongPrimaryMatch,
        invalidMentionedPaths,
        rankedFiles: files.slice(0, 5).map((file) => ({
          path: file.relativePath,
          score: file.score,
          matchedTerms: file.matchedTerms,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("AI ASSISTANT ROUTE ERROR:", error);

    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Groq request timed out"
        : error instanceof Error
          ? error.message
          : "Unknown error";

    return Response.json({ error: message }, { status: 500 });
  }
}