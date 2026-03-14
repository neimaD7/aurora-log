import React, { useState } from 'react';
import { inp } from '../constants';

interface PullPriorityModalProps {
  onClose: () => void;
  priority: string[];
  onSave: (items: string[]) => void;
}

export function PullPriorityModal({ onClose, priority, onSave }: PullPriorityModalProps) {
  const [items, setItems] = useState([...priority]);
  const [newCat, setNewCat] = useState("");

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setItems(next);
  };
  const moveDown = (idx: number) => {
    if (idx >= items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setItems(next);
  };
  const remove = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const add = () => {
    const val = newCat.trim();
    if (!val) return;
    setItems([...items, val]);
    setNewCat("");
  };
  const save = () => { onSave(items); onClose(); };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "min(420px,96vw)", maxHeight: "85vh", overflowY: "auto", padding: "22px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.94rem", letterSpacing: "0.1em" }}>PULL ORDER</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#555555", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ fontSize: "0.72rem", color: "#555555", marginBottom: 14, lineHeight: 1.5 }}>Items matching earlier categories get pulled first. Use arrows to reorder.</div>
        {items.map((cat, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: "#444444", fontSize: "0.68rem", fontWeight: 700, width: 18, textAlign: "center", flexShrink: 0 }}>{idx + 1}</span>
            <span style={{ flex: 1, color: "#cccccc", fontSize: "0.88rem" }}>{cat}</span>
            <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ background: "none", border: "1px solid " + (idx === 0 ? "#1a1a1a" : "#2a2a2a"), color: idx === 0 ? "#1a1a1a" : "#888888", padding: "3px 7px", fontFamily: "'Courier New',monospace", fontSize: "0.76rem", cursor: idx === 0 ? "default" : "pointer" }}>&#9650;</button>
            <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1} style={{ background: "none", border: "1px solid " + (idx === items.length - 1 ? "#1a1a1a" : "#2a2a2a"), color: idx === items.length - 1 ? "#1a1a1a" : "#888888", padding: "3px 7px", fontFamily: "'Courier New',monospace", fontSize: "0.76rem", cursor: idx === items.length - 1 ? "default" : "pointer" }}>&#9660;</button>
            <button onClick={() => remove(idx)} style={{ background: "none", border: "none", color: "#3a1010", cursor: "pointer", fontSize: "0.82rem", padding: "0 4px" }}>x</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 10, marginBottom: 14 }}>
          <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === "Enter") add(); }}
            placeholder="New category..." style={{ ...inp, flex: 1, fontSize: "0.84rem", padding: "5px 7px", background: "#000000" }} />
          <button onClick={add} style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", color: "#666666", padding: "5px 10px", fontFamily: "'Courier New',monospace", fontSize: "0.74rem", cursor: "pointer" }}>+ ADD</button>
        </div>
        <button onClick={save} style={{ width: "100%", background: "#ffffff", color: "#0a0a0a", border: "none", borderRadius: 12, padding: "12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.06em", cursor: "pointer" }}>SAVE ORDER</button>
      </div>
    </div>
  );
}
