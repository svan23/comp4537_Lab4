/**
 * Small helper utilities for the API.
 */

/**
 * Read request body and parse as JSON.
 * Assumes JSON-only requests.
 */
function readJSON(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e); // caller can send a 400 "Bad JSON"
      }
    });
    req.on("error", reject);
  });
}

/**
 * Accepts letters, spaces, hyphens, apostrophes. Must start with a letter.
 * Examples: "book", "ice cream", "mother-in-law", "O'Reilly"
 */
function isValidWord(s) {
  if (typeof s !== "string") return false;
  const trimmed = s.trim();
  if (!trimmed) return false;
  return /^[A-Za-z][A-Za-z\s\-']*$/.test(trimmed); //to ensure the string is letters.
}

/**
 * Definition must be a non-empty string.
 * Looser check than word: allow punctuation, numbers, etc., but not empty.
 */
function isValidDefinition(s) {
  if (typeof s !== "string") return false;
  return s.trim().length > 0;
}

module.exports = { readJSON, isValidWord, isValidDefinition };
