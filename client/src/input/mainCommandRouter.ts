export type MainModeCommand =
  | 'editNickname'
  | 'toggleMute'
  | 'toggleOutputMode'
  | 'toggleLoopback'
  | 'toggleVoiceLayer'
  | 'toggleItemLayer'
  | 'toggleMediaLayer'
  | 'toggleWorldLayer'
  | 'openEffectSelect'
  | 'effectValueUp'
  | 'effectValueDown'
  | 'speakCoordinates'
  | 'openMicGainEdit'
  | 'calibrateMicrophone'
  | 'useItemOrUsersSummary'
  | 'addItem'
  | 'locateOrListItems'
  | 'pickupDropOrDelete'
  | 'editOrInspectItem'
  | 'pingServer'
  | 'locateOrListUsers'
  | 'openHelp'
  | 'openChat'
  | 'chatPrev'
  | 'chatNext'
  | 'chatFirst'
  | 'chatLast'
  | 'escape';

export function resolveMainModeCommand(code: string, shiftKey: boolean): MainModeCommand | null {
  if (code === 'KeyN') return 'editNickname';
  if (code === 'KeyM') return shiftKey ? 'toggleOutputMode' : 'toggleMute';
  if (code === 'Digit1') return shiftKey ? 'toggleLoopback' : 'toggleVoiceLayer';
  if (code === 'Digit2') return 'toggleItemLayer';
  if (code === 'Digit3') return 'toggleMediaLayer';
  if (code === 'Digit4') return 'toggleWorldLayer';
  if (code === 'KeyE') return 'openEffectSelect';
  if (code === 'Equal' || code === 'NumpadAdd') return 'effectValueUp';
  if (code === 'Minus' || code === 'NumpadSubtract') return 'effectValueDown';
  if (code === 'KeyC') return 'speakCoordinates';
  if (code === 'KeyV') return shiftKey ? 'calibrateMicrophone' : 'openMicGainEdit';
  if (code === 'KeyU') return 'useItemOrUsersSummary';
  if (code === 'KeyA') return 'addItem';
  if (code === 'KeyI') return 'locateOrListItems';
  if (code === 'KeyD') return 'pickupDropOrDelete';
  if (code === 'KeyO') return 'editOrInspectItem';
  if (code === 'KeyP') return 'pingServer';
  if (code === 'KeyL') return 'locateOrListUsers';
  if (code === 'Slash') return shiftKey ? 'openHelp' : 'openChat';
  if (code === 'Comma') return shiftKey ? 'chatFirst' : 'chatPrev';
  if (code === 'Period') return shiftKey ? 'chatLast' : 'chatNext';
  if (code === 'Escape') return 'escape';
  return null;
}
