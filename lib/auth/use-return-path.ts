'use client';
import { useSyncExternalStore } from 'react';
import { returnPathFromSearch } from './return-path';
const subscribe = (callback: () => void) => {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
};
export const useReturnPath = () => useSyncExternalStore(subscribe, () => returnPathFromSearch(window.location.search), () => '/');
