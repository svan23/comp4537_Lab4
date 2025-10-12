/**
 * Small helper utilities for the API.
 */

const MAX_BODY_BYTES = 1 * 1024 * 1024; // ~1MB cap to avoid abuse

/**
 * Read full request body as UTF-8 string.
 * Works for JSON or x-www-form-urlencoded or raw text.
 */
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("BODY_TOO_LARGE"));
        req.destroy(); // stop reading
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      resolve(raw);
    });

    req.on("error", (err) => reject(err));
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
  return /^[A-Za-z][A-Za-z\s\-']*$/.test(trimmed);
}

/**
 * Definition must be a non-empty string.
 * Looser check than word: allow punctuation, numbers, etc., but not empty.
 */
function isValidDefinition(s) {
  if (typeof s !== "string") return false;
  return s.trim().length > 0;
}

module.exports = { readRequestBody, isValidWord, isValidDefinition };
