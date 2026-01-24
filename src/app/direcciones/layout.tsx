'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function DireccionesLayout({ children }: { children: ReactNode }) {
    return (
        <FeatureErrorBoundary featureName="Direcciones">
            {children}
        </FeatureErrorBoundary>
    );
}
