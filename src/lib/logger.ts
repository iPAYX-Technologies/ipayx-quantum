/**
 * Logging utility for production-safe console output
 * Only logs in development mode to keep production console clean
 */
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) console.log(...args);
  },
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  info: (...args: any[]) => {
    if (import.meta.env.DEV) console.info(...args);
  }
};

// Export standalone log function for convenience
export function log(...args: any[]) {
  if (import.meta.env.DEV) console.log(...args);
}
