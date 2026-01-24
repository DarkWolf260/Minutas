'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function OrdenDelDiaLayout({ children }: { children: ReactNode }) {
    return (
        <FeatureErrorBoundary featureName="Orden del Día">
            {children}
        </FeatureErrorBoundary>
    );
}
