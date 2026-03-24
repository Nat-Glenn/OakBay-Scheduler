import leoProfanity from "leo-profanity";

// Load default English profanity dictionary
leoProfanity.loadDictionary("en");

// Extra words/variants to catch that may be missed
const customProfanityWords = [
  "damn",
  "wtf",
  "stfu",
  "bs",
  "bullshit",
  "asshole",
  "bastard",
  "dick",
  "motherfucker",
  "fucker",
  "fucking",
  "shit",
  "shitty",
  "bitch",
  "bitches",
  "piss",
  "slut",
  "whore",
  "cunt",
  "fag",
  "faggot",
];

// Unsafe / violent / threatening language
const harmfulKeywords = [
  "kill",
  "murder",
  "attack",
  "stab",
  "shoot",
  "bomb",
  "suicide",
  "destroy",
  "beat up",
  "choke",
  "strangle",
  "i will kill",
  "want to kill",
  "going to kill",
];

// Normalize text to catch simple disguises like sh!t or k1ll
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7+]/g, "t")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Check profanity
export function hasProfanity(value: string): boolean {
  if (!value) return false;

  const normalized = normalizeText(value);

  return (
    leoProfanity.check(value) ||
    leoProfanity.check(normalized) ||
    customProfanityWords.some((word) => normalized.includes(word))
  );
}

// Clean profanity in free-text fields
export function cleanText(value: string): string {
  if (!value) return value;

  let cleaned = leoProfanity.clean(value);
  const normalized = normalizeText(value);

  for (const word of customProfanityWords) {
    if (normalized.includes(word)) {
      const pattern = new RegExp(word, "gi");
      cleaned = cleaned.replace(pattern, "****");
    }
  }

  return cleaned;
}

// Null-safe cleaner for optional fields
export function cleanField(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  return cleanText(value);
}

// Check unsafe / violent language
export function hasUnsafeLanguage(value: string | null | undefined): boolean {
  if (!value) return false;

  const normalized = normalizeText(value);
  return harmfulKeywords.some((word) => normalized.includes(word));
}