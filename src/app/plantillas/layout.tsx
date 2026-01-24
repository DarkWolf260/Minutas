'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function PlantillasLayout({ children }: { children: ReactNode }) {
    return (
        <FeatureErrorBoundary featureName="Plantillas">
            {children}
        </FeatureErrorBoundary>
    );
}
