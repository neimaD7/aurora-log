import { StorageResult, WindowStorage, StorageKey } from './types';
import { getApiKey, setApiKeyVal } from './utils';

/**
 * Storage wrapper that mirrors window.storage functionality.
 * All keys are prefixed with "aurora_log_" and automatically backed up.
 */
export const storage: WindowStorage = {
  async get(key: string): Promise<StorageResult> {
    const fullKey = "aurora_log_" + key;
    const value = localStorage.getItem(fullKey);
    if (value === null) {
      throw new Error("Not found");
    }
    return { key, value };
  },

  async set(key: string, value: string): Promise<StorageResult> {
    const fullKey = "aurora_log_" + key;

    // Set main value
    localStorage.setItem(fullKey, value);

    // Create backup (fail silently if storage full)
    try {
      localStorage.setItem(fullKey + "_backup", value);
    } catch {
      // Storage quota exceeded - backup creation failed but main storage succeeded
    }

    return { key, value };
  }
};

/**
 * Helper functions for common storage operations
 */

/**
 * Get and parse JSON data from storage
 */
export async function getStorageData<T>(key: StorageKey, defaultValue: T): Promise<T> {
  try {
    const result = await storage.get(key);
    return JSON.parse(result.value);
  } catch {
    return defaultValue;
  }
}

/**
 * Set JSON data to storage
 */
export async function setStorageData(key: StorageKey, data: unknown): Promise<void> {
  try {
    await storage.set(key, JSON.stringify(data));
  } catch(e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

/**
 * API key management functions (not prefixed, separate from main storage)
 */
export { getApiKey, setApiKeyVal };

/**
 * Initialize window.storage for global access (used by failsafe system)
 */
export function initWindowStorage(): void {
  window.storage = storage;
}

/**
 * Storage validation keys used by failsafe system
 */
export const STORAGE_KEYS = [
  "aurora_log_entries",
  "aurora_log_known_items",
  "aurora_log_upcoming",
  "aurora_log_pull_queue",
  "aurora_log_pull_priority"
] as const;