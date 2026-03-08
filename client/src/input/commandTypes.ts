export type ModeInput = {
  code: string;
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
};

export type CommandDescriptor<CommandId extends string = string> = {
  id: CommandId;
  label: string;
  shortcut: string;
  tooltip: string;
  section: string;
};

/** Formats a palette/menu label as `Name: Key`. */
export function formatCommandMenuLabel(command: Pick<CommandDescriptor, 'label' | 'shortcut'>): string {
  return `${command.label}: ${command.shortcut}`;
}
