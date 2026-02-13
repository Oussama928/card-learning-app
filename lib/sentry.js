const Sentry = require("@sentry/node");

let initialized = false;

const initSentry = () => {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });

  initialized = true;
};

const captureException = (error, context) => {
  if (!process.env.SENTRY_DSN) return;
  if (!initialized) {
    initSentry();
  }
  Sentry.captureException(error, { extra: context });
};

module.exports = { initSentry, captureException };
