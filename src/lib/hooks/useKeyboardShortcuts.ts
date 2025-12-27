
import { useCallback, useEffect } from 'react';
import { getShortCutAction, ShorcutAction } from '../utils/keyboard-shortcuts';


interface UseKeyboardShortCutParams{
    onReset?:()=>void
    onNewPassage?:()=>void
    onCancel?:()=>void
    onStart?:()=>void
    enabled?:boolean
}

export function useKeyboardShortcuts({
  onReset,
  onNewPassage,
  onCancel,
  onStart,
  enabled = true,
}: UseKeyboardShortCutParams) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const action = getShortCutAction(event);
      if (!action) return;

      const handlers: Partial<Record<ShorcutAction, () => void>> = {
        reset: onReset,
        newPassage: onNewPassage,
        cancelTest: onCancel,
        start: onStart,
      };

      const handler = handlers[action];
      if (!handler) return;

      event.preventDefault();
      handler();
    },
    [enabled, onReset, onNewPassage, onCancel, onStart],
  );
	useEffect(() => {
		if (!enabled) return;

		globalThis.addEventListener("keydown", handleKeyDown);
		return () => globalThis.removeEventListener("keydown", handleKeyDown);
	}, [enabled, handleKeyDown]);
}

