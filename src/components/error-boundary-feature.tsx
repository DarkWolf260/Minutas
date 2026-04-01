'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  featureName: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Feature-level error boundary component
 *
 * Catches React errors in a specific feature and displays a user-friendly
 * error message with the ability to retry.
 *
 * @example
 * ```tsx
 * <FeatureErrorBoundary featureName="Personal">
 *   <PersonnelPage />
 * </FeatureErrorBoundary>
 * ```
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    logger.error(`Error in ${this.props.featureName}`, error, {
      feature: this.props.featureName,
      action: 'render',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });

    // ✅ Send to Sentry via error handler
    import('@/lib/error-handler').then(({ logError }) => {
      logError(error, 'error', {
        feature: this.props.featureName,
        action: 'render',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      });
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error en {this.props.featureName}</h3>
            <p className="text-muted-foreground mb-4">
              Ocurrió un error inesperado. Por favor, intenta de nuevo.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <div className="mb-4 p-3 bg-muted rounded-md text-left">
                <p className="text-xs font-mono text-destructive break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={this.resetError} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Recargar Página
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
