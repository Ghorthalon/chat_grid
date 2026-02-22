/**
 * High-level edit session intents derived from keyboard input.
 */
export type EditSessionAction = 'submit' | 'cancel' | null;

/**
 * Maps Enter/Escape to submit/cancel semantics for text-editing flows.
 */
export function getEditSessionAction(code: string): EditSessionAction {
  if (code === 'Enter') return 'submit';
  if (code === 'Escape') return 'cancel';
  return null;
}
