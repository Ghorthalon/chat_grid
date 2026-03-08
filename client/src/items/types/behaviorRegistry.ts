import { type IncomingMessage } from '../../network/protocol';
import { type GameMode, type WorldItem } from '../../state/gameState';
import { type CommandDescriptor, type ModeInput } from '../../input/commandTypes';
import { createPianoBehavior } from './piano/behavior';
import { type ItemBehavior, type ItemBehaviorDeps } from './runtimeShared';

/** Runtime registry that composes all per-item client behavior modules. */
export class ItemBehaviorRegistry {
  private readonly behaviors: ItemBehavior[];

  constructor(deps: ItemBehaviorDeps) {
    this.behaviors = [createPianoBehavior(deps)];
  }

  /** Runs per-item initialization hooks after app bootstrap. */
  async initialize(): Promise<void> {
    for (const behavior of this.behaviors) {
      await behavior.onInit?.();
    }
  }

  /** Runs all per-item teardown hooks during disconnect/reset flows. */
  cleanup(): void {
    for (const behavior of this.behaviors) {
      behavior.onCleanup?.();
    }
  }

  /** Forwards incoming messages to behavior-specific use-result hooks. */
  onUseResultMessage(message: IncomingMessage): void {
    for (const behavior of this.behaviors) {
      behavior.onUseResultMessage?.(message);
    }
  }

  /** Lets item behaviors consume custom action-result status handling. */
  onActionResultStatus(message: Extract<IncomingMessage, { type: 'item_action_result' }>): boolean {
    for (const behavior of this.behaviors) {
      if (behavior.onActionResultStatus?.(message)) {
        return true;
      }
    }
    return false;
  }

  /** Runs per-item world-update hooks after state changes. */
  onWorldUpdate(): void {
    for (const behavior of this.behaviors) {
      behavior.onWorldUpdate?.();
    }
  }

  /** Routes property preview changes into per-item behavior hooks. */
  onPropertyPreviewChange(item: WorldItem, key: string, value: unknown): void {
    for (const behavior of this.behaviors) {
      behavior.onPropertyPreviewChange?.(item, key, value);
    }
  }

  /** Gives item behaviors first chance to handle mode input. */
  handleModeInput(mode: GameMode, input: ModeInput): boolean {
    for (const behavior of this.behaviors) {
      if (behavior.handleModeInput?.(mode, input)) {
        return true;
      }
    }
    return false;
  }

  /** Gives item behaviors first chance to handle mode key-up events. */
  handleModeKeyUp(mode: GameMode, input: Pick<ModeInput, 'code' | 'shiftKey'>): boolean {
    for (const behavior of this.behaviors) {
      if (behavior.handleModeKeyUp?.(mode, input)) {
        return true;
      }
    }
    return false;
  }

  /** Returns palette-visible commands for the active item-owned mode, if any. */
  getModeCommands(mode: GameMode): CommandDescriptor[] {
    const commands: CommandDescriptor[] = [];
    for (const behavior of this.behaviors) {
      const next = behavior.getModeCommands?.(mode);
      if (next && next.length > 0) {
        commands.push(...next);
      }
    }
    return commands;
  }

  /** Runs an item-owned mode command by id, returning true when handled. */
  runModeCommand(mode: GameMode, commandId: string): boolean {
    for (const behavior of this.behaviors) {
      if (behavior.runModeCommand?.(mode, commandId)) {
        return true;
      }
    }
    return false;
  }

  /** Routes incoming item-piano-note packets to the item behavior owning that protocol. */
  onRemotePianoNote(message: Extract<IncomingMessage, { type: 'item_piano_note' }>): void {
    for (const behavior of this.behaviors) {
      behavior.onRemotePianoNote?.(message);
    }
  }

  /** Routes incoming item-piano-status packets to behavior modules that track piano runtime state. */
  onPianoStatus(message: Extract<IncomingMessage, { type: 'item_piano_status' }>): void {
    for (const behavior of this.behaviors) {
      behavior.onPianoStatus?.(message);
    }
  }

  /** Stops all remote notes for one sender across behavior modules that own remote note runtimes. */
  stopAllRemoteNotesForSender(senderId: string): void {
    for (const behavior of this.behaviors) {
      behavior.onStopAllRemoteNotesForSender?.(senderId);
    }
  }
}
