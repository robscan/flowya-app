/**
 * SearchFloating — Router por plataforma.
 * Web: overlay modal (SearchOverlayWeb). Native: sheet con drag (SearchFloatingNative).
 */

import { Platform } from 'react-native';
import { SearchFloatingNative } from './SearchFloatingNative';
import { SearchOverlayWeb } from './SearchOverlayWeb';
import type { SearchFloatingProps } from './types';

export function SearchFloating<T>(props: SearchFloatingProps<T>) {
  if (Platform.OS === 'web') {
    return <SearchOverlayWeb<T> {...props} />;
  }
  return <SearchFloatingNative<T> {...props} />;
}
