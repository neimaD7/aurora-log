import React, { useState, useRef } from 'react';
import { NameInputProps, KnownItem } from '../types';
import { inp } from '../constants';
import { normalizeForMatch } from '../utils';

/**
 * Autocomplete input component with dictionary suggestions.
 * CRITICAL: This component must be TOP-LEVEL, never nested inside another component.
 */
export function NameInput({
  value,
  onChange,
  placeholder,
  knownItems = [],
  inputStyle
}: NameInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<KnownItem[]>([]);
  const touchRef = useRef({ y: 0, moved: false });

  const activeItems = knownItems.filter(item => !item._deleted);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.trim().length >= 2 && activeItems.length > 0) {
      const norm = normalizeForMatch(newValue);
      const matches = activeItems.filter(k => {
        const kn = normalizeForMatch(k.name);
        return kn.includes(norm) || norm.split(" ").some(t => t.length > 1 && kn.includes(t));
      }).slice(0, 5);

      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item: KnownItem) => {
    onChange(item.name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const style = inputStyle || {
    ...inp,
    background: "#000000",
    fontSize: "0.88rem",
    padding: "5px 7px"
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={value || ""}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={style}
      />
      {showSuggestions && (
        <div
          onTouchStart={(e) => { touchRef.current = { y: e.touches[0].clientY, moved: false }; }}
          onTouchMove={() => { touchRef.current.moved = true; }}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#1c1c1e",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            zIndex: 100,
            maxHeight: 160,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)"
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
              onTouchEnd={(e) => {
                if (touchRef.current.moved) return;
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
              style={{
                padding: "10px 12px",
                fontSize: "0.84rem",
                color: "#e5e5e7",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.06)"
              }}
            >
              {suggestion.name}
              {suggestion.unit && (
                <span style={{
                  color: "#666666",
                  fontSize: "0.72rem",
                  marginLeft: 6
                }}>
                  {suggestion.unit}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}