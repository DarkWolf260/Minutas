'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function ReportesLayout({ children }: { children: ReactNode }) {
  return <FeatureErrorBoundary featureName="Reportes">{children}</FeatureErrorBoundary>;
}
