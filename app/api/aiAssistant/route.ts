import { access, readdir, readFile } from "fs/promises";
import path from "path";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

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
const MAX_TOTAL_CHARS = 9000;
const MAX_FILES = 3;
const MAX_HISTORY = 6;
const REPO_CACHE_TTL_MS = 15_000;


const MIN_STRONG_MATCH_SCORE = 60;
const MIN_STRONG_MATCH_GAP = 20;

type ChatMessage = {
  role?: string;
  content?: string;
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
  quotedPhrases: string[];
  pagePhrases: string[];
  anchorPhrases: string[];
  labelPhrases: string[];
  routePaths: string[];
  fileReferences: string[];
  terms: string[];
  wantsPage: boolean;
  wantsButton: boolean;
  wantsNavigation: boolean;
};

const AI_ROUTE_HINTS = [
  "ai assistant",
  "practice assistant",
  "ollama",
  "model",
  "prompt",
  "retrieval",
  "route.ts",
  "api route",
  "app/api/aiassistant",
  "chatbot",
];

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
  "file",
  "some",
  "help",
  "thing",
  "page",
  "screen",
  "called",
  "named",
  "titled",
  "button",
]);

let repoCache:
  | {
      expiresAt: number;
      files: Array<{ relativePath: string; raw: string }>;
    }
  | null = null;

let resolvedRepoRoot: string | null = null;

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


function toRepoPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function singularizeToken(token: string) {
  const value = normalizeText(token);

  if (value.endsWith("ies") && value.length > 3) {
    return `${value.slice(0, -3)}y`;
  }

  if (value.endsWith("ses") && value.length > 3) {
    return value.slice(0, -2);
  }

  if (value.endsWith("s") && !value.endsWith("ss") && value.length > 3) {
    return value.slice(0, -1);
  }

  return value;
}

function pluralizeToken(token: string) {
  const value = normalizeText(token);

  if (value.endsWith("y") && value.length > 2) {
    return `${value.slice(0, -1)}ies`;
  }

  if (value.endsWith("s")) {
    return value;
  }

  return `${value}s`;
}

function expandLookupTokens(tokens: string[]) {
  const expanded = new Set<string>();

  for (const token of tokens) {
    const value = normalizeText(token);
    if (!value) continue;

    expanded.add(value);
    expanded.add(singularizeToken(value));
    expanded.add(pluralizeToken(value));

    const compact = value.replace(/[-_]/g, " ");
    if (compact && compact !== value) {
      expanded.add(compact);
    }
  }

  return [...expanded].filter(Boolean);
}

function extractFileReferences(message: string) {
  const basenames = [
    ...message.matchAll(/\b[A-Za-z0-9._-]+\.(?:js|jsx|ts|tsx|json|prisma|md)\b/g),
  ].map((match) => normalizeText(match[0]));

  const explicitPaths = extractExplicitRepoPaths(message).map(normalizeText);

  return unique([...explicitPaths, ...basenames]);
}

function hasFileReference(message: string) {
  return extractFileReferences(message).length > 0;
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

function hasCodeKeyword(message: string) {
  return /^code\b[:\-\s]*/i.test(message.trim());
}

function stripCodeKeyword(message: string) {
  return message.replace(/^code\b[:\-\s]*/i, "").trim();
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
    "gimme the code",
    "gimme code",
    "gimme da code",
    "send the code",
    "send me the code",
    "exact code",
    "code for this",
    "full code",
    "full implementation",
    "implement this",
    "write the implementation",
    "give me the implementation",
  ];

  if (directPhrases.some((phrase) => m.includes(phrase))) {
    return true;
  }

  const asksForCode = m.includes("code") || m.includes("implementation");
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
  ];

  return asksForCode && requestWords.some((word) => m.includes(word));
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

function currentMessageNeedsScopedContext(message: string) {
  const m = normalizeText(message);

  if (hasFileReference(message)) return false;

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
    "sign up",
    "signup",
    "register",
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
    "write the code",
    "show me the code",
    "code:",
  ];

  return followUpIntentMarkers.some((marker) => m.includes(marker));
}

