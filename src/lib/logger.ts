/**
 * Production-ready logging utility
 * Automatically removes logs in production, keeps error/warn for debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = import.meta.env.DEV;

class Logger {
  private log(level: LogLevel, message: string, ...args: unknown[]) {
    // In production, only allow warn and error
    if (!isDevelopment && (level === 'debug' || level === 'info')) {
      return;
    }

    // Support log level override via URL in development
    if (isDevelopment && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const forceLevel = params.get('logLevel') as LogLevel | null;
      if (forceLevel && level === 'debug' && forceLevel !== 'debug') {
        // Simple filter logic: if logLevel is set, don't show debug unless explicitly asked
        return;
      }
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      default:
        // Development only
        if (isDevelopment) {
          console.log(prefix, message, ...args);
        }
    }
  }

  debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, error?: unknown, ...args: unknown[]) {
    // If it looks like a ZodError (has .issues), log those issues clearly
    const isZodError = error && typeof error === 'object' && 'issues' in error && Array.isArray((error as any).issues);

    if (error instanceof Error) {
      const errorData: any = { 
        error: error.message, 
        stack: isDevelopment ? error.stack : undefined 
      };
      
      if (isZodError) {
        errorData.issues = (error as any).issues;
      }

      this.log('error', message, errorData, ...args);
    } else if (error && typeof error === 'object') {
      // For plain objects, ensure they are logged in a way that doesn't just show [object Object]
      // console.error handles this in most browsers, but we can be more explicit for development logs
      this.log('error', message, error, ...args);
    } else {
      this.log('error', message, error, ...args);
    }
  }
}

export const logger = new Logger();
