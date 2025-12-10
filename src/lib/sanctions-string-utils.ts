/**
 * Levenshtein distance algorithm for fuzzy string matching
 * Used to compare names against sanctions lists even with typos/variations
 *
 * @license AGPL-3.0
 * @author Regulatory OS (https://regulatory-os.fr)
 */

/**
 * Calculate the Levenshtein distance between two strings
 * @param a First string
 * @param b Second string
 * @returns The edit distance between the strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalize a string for comparison
 * - Removes accents
 * - Converts to lowercase
 * - Removes special characters
 * - Sorts words alphabetically (to handle different word orders)
 * @param str String to normalize
 * @returns Normalized string
 */
function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9\s]/g, "")  // Remove special characters
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .sort()
    .join(" ");
}

/**
 * Calculate similarity percentage between two strings
 * @param s1 First string
 * @param s2 Second string
 * @returns Similarity percentage (0-100)
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeString(s1);
  const norm2 = normalizeString(s2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 100;

  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);

  if (maxLength === 0) return 100;

  const similarity = (1 - distance / maxLength) * 100;
  return Math.round(similarity);
}

/**
 * Get the best match score for a query against a name and its aliases
 * @param query Search query
 * @param name Primary name
 * @param aliases Array of alias names
 * @returns Object with score and whether it matched on name or alias
 */
export function getBestMatchScore(
  query: string,
  name: string,
  aliases: string[]
): { score: number; matchedOn: 'Name' | 'Alias' } {
  const nameScore = calculateSimilarity(query, name);

  let maxAliasScore = 0;
  if (aliases && aliases.length > 0) {
    maxAliasScore = Math.max(
      ...aliases.map(alias => calculateSimilarity(query, alias))
    );
  }

  const finalScore = Math.max(nameScore, maxAliasScore);
  const matchedOn: 'Name' | 'Alias' = maxAliasScore > nameScore ? 'Alias' : 'Name';

  return { score: finalScore, matchedOn };
}
