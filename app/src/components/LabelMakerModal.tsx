import React, { useState, useRef } from 'react';
import { KnownItem } from '../types';
import { inp, lbl } from '../constants';

interface LabelMakerModalProps {
  onClose: () => void;
  knownItems: KnownItem[];
}

interface Label {
  id: string;
  name: string;
  overstock: string;
}

type LabelSize = "standard" | "overstock";

export function LabelMakerModal({ onClose }: LabelMakerModalProps) {
  const [labels, setLabels] = useState<Label[]>([{ id: "l1", name: "", overstock: "" }]);
  const [labelSize, setLabelSize] = useState<LabelSize>("standard");
  const nextId = useRef(2);
  const addLabel = () => { setLabels(l => [...l, { id: "l" + (nextId.current++), name: "", overstock: "" }]); };
  const removeLabel = (id: string) => setLabels(l => l.filter(lb => lb.id !== id));
  const updateLabel = (id: string, key: keyof Label, val: string) => setLabels(l => l.map(lb => lb.id === id ? { ...lb, [key]: val } : lb));
  const dupLabel = (id: string) => setLabels(l => { const srcIdx = l.findIndex(lb => lb.id === id); if (srcIdx < 0) return l; const copy = { ...l[srcIdx], id: "l" + (nextId.current++) }; const next = [...l]; next.splice(srcIdx + 1, 0, copy); return next; });

  const validLabels = labels.filter(lb => (lb.name || "").trim());

  const printLabels = () => {
    if (validLabels.length === 0) return;
    const isOverstock = labelSize === "overstock";
    const labelW = isOverstock ? 8 : 5.75;
    const labelH = isOverstock ? 5 : 1.75;
    const startSize = isOverstock ? 180 : 96;
    const padding = isOverstock ? '0.4in 0.5in' : '0.15in 0.25in';
    const osRatio = isOverstock ? 0.45 : 0.55;
    const minOsSize = isOverstock ? 24 : 14;
    let html = '<!DOCTYPE html><html><head><style>';
    html += '@page { size: 8.5in 11in; margin: 0.25in; }';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    html += 'body { font-family: "Courier New", monospace; }';
    html += '.label { width: ' + labelW + 'in; height: ' + labelH + 'in; border: 1px dashed #cccccc; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: ' + padding + '; page-break-inside: avoid; overflow: hidden; position: relative; margin-bottom: -1px; }';
    if (isOverstock) { html += '.label { page-break-after: always; }'; html += '.label:last-child { page-break-after: auto; }'; }
    html += '.label:last-child { margin-bottom: 0; }';
    html += '.item-name { font-weight: 700; line-height: 1.2; color: #000000; ' + (isOverstock ? 'white-space: pre-line; text-align: center;' : 'white-space: nowrap;') + ' }';
    html += '.overstock { font-weight: 400; color: #555555; margin-top: ' + (isOverstock ? '0.2in' : '0.06in') + '; white-space: nowrap; }';
    html += '</style></head><body>';
    validLabels.forEach((lb) => {
      html += '<div class="label">';
      html += '<div class="item-name" data-fit="true">' + lb.name.replace(/</g, "&lt;") + '</div>';
      if ((lb.overstock || "").trim()) {
        html += '<div class="overstock">Overstock in ' + lb.overstock.replace(/</g, "&lt;") + '</div>';
      }
      html += '</div>';
    });
    html += '<script>';
    html += 'document.querySelectorAll(".label").forEach(function(label) {';
    html += '  var nameEl = label.querySelector(".item-name");';
    html += '  var osEl = label.querySelector(".overstock");';
    html += '  var maxW = label.clientWidth - 36;';
    html += '  var maxH = label.clientHeight - 24;';
    html += '  var size = ' + startSize + ';';
    html += '  nameEl.style.fontSize = size + "pt";';
    if (isOverstock) {
      // For overstock: shrink until text fits both width and height (text wraps via pre-line)
      html += '  while ((nameEl.scrollWidth > maxW || nameEl.scrollHeight + (osEl ? osEl.scrollHeight + 20 : 0) > maxH) && size > 8) { size -= 1; nameEl.style.fontSize = size + "pt"; }';
    } else {
      html += '  while (nameEl.scrollWidth > maxW && size > 8) { size -= 1; nameEl.style.fontSize = size + "pt"; }';
    }
    html += '  if (osEl) {';
    html += '    var osSize = Math.max(Math.round(size * ' + osRatio + '), ' + minOsSize + ');';
    html += '    osEl.style.fontSize = osSize + "pt";';
    html += '    while (osEl.scrollWidth > maxW && osSize > 8) { osSize -= 1; osEl.style.fontSize = osSize + "pt"; }';
    html += '  }';
    html += '});';
    html += '<\\/script>';
    html += '</body></html>';
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 800); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "min(500px,96vw)", maxHeight: "90vh", overflowY: "auto", padding: "22px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.94rem", letterSpacing: "0.1em" }}>LABEL MAKER</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#555555", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <button onClick={() => setLabelSize("standard")} style={{ flex: 1, background: labelSize === "standard" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)", border: "1px solid " + (labelSize === "standard" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"), borderRadius: 10, color: labelSize === "standard" ? "#ffffff" : "#555555", padding: "8px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em" }}>STANDARD<br/><span style={{ fontSize: "0.58rem", fontWeight: 400, opacity: 0.6 }}>2" × 6" rack labels</span></button>
          <button onClick={() => setLabelSize("overstock")} style={{ flex: 1, background: labelSize === "overstock" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)", border: "1px solid " + (labelSize === "overstock" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"), borderRadius: 10, color: labelSize === "overstock" ? "#ffffff" : "#555555", padding: "8px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em" }}>OVERSTOCK<br/><span style={{ fontSize: "0.58rem", fontWeight: 400, opacity: 0.6 }}>8.5" × 5.5" pallet labels</span></button>
        </div>
        <div style={{ fontSize: "0.72rem", color: "#555555", marginBottom: 14, lineHeight: 1.5 }}>{labelSize === "standard" ? "Item labels for 2\" × 6\" C-channel holders. Print on cardstock, cut along dashed lines." : "Large labels for overstock pallets. One per half-sheet, readable from the ground."}</div>
        {labels.map((lb) => (
          <div key={lb.id} style={{ marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>ITEM NAME{labelSize === "overstock" ? " (one item per line)" : ""}</label>
                {labelSize === "overstock" ? (
                  <textarea value={lb.name} onChange={e => updateLabel(lb.id, "name", e.target.value)} placeholder={"e.g.\n#4 Rebar 20' Grade 60\n#5 Rebar 20' Grade 60"} rows={3} style={{ ...inp, background: "#000000", fontSize: "0.86rem", padding: "6px 8px", resize: "vertical", lineHeight: 1.4 }} />
                ) : (
                  <input value={lb.name} onChange={e => updateLabel(lb.id, "name", e.target.value)} placeholder="e.g. #4 Rebar 20' Grade 60" style={{ ...inp, background: "#000000", fontSize: "0.86rem", padding: "6px 8px" }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "flex-end", flexShrink: 0 }}>
                <button onClick={() => dupLabel(lb.id)} title="Duplicate" style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", color: "#555555", padding: "2px 6px", fontFamily: "'Courier New',monospace", fontSize: "0.68rem", cursor: "pointer" }}>DUP</button>
                {labels.length > 1 && <button onClick={() => removeLabel(lb.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 4, color: "#ff4444", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, padding: "2px 6px", fontFamily: "'Courier New',monospace" }}>DEL</button>}
              </div>
            </div>
            <div>
              <label style={lbl}>OVERSTOCK LOCATION (OPTIONAL)</label>
              <input value={lb.overstock} onChange={e => updateLabel(lb.id, "overstock", e.target.value)} placeholder="e.g. Bin 5" style={{ ...inp, background: "#000000", fontSize: "0.84rem", padding: "5px 8px" }} />
            </div>
          </div>
        ))}
        <button onClick={addLabel} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#666666", padding: "8px 12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.74rem", cursor: "pointer", marginBottom: 16, width: "100%" }}>+ ADD LABEL</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={printLabels} disabled={validLabels.length === 0} style={{ flex: 1, background: validLabels.length > 0 ? "#ffffff" : "rgba(255,255,255,0.06)", color: validLabels.length > 0 ? "#0a0a0a" : "#555555", border: "none", borderRadius: 12, padding: "12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.06em", cursor: validLabels.length > 0 ? "pointer" : "default" }}>
            PRINT {validLabels.length > 0 ? "(" + validLabels.length + ")" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
