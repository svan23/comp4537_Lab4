/**
 * Lab 4 - Minimal Dictionary REST API (no external modules)
 *
 * Attribution: Assisted by ChatGPT-5 Thinking (https://chat.openai.com/).
 */

const http = require("http");
const url = require("url");
const qs = require("querystring");
const { MESSAGES } = require("./strings");
const Utils = require("./utils");

class DictionaryAPI {
  constructor() {
    this.dictionary = [];
    this.requestCount = 0;
  }

  // ---- Helper: CORS headers (for Server1 <-> Server2 cross-origin calls) ----
  setCORS(res) {
    // For the lab, allow all origins. In production, restrict to Server1 origin.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); //Allow Get,Post,Options request
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  // ---- Helper: JSON response wrapper ----
  sendJSON(res, statusCode, payload) {
    const body = JSON.stringify(payload, null, 2);
    res.writeHead(statusCode, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body); // Send the response
  }

  // ---- Helper: find word in dictionary ----
  findIndexByWord(word) {
    return this.dictionary.findIndex(
      // Find the index of the word in the dictionary, -1 if not found
      (e) => e.word.toLowerCase() === word.toLowerCase()
    );
  }

  // ---- Route: GET /api/definitions?word=book ----
  async handleGet(req, res, query) {
    const word = (query.word || "").trim();

    if (!Utils.isValidWord(word)) {
      return this.sendJSON(res, 400, {
        // Bad Request
        requestNumber: this.requestCount,
        entriesCount: this.dictionary.length,
        message: MESSAGES.INVALID_WORD,
        error: true,
      });
    }

    // Look up the word (case-insensitive), return 404 if not found
    const idx = this.findIndexByWord(word);
    if (idx === -1) {
      return this.sendJSON(res, 404, {
        requestNumber: this.requestCount,
        entriesCount: this.dictionary.length,
        message: MESSAGES.notFound(word, this.requestCount),
        error: true,
      });
    }

    return this.sendJSON(res, 200, {
      requestNumber: this.requestCount,
      entriesCount: this.dictionary.length,
      result: this.dictionary[idx],
      message: MESSAGES.found(word),
    });
  }

  // ---- Route: POST /api/definitions ----
  // Accepts JSON, x-www-form-urlencoded, or plain text "word=...&definition=..."
  async handlePost(req, res) {
    let payload;
    try {
      payload = await Utils.readJSON(req); //make the request body to json
    } catch {
      return this.sendJSON(res, 400, {
        requestNumber: this.requestCount,
        entriesCount: this.dictionary.length,
        message: MESSAGES.INVALID_JSON,
        error: true,
      });
    }

    const word = (payload.word || "").trim();
    const definition = (payload.definition || "").trim();

    // Basic input validation (non-empty strings; restrict word characters)
    if (!Utils.isValidWord(word)) {
      return this.sendJSON(res, 400, {
        //
        requestNumber: this.requestCount,
        entriesCount: this.dictionary.length,
        message: MESSAGES.INVALID_WORD,
        error: true,
      });
    }
    if (!Utils.isValidDefinition(definition)) {
      return this.sendJSON(res, 400, {
        requestNumber: this.requestCount,
        entriesCount: this.dictionary.length,
        message: MESSAGES.INVALID_DEFINITION,
        error: true,
      });
    }

    const idx = this.findIndexByWord(word);
    if (idx !== -1) {
      return this.sendJSON(res, 409, {
        requestNumber: this.requestCount,
        entriesCount: this.dictionary.length,
        message: MESSAGES.alreadyExists(word),
        existing: this.dictionary[idx],
        error: true,
      });
    }

    // Insert new entry
    const newEntry = { word, definition };
    this.dictionary.push(newEntry);

    return this.sendJSON(res, 201, {
      requestNumber: this.requestCount,
      entriesCount: this.dictionary.length,
      message: MESSAGES.created(word),
      result: newEntry,
    });
  }

  // ---- HTTP Server ----
  async handleRequest(req, res) {
    try {
      this.setCORS(res); // Enable CORS for all responses
      // Count every request we handle (OPTIONS included)
      this.requestCount += 1;

      // Parse URL and query string
      const { pathname, query } = url.parse(req.url, true);

      // Health + root info for the backend itself
      if (req.method === "GET" && pathname === "/") {
        return this.sendJSON(res, 200, {
          requestNumber: this.requestCount,
          entriesCount: this.dictionary.length,
          message: "Dictionary API is running.",
          routes: [
            { method: "GET", path: "/api/definitions?word=book" },
            { method: "POST", path: "/api/definitions" },
          ],
        });
      }

      // Preflight for CORS
      if (req.method === "OPTIONS") {
        this.setCORS(res); // Add CORS headers to the response
        res.writeHead(204);
        return res.end();
      }

      // Only handle /api/definitions
      if (pathname === "/api/definitions") {
        if (req.method === "GET") {
          return this.handleGet(req, res, query);
        }
        if (req.method === "POST") {
          return this.handlePost(req, res);
        }
        //405: in this path, Method not allowed on this resource. Allow GET, POST, OPTIONS
        res.setHeader("Allow", "GET, POST, OPTIONS");
        return this.sendJSON(res, 405, {
          requestNumber: this.requestCount,
          entriesCount: this.dictionary.length,
          message: MESSAGES.METHOD_NOT_ALLOWED,
          error: true,
        });
      }

      // Not found paths
      return this.sendJSON(res, 404, {
        requestNumber: this.requestCount,
        entriesCount: this.dictionary.length,
        message: MESSAGES.ROUTE_NOT_FOUND,
        error: true,
      });
    } catch (err) {
      // Generic error handling
      return this.sendJSON(res, 500, {
        requestNumber: this.requestCount,
        entriesCount: this.dictionary.length,
        message: MESSAGES.SERVER_ERROR,
        error: true,
        details: err?.message,
      });
    }
  }

  startServer(port = 8080) {
    const server = http.createServer(this.handleRequest.bind(this));
    server.listen(port, () => {
      console.log(`Dictionary API listening on port ${port}`);
    });
  }
}

const api = new DictionaryAPI();
api.startServer(process.env.PORT ? Number(process.env.PORT) : 8080);
