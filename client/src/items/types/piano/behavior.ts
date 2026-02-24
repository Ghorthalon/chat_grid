import { type ItemBehavior, type ItemBehaviorDeps } from '../runtimeShared';
import { PianoController } from './runtime';

/** Creates runtime behavior hooks for piano items. */
export function createPianoBehavior(deps: ItemBehaviorDeps): ItemBehavior {
  const controller = new PianoController({
    state: deps.state,
    audio: deps.audio,
    signalingSend: deps.signalingSend,
    updateStatus: deps.updateStatus,
    openHelpViewer: deps.openHelpViewer,
  });

  const statusMessages = new Set([
    'record',
    'pause',
    'resume',
    'play',
    'stop',
    'No recording saved on this piano.',
    'Stop recording before playback.',
    'This piano is already recording.',
  ]);

  return {
    onInit: async () => {
      await controller.loadHelpFromUrl(deps.withBase('piano.json'));
      await controller.loadDemoFromUrl(deps.withBase('piano_demo.json'));
    },
    onCleanup: () => {
      controller.cleanup();
    },
    onUseResultMessage: (message) => {
      controller.onUseResultMessage(message);
      if (
        message.type === 'item_action_result' &&
        message.ok &&
        message.action === 'use' &&
        typeof message.itemId === 'string' &&
        typeof message.message === 'string' &&
        message.message.toLowerCase().includes('begin playing')
      ) {
        const item = deps.state.items.get(message.itemId);
        if (item?.type === 'piano') {
          void controller.startUseMode(item.id);
        }
      }
    },
    onActionResultStatus: (message) => {
      if (message.action !== 'use') return false;
      if (!statusMessages.has(message.message)) return false;
      deps.updateStatus(message.message);
      if (message.ok) {
        deps.audio.sfxUiBlip();
      } else {
        deps.audio.sfxUiCancel();
      }
      return true;
    },
    onPropertyPreviewChange: (item, key, value) => {
      controller.onPreviewPropertyChange(item, key, value);
    },
    onWorldUpdate: () => {
      controller.syncAfterWorldUpdate();
    },
    handleModeInput: (mode, code) => {
      if (mode !== 'pianoUse') return false;
      controller.handleModeInput(code);
      return true;
    },
    handleModeKeyUp: (mode, code) => {
      if (mode !== 'pianoUse') return false;
      controller.handleModeKeyUp(code);
      return true;
    },
    onRemotePianoNote: (message) => {
      if (message.on) {
        controller.playRemoteNote({
          itemId: message.itemId,
          senderId: message.senderId,
          keyId: message.keyId,
          midi: message.midi,
          instrument: message.instrument,
          voiceMode: message.voiceMode,
          octave: message.octave,
          attack: message.attack,
          decay: message.decay,
          release: message.release,
          brightness: message.brightness,
          x: message.x,
          y: message.y,
          emitRange: message.emitRange,
        });
      } else {
        controller.stopRemoteNote(message.senderId, message.keyId);
      }
    },
    onStopAllRemoteNotesForSender: (senderId) => {
      controller.stopAllRemoteNotesForSender(senderId);
    },
  };
}
