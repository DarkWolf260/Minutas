/**
 * Centralized error logging utility
 * 
 * Provides consistent error logging across the application with support
 * for different severity levels and optional error tracking service integration.
 */

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorContext {
    feature?: string;
    userId?: string;
    action?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Log an error with context
 * 
 * @param error - The error to log
 * @param severity - Error severity level
 * @param context - Additional context about the error
 * 
 * @example
 * ```ts
 * logError(new Error('Failed to save'), 'error', {
 *   feature: 'Personnel',
 *   action: 'save',
 *   metadata: { personnelId: '123' }
 * });
 * ```
 */
export function logError(
    error: Error | unknown,
    severity: ErrorSeverity = 'error',
    context?: ErrorContext
) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Console logging with severity-based styling
    const logMethod = severity === 'critical' || severity === 'error'
        ? console.error
        : severity === 'warning'
            ? console.warn
            : console.log;

    logMethod(
        `[${severity.toUpperCase()}]${context?.feature ? ` [${context.feature}]` : ''}:`,
        errorMessage,
        {
            stack: errorStack,
            context,
            timestamp: new Date().toISOString(),
        }
    );

    // TODO: Send to error tracking service
    // if (process.env.NODE_ENV === 'production') {
    //   sendToSentry({ error, severity, context });
    // }
}

/**
 * Log operation errors (localStorage, network, etc.)
 * 
 * @param operation - The operation that failed
 * @param error - The error that occurred
 * @param context - Additional context
 */
export function logOperationError(
    operation: string,
    error: unknown,
    context?: ErrorContext
) {
    logError(error, 'error', {
        ...context,
        action: operation,
    });
}

/**
 * Check if error is a QuotaExceededError
 */
export function isQuotaExceededError(error: unknown): boolean {
    return (
        error instanceof Error &&
        (error.name === 'QuotaExceededError' ||
            error.message.includes('quota') ||
            error.message.includes('storage'))
    );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
    if (isQuotaExceededError(error)) {
        return 'Almacenamiento lleno. Por favor, elimina algunos datos antiguos.';
    }

    if (error instanceof Error) {
        // Map known errors to user-friendly messages
        const knownErrors: Record<string, string> = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'Failed to fetch': 'No se pudo cargar la información. Intenta de nuevo.',
        };

        return knownErrors[error.message] || 'Ocurrió un error inesperado.';
    }

    return 'Ocurrió un error inesperado.';
}
