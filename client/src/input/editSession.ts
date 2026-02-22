export type EditSessionAction = 'submit' | 'cancel' | null;

export function getEditSessionAction(code: string): EditSessionAction {
  if (code === 'Enter') return 'submit';
  if (code === 'Escape') return 'cancel';
  return null;
}
