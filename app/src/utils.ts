import { FENCE_RE, API_CONFIG } from './constants';
import { KnownItem } from './types';

/**
 * Get current date in YYYY-MM-DD format using local timezone.
 * CRITICAL: Uses getFullYear/getMonth/getDate NOT toISOString() to avoid UTC date bugs.
 */
export function today(): string {
  const n = new Date();
  return n.getFullYear() + "-" +
         String(n.getMonth() + 1).padStart(2, "0") + "-" +
         String(n.getDate()).padStart(2, "0");
}

/**
 * Format date string as "Wednesday, March 9" for display headers
 */
export function formatDateHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[dt.getDay()]}, ${months[dt.getMonth()]} ${d}`;
}

/**
 * Normalize string for fuzzy matching - lowercase, remove non-alphanumeric, collapse spaces
 */
export function normalizeForMatch(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Check if string contains any digits
 */
export function hasDigit(s: string): boolean {
  return /\d/.test(s);
}

/**
 * Find best matching known item for given name using fuzzy matching with exact number matching.
 * Returns null if no good match found (score < 0.6).
 */
export function findBestMatch(name: string, knownItems: KnownItem[]): KnownItem | null {
  if (!name || !knownItems.length) return null;

  const norm = normalizeForMatch(name);
  if (!norm) return null;

  // Check for exact match first
  const exact = knownItems.find(k => !k._deleted && normalizeForMatch(k.name) === norm);
  if (exact) return exact;

  const tokens = norm.split(" ").filter(t => t.length > 1);
  if (!tokens.length) return null;

  let bestScore = 0;
  let bestItem: KnownItem | null = null;

  for (const item of knownItems) {
    if (item._deleted) continue;

    const kTokens = normalizeForMatch(item.name).split(" ").filter(t => t.length > 1);
    if (!kTokens.length) continue;

    // Check that numeric tokens match exactly — sizes/dimensions matter
    const inputNums = tokens.filter(hasDigit);
    const knownNums = kTokens.filter(hasDigit);

    // If both have numbers, ALL numbers in the input must appear exactly in the known item
    if (inputNums.length > 0 && knownNums.length > 0) {
      const numMismatch = inputNums.some(n => !knownNums.includes(n)) ||
                         knownNums.some(n => !inputNums.includes(n));
      if (numMismatch) continue; // Different size/dimension — skip entirely
    }

    let overlap = 0;
    for (const t of tokens) {
      if (kTokens.some(kt => kt === t)) overlap++; // Exact token match only
    }

    const score = overlap / Math.max(tokens.length, kTokens.length);
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  return bestScore >= 0.6 ? bestItem : null;
}

/**
 * Extract JSON from AI response text, handling various formats and markdown code blocks
 */
export function extractJSON(text: string): unknown {
  // Remove markdown code block fences
  let cleaned = text.replace(FENCE_RE, "");
  cleaned = cleaned.replace(/^\s*json\s*$/gm, "").trim();

  // Try parsing the cleaned text first
  try {
    return JSON.parse(cleaned);
  } catch { /* not valid JSON as-is, try extracting */ }

  // Try extracting object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch { /* not a valid JSON object */ }
  }

  // Try extracting array
  const aStart = cleaned.indexOf("[");
  const aEnd = cleaned.lastIndexOf("]");
  if (aStart !== -1 && aEnd > aStart) {
    try {
      return JSON.parse(cleaned.slice(aStart, aEnd + 1));
    } catch { /* not a valid JSON array */ }
  }

  return null;
}

/**
 * Match item name against priority list and return index.
 * CRITICAL: Uses .every() not .some() for multi-token matching.
 * Categories with "/" are treated as OR alternatives.
 */
export function matchPriority(itemName: string, priorityList: string[]): number {
  const norm = normalizeForMatch(itemName);

  for (let i = 0; i < priorityList.length; i++) {
    const raw = priorityList[i];
    const alternatives = raw.split("/").map(s => s.trim()).filter(Boolean);

    const matched = alternatives.some(alt => {
      const catTokens = normalizeForMatch(alt).split(" ").filter(t => t.length > 1);
      if (!catTokens.length) return false;

      // ALL tokens in the category must appear in the item name
      return catTokens.every(ct => norm.includes(ct));
    });

    if (matched) return i;
  }

  return priorityList.length; // Not found - goes to end
}

/**
 * Get API key from localStorage
 */
export function getApiKey(): string {
  return localStorage.getItem("aurora_api_key") || "";
}

/**
 * Set API key in localStorage
 */
export function setApiKeyVal(key: string): void {
  localStorage.setItem("aurora_api_key", key);
}

/**
 * Get API headers for Anthropic Claude API
 */
export function getApiHeaders(): Record<string, string> {
  return {
    ...API_CONFIG.headers,
    "x-api-key": getApiKey()
  };
}

/**
 * Generate unique entry ID
 */
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 5);
}