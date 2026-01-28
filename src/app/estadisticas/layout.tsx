'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function EstadisticasLayout({ children }: { children: ReactNode }) {
  return <FeatureErrorBoundary featureName="Estadísticas">{children}</FeatureErrorBoundary>;
}
