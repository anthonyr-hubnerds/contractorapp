/* eslint-disable no-console */
// Small logging wrapper so ESLint `no-console` rule doesn't trigger throughout the codebase.
// Keeps behavior identical for now but centralizes logging and makes it easy to swap
// to a real logger (winston/pino) later.
const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: unknown[]) => {
    if (!isTest) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (!isTest) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // always show errors, even in test logs
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev && !isTest) console.debug(...args);
  }
};

export default logger;
