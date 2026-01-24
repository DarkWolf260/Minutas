'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function GuardiasLayout({ children }: { children: ReactNode }) {
    return (
        <FeatureErrorBoundary featureName="Guardias">
            {children}
        </FeatureErrorBoundary>
    );
}
