/**
 * @deprecated Use SystemStatusBar API instead.
 * Compatibility layer to avoid breaking call sites while migrating to useSystemStatus.
 */

import React from 'react';

import {
  SystemStatusProvider,
  type SystemStatusType,
  useSystemStatus,
} from './system-status-bar';

export type ToastType = SystemStatusType;

type ToastContextValue = {
  show: (message: string, options?: { type?: ToastType; replaceVisible?: boolean }) => void;
};

export function useToast(): ToastContextValue {
  return useSystemStatus();
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <SystemStatusProvider>{children}</SystemStatusProvider>;
}
