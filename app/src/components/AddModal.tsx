import React, { useState } from 'react';
import { Entry, ParsedDocument, LineItem, KnownItem } from '../types';
import { inp, lbl, STORES } from '../constants';
import { today } from '../utils';
import { NameInput } from './NameInput';

interface AddModalProps {
  onClose: () => void;
  onSave: (data: ParsedDocument) => void;
  onSaveUpcoming: (data: ParsedDocument) => void;
  defaultType: string;
  editEntry: Entry | null;
  editMode: string | null;
  knownItems: KnownItem[];
}

export function AddModal({ onClose, onSave, onSaveUpcoming, defaultType, editEntry, knownItems }: AddModalProps) {
  const [form, setFormState] = useState<ParsedDocument>(editEntry ? {
    type: editEntry.type, party: editEntry.party, docId: editEntry.docId,
    date: editEntry.date, lineItems: editEntry.lineItems.map(li => ({...li})), notes: editEntry.notes || ""
  } : { type: (defaultType as ParsedDocument['type']) || "PO", party: "", docId: "", date: today(), lineItems: [{ name: "", qty: "", unit: "" }], notes: "" });
  const set = (k: keyof ParsedDocument, v: ParsedDocument[keyof ParsedDocument]) => setFormState(f => ({ ...f, [k]: v }));
  const updateLine = (idx: number, k: keyof LineItem, v: string | number | boolean) => setFormState(f => ({ ...f, lineItems: (f.lineItems as LineItem[]).map((li, i) => i === idx ? { ...li, [k]: v } : li) }));
  const addLine = () => setFormState(f => ({ ...f, lineItems: [...f.lineItems, { name: "", qty: "", unit: "" }] }));
  const removeLine = (idx: number) => setFormState(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));
  const isTransfer = form.type !== "PO";
  const partyLabel = form.type === "PO" ? "VENDOR / SUPPLIER" : form.type === "Transfer In" ? "FROM STORE" : "TO STORE";
  const isValid = form.party.trim() && form.lineItems.some(li => (li.name || "").trim());
  const save = () => { if (!isValid) return; onSave(form); onClose(); };
  const saveUpcoming = () => { if (!isValid) return; onSaveUpcoming(form); onClose(); };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "min(500px,96vw)", maxHeight: "92vh", overflowY: "auto", padding: "22px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.08em" }}>{editEntry ? "EDIT ENTRY" : "LOG ENTRY"}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#555555", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>TYPE</label>
          <select value={form.type} onChange={e => set("type", e.target.value as ParsedDocument['type'])} style={{ ...inp, padding: "7px 9px" }}>
            <option>PO</option><option>Transfer In</option><option>Transfer Out</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>{partyLabel}</label>
          {isTransfer ? (
            <select value={form.party} onChange={e => set("party", e.target.value)} style={{ ...inp, padding: "7px 9px" }}>
              <option value="">Select</option>
              {STORES.map(s => <option key={s}>{s}</option>)}
            </select>
          ) : (
            <input value={form.party} onChange={e => set("party", e.target.value)} placeholder="e.g. Pacific Supply Co." style={inp} />
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}><label style={lbl}>DOC #</label><input value={form.docId || ""} onChange={e => set("docId", e.target.value)} placeholder="optional" style={inp} /></div>
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}><label style={lbl}>DATE</label><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={{ ...inp, width: "100%", minWidth: 0 }} /></div>
        </div>
        <label style={{ ...lbl, marginBottom: 7 }}>LINE ITEMS</label>
        {form.lineItems.map((li, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 56px 56px 22px", gap: 5, marginBottom: 5 }}>
            <NameInput value={li.name} onChange={v => updateLine(idx, "name", v)} placeholder="Item name" knownItems={knownItems} />
            <input value={li.qty} onChange={e => updateLine(idx, "qty", e.target.value)} placeholder="Qty" style={{ ...inp, fontSize: "0.88rem", padding: "5px 7px" }} />
            <input value={li.unit || ""} onChange={e => updateLine(idx, "unit", e.target.value)} placeholder="Unit" style={{ ...inp, fontSize: "0.88rem", padding: "5px 7px" }} />
            <button onClick={() => removeLine(idx)} style={{ background: "none", border: "none", color: "#4a0000", cursor: "pointer", fontSize: "0.94rem", alignSelf: "center" }}>x</button>
          </div>
        ))}
        <button onClick={addLine} style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", color: "#666666", padding: "3px 10px", fontFamily: "'Courier New',monospace", fontSize: "0.72rem", cursor: "pointer", marginBottom: 12 }}>+ LINE</button>
        <div style={{ marginBottom: 16 }}><label style={lbl}>NOTES (OPTIONAL)</label><input value={form.notes || ""} onChange={e => set("notes", e.target.value)} style={inp} /></div>
        {editEntry ? (
          <button onClick={save} style={{ width: "100%", background: "#ffffff", color: "#0a0a0a", border: "none", borderRadius: 12, padding: "12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: 700, fontSize: "0.93rem", letterSpacing: "0.06em", cursor: "pointer" }}>SAVE CHANGES</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} style={{ flex: 1, background: "#ffffff", color: "#0a0a0a", border: "none", borderRadius: 12, padding: "12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.06em", cursor: "pointer" }}>SAVE</button>
            <button onClick={saveUpcoming} style={{ flex: 1, background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: "12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.06em", cursor: "pointer" }}>UPCOMING</button>
          </div>
        )}
      </div>
    </div>
  );
}
