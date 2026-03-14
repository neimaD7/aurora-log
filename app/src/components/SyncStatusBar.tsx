import React, { useEffect, useState } from 'react';
import { SyncStatusBarProps } from '../types';
import { GitHubSync } from '../sync/GitHubSync';

/**
 * Bottom-of-screen sync status indicator.
 * Only visible when GitHub sync is configured.
 */
export function SyncStatusBar({ syncState }: SyncStatusBarProps) {
  // Tick every 15s so "ago" stays fresh without calling Date.now() during render
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  if (!GitHubSync.isConfigured()) return null;

  const { status, lastSync, error } = syncState;
  let text = "";
  let color = "#333333";

  if (status === "syncing") {
    text = "SYNCING...";
    color = "#5b8fff";
  } else if (status === "error") {
    text = "SYNC ERROR";
    color = "#ff4444";
  } else if (status === "synced" && lastSync) {
    const ago = Math.round((now - lastSync) / 1000);
    if (ago < 60) {
      text = `SYNCED ${ago}s AGO`;
    } else if (ago < 3600) {
      text = `SYNCED ${Math.round(ago / 60)}m AGO`;
    } else {
      text = `SYNCED ${Math.round(ago / 3600)}h AGO`;
    }
    color = "#2a4a2a";
  } else {
    text = "SYNC IDLE";
    color = "#333333";
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      textAlign: "center",
      padding: "5px 0",
      paddingBottom: "calc(5px + env(safe-area-inset-bottom))",
      background: "rgba(0,0,0,0.9)",
      borderTop: "1px solid rgba(255,255,255,0.04)",
      zIndex: 500,
      WebkitBackdropFilter: "blur(10px)",
      backdropFilter: "blur(10px)"
    }}>
      <span style={{
        fontSize: "0.56rem",
        letterSpacing: "0.12em",
        color,
        fontFamily: "'SF Mono','Menlo','Courier New', monospace"
      }}>
        {text}
      </span>
      {error && (
        <span style={{
          fontSize: "0.52rem",
          color: "#ff4444",
          marginLeft: 6
        }}>
          {error}
        </span>
      )}
    </div>
  );
}