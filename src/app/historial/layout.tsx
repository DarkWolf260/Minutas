'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function HistorialLayout({ children }: { children: ReactNode }) {
    return (
        <FeatureErrorBoundary featureName="Historial">
            {children}
        </FeatureErrorBoundary>
    );
}
