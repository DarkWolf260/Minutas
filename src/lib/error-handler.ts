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
  const logMethod =
    severity === 'critical' || severity === 'error'
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

}

/**
 * Log operation errors (localStorage, network, etc.)
 *
 * @param operation - The operation that failed
 * @param error - The error that occurred
 * @param context - Additional context
 */
export function logOperationError(operation: string, error: unknown, context?: ErrorContext) {
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
    return 'Almacenamiento lleno. Por favor, elimina algunos reportes antiguos para liberar espacio.';
  }

  if (error instanceof Error) {
    // Map known errors to user-friendly messages with actionable suggestions
    const knownErrors: Record<string, string> = {
      'Network request failed': 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
      'Failed to fetch': 'No se pudo cargar la información. Revisa tu conexión e intenta de nuevo.',
      'localStorage is not available': 'El almacenamiento local no está disponible. Verifica la configuración de tu navegador.',
      'QuotaExceededError': 'Almacenamiento lleno. Elimina algunos datos antiguos para continuar.',
      'NetworkError': 'Error de red. Verifica tu conexión a internet.',
      'TypeError': 'Error de datos. Por favor, recarga la página e intenta nuevamente.',
      'Failed to parse': 'Los datos están corruptos. Por favor, contacta al soporte técnico.',
      'Permission denied': 'Permiso denegado. Verifica que no estés en modo incógnito.',
      'Duplicate key': 'Este registro ya existe. Verifica los datos ingresados.',
      'Invalid data': 'Datos inválidos. Por favor, revisa la información ingresada.',
    };

    // Check for partial matches in error message
    for (const [key, message] of Object.entries(knownErrors)) {
      if (error.message.includes(key)) {
        return message;
      }
    }

    // For RxDB errors, provide context
    if (error.message.includes('RxDB')) {
      return 'Error de base de datos. Por favor, recarga la página. Si el problema persiste, contacta al soporte.';
    }

    // For validation errors
    if (error.message.includes('validation') || error.message.includes('required')) {
      return 'Los datos ingresados no son válidos. Verifica que todos los campos requeridos estén completos.';
    }

    // Generic fallback with the actual error for debugging context
    if (import.meta.env.DEV) {
      return `Error: ${error.message}`;
    }
  }

  return 'Ocurrió un error inesperado. Por favor, intenta nuevamente o contacta al soporte.';
}
