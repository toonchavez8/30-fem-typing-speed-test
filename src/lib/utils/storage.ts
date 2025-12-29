const STORAGE_KEY_PREFIX = "typing-test-";

function isBrowser(): boolean {
	return globalThis.window !== undefined;
}
export function getLocalStorage<T>(key: string, defaultValue: T): T {
	if (!isBrowser()) return defaultValue;

	try {
		const item = globalThis.localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
		return item ? JSON.parse(item) : defaultValue;
	} catch (error) {
		console.error(`Error reading localStorage key "${key}":`, error);
		return defaultValue;
	}
}

export function setLocalStorage<T>(key: string, value: T): void {
	if (!isBrowser()) return;

	try {
		globalThis.localStorage.setItem(
			`${STORAGE_KEY_PREFIX}${key}`,
			JSON.stringify(value),
		);
	} catch (error) {
		console.error(`Error setting localStorage key "${key}":`, error);
	}
}

export function removeLocalStorage(key: string): void {
	if (!isBrowser()) return;

	try {
		globalThis.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
	} catch (error) {
		console.error(`Error removing localStorage key "${key}":`, error);
	}
}

export function clearAppStorage(): void {
	if (!isBrowser()) return;

	try {
		const keys = Object.keys(globalThis.localStorage);
		for (const key of keys) {
			if (key.startsWith(STORAGE_KEY_PREFIX)) {
				globalThis.localStorage.removeItem(key);
			}
		}
	} catch (error) {
		console.error("Error clearing app storage:", error);
	}
}