function getPreviousUserMessage(
  messages: ChatMessage[],
  currentMessage: string
) {
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

function lastAssistantWasFollowUpQuestion(messages: ChatMessage[]) {
  const lastAssistant = normalizeText(getLastAssistantMessage(messages) || "");

  if (!lastAssistant) return false;

  const followUpMarkers = [
    "what would you like the button to do",
    "what do you want to add or change",
    "what do you want to implement",
    "what would you like it to do",
    "what should it do",
    "tell me what you want to add or change",
    "tell me what you want to add",
    "tell me what you want to change",
    "i’ll guide you through it or write the code",
    "i'll guide you through it or write the code",
    "i’ll guide you through it",
    "i'll guide you through it",
    "write the code",
    "say `code:` when you want me to write the exact code",
    "say code: when you want me to write the exact code",
  ];

  return followUpMarkers.some((marker) => lastAssistant.includes(marker));
}

function buildRetrievalQuery(currentMessage: string, messages: ChatMessage[]) {
  const scopedFile = getLastAssistantReferencedFile(messages);
  const shouldCarryScope = currentMessageNeedsScopedContext(currentMessage);

  const parts: string[] = [];

  if (scopedFile && shouldCarryScope) {
    parts.push(scopedFile);
  }

  if (lastAssistantWasFollowUpQuestion(messages) || (scopedFile && shouldCarryScope)) {
    const previousUser = getPreviousUserMessage(messages, currentMessage);
    if (previousUser) {
      parts.push(previousUser.trim());
    }
  }

  parts.push(currentMessage.trim());

  return unique(parts).join("\n").trim();
}

function inferMode(
  currentMessage: string,
  forceCodeMode: boolean,
  explicitCodeRequest: boolean,
  retrievalQuery: string
): "chat" | "debug" | "architecture" | "implementation" | "explain" | "locate" {
  const current = normalizeText(currentMessage);
  const retrieval = normalizeText(retrievalQuery);
  const words = current.split(/\s+/).filter(Boolean);

  const casualWords = [
    "hi",
    "hello",
    "hey",
    "yo",
    "sup",
    "how are you",
    "how u doing",
    "what's up",
    "wyd",
    "good morning",
    "good afternoon",
    "good evening",
  ];

  const locatePhrases = [
    "where is",
    "where can i find",
    "where do i find",
    "where would i go",
    "which file",
    "what file",
    "find the file",
    "locate",
    "route.ts",
    "app/api/",
    "components/",
    "app/",
    "lib/",
  ];

  const implementationWords = [
    "add",
    "build",
    "create",
    "make",
    "implement",
    "edit",
    "update",
    "change",
    "modify",
    "work on",
    "button",
    "form",
    "component",
    "route",
    "feature",
    "update the code",
    "change the code",
    "how would i add",
    "beside",
    "next to",
    "modal",
    "dialog",
    "export",
    "print",
    "toggle",
    "filter",
    "search",
    "dropdown",
    "link to",
    "take me",
    "send me",
    "sends me",
    "navigate",
    "redirect",
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

  const explainWords = [
    "how does",
    "explain",
    "what does",
    "walk me through",
  ];

  const architectureWords = [
    "architecture",
    "project structure",
    "folder structure",
    "codebase structure",
    "repo structure",
    "how is the project organized",
    "how is this project organized",
    "overview of the project",
    "project overview",
  ];

  const fileExplainWords = [
    "what is",
    "what does",
    "doing",
    "what's",
    "explain",
  ];

  if (casualWords.some((word) => current.includes(word))) return "chat";
  if (debugWords.some((word) => retrieval.includes(word))) return "debug";
  if (architectureWords.some((word) => retrieval.includes(word))) return "architecture";
  if (hasFileReference(retrievalQuery) && fileExplainWords.some((word) => retrieval.includes(word))) {
    return "explain";
  }

  if (
    forceCodeMode ||
    explicitCodeRequest ||
    implementationWords.some((word) => retrieval.includes(word))
  ) {
    return "implementation";
  }

  if (explainWords.some((word) => retrieval.includes(word))) return "explain";

  if (
    locatePhrases.some((word) => current.includes(word)) ||
    (words.length <= 4 &&
      (current.includes("page") ||
        current.includes("screen") ||
        current.includes("file") ||
        current.includes("route")))
  ) {
    return "locate";
  }

  return "chat";
}

function needsButtonBehaviorFollowUp(
  currentMessage: string,
  forceCodeMode: boolean,
  explicitCodeRequest: boolean
) {
  if (forceCodeMode || explicitCodeRequest) return false;

  const m = normalizeText(currentMessage);
  const signals = buildQuerySignals(currentMessage);

  const mentionsButton = m.includes("button");

  if (!mentionsButton) return false;

  if (
    signals.wantsNavigation ||
    signals.routePaths.length > 0 ||
    signals.pagePhrases.length > 0 ||
    signals.anchorPhrases.length > 0 ||
    signals.labelPhrases.length > 0
  ) {
    return false;
  }

const actionWords = [
  "open",
  "show",
  "toggle",
  "navigate",
  "go to",
  "take me",
  "takes me",
  "send me",
  "sends me",
  "send us",
  "sends us",
  "send user",
  "sends user",
  "take us",
  "takes us",
  "takes user",
  "takes users",
  "link to",
  "redirect",
  "route to",
  "routes to",
  "bring me to",
  "brings me to",
  "appointment page",
  "appointments page",
  "/",
];

  return !actionWords.some((word) => m.includes(word));
}

function needsBroadFollowUp(
  currentMessage: string,
  forceCodeMode: boolean,
  explicitCodeRequest: boolean,
  mode: string
) {
  if (forceCodeMode || explicitCodeRequest) return false;
  if (mode === "locate" || mode === "debug" || mode === "architecture") return false;

  const m = normalizeText(currentMessage);

  const broadIntentWords = [
    "help me with",
    "help me add",
    "help adding",
    "help building",
    "help making",
    "want help",
    "want to add functionality",
    "some functionality",
    "add something",
    "change something",
  ];

  const specificWords = [
    "button",
    "modal",
    "filter",
    "search",
    "export",
    "print",
    "login",
    "auth",
    "history",
    "table",
    "card",
    "chart",
    "dropdown",
    "toggle",
    "form",
    "patient",
    "appointment",
    "payment",
    "calendar",
    "badge",
    "graph",
    "/",
  ];

  return (
    broadIntentWords.some((word) => m.includes(word)) &&
    !specificWords.some((word) => m.includes(word))
  );
}

function extractExplicitRepoPaths(message: string) {
  const matches = [
    ...message.matchAll(
      /(?:^|[\s`"(])((?:app|components|lib|prisma|utils)\/[A-Za-z0-9._/-]+)/g
    ),
  ].map((match) => match[1]);

  return unique(matches.map((value) => value.trim()));
}

function extractFilenameReferences(message: string) {
  const matches = [
    ...message.matchAll(
      /([A-Za-z0-9_-]+\.(?:js|jsx|ts|tsx|json|prisma|md))/g
    ),
  ].map((match) => normalizeText(match[1]));

  return unique(matches);
}

function fileStem(value: string) {
  return normalizeText(value).replace(/\.[^.]+$/, "");
}

function extractQuotedPhrases(message: string) {
  return unique(
    [...message.matchAll(/["“]([^"”]{2,80})["”]/g)]
      .map((match) => match[1].trim())
      .filter(Boolean)
      .map(normalizeText)
  );
}

function cleanPhrase(value: string) {
  return normalizeText(value)
    .replace(/^[^a-z0-9/]+|[^a-z0-9/]+$/g, "")
    .replace(/^(?:on|in|at|to|for|from|back|the|a|an)\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripUiWords(value: string) {
  return value
    .replace(/\b(button|btn|link|page|screen|card|section|tab)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstIndex(...indexes: number[]) {
  const valid = indexes.filter((index) => index >= 0);
  return valid.length > 0 ? Math.min(...valid) : -1;
}

function splitPhraseWords(value: string) {
  return cleanPhrase(value)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length >= 2)
    .filter((word) => !NOISE_WORDS.has(word));
}

function makeBigrams(words: string[]) {
  const out: string[] = [];

  for (let i = 0; i < words.length - 1; i += 1) {
    out.push(`${words[i]} ${words[i + 1]}`);
  }

  return out;
}

function extractPagePhrases(message: string) {
  return unique(
    [...message.matchAll(/\b((?:[a-z0-9]+(?:\s+|[-_/])){0,2}[a-z0-9]+\s(?:page|screen))\b/gi)]
      .map((match) => cleanPhrase(match[1]))
      .filter(Boolean)
      .map((phrase) => phrase.replace(/^(?:on|in|at)\s+/, "").trim())
  );
}

function extractAnchorPhrases(message: string) {
  return unique(
    [
      ...message.matchAll(
        /\b(?:beside|next to|under|below|above|near)\s+(?:the\s+|a\s+|an\s+)?([^,.\n]{2,60})/gi
      ),
    ]
      .map((match) => cleanPhrase(match[1]))
      .filter(Boolean)
      .map((phrase) =>
        stripUiWords(
          phrase
            .replace(/\b(?:that|which)\b.*$/i, "")
            .replace(/\s+(?:called|named|titled)\s+.*$/i, "")
            .trim()
        )
      )
      .filter(Boolean)
  );
}

function extractLabelPhrases(message: string) {
  return unique(
    [
      ...message.matchAll(
        /\b(?:say|says|label|labelled|labeled|text|called|named|titled)\s+["“]?([^"”,.\n]{1,40})["”]?/gi
      ),
    ]
      .map((match) => cleanPhrase(match[1]))
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

function getSearchTerms(message: string) {
  const lower = normalizeText(message);

  const words = lower
    .replace(/[^a-z0-9/_ .-]+/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .flatMap((word) => word.split(/[/.:_-]+/))
    .filter(Boolean)
    .filter((word) => word.length >= 3)
    .filter((word) => !NOISE_WORDS.has(word));

  return unique(words);
}

function buildQuerySignals(message: string): QuerySignals {
  const lower = normalizeText(message);

  const explicitRepoPaths = extractExplicitRepoPaths(message).map(normalizeText);
  const quotedPhrases = extractQuotedPhrases(message);
  const pagePhrases = extractPagePhrases(message);
  const anchorPhrases = extractAnchorPhrases(message);
  const labelPhrases = extractLabelPhrases(message);
  const routePaths = extractRoutePaths(message);
  const fileReferences = extractFilenameReferences(message);

  const phraseWords = unique([
    ...pagePhrases.flatMap(splitPhraseWords),
    ...anchorPhrases.flatMap(splitPhraseWords),
    ...labelPhrases.flatMap(splitPhraseWords),
    ...quotedPhrases.flatMap(splitPhraseWords),
  ]);

  const phraseBigrams = unique(makeBigrams(phraseWords));

  return {
    explicitRepoPaths,
    quotedPhrases,
    pagePhrases,
    anchorPhrases,
    labelPhrases,
    routePaths,
    fileReferences,
    terms: unique([
      ...getSearchTerms(message),
      ...phraseWords,
      ...phraseBigrams,
      ...fileReferences,
      ...fileReferences.map(fileStem),
    ]),
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
      lower.includes("appointment page") ||
      lower.includes("appointments page") ||
      lower.includes("href") ||
      routePaths.length > 0,
  };
}

function detectPrimaryTarget(message: string) {
  const explicitPaths = extractExplicitRepoPaths(message);
  return explicitPaths[0] || null;
}

function isAiRouteQuery(message: string) {
  const m = normalizeText(message);
  return AI_ROUTE_HINTS.some((hint) => m.includes(hint));
}

function selectSnippet(raw: string, bestIndex: number) {
  if (bestIndex < 0) {
    return raw.slice(0, MAX_SNIPPET_CHARS);
  }

  const start = Math.max(0, bestIndex - 900);
  const end = Math.min(raw.length, bestIndex + 2000);
  return raw.slice(start, end);
}

function analyzeFile(relativePath: string, raw: string, message: string) {
  const p = normalizeText(relativePath);
  const c = normalizeText(raw);
  const signals = buildQuerySignals(message);
  const primaryTarget = detectPrimaryTarget(message);

  let score = 0;
  let bestIndex = Number.MAX_SAFE_INTEGER;
  const matchedTerms = new Set<string>();
  const pathSegments = p.split(/[\/._-]+/).filter(Boolean);
  const baseName = p.split("/").pop() || "";
  const stemName = fileStem(baseName);

  function addMatch(label: string, points: number, index?: number) {
    score += points;
    matchedTerms.add(label);
    if (typeof index === "number" && index >= 0) {
      bestIndex = Math.min(bestIndex, index);
    }
  }

  function addPathAndContentMatch(
    token: string,
    pathPoints: number,
    contentPoints: number
  ) {
    if (!token) return;

    if (p.includes(token)) {
      addMatch(`path:${token}`, pathPoints, 0);
    }

    const idx = c.indexOf(token);
    if (idx !== -1) {
      addMatch(`content:${token}`, contentPoints, idx);
    }
  }

  if (primaryTarget && p === normalizeText(primaryTarget)) {
    addMatch("explicit-path", 2200, 0);
  }

  for (const explicitPath of signals.explicitRepoPaths) {
    addPathAndContentMatch(explicitPath, 280, 80);
  }

  for (const fileReference of signals.fileReferences) {
    const refStem = fileStem(fileReference);

    if (baseName === fileReference) {
      addMatch(`file:${fileReference}`, 900, 0);
    }

    if (stemName === refStem) {
      addMatch(`file-stem:${refStem}`, 720, 0);
    }
  }

  for (const phrase of [
    ...signals.quotedPhrases,
    ...signals.pagePhrases,
    ...signals.anchorPhrases,
    ...signals.labelPhrases,
  ]) {
    addPathAndContentMatch(phrase, 120, 420);
  }

  for (const routePath of signals.routePaths) {
    addPathAndContentMatch(routePath, 40, 320);
  }

  for (const term of signals.terms) {
    if (!term || NOISE_WORDS.has(term)) continue;

    if (pathSegments.includes(term)) {
      addMatch(`segment:${term}`, 40, 0);
    }

    addPathAndContentMatch(term, 30, 20);
  }

  const pageWords = unique(signals.pagePhrases.flatMap(splitPhraseWords));
  const pageWordHits = pageWords.filter((word) => pathSegments.includes(word)).length;

  if (
    signals.wantsPage &&
    (p.endsWith("page.js") ||
      p.endsWith("page.jsx") ||
      p.endsWith("page.ts") ||
      p.endsWith("page.tsx"))
  ) {
    addMatch("page-file", 28, 0);

    if (pageWordHits > 0) {
      addMatch("page-structure", 120 + pageWordHits * 30, 0);
    }
  }

  const buttonIdx = firstIndex(
    c.indexOf("<button"),
    c.indexOf("button"),
    c.indexOf("variant="),
    c.indexOf("classname")
  );

  if (signals.wantsButton && buttonIdx >= 0) {
    addMatch("button-ui", 36, buttonIdx);
  }

  const navIdx = firstIndex(
    c.indexOf("next/link"),
    c.indexOf("href="),
    c.indexOf("router.push"),
    c.indexOf("userouter"),
    c.indexOf("pathname")
  );

  if (signals.wantsNavigation && navIdx >= 0) {
    addMatch("navigation-ui", 42, navIdx);
  }

  const anchorHit = signals.anchorPhrases.find((phrase) => c.includes(phrase));
  const labelHit = signals.labelPhrases.find((phrase) => c.includes(phrase));

  if (anchorHit) {
    addMatch(`anchor:${anchorHit}`, 260, c.indexOf(anchorHit));
  }

  if (labelHit) {
    addMatch(`label:${labelHit}`, 320, c.indexOf(labelHit));
  }

  if (anchorHit && signals.wantsButton) {
    addMatch("anchor+button", 140);
  }

  if (labelHit && signals.wantsNavigation) {
    addMatch("label+nav", 120);
  }

  if (anchorHit && labelHit) {
    addMatch("anchor+label", 180);
  }

  if (isAiRouteQuery(message) && p === "app/api/aiassistant/route.ts") {
    addMatch("ai-route", 180, 0);
  }

  return {
    score,
    bestIndex: bestIndex === Number.MAX_SAFE_INTEGER ? -1 : bestIndex,
    matchedTerms: [...matchedTerms],
  };
}

function relaxedAnalyzeFile(relativePath: string, raw: string, message: string) {
  const p = normalizeText(relativePath);
  const c = normalizeText(raw);
  const signals = buildQuerySignals(message);

  let score = 0;
  let bestIndex = -1;
  const matchedTerms = new Set<string>();
  const pathSegments = p.split(/[\/._-]+/).filter(Boolean);
  const baseName = p.split("/").pop() || "";
  const stemName = fileStem(baseName);

  const looseTokens = unique([
    ...signals.terms,
    ...signals.pagePhrases.flatMap(splitPhraseWords),
    ...signals.anchorPhrases.flatMap(splitPhraseWords),
    ...signals.labelPhrases.flatMap(splitPhraseWords),
    ...signals.routePaths,
  ]).filter((token) => token.length >= 2 && !NOISE_WORDS.has(token));

  for (const fileReference of signals.fileReferences) {
    const refStem = fileStem(fileReference);

    if (baseName === fileReference) {
      score += 180;
      matchedTerms.add(`file:${fileReference}`);
    }

    if (stemName === refStem) {
      score += 140;
      matchedTerms.add(`file-stem:${refStem}`);
    }
  }

  for (const token of looseTokens) {
    if (p.includes(token)) {
      score += 24;
      matchedTerms.add(`path:${token}`);
    }

    if (pathSegments.includes(token)) {
      score += 20;
      matchedTerms.add(`segment:${token}`);
    }

    const idx = c.indexOf(token);
    if (idx !== -1) {
      score += 14;
      matchedTerms.add(`content:${token}`);
      if (bestIndex === -1) bestIndex = idx;
    }
  }

  if (
    signals.wantsPage &&
    (p.endsWith("page.js") ||
      p.endsWith("page.jsx") ||
      p.endsWith("page.ts") ||
      p.endsWith("page.tsx"))
  ) {
    score += 16;
    matchedTerms.add("page-file");
  }

  if (signals.wantsButton && (c.includes("button") || c.includes("<button"))) {
    score += 18;
    matchedTerms.add("button-ui");
  }

  if (
    signals.wantsNavigation &&
    (c.includes("next/link") || c.includes("href=") || c.includes("router.push"))
  ) {
    score += 18;
    matchedTerms.add("navigation-ui");
  }

  return {
    score,
    bestIndex,
    matchedTerms: [...matchedTerms],
  };
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

function shouldSuppressFile(relativePath: string, message: string) {
  const p = normalizeText(relativePath);

  if (p === "app/api/aiassistant/route.ts" && !isAiRouteQuery(message)) {
    return true;
  }

  return false;
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

  const files: Array<{ relativePath: string; raw: string }> = [];

  for (const filePath of allPaths) {
    try {
      files.push({
        relativePath: toRepoPath(path.relative(root, filePath)),
        raw: await readFile(filePath, "utf-8"),
      });
    } catch {
      // skip unreadable files
    }
  }

  repoCache = {
    expiresAt: Date.now() + REPO_CACHE_TTL_MS,
    files,
  };

  return files;
}

function hasStrongPrimaryMatch(files: RetrievedFile[]) {
  if (files.length === 0) return false;

  const first = files[0];
  const second = files[1];

  if (
    first.matchedTerms.includes("explicit-path") ||
    first.matchedTerms.includes("anchor+label")
  ) {
    return true;
  }

  if (!second) {
    return first.score >= MIN_STRONG_MATCH_SCORE;
  }

  return (
    first.score >= MIN_STRONG_MATCH_SCORE &&
    first.score - second.score >= MIN_STRONG_MATCH_GAP
  );
}

function buildVerifiedFallbackReply(
  files: RetrievedFile[],
  allowCode: boolean,
  reason?: "low_confidence" | "invalid_paths"
) {
  if (files.length === 0) {
    return allowCode
      ? `Summary:\nLikely files to edit:\n- No verified target file yet.\nWhat to change:\n- I need a verified repo match before I can write exact code safely.\nSteps:\n1. Retry with the exact UI text, route, or screen name.\n2. Include the button label or page title if you know it.\nExample code:\n- Not provided because the target file is not verified.\nNotes:\n- I blocked guessed file paths from the model output.`
      : `Likely file:\n- No verified target file yet.\nWhy:\n- I could not verify the exact file from the current repo scan.\nPlan:\n- Retry with the exact UI text or route so I can ground the answer from the repo itself.\nNext step:\n- Ask again with the button label or route.`;
  }

  const primary = files[0];
  const others = files
    .slice(1, 3)
    .map((file) => `\`${file.relativePath}\``)
    .join(", ");

  const reasonLine =
    reason === "invalid_paths"
      ? "I blocked unverified file paths from the model output."
      : "The repo match was not strong enough to safely return exact code.";

  if (allowCode) {
    return `Summary:\nLikely files to edit:\n- \`${primary.relativePath}\`${others ? `\n- ${others}` : ""}\nWhat to change:\n- Add the requested behavior in the strongest verified file first.\nSteps:\n1. Start in \`${primary.relativePath}\`.\n2. Keep the change scoped to the verified file and its nearby controls.\n3. Re-run the request with the exact UI text if you want me to write final code.\nExample code:\n- I did not return exact code because the target file is not verified strongly enough yet.\nNotes:\n- ${reasonLine}`;
  }

  return `Likely file:\n- \`${primary.relativePath}\`\nWhy:\n- That is the strongest verified repo match from the current search.\nPlan:\n- Start there and keep the change scoped to verified files only.${others ? `\n- Other verified candidates: ${others}.` : ""}\nNext step:\n- Ask for code again with the exact UI text if you want the final implementation.`;
}

function getInvalidMentionedPaths(reply: string, retrievedFiles: string[]) {
  const mentionedPaths = extractMentionedPaths(reply);
  if (mentionedPaths.length === 0) return [];

  if (retrievedFiles.length === 0) {
    return mentionedPaths;
  }

  const allowed = new Set(retrievedFiles.map(normalizeText));

  return mentionedPaths.filter((pathValue) => !allowed.has(pathValue));
}

async function loadRelevantFiles(message: string) {
  const repoFiles = await getRepoFiles();
  const primaryTarget = detectPrimaryTarget(message);

  const ranked: RetrievedFile[] = [];

  for (const file of repoFiles) {
    if (shouldSuppressFile(file.relativePath, message)) continue;

    const analysis = analyzeFile(file.relativePath, file.raw, message);
    if (analysis.score <= 0) continue;

    let score = analysis.score;

    if (
      primaryTarget &&
      normalizeText(file.relativePath) === normalizeText(primaryTarget)
    ) {
      score += 1200;
    }

    ranked.push({
      relativePath: file.relativePath,
      raw: file.raw,
      snippet: selectSnippet(file.raw, analysis.bestIndex),
      score,
      matchedTerms: analysis.matchedTerms,
      bestIndex: analysis.bestIndex,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    const relaxed: RetrievedFile[] = [];

    for (const file of repoFiles) {
      if (shouldSuppressFile(file.relativePath, message)) continue;

      const analysis = relaxedAnalyzeFile(file.relativePath, file.raw, message);
      if (analysis.score <= 0) continue;

      relaxed.push({
        relativePath: file.relativePath,
        raw: file.raw,
        snippet: selectSnippet(file.raw, analysis.bestIndex),
        score: analysis.score,
        matchedTerms: analysis.matchedTerms,
        bestIndex: analysis.bestIndex,
      });
    }

    relaxed.sort((a, b) => b.score - a.score);

    let totalChars = 0;
    const selectedRelaxed: RetrievedFile[] = [];

    for (const file of relaxed.slice(0, MAX_FILES)) {
      if (totalChars >= MAX_TOTAL_CHARS) break;

      const remaining = Math.max(0, MAX_TOTAL_CHARS - totalChars);
      const finalSnippet = file.snippet.slice(0, remaining);

      totalChars += finalSnippet.length;
      selectedRelaxed.push({
        ...file,
        snippet: finalSnippet,
      });
    }

    if (selectedRelaxed.length > 0) {
      return selectedRelaxed;
    }

    return [];
  }

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

function formatHistory(messages: ChatMessage[]) {
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

function buildRepoAccessReply(repoRoot: string, repoFileCount: number) {
  return [
    "I should have access to the files.",
    repoFileCount > 0
      ? `The repo scan is working and found ${repoFileCount} files under \`${repoRoot}\`.`
      : `Right now the repo scan is not finding files under \`${repoRoot}\`, so the runtime file access is the issue.`,
    repoFileCount > 0
      ? "If I still ask for a file path, that means the request routing or matching logic needs to be broader."
      : "That is why the assistant falls back to vague answers instead of pointing at the right file.",
  ].join("\n");
}


function isFileInventoryResponseText(value: string) {
  const normalized = normalizeText(value);

  return (
    normalized.includes("i can currently see") &&
    (normalized.includes("repo files") ||
      normalized.includes("here are some examples") ||
      normalized.includes("here are some more files"))
  );
}

function lastAssistantWasFileInventoryResponse(messages: ChatMessage[]) {
  const lastAssistant = getLastAssistantMessage(messages) || "";

  if (!lastAssistant) return false;

  return isFileInventoryResponseText(lastAssistant);
}

function isFileListingContinuation(
  message: string,
  messages: ChatMessage[]
) {
  if (!lastAssistantWasFileInventoryResponse(messages)) return false;

  const m = normalizeText(message);

  const continuationPhrases = [
    "what else",
    "anything else",
    "show more",
    "more",
    "more files",
    "what else can you see",
    "what else do you see",
    "any more",
    "keep going",
  ];

  return continuationPhrases.some((phrase) => m === phrase || m.includes(phrase));
}

function countConsecutiveFileInventoryResponses(messages: ChatMessage[]) {
  let count = 0;

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];

    if (msg.role !== "assistant" || typeof msg.content !== "string" || !msg.content.trim()) {
      continue;
    }

    if (isFileInventoryResponseText(msg.content)) {
      count += 1;
      continue;
    }

    if (count > 0) break;
  }

  return count;
}

function isFileListingQuestion(message: string, messages: ChatMessage[] = []) {
  const m = normalizeText(message);

  if (isFileListingContinuation(message, messages)) {
    return true;
  }

  const fileListingPhrases = [
    "name some files you can see",
    "what files can you see",
    "which files can you see",
    "show me some files",
    "list some files",
    "name files you can see",
    "what files do you have access to",
    "which files do you have access to",
    "show files you can see",
    "can you list files",
    "name some files",
    "show me files",
  ];

  return fileListingPhrases.some((phrase) => m.includes(phrase));
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

function buildVisibleFilesReply(
  repoFiles: Array<{ relativePath: string; raw: string }>,
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

  const chunkSize = 12;
  const examples = sorted
    .slice(startIndex, startIndex + chunkSize)
    .map((file) => `- \`${file.relativePath}\``);

  if (examples.length === 0) {
    return [
      `I can currently see ${repoFiles.length} repo files.`,
      "",
      "I already showed the sampled file list I have for this reply path.",
    ].join("\n");
  }

  const remaining = Math.max(0, sorted.length - (startIndex + examples.length));

  return [
    `I can currently see ${repoFiles.length} repo files.`,
    "",
    startIndex === 0 ? "Here are some examples:" : "Here are some more files I can see:",
    ...examples,
    ...(remaining > 0 ? ["", `${remaining} more files are available in the repo scan.`] : []),
  ].join("\n");
}

function isPageFilePath(relativePath: string) {
  return /\/page\.(?:js|jsx|ts|tsx)$/i.test(relativePath);
}

const PAGE_LOOKUP_NOISE_WORDS = new Set([
  ...NOISE_WORDS,
  "edit",
  "change",
  "update",
  "modify",
  "work",
  "wanted",
  "want",
  "where",
  "would",
  "find",
  "page",
  "screen",
  "view",
  "route",
  "go",
  "help",
  "wanted",
  "wanting",
  "wanted",
  "wanted",
]);

function extractPageLookupTerms(message: string) {
  const signals = buildQuerySignals(message);

  const baseTerms = unique([
    ...signals.pagePhrases.flatMap(splitPhraseWords),
    ...signals.anchorPhrases.flatMap(splitPhraseWords),
    ...signals.labelPhrases.flatMap(splitPhraseWords),
    ...signals.terms,
  ]).filter((word) => word.length >= 2 && !PAGE_LOOKUP_NOISE_WORDS.has(word));

  return expandLookupTokens(baseTerms).filter(
    (word) => word.length >= 2 && !PAGE_LOOKUP_NOISE_WORDS.has(word)
  );
}

function findPageFileCandidates(
  message: string,
  repoFiles: Array<{ relativePath: string; raw: string }>
) {
  const pageTerms = extractPageLookupTerms(message);

  if (pageTerms.length === 0) return [];

  const candidates = repoFiles
    .map((file) => {
      if (!isPageFilePath(file.relativePath)) return null;

      const lowerPath = normalizeText(file.relativePath);
      const lowerRaw = normalizeText(file.raw);
      const pathSegments = lowerPath.split(/[\/._-]+/).filter(Boolean);
      const route = normalizeText(routeFromPageFile(file.relativePath) || "");

      let score = 0;

      for (const term of pageTerms) {
        if (!term || PAGE_LOOKUP_NOISE_WORDS.has(term)) continue;

        if (pathSegments.includes(term)) score += 180;
        if (lowerPath.includes(`/${term}/page.`)) score += 260;
        if (lowerPath.includes(term)) score += 70;
        if (route === `/${term}`) score += 220;
        if (route.endsWith(`/${term}`)) score += 160;
        if (route.includes(`/${term}/`)) score += 120;

        const contentIndex = lowerRaw.indexOf(term);
        if (contentIndex !== -1) {
          score += 55;

          if (contentIndex < 3000) {
            score += 20;
          }
        }
      }

      return score > 0
        ? {
            relativePath: file.relativePath,
            score,
          }
        : null;
    })
    .filter(
      (value): value is { relativePath: string; score: number } => Boolean(value)
    )
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, 6);
}

function buildPageScopeReply(
  message: string,
  repoFiles: Array<{ relativePath: string; raw: string }>,
  retrievedFiles: RetrievedFile[] = []
) {
  const m = normalizeText(message);

  const mentionsPageScope =
    m.includes("page") ||
    m.includes("screen") ||
    m.includes("view") ||
    m.includes("route") ||
    m.includes("where would i go") ||
    m.includes("where can i find") ||
    m.includes("where do i find") ||
    m.includes("which file") ||
    m.includes("what file") ||
    m.includes("edit") ||
    m.includes("change") ||
    m.includes("update") ||
    m.includes("modify");

  if (!mentionsPageScope) return null;

  const candidateMap = new Map<string, number>();

  for (const file of retrievedFiles) {
    if (!isPageFilePath(file.relativePath)) continue;
    candidateMap.set(file.relativePath, Math.max(candidateMap.get(file.relativePath) || 0, file.score + 300));
  }

  for (const file of findPageFileCandidates(message, repoFiles)) {
    candidateMap.set(file.relativePath, Math.max(candidateMap.get(file.relativePath) || 0, file.score));
  }

  const candidates = [...candidateMap.entries()]
    .map(([relativePath, score]) => ({ relativePath, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (candidates.length === 0) return null;

  const primary = candidates[0];
  const others = candidates.slice(1).map((file) => `\`${file.relativePath}\``);

  const editIntentMarkers = [
    "edit",
    "change",
    "update",
    "modify",
    "work on",
    "help with",
    "help me",
    "wanted to change",
    "want to change",
    "wanted to edit",
    "want to edit",
    "if i wanted to edit",
    "if i wanted to change",
    "if i wanted to update",
  ];

  const locateIntentMarkers = [
    "where is",
    "where can i find",
    "where do i find",
    "where would i go",
    "which file",
    "what file",
    "find",
    "locate",
    "where would i edit",
    "where should i edit",
  ];

  if (editIntentMarkers.some((marker) => m.includes(marker))) {
    return [
      `The strongest match is \`${primary.relativePath}\`.`,
      "Start there first.",
      "Tell me what you want to add or change and I’ll guide you through it or write the code.",
      ...(others.length > 0 ? [`Other likely page files are ${others.join(", ")}.`] : []),
    ].join("\n");
  }

  if (locateIntentMarkers.some((marker) => m.includes(marker))) {
    return others.length > 0
      ? `The strongest match is \`${primary.relativePath}\`. Other likely page files are ${others.join(", ")}.`
      : `The strongest match is \`${primary.relativePath}\`. Start there first.`;
  }

  return null;
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

function buildArchitectureReply(
  repoFiles: Array<{ relativePath: string; raw: string }>
) {
  if (repoFiles.length === 0) {
    return "I can’t map the project architecture yet because the repo scan did not return any files.";
  }

  const dirCount = (dir: string) =>
    repoFiles.filter((file) => file.relativePath.startsWith(`${dir}/`)).length;

  const pageRoutes = repoFiles
    .map((file) => {
      const route = routeFromPageFile(file.relativePath);
      return route
        ? {
            route,
            file: file.relativePath,
          }
        : null;
    })
    .filter((value): value is { route: string; file: string } => Boolean(value))
    .sort((a, b) => a.route.localeCompare(b.route));

  const apiRoutes = repoFiles
    .map((file) => {
      const route = routeFromRouteFile(file.relativePath);
      return route
        ? {
            route,
            file: file.relativePath,
          }
        : null;
    })
    .filter((value): value is { route: string; file: string } => Boolean(value))
    .sort((a, b) => a.route.localeCompare(b.route));

  const componentExamples = repoFiles
    .filter((file) => file.relativePath.startsWith("components/"))
    .map((file) => `\`${file.relativePath}\``)
    .slice(0, 5);

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
    for (const entry of pageRoutes.slice(0, 10)) {
      lines.push(`- \`${entry.route}\` → \`${entry.file}\``);
    }
  }

  lines.push("", "API routes:");

  if (apiRoutes.length === 0) {
    lines.push("- I did not find any route handler files.");
  } else {
    for (const entry of apiRoutes.slice(0, 8)) {
      lines.push(`- \`${entry.route}\` → \`${entry.file}\``);
    }
  }

  lines.push("", "Shared component examples:");

  if (componentExamples.length === 0) {
    lines.push("- I did not find shared components in `components/`.");
  } else {
    for (const entry of componentExamples) {
      lines.push(`- ${entry}`);
    }
  }

  lines.push(
    "",
    `Overall, I scanned ${repoFiles.length} repo files, so I can answer architecture questions directly from the codebase instead of guessing.`
  );

  return lines.join("\n");
}


function hasSpecificImplementationDetails(message: string) {
  const m = normalizeText(message);

  const detailMarkers = [
    "button",
    "modal",
    "dialog",
    "filter",
    "search",
    "dropdown",
    "link",
    "route",
    "redirect",
    "navigate",
    "take me",
    "send me",
    "sends me",
    "bring me to",
    "form",
    "field",
    "input",
    "table",
    "card",
    "chart",
    "toggle",
    "export",
    "print",
    "history",
    "appointment",
    "appointments",
    "patient",
    "payment",
    "calendar",
    "badge",
    "graph",
    "next to",
    "beside",
    "under",
    "below",
    "above",
    "near",
  ];

  return detailMarkers.some((marker) => m.includes(marker));
}

function buildScopedEditReply(message: string, files: RetrievedFile[]) {
  if (files.length === 0) return null;

  const m = normalizeText(message);
  const primary = files[0];

  const editIntentMarkers = [
    "edit",
    "change",
    "update",
    "modify",
    "work on",
    "help with",
    "can you help",
    "want to edit",
    "want to change",
    "want to update",
  ];

  const mentionsScopedArea =
    m.includes("page") ||
    m.includes("screen") ||
    m.includes("component") ||
    m.includes("route") ||
    m.includes("file");

  if (!editIntentMarkers.some((marker) => m.includes(marker))) return null;
  if (!mentionsScopedArea) return null;
  if (hasSpecificImplementationDetails(message)) return null;

  const scopeKind = primary.relativePath.toLowerCase().includes("/page.")
    ? "page"
    : primary.relativePath.toLowerCase().includes("/route.")
      ? "route"
      : primary.relativePath.toLowerCase().includes("components/")
        ? "component"
        : "file";

  return [
    `The strongest match is \`${primary.relativePath}\`.`,
    `I can help you change that ${scopeKind}.`,
    "Tell me what you want to add or change there and I’ll either guide you through it or write the code.",
    "For example: add a button, change navigation, update a form field, tweak layout, or explain how the page is wired.",
  ].join("\n");
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

function buildFollowUpQuestion(
  currentMessage: string,
  files: RetrievedFile[],
  forceCodeMode: boolean
) {
  const m = normalizeText(currentMessage);
  const primary = files[0];

  const codeHint = forceCodeMode
    ? ""
    : " Say `CODE:` when you want me to write the exact code.";

  if (m.includes("button")) {
    if (primary) {
      return `Sure — \`${primary.relativePath}\` looks like the strongest match. What should the button do?${codeHint}`;
    }

    return `Sure — what should the button do?${codeHint}`;
  }

  if (primary) {
    return `Sure — \`${primary.relativePath}\` looks like the strongest match. What do you want to add or change there?${codeHint}`;
  }

  return `Sure — what do you want to implement?${codeHint}`;
}

function buildDeterministicImplementationReply(files: RetrievedFile[]) {
  if (files.length === 0) {
    return null;
  }

  const primary = files[0];

  return [
    `The strongest match is \`${primary.relativePath}\`.`,
    "Start there first.",
    "Tell me what you want to change and I’ll guide you through it.",
    "If you want the exact implementation, ask for code and I’ll write it against that file.",
  ].join("\n");
}

function buildGroundedImplementationReply(
  message: string,
  files: RetrievedFile[]
) {
  return buildScopedEditReply(message, files);
}

function shouldUseDeterministicImplementationReply(
  files: RetrievedFile[],
  mode: string,
  forceCodeMode: boolean,
  explicitCodeRequest: boolean
) {
  if (mode !== "implementation") return false;
  if (forceCodeMode || explicitCodeRequest) return false;
  if (files.length === 0) return false;

  const first = files[0];
  const second = files[1];

  if (!second) return first.score >= 24;

  return first.score >= 40 && first.score - second.score >= 8;
}

function buildPrompt({
  message,
  history,
  files,
  mode,
  forceCodeMode,
  explicitCodeRequest,
  answeringFollowUp,
}: {
  message: string;
  history: string;
  files: RetrievedFile[];
  mode: string;
  forceCodeMode: boolean;
  explicitCodeRequest: boolean;
  answeringFollowUp: boolean;
}) {
  const filePaths = files.map((file) => file.relativePath).join("\n");

  const fileBlocks = files
    .map(
      (file) =>
        `FILE: ${file.relativePath}\nMATCHED TERMS: ${file.matchedTerms.join(", ") || "none"}\nSNIPPET:\n${file.snippet}`
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

CODE-FIRST MODE:
- ${forceCodeMode || explicitCodeRequest ? "ON" : "OFF"}

FOLLOW-UP ANSWER MODE:
- ${answeringFollowUp ? "ON" : "OFF"}

MOST IMPORTANT RULES:
- Answer the USER'S LATEST MESSAGE directly.
- Use the ranked files and snippets as the source of truth.
- If you mention a file path, copy it exactly from RETRIEVED FILE PATHS.
- Never rename, restyle, simplify, or invent file paths.
- Never mention files that are not in RETRIEVED FILE PATHS.
- Base your file choice on actual code evidence such as UI text, nearby labels, routes, imports, button or link code, and page or component structure.
- Do not say phrases like "based on the provided code snippets" or "it appears that".
- Speak naturally, like a helpful teammate.
- If the user's request is already specific, do not ask a follow-up question.
- If certainty is limited, say "the strongest match is..." instead of guessing.

WHEN CODE-FIRST MODE IS OFF:
- Keep the reply short and grounded.
- Mention only verified file paths from RETRIEVED FILE PATHS.
- If there is no strong verified target, say so directly.

WHEN CODE-FIRST MODE IS ON:
- Write exact code only when the strongest verified target file is clear.
- Mention only verified file paths from RETRIEVED FILE PATHS.
- If the target file is not verified strongly enough, do not invent code or file paths.

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

function buildKnownRoutes(repoFiles: Array<{ relativePath: string; raw: string }>) {
  return unique(
    repoFiles
      .map((file) => routeFromPageFile(file.relativePath))
      .filter((value): value is string => Boolean(value))
  ).slice(0, 25);
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
        `FILE: ${file.relativePath}\nMATCHED TERMS: ${file.matchedTerms.join(", ") || "none"}\nSNIPPET:\n${file.snippet}`
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
- Do not rewrite the full file unless the user explicitly asked for the full file.
- Prefer the smallest possible change.
- Prefer this order:
  1. small insertion or replacement snippet
  2. minimal patch-style code block
  3. full file only if absolutely necessary
- If an import is needed, include only the import line that needs to be added or changed.
- If a route is needed, use only a route from KNOWN PAGE ROUTES.
- If a route is still uncertain, say so briefly and use a TODO comment inside the code instead of inventing a route.
- Do not mention files that are not in RETRIEVED FILE PATHS.
- Return code in fenced markdown blocks.
- Keep the explanation very short.
${strictPatchOnly ? "- Return only a minimal patch/snippet for the strongest matched file. No full-file rewrite." : ""}

OUTPUT FORMAT:
TARGET FILE: <one verified file path>
WHY: <one short sentence>
CHANGE:
\`\`\`tsx
<minimal code>
\`\`\`
${strictPatchOnly ? "" : "NOTES: <only if import or route uncertainty matters>"}

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

async function parseOllamaResponse(res: Response) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(text || "Ollama request failed");
    }

    return { response: text };
  }
}

async function callOllama(prompt: string, numPredict: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.05,
          num_predict: numPredict,
          stop: ["RECENT CHAT:", "RELEVANT PROJECT FILES:", "FINAL ANSWER:"],
        },
      }),
    });

    const data = await parseOllamaResponse(ollamaRes);

    if (!ollamaRes.ok) {
      throw new Error(data?.error || "Ollama request failed");
    }

    return data;
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

  return (
    cleaned ||
    "I found the right area, but the model didn’t return a usable reply."
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

function hasInvalidMentionedPath(reply: string, retrievedFiles: string[]) {
  return getInvalidMentionedPaths(reply, retrievedFiles).length > 0;
}

function buildSafeFallbackReply(files: RetrievedFile[], allowCode: boolean) {
  if (files.length === 0) {
    return allowCode
      ? `Summary:\nLikely files to edit:\n- I couldn't find a strong repo match.\nWhat to change:\n- Search the relevant page or component first.\nSteps:\n1. Retry with the exact UI text, route, or screen name.\nExample code:\n- Not available because no strong file match was found.\nNotes:\n- I avoided guessing the target file.`
      : `Likely file:\n- I couldn't find a strong repo match.\nWhy:\n- The retrieval did not find a clear target in the current repo scan.\nPlan:\n- Narrow the request with exact UI text or a route.\nNext step:\n- Ask again with more specific wording or say \`CODE:\` once the target file is clear.`;
  }

  const primary = files[0];

  if (allowCode) {
    return `Summary:\nLikely files to edit:\n- \`${primary.relativePath}\`\nWhat to change:\n- Make the requested change in the strongest matched file first.\nSteps:\n1. Update the JSX, handlers, or navigation in \`${primary.relativePath}\`.\n2. Keep the UI consistent with the nearby controls already in that file.\n3. Test the flow in the app after the change.\nExample code:\n- I skipped code here because the model mentioned a target file that was not retrieved.\nNotes:\n- I only trust files that were actually retrieved from the repo.`;
  }

  return `Likely file:\n- \`${primary.relativePath}\`\nWhy:\n- That was the strongest repo match from the search results.\nPlan:\n- Start the change there and keep the update scoped to that file first.\nNext step:\n- Say \`CODE:\` when you want the exact code.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessage = String(body.message ?? "").trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!rawMessage) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const forceCodeMode = hasCodeKeyword(rawMessage);
    const explicitCodeRequest = wantsExplicitCode(rawMessage);

    let message = forceCodeMode ? stripCodeKeyword(rawMessage) : rawMessage;

    if (!message && forceCodeMode) {
      const previousUser = getPreviousUserMessage(messages, rawMessage);
      if (previousUser) {
        message = previousUser.trim();
      }
    }

    if (!message) {
      return Response.json(
        { error: 'Message is required after "CODE:"' },
        { status: 400 }
      );
    }

    const quickReply = getQuickChatReply(message);
    if (quickReply) {
      return Response.json({
        reply: quickReply,
        contextFiles: 0,
        mode: "chat",
        retrievedFiles: [],
        answerSource: "rule",
      });
    }

    const retrievalQuery = buildRetrievalQuery(message, messages);
    const mode = inferMode(
      message,
      forceCodeMode,
      explicitCodeRequest,
      retrievalQuery
    );

    const repoRoot = await resolveRepoRoot();
    const repoFiles = await getRepoFiles();
    const repoFileCount = repoFiles.length;

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

    if (isFileListingQuestion(message, messages)) {
      const startIndex = isFileListingContinuation(message, messages)
        ? countConsecutiveFileInventoryResponses(messages) * 12
        : 0;

      return Response.json({
        reply: buildVisibleFilesReply(repoFiles, startIndex),
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

    const files = mode !== "chat" ? await loadRelevantFiles(retrievalQuery) : [];
    const retrievedFiles = files.map((file) => file.relativePath);
    const primaryTarget = detectPrimaryTarget(retrievalQuery);
    const strongPrimaryMatch = hasStrongPrimaryMatch(files);
    const pageScopeReply = buildPageScopeReply(message, repoFiles, files);
    const groundedReply = buildGroundedImplementationReply(message, files);

    if (pageScopeReply) {
      return Response.json({
        reply: pageScopeReply,
        contextFiles: files.length,
        mode: "locate",
        retrievedFiles,
        primaryTarget,
        answerSource: "deterministic_page_scope",
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

    if (groundedReply) {
      return Response.json({
        reply: groundedReply,
        contextFiles: files.length,
        mode,
        retrievedFiles,
        primaryTarget,
        answerSource: "deterministic_grounded",
        debug: {
          strongPrimaryMatch,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    const accessQuestion =
      normalizeText(message).includes("have access to the files") ||
      normalizeText(message).includes("access to the files no") ||
      normalizeText(message).includes("should have the file path");

    if (accessQuestion) {
      return Response.json({
        reply: buildRepoAccessReply(repoRoot, repoFileCount),
        contextFiles: files.length,
        mode: "explain",
        retrievedFiles,
        primaryTarget,
        answerSource: "deterministic",
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
      return Response.json({
        reply: buildLocateReply(files),
        contextFiles: files.length,
        mode,
        retrievedFiles,
        primaryTarget,
        answerSource: "deterministic",
        debug: {
          repoRoot,
          repoFileCount,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    if (
      needsButtonBehaviorFollowUp(message, forceCodeMode, explicitCodeRequest) ||
      needsBroadFollowUp(message, forceCodeMode, explicitCodeRequest, mode)
    ) {
      return Response.json({
        reply: buildFollowUpQuestion(message, files, forceCodeMode),
        contextFiles: files.length,
        mode: "clarify",
        retrievedFiles,
        primaryTarget,
        answerSource: "deterministic",
        debug: {
          repoRoot,
          repoFileCount,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    if (
      (forceCodeMode || explicitCodeRequest) &&
      mode === "implementation" &&
      files.length === 0
    ) {
      const scopedPageReply = buildPageScopeReply(message, repoFiles);

      if (scopedPageReply) {
        return Response.json({
          reply:
            scopedPageReply +
            "\n\n" +
            "I can write the code once the target file is scoped. Ask again with CODE: or say write the code for that.",
          contextFiles: 0,
          mode: "locate",
          retrievedFiles: [],
          primaryTarget: null,
          answerSource: "deterministic_page_scope_code_fallback",
          debug: {
            repoRoot,
            repoFileCount,
            strongPrimaryMatch,
            rankedFiles: [],
          },
        });
      }

      return Response.json({
        reply: buildSafeFallbackReply(files, true),
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

    if (
      shouldUseDeterministicImplementationReply(
        files,
        mode,
        forceCodeMode,
        explicitCodeRequest
      )
    ) {
      return Response.json({
        reply: buildDeterministicImplementationReply(files),
        contextFiles: files.length,
        mode,
        retrievedFiles,
        primaryTarget,
        answerSource: "deterministic",
        debug: {
          repoRoot,
          repoFileCount,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    const answeringFollowUp =
      lastAssistantWasFollowUpQuestion(messages) &&
      !forceCodeMode &&
      !explicitCodeRequest;

    const history = formatHistory(messages);
    const allowCodeMode = forceCodeMode || explicitCodeRequest;
    const knownRoutes = buildKnownRoutes(repoFiles);

    const prompt = allowCodeMode
      ? buildCodePrompt({
          message,
          history,
          files,
          knownRoutes,
          strictPatchOnly: false,
        })
      : buildPrompt({
          message,
          history,
          files,
          mode,
          forceCodeMode,
          explicitCodeRequest,
          answeringFollowUp,
        });

    let data = await callOllama(
      prompt,
      allowCodeMode ? 700 : mode === "debug" ? 420 : 260
    );

    let reply = finalizeReply(
      data?.response || data?.reply || "",
      allowCodeMode
    );

    if (allowCodeMode) {
      reply = normalizeCodeReply(reply, files[0]?.relativePath);

      if (!hasCodeBlock(reply) || isFullFileStyleReply(reply)) {
        const retryPrompt = buildCodePrompt({
          message,
          history,
          files,
          knownRoutes,
          strictPatchOnly: true,
        });

        data = await callOllama(retryPrompt, 700);
        const retriedReply = normalizeCodeReply(
          finalizeReply(data?.response || data?.reply || "", true),
          files[0]?.relativePath
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
        (mode === "implementation"
          ? buildDeterministicImplementationReply(files)
          : null) ||
        buildLocateReply(files) ||
        buildSafeFallbackReply(files, allowCodeMode);
    }

    const invalidMentionedPaths = getInvalidMentionedPaths(reply, retrievedFiles);

    if (hasInvalidMentionedPath(reply, retrievedFiles)) {
      reply = buildVerifiedFallbackReply(
        files,
        forceCodeMode || explicitCodeRequest,
        "invalid_paths"
      );

      return Response.json({
        reply,
        contextFiles: files.length,
        mode,
        retrievedFiles,
        primaryTarget,
        answerSource: "verified_invalid_path_block",
        debug: {
          invalidMentionedPaths,
          strongPrimaryMatch,
          rankedFiles: files.slice(0, 5).map((file) => ({
            path: file.relativePath,
            score: file.score,
            matchedTerms: file.matchedTerms,
          })),
        },
      });
    }

    if (allowCodeMode && (!hasCodeBlock(reply) || isLowValueReply(reply))) {
      reply = buildVerifiedFallbackReply(files, true, "low_confidence");
    }

    if (!allowCodeMode && isLowValueReply(reply)) {
      const fallbackPageScopeReply = buildPageScopeReply(message, repoFiles);

      if (fallbackPageScopeReply) {
        return Response.json({
          reply: fallbackPageScopeReply,
          contextFiles: 0,
          mode: "locate",
          retrievedFiles: [],
          primaryTarget: null,
          answerSource: "deterministic_page_scope_fallback",
          debug: {
            repoRoot,
            repoFileCount,
          },
        });
      }

      reply = buildSafeFallbackReply(files, allowCodeMode);
    }

    return Response.json({
      reply,
      contextFiles: files.length,
      mode,
      retrievedFiles,
      primaryTarget,
      answerSource: "llm_verified",
      debug: {
        invalidMentionedPaths,
        strongPrimaryMatch,
        rankedFiles: files.slice(0, 5).map((file) => ({
          path: file.relativePath,
          score: file.score,
          matchedTerms: file.matchedTerms,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("OLLAMA ERROR:", error);

    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Ollama request timed out"
        : error instanceof Error
          ? error.message
          : "Unknown error";

    return Response.json({ error: message }, { status: 500 });
  }
}
