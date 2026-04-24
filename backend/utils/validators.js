/**
 * Input validation utilities for BFHL API
 */

const EDGE_PATTERN = /^[A-Z]->[A-Z]$/;
const MAX_INPUT_SIZE = 50;

/**
 * Validates a single raw entry from the data array.
 * @param {*} rawItem - The raw item from the input array
 * @returns {{ valid: boolean, trimmed?: string, parent?: string, child?: string }}
 */
function validateEntry(rawItem) {
  if (typeof rawItem !== 'string') {
    return { valid: false };
  }
  const trimmed = rawItem.trim();
  if (!EDGE_PATTERN.test(trimmed)) {
    return { valid: false };
  }
  // Self-loop check
  if (trimmed[0] === trimmed[3]) {
    return { valid: false };
  }
  return { valid: true, trimmed, parent: trimmed[0], child: trimmed[3] };
}

/**
 * Validates the request payload structure.
 * @param {object} body - The request body
 * @returns {{ valid: boolean, error?: string, data?: string[] }}
 */
function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }
  const { data } = body;
  if (!Array.isArray(data)) {
    return { valid: false, error: "'data' must be an array." };
  }
  if (data.length > MAX_INPUT_SIZE) {
    return { valid: false, error: `Input exceeds maximum of ${MAX_INPUT_SIZE} entries.` };
  }
  return { valid: true, data };
}

module.exports = { validateEntry, validatePayload, EDGE_PATTERN, MAX_INPUT_SIZE };
