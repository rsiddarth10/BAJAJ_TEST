const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const bfhlRoutes = require('./routes/bfhlRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));

// Rate limiter: 100 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Swagger Docs (CDN-based, Express 5 compatible) ───────
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'BFHL API',
    version: '1.0.0',
    description: 'SRM Full Stack Engineering Challenge — Hierarchy Parser API',
  },
  servers: [{ url: '/' }],
  paths: {
    '/bfhl': {
      post: {
        summary: 'Process hierarchical node relationships',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['data'],
                properties: {
                  data: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['A->B', 'A->C', 'B->D'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Successful analysis result' },
          400: { description: 'Invalid input' },
          500: { description: 'Internal server error' },
        },
      },
    },
  },
};

app.get('/api-docs/spec.json', (req, res) => {
  res.json(swaggerSpec);
});

app.get('/api-docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BFHL API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: '/api-docs/spec.json', dom_id: '#swagger-ui' });
  </script>
</body>
</html>`);
});

// ── Routes ───────────────────────────────────────────────
app.use('/', bfhlRoutes);

// ── Error Handling ───────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend API live on port ${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
