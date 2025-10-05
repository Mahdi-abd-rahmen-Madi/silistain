// Logger utility to handle console methods in different environments

const isProduction = import.meta.env.PROD;

type Logger = {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
};

const logger: Logger = {
  log: isProduction ? () => {} : (...args) => console.log(...args),
  warn: isProduction ? () => {} : (...args) => console.warn(...args),
  error: (...args) => console.error(...args), // Always show errors
  debug: isProduction ? () => {} : (...args) => console.debug(...args),
  info: isProduction ? () => {} : (...args) => console.info(...args),
};

export default logger;
