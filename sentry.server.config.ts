import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set environment
    environment: process.env.NODE_ENV || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    beforeSend(event, hint) {
        // Filter out non-error events in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Sentry Server] Event:', event);
        }

        // Don't send events from localhost in development
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
            return null;
        }

        return event;
    },
});
