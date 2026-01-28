'use client';

import { ReactNode } from 'react';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <FeatureErrorBoundary featureName="Configuración">{children}</FeatureErrorBoundary>;
}
