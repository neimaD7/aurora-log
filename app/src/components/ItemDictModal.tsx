import React, { useState, Fragment } from 'react';
import { KnownItem } from '../types';
import { inp } from '../constants';
import { normalizeForMatch } from '../utils';
import { GitHubSync } from '../sync/GitHubSync';

interface ItemDictModalProps {
  onClose: () => void;
  knownItems: KnownItem[];
  setKnownItems: (items: KnownItem[]) => void;
  persistKnown: (items: KnownItem[]) => void;
  onOpenLabels: () => void;
  onOpenApiKey: () => void;
  onOpenSync: () => void;
}

export function ItemDictModal({ onClose, knownItems, setKnownItems, persistKnown, onOpenLabels, onOpenApiKey, onOpenSync }: ItemDictModalProps) {
  const [editName, setEditName] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const remove = (idx: number) => { const next = knownItems.map((k, i) => i === idx ? { ...k, _deleted: true, modifiedAt: Date.now() } : k); setKnownItems(next); persistKnown(next); };
  const startEdit = (item: KnownItem, idx: number) => { setEditName(idx); setEditVal(item.name); };
  const saveEdit = (idx: number) => {
    if (!editVal.trim()) return;
    const newName = editVal.trim();
    const newKey = normalizeForMatch(newName);
    // Check for tombstone collision — if renamed target was previously deleted, un-delete it instead of creating a duplicate
    const tombstoneIdx = knownItems.findIndex((k, i) => i !== idx && normalizeForMatch(k.name) === newKey && k._deleted);
    let next: KnownItem[];
    if (tombstoneIdx >= 0) {
      next = knownItems.map((k, i) => {
        if (i === tombstoneIdx) return { ...k, name: newName, _deleted: undefined, modifiedAt: Date.now() };
        if (i === idx) return { ...k, _deleted: true, modifiedAt: Date.now() };
        return k;
      });
    } else {
      next = knownItems.map((k, i) => i === idx ? { ...k, name: newName, modifiedAt: Date.now() } : k);
    }
    setKnownItems(next); persistKnown(next); setEditName(null);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "min(460px,96vw)", maxHeight: "85vh", overflowY: "auto", padding: "22px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.94rem", letterSpacing: "0.1em" }}>ITEM DICTIONARY</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#555555", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ fontSize: "0.72rem", color: "#555555", marginBottom: 14, lineHeight: 1.5 }}>Auto-learned from entries. AI matches documents to these names. Tap to edit.</div>
        {knownItems.filter(k => !k._deleted).length === 0 && <div style={{ color: "#333333", fontSize: "0.84rem", padding: "20px 0", textAlign: "center" }}>No items yet — log your first entry to start building the dictionary.</div>}
        {knownItems.map((item, idx) => item._deleted ? null : (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            {editName === idx ? (
              <Fragment>
                <input value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(idx); }}
                  style={{ ...inp, flex: 1, fontSize: "0.86rem", padding: "4px 7px", background: "#000000" }} autoFocus />
                <button onClick={() => saveEdit(idx)} style={{ background: "none", border: "none", color: "#00c853", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'Courier New',monospace", fontWeight: 700 }}>SAVE</button>
              </Fragment>
            ) : (
              <Fragment>
                <span onClick={() => startEdit(item, idx)} style={{ flex: 1, color: "#cccccc", fontSize: "0.88rem", cursor: "pointer" }}>
                  {item.name} {item.unit && <span style={{ color: "#444444", fontSize: "0.72rem" }}>({item.unit})</span>}
                </span>
                <button onClick={() => remove(idx)} style={{ background: "none", border: "none", color: "#3a1010", cursor: "pointer", fontSize: "0.82rem" }}>x</button>
              </Fragment>
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <button onClick={() => { onClose(); onOpenLabels(); }} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#888888", padding: "10px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.06em" }}>LABELS</button>
          <button onClick={() => { onClose(); onOpenApiKey(); }} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#555555", padding: "10px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.74rem", cursor: "pointer", letterSpacing: "0.06em" }}>API KEY</button>
          <button onClick={() => { onClose(); onOpenSync(); }} style={{ flex: 1, background: GitHubSync.isConfigured() ? "rgba(0,200,83,0.08)" : "rgba(255,255,255,0.04)", border: "1px solid " + (GitHubSync.isConfigured() ? "rgba(0,200,83,0.15)" : "rgba(255,255,255,0.08)"), borderRadius: 10, color: GitHubSync.isConfigured() ? "#00c853" : "#555555", padding: "10px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.74rem", cursor: "pointer", letterSpacing: "0.06em" }}>SYNC</button>
        </div>
      </div>
    </div>
  );
}
