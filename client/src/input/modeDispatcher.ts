import type { GameMode } from '../state/gameState';

type ModeHandler = (code: string, key: string, ctrlKey: boolean) => void;

type ModeHandlers = Partial<Record<GameMode, ModeHandler>>;

type DispatchOptions = {
  mode: GameMode;
  code: string;
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  handlers: ModeHandlers;
  onNormalMode: (code: string, shiftKey: boolean) => void;
};

/**
 * Routes key input to the handler for the current game mode.
 */
export function dispatchModeInput(options: DispatchOptions): void {
  const modeHandler = options.handlers[options.mode];
  if (modeHandler) {
    modeHandler(options.code, options.key, options.ctrlKey);
    return;
  }
  options.onNormalMode(options.code, options.shiftKey);
}
