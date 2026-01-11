import { profanity } from "@2toad/profanity";

// Configure profanity filter options
profanity.options.wholeWord = true; // Only match whole words to reduce false positives
profanity.options.grawlix = "*****"; // Replacement character

/**
 * Check if text contains profanity
 * @param text - The text to check
 * @returns true if text contains profanity, false otherwise
 */
export function containsProfanity(text: string | undefined): boolean {
  if (!text) {
    return false;
  }

  return profanity.exists(text);
}

/**
 * Check if any field in an object contains profanity
 * @param obj - Object with string fields to check
 * @returns true if any field contains profanity
 */
export function containsProfanityInFields(obj: Record<string, string | undefined>): boolean {
  return Object.values(obj).some((value) => containsProfanity(value));
}

/**
 * Censor profanity in text
 * @param text - The text to censor
 * @returns Censored text with profanity replaced
 */
export function censorProfanity(text: string): string {
  return profanity.censor(text);
}
