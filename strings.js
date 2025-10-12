/**
 * User-facing strings kept separate (avoid -2 penalty).
 * Keep messages short and clear for the lab UI.
 */

const MESSAGES = {
  INVALID_WORD:
    "Invalid 'word'. Use non-empty alphabetic text (letters/spaces/-, no numbers).",
  INVALID_DEFINITION:
    "Invalid 'definition'. Provide a non-empty string (letters/punctuation allowed).",
  METHOD_NOT_ALLOWED: "Method not allowed for this endpoint.",
  ROUTE_NOT_FOUND: "Route not found.",
  SERVER_ERROR: "Internal server error.",
  BODY_TOO_LARGE: "Request body too large. Max ~1MB.",

  created: (w) => `New entry recorded: "${w}"`,
  alreadyExists: (w) => `Warning! "${w}" already exists.`,
  notFound: (w, n) => `Request #${n}: word "${w}" not found!`,
  found: (w) => `Definition found for "${w}".`,
};

module.exports = { MESSAGES };
