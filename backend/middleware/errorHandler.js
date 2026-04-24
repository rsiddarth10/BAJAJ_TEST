/**
 * Centralized error handling middleware.
 */

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err.message || err);
  res.status(500).json({ error: 'Internal Server Error' });
}

module.exports = { notFoundHandler, errorHandler };
