/**
 * Lab 4 - Minimal Dictionary REST API (no external modules)
 * Technology: Node.js built-ins only (http, url, querystring)
 *
 * Attribution: Assisted by ChatGPT-5 Thinking (https://chat.openai.com/).
 */

const http = require("http");
const url = require("url");
const qs = require("querystring");
const { MESSAGES } = require("./strings");
const { readRequestBody, isValidWord, isValidDefinition } = require("./utils");

// ===== In-memory storage =====
// Required variable name: `dictionary` (array of { word, definition })
let dictionary = [];
let requestCount = 0; // total number of requests served (all methods/paths)

// ---- Helper: CORS headers (for Server1 <-> Server2 cross-origin calls) ----
function setCORS(res) {
  // For the lab, allow all origins. In production, restrict to Server1 origin.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ---- Helper: JSON response wrapper ----
function sendJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// ---- Helper: find entry index (case-insensitive word match) ----
function findIndexByWord(word) {
  return dictionary.findIndex(
    (e) => e.word.toLowerCase() === word.toLowerCase()
  );
}

// ---- Route: GET /api/definitions?word=book ----
async function handleGet(req, res, query) {
  const word = (query.word || "").trim();

  if (!isValidWord(word)) {
    return sendJSON(res, 400, {
      requestNumber: requestCount,
      entriesCount: dictionary.length,
      message: MESSAGES.INVALID_WORD,
      error: true,
    });
  }

  const idx = findIndexByWord(word);
  if (idx === -1) {
    return sendJSON(res, 404, {
      requestNumber: requestCount,
      entriesCount: dictionary.length,
      message: MESSAGES.notFound(word, requestCount),
      error: true,
    });
  }

  return sendJSON(res, 200, {
    requestNumber: requestCount,
    entriesCount: dictionary.length,
    result: dictionary[idx],
    message: MESSAGES.found(word),
  });
}

// ---- Route: POST /api/definitions ----
// Accepts JSON, x-www-form-urlencoded, or plain text "word=...&definition=..."
async function handlePost(req, res) {
  let parsed = {};
  try {
    const raw = await readRequestBody(req);

    // Try JSON first
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: try querystring parsing
      parsed = qs.parse(raw);
    }
  } catch (e) {
    return sendJSON(res, 413, {
      requestNumber: requestCount,
      entriesCount: dictionary.length,
      message: MESSAGES.BODY_TOO_LARGE,
      error: true,
    });
  }

  const word = (parsed.word || "").trim();
  const definition = (parsed.definition || "").trim();

  // Basic input validation (non-empty strings; restrict word characters)
  if (!isValidWord(word)) {
    return sendJSON(res, 400, {
      requestNumber: requestCount,
      entriesCount: dictionary.length,
      message: MESSAGES.INVALID_WORD,
      error: true,
    });
  }
  if (!isValidDefinition(definition)) {
    return sendJSON(res, 400, {
      requestNumber: requestCount,
      entriesCount: dictionary.length,
      message: MESSAGES.INVALID_DEFINITION,
      error: true,
    });
  }

  const idx = findIndexByWord(word);
  if (idx !== -1) {
    return sendJSON(res, 409, {
      requestNumber: requestCount,
      entriesCount: dictionary.length,
      message: MESSAGES.alreadyExists(word),
      existing: dictionary[idx],
      error: true,
    });
  }

  // Insert new entry
  const newEntry = { word, definition };
  dictionary.push(newEntry);

  return sendJSON(res, 201, {
    requestNumber: requestCount,
    entriesCount: dictionary.length,
    message: MESSAGES.created(word),
    result: newEntry,
  });
}

// ---- HTTP Server ----
const server = http.createServer(async (req, res) => {
  try {
    setCORS(res);
    // Count every request we handle (OPTIONS included)
    requestCount += 1;

    const { pathname, query } = url.parse(req.url, true);

    // Health + root
    if (req.method === "GET" && pathname === "/") {
      return sendJSON(res, 200, {
        requestNumber: requestCount,
        entriesCount: dictionary.length,
        message: "Dictionary API is running.",
        routes: [
          { method: "GET", path: "/api/definitions?word=book" },
          { method: "POST", path: "/api/definitions" },
        ],
      });
    }

    // Preflight for CORS
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    // Only handle /api/definitions
    if (pathname === "/api/definitions") {
      if (req.method === "GET") {
        return handleGet(req, res, query);
      }
      if (req.method === "POST") {
        return handlePost(req, res);
      }
      // Method not allowed on this resource
      res.setHeader("Allow", "GET, POST, OPTIONS");
      return sendJSON(res, 405, {
        requestNumber: requestCount,
        entriesCount: dictionary.length,
        message: MESSAGES.METHOD_NOT_ALLOWED,
        error: true,
      });
    }

    // Not found
    return sendJSON(res, 404, {
      requestNumber: requestCount,
      entriesCount: dictionary.length,
      message: MESSAGES.ROUTE_NOT_FOUND,
      error: true,
    });
  } catch (err) {
    // Generic error handling
    return sendJSON(res, 500, {
      requestNumber: requestCount,
      entriesCount: dictionary.length,
      message: MESSAGES.SERVER_ERROR,
      error: true,
      details: err?.message,
    });
  }
});

// Port from env or 8080 by default (works on most hosts)
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
server.listen(PORT, () => {
  // Log so you can see it in hosting provider logs
  console.log(`Dictionary API listening on port ${PORT}`);
});
