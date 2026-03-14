import React from 'react';

// Store names for transfers
export const STORES = ["Hillsboro", "Eugene", "Gresham", "Vancouver", "Redmond"];

// Default pull priority categories
export const DEFAULT_PULL_PRIORITY = [
  "stakes",
  "bag ties",
  "form oil",
  "dobies",
  "bolts",
  "pier papers",
  "form clips/flat ties",
  "snap ties",
  "misc"
];

// Regex pattern for removing triple backticks from AI responses
// Built with String.fromCharCode to avoid literal backticks in source
export const FENCE_RE = new RegExp(
  String.fromCharCode(96, 96, 96) + "json|" + String.fromCharCode(96, 96, 96),
  "g"
);

// Shared input styling
export const inp: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "#e5e5e7",
  padding: "12px 14px",
  fontSize: "16px",
  outline: "none",
  fontFamily: "'SF Mono', 'Menlo', 'Courier New', monospace",
  boxSizing: "border-box" as const,
  transition: "border-color 0.15s ease"
};

// Shared label styling
export const lbl: React.CSSProperties = {
  display: "block",
  fontSize: "0.62rem",
  fontWeight: "600",
  letterSpacing: "0.12em",
  color: "#555555",
  marginBottom: 6,
  textTransform: "uppercase" as const
};

// API configuration
export const API_CONFIG = {
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  maxTokensSO: 8192,
  apiUrl: "https://api.anthropic.com/v1/messages",
  headers: {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true"
  }
};

// GitHub sync configuration
export const GITHUB_CONFIG = {
  owner: "neimaD7",
  repo: "aurora-log-data",
  apiBase: "https://api.github.com/repos"
};

// Debounce timers
export const SYNC_DEBOUNCE_MS = 2500;
export const REAP_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours for tombstone cleanup
export const MOUNT_TIMEOUT_MS = 8000; // App mount timeout for failsafe
export const SYNC_STATUS_UPDATE_INTERVAL_MS = 30000; // 30 seconds for sync status updates