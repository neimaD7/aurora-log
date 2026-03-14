import React, { useState } from 'react';
import { inp } from '../constants';
import { GitHubSync } from '../sync/GitHubSync';

interface SyncTokenModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Modal for entering and managing the GitHub sync token.
 */
export function SyncTokenModal({ onClose, onSaved }: SyncTokenModalProps) {
  const [value, setValue] = useState(GitHubSync.getToken());

  const handleSave = () => {
    GitHubSync.setToken(value);
    if (onSaved) onSaved();
    onClose();
  };

  const handleClear = () => {
    GitHubSync.setToken("");
    setValue("");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        WebkitBackdropFilter: "blur(20px)",
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(28,28,30,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          width: "min(380px,92vw)",
          padding: "22px 20px"
        }}
      >
        <div style={{
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "0.94rem",
          letterSpacing: "0.1em",
          marginBottom: 8
        }}>
          SYNC TOKEN
        </div>

        <div style={{
          fontSize: "0.7rem",
          color: "#444444",
          marginBottom: 14,
          lineHeight: 1.5
        }}>
          GitHub personal access token for syncing data across devices. Syncs to neimaD7/aurora-log-data.
        </div>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="github_pat_..."
          type="password"
          style={{
            ...inp,
            marginBottom: 12
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: "#ffffff",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 12,
              padding: "10px",
              fontFamily: "'SF Mono','Menlo','Courier New',monospace",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            SAVE
          </button>
          {value && (
            <button
              onClick={handleClear}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: 12,
                color: "#666666",
                padding: "10px 14px",
                fontFamily: "'SF Mono','Menlo','Courier New',monospace",
                fontSize: "0.76rem",
                cursor: "pointer"
              }}
            >
              CLEAR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}