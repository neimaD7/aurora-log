import React, { useState } from 'react';
import { inp } from '../constants';
import { getApiKey, setApiKeyVal } from '../utils';

interface ApiKeyModalProps {
  onClose: () => void;
}

/**
 * Modal for entering and saving the Anthropic API key.
 */
export function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const [value, setValue] = useState(getApiKey());

  const handleSave = () => {
    setApiKeyVal(value);
    onClose();
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
          marginBottom: 14
        }}>
          API KEY
        </div>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-..."
          type="password"
          style={{
            ...inp,
            marginBottom: 12
          }}
        />

        <button
          onClick={handleSave}
          style={{
            width: "100%",
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
      </div>
    </div>
  );
}