import { cycleIndex, findNextIndexByInitial } from './listNavigation';

/**
 * Normalized control result for list-like menus.
 */
export type ListControlResult =
  | { type: 'move'; index: number; reason: 'arrow' | 'initial' }
  | { type: 'select' }
  | { type: 'cancel' }
  | { type: 'none' };

/**
 * Applies common list key handling (arrows, first-letter jump, enter, escape).
 */
export function handleListControlKey<T>(
  code: string,
  key: string,
  entries: readonly T[],
  currentIndex: number,
  labelFor: (entry: T) => string,
): ListControlResult {
  if (entries.length === 0) return { type: 'none' };

  if (code === 'ArrowDown' || code === 'ArrowUp') {
    return {
      type: 'move',
      index: cycleIndex(currentIndex, entries.length, code === 'ArrowDown' ? 'next' : 'prev'),
      reason: 'arrow',
    };
  }

  const nextByInitial = findNextIndexByInitial(entries, currentIndex, key, labelFor);
  if (nextByInitial >= 0) {
    return { type: 'move', index: nextByInitial, reason: 'initial' };
  }

  if (code === 'Enter') return { type: 'select' };
  if (code === 'Escape') return { type: 'cancel' };
  return { type: 'none' };
}
