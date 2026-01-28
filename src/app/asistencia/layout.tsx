'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function AsistenciaLayout({ children }: { children: ReactNode }) {
  return <FeatureErrorBoundary featureName="Asistencia">{children}</FeatureErrorBoundary>;
}
