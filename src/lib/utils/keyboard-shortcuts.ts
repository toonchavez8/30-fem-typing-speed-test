export const KEYBOARD_SHORTCUTS = {
	START_TEST: { ctrlKey: false, key: "enter", description: "Start Test" },
	RESET_TEST: { ctrlKey: true, key: "r", description: "Reset Test" },
	NEW_PASSAGE: { ctrlKey: true, key: "n", description: "New Passage" },
	CANCEL_TEST: { ctrlKey: true, key: "c", description: "Cancel Test" },
} as const;

export type ShorcutAction = "start" | "reset" | "newPassage" | "cancelTest";

// check if keyboard event matches a shortcut

export function matchesShortcut(
	event: KeyboardEvent,
	shortcut: (typeof KEYBOARD_SHORTCUTS)[keyof typeof KEYBOARD_SHORTCUTS],
): boolean {
	const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
	const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;

	return keyMatches && ctrlMatches;
}

export function getShortCutAction(event: KeyboardEvent): ShorcutAction | null {
	switch (true) {
		case matchesShortcut(event, KEYBOARD_SHORTCUTS.START_TEST):
			return "start";

		case matchesShortcut(event, KEYBOARD_SHORTCUTS.RESET_TEST):
			return "reset";

		case matchesShortcut(event, KEYBOARD_SHORTCUTS.NEW_PASSAGE):
			return "newPassage";

		case matchesShortcut(event, KEYBOARD_SHORTCUTS.CANCEL_TEST):
			return "cancelTest";

		default:
			return null;
	}
}
