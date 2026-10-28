const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({ level: 'INFO', time: formatTimestamp(), message, ...meta }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'WARN', time: formatTimestamp(), message, ...meta }));
  },
  error: (message, error = {}) => {
    const errorDetails = error instanceof Error 
      ? { errorMessage: error.message, stack: error.stack }
      : { error };
    console.error(JSON.stringify({ level: 'ERROR', time: formatTimestamp(), message, ...errorDetails }));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({ level: 'DEBUG', time: formatTimestamp(), message, ...meta }));
    }
  }
};
