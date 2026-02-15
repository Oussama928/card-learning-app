const { createServer } = require('http');
const { parse } = require('url');
const helmet = require('helmet');
const cors = require('cors');
const next = require('next');
const { initSocketServer } = require('./lib/socketServer');
const db = require('./lib/db');
const { env } = require('./lib/env');
const logger = require('./lib/logger');
const { initSentry, captureException } = require('./lib/sentry');

const dev = process.env.NODE_ENV !== 'production';
const hostname = env.host;
const port = env.port;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
let server;

const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});

const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
});

const runMiddleware = (middleware, req, res) => {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
};

initSentry();

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }

    await db.end();
    console.log('Shutdown complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// process.on('SIGINT', () => {
//   void shutdown('SIGINT');
// });

// process.on('SIGTERM', () => {
//   void shutdown('SIGTERM');
// });

app.prepare().then(() => {
  server = createServer(async (req, res) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info('http_request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration_ms: Date.now() - start,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });
    });

    try {
      await runMiddleware(corsMiddleware, req, res);
      await runMiddleware(helmetMiddleware, req, res);

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error('request_error', { message: err?.message, stack: err?.stack });
      captureException(err, { url: req.url, method: req.method });
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.IO
  initSocketServer(server);

  server.listen(port, () => {
    logger.info('server_ready', { url: `http://${hostname}:${port}` });
    logger.info('socket_ready', { url: `ws://${hostname}:${port}/api/socket` });
  });
});
