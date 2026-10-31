'use client';

import React from 'react';
import { PlatformProvider } from '@/context/PlatformContext';
import { AppShell } from '@/components/shell/AppShell';

export default function HomePage() {
  return (
    <PlatformProvider>
      <AppShell />
    </PlatformProvider>
  );
}
