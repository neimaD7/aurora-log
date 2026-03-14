// Pre-React localStorage validator and corruption detector
// This module runs BEFORE React and must be plain JavaScript compatible

import { STORAGE_KEYS } from '../storage';

/**
 * Validate localStorage data and attempt auto-recovery from corruption.
 * Must run before React starts to prevent data loss.
 * Sets window._dataLost flag if critical data cannot be recovered.
 */
export function validateStorage(): void {
  window._dataLost = false;

  STORAGE_KEYS.forEach(function(key) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        JSON.parse(value); // Test if JSON is valid
      }
    } catch {
      console.warn('Storage corruption detected for key:', key);

      // Save corrupted data as backup
      try {
        const corruptedData = localStorage.getItem(key);
        if (corruptedData) {
          localStorage.setItem(key + "_corrupted_backup", corruptedData);
        }
      } catch(backupError) {
        console.error('Failed to save corrupted backup:', backupError);
      }

      // Remove corrupted key
      localStorage.removeItem(key);

      // Attempt restore from backup
      const backupKey = key + "_backup";
      const backup = localStorage.getItem(backupKey);
      if (backup) {
        try {
          JSON.parse(backup); // Validate backup
          localStorage.setItem(key, backup);
          console.log('Successfully restored from backup:', key);
        } catch {
          console.error('Backup is also corrupted for key:', key);
          localStorage.removeItem(backupKey);
          if (key === "aurora_log_entries") {
            window._dataLost = true;
          }
        }
      } else {
        console.error('No backup found for key:', key);
        if (key === "aurora_log_entries") {
          window._dataLost = true;
        }
      }
    }
  });

  if (window._dataLost) {
    console.error('Critical data loss detected - both main and backup entries corrupted');
  }
}

/**
 * Initialize window properties for the app
 */
export function initWindowProps(): void {
  window._appMounted = false;
  window._dataLost = false;
}