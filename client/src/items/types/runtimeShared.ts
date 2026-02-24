import { type IncomingMessage, type OutgoingMessage } from '../../network/protocol';
import { type GameMode, type WorldItem } from '../../state/gameState';

/** Shared dependencies made available to all client item behavior modules. */
export type ItemBehaviorDeps = {
  state: {
    mode: GameMode;
    items: Map<string, WorldItem>;
    player: { id: string | null; x: number; y: number };
  };
  audio: {
    ensureContext: () => Promise<void>;
    context: AudioContext | null;
    getOutputDestinationNode: () => AudioNode | null;
    sfxUiBlip: () => void;
    sfxUiCancel: () => void;
  };
  signalingSend: (message: OutgoingMessage) => void;
  updateStatus: (message: string) => void;
  openHelpViewer: (lines: string[], returnMode: GameMode) => void;
  withBase: (path: string) => string;
};

/** Optional per-item behavior hooks used by the client runtime. */
export type ItemBehavior = {
  onInit?: () => void | Promise<void>;
  onCleanup?: () => void;
  onUseResultMessage?: (message: IncomingMessage) => void;
  onActionResultStatus?: (message: Extract<IncomingMessage, { type: 'item_action_result' }>) => boolean;
  onPropertyPreviewChange?: (item: WorldItem, key: string, value: unknown) => void;
  onWorldUpdate?: () => void;
  handleModeInput?: (mode: GameMode, code: string) => boolean;
  handleModeKeyUp?: (mode: GameMode, code: string) => boolean;
  onRemotePianoNote?: (message: Extract<IncomingMessage, { type: 'item_piano_note' }>) => void;
  onStopAllRemoteNotesForSender?: (senderId: string) => void;
};
