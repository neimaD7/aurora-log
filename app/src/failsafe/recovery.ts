// Plain JavaScript recovery UI - no React, no TypeScript features
// This module provides data recovery when the main app fails to load

/**
 * Show recovery UI when app fails to initialize.
 * Must be plain JavaScript that works when React fails.
 * @param reason - Error message describing why recovery was triggered
 */
export function showRecoveryUI(reason?: string): void {
  const root = document.getElementById("root");
  if (!root) return;

  let entries: unknown[] = [];
  let known: unknown[] = [];
  let upcoming: unknown[] = [];

  // Attempt to retrieve data from localStorage or backups
  try {
    const entriesData = localStorage.getItem("aurora_log_entries") ||
                       localStorage.getItem("aurora_log_entries_backup");
    if (entriesData) entries = JSON.parse(entriesData);
  } catch(e) {
    console.error('Could not recover entries data:', e);
  }

  try {
    const knownData = localStorage.getItem("aurora_log_known_items") ||
                     localStorage.getItem("aurora_log_known_items_backup");
    if (knownData) known = JSON.parse(knownData);
  } catch(e) {
    console.error('Could not recover known items data:', e);
  }

  try {
    const upcomingData = localStorage.getItem("aurora_log_upcoming") ||
                        localStorage.getItem("aurora_log_upcoming_backup");
    if (upcomingData) upcoming = JSON.parse(upcomingData);
  } catch(e) {
    console.error('Could not recover upcoming data:', e);
  }

  const hasData = entries.length > 0 || known.length > 0 || upcoming.length > 0;
  const exportData = JSON.stringify({
    entries: entries,
    knownItems: known,
    upcoming: upcoming,
    exportedAt: new Date().toISOString()
  }, null, 2);

  // Build recovery UI HTML
  let html = '<div style="padding:24px 16px;font-family:Courier New,monospace;background:#0a0a0a;color:#f5f5f5;min-height:100vh">';
  html += '<div style="max-width:500px;margin:0 auto">';

  // Header
  html += '<div style="color:#ff4444;font-weight:700;font-size:1rem;letter-spacing:0.1em;margin-bottom:6px">RECOVERY MODE</div>';
  html += '<div style="color:#666;font-size:0.78rem;margin-bottom:20px">' + (reason || "App failed to load.") + '</div>';

  // Data status
  if (hasData) {
    html += '<div style="color:#00c853;font-size:0.82rem;margin-bottom:12px;font-weight:700">';
    html += 'DATA SAFE: ' + entries.length + ' entries, ' + upcoming.length + ' upcoming, ' + known.length + ' dict';
    html += '</div>';

    // Copy data button
    html += '<button id="copyBtn" style="background:#1a2d5a;color:#7aa8f0;border:1px solid #2a2a2a;padding:10px 16px;font-family:Courier New,monospace;font-weight:700;font-size:0.84rem;cursor:pointer;width:100%;margin-bottom:8px">COPY DATA BACKUP</button>';

    // Export textarea
    html += '<textarea id="exportArea" readonly style="width:100%;height:60px;background:#111;border:1px solid #2a2a2a;color:#555;font-size:0.68rem;padding:6px;font-family:Courier New,monospace;resize:vertical;margin-bottom:12px">';
    html += exportData.replace(/</g, "&lt;");
    html += '</textarea>';
  }

  // Action buttons
  html += '<div style="display:flex;gap:8px">';
  html += '<button id="retryBtn" style="background:#fff;color:#0a0a0a;border:none;padding:10px 20px;font-family:Courier New,monospace;font-weight:700;font-size:0.88rem;cursor:pointer;flex:1">RETRY</button>';
  html += '<button id="clearBtn" style="background:#2a0000;color:#ff4444;border:1px solid #4a0000;padding:10px 20px;font-family:Courier New,monospace;font-weight:700;font-size:0.88rem;cursor:pointer;flex:1">CLEAR + RELOAD</button>';
  html += '</div>';

  // Restore from backup button (if data exists)
  if (hasData) {
    html += '<button id="restoreBtn" style="background:none;border:1px solid #2a2a2a;color:#888;padding:8px 16px;font-family:Courier New,monospace;font-size:0.76rem;cursor:pointer;width:100%;margin-top:8px">RESTORE FROM BACKUP</button>';
  }

  html += '</div></div>';

  // Set the HTML
  root.innerHTML = html;

  // Add event handlers after a small delay to ensure DOM is updated
  setTimeout(() => {
    // Copy data button
    const copyBtn = document.getElementById("copyBtn");
    if (copyBtn) {
      copyBtn.onclick = function() {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(exportData).then(() => {
            copyBtn.textContent = "COPIED!";
            copyBtn.style.background = "#0a3a1a";
            copyBtn.style.color = "#00c853";
          }).catch(() => {
            // Fallback for copy failure
            console.error('Copy to clipboard failed');
          });
        }
      };
    }

    // Retry button
    const retryBtn = document.getElementById("retryBtn");
    if (retryBtn) {
      retryBtn.onclick = function() {
        location.reload();
      };
    }

    // Clear button
    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) {
      clearBtn.onclick = function() {
        if (confirm("Erase all data? Copy backup first!")) {
          localStorage.clear();
          location.reload();
        }
      };
    }

    // Restore from backup button
    const restoreBtn = document.getElementById("restoreBtn");
    if (restoreBtn) {
      restoreBtn.onclick = function() {
        const keysToRestore = ["aurora_log_entries", "aurora_log_known_items", "aurora_log_upcoming"];
        keysToRestore.forEach(key => {
          const backup = localStorage.getItem(key + "_backup");
          if (backup) {
            try {
              JSON.parse(backup); // Validate backup
              localStorage.setItem(key, backup);
            } catch(e) {
              console.error('Failed to restore backup for', key, e);
            }
          }
        });
        location.reload();
      };
    }
  }, 50);
}

/**
 * Set up error handlers and mount timeout for recovery system
 */
export function setupRecoveryHandlers(): void {
  // Global error handler
  window.onerror = function(msg: string | Event, source?: string, line?: number) {
    const errorMsg = typeof msg === 'string' ? msg : 'Unknown error';
    const errorDetails = source && line ? ` (line ${line})` : '';
    showRecoveryUI("Error: " + errorMsg + errorDetails);
    return true;
  };

  // App mount timeout
  setTimeout(() => {
    if (!window._appMounted) {
      showRecoveryUI("App failed to initialize. Your data is preserved.");
    }
  }, 8000);
}