import React, { useState, useRef } from 'react';
import { PullIntakeProps, ImageData, ParsedSalesOrder } from '../types';
import { inp, lbl, API_CONFIG } from '../constants';
import { extractJSON, findBestMatch, getApiKey, getApiHeaders } from '../utils';
import { NameInput } from './NameInput';

export function PullIntake({ onAddSO, knownItems }: PullIntakeProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedSalesOrder | null>(null);
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImageData[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const knownItemsList = knownItems.length > 0
    ? "\n\nKNOWN ITEM NAMES (ALWAYS use these exact names when you recognize the same product):\n" + knownItems.map(k => `- "${k.name}"${k.unit ? ` (unit: ${k.unit})` : ""}`).join("\n")
    : "";

  const systemPrompt = `You are a document parser for Aurora, a construction and building materials supply warehouse in Portland, Oregon.

You are parsing a SALES ORDER (SO) or will-call ticket for the pull sheet. Extract the customer info and all line items.

The user may provide MULTIPLE PHOTOS of the same document. Treat all images as pages of ONE document — combine all line items into a single result.

Return ONLY valid JSON, no markdown:
{
  "customer": "customer or company name",
  "jobSite": "job site, lot number, or address if visible, otherwise empty string",
  "soNumber": "sales order or ticket number as string, or empty string",
  "lineItems": [ { "name": "item name", "qty": number, "unit": "bags/pcs/rolls/etc" } ]
}

CRITICAL NAME MATCHING RULE: When a line item refers to the EXACT same product (same size, same dimensions, same grade) as a known item below, use the known item's exact name. But if the size or dimensions differ (e.g. 1/2" vs 5/8", 18" vs 24", Grade 40 vs Grade 60), treat it as a DIFFERENT item and use the name as written on the document. Do NOT substitute a different size from the known items list.` + knownItemsList;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImages(prev => [...prev, { base64: result.split(",")[1], mediaType: file.type, preview: result }]);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };
  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const parse = async () => {
    if (!input.trim() && images.length === 0) return;
    if (!getApiKey()) { setError("API key required — tap KEY in the header."); return; }
    setLoading(true); setError(""); setParsed(null);
    try {
      type AnthropicContent =
        | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
        | { type: "text"; text: string };
      const userContent: AnthropicContent[] = [];
      images.forEach((img) => {
        userContent.push({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.base64 } });
      });
      const textPart = input.trim() || (images.length > 1 ? "Parse this " + images.length + "-page sales order. Combine all line items into one result." : "Parse this sales order / will-call ticket.");
      userContent.push({ type: "text", text: textPart });
      const res = await fetch(API_CONFIG.apiUrl, { method: "POST", headers: getApiHeaders(), body: JSON.stringify({ model: API_CONFIG.model, max_tokens: API_CONFIG.maxTokensSO, system: systemPrompt, messages: [{ role: "user", content: userContent }] }) });
      const data = await res.json() as { error?: { message?: string }; stop_reason?: string; content?: { text?: string }[] };
      if (data.error) { setError("API error: " + (data.error.message || "Unknown")); setLoading(false); return; }
      if (data.stop_reason === "max_tokens") { setError("Response was cut off (too many items). Try fewer pages."); setLoading(false); return; }
      const text = data.content?.map((b) => b.text || "").join("").trim();
      const result = extractJSON(text ?? "") as ParsedSalesOrder | null;
      if (!result) { setError("Couldn't parse SO — try again or enter manually."); setLoading(false); return; }
      if (result.lineItems) {
        result.lineItems = result.lineItems.map((li) => {
          const match = findBestMatch(li.name, knownItems);
          if (match) return { ...li, name: match.name, unit: li.unit || match.unit || "" };
          return li;
        });
      }
      setParsed(result);
    } catch (e: unknown) { setError("Error: " + (e instanceof Error ? e.message : String(e))); }
    setLoading(false);
  };

  const updateField = (k: keyof ParsedSalesOrder, v: ParsedSalesOrder[keyof ParsedSalesOrder]) => setParsed(p => p ? { ...p, [k]: v } : p);
  const updateLine = (idx: number, key: string, val: string | number) => setParsed(p => p ? { ...p, lineItems: p.lineItems.map((li, i) => i === idx ? { ...li, [key]: val } : li) } : p);
  const removeLine = (idx: number) => setParsed(p => p ? { ...p, lineItems: p.lineItems.filter((_, i) => i !== idx) } : p);
  const addLine = () => setParsed(p => p ? { ...p, lineItems: [...(p.lineItems || []), { name: "", qty: "", unit: "" }] } : p);
  const reset = () => { setParsed(null); setInput(""); setImages([]); if (fileRef.current) fileRef.current.value = ""; };
  const confirm = () => {
    if (!parsed) return;
    onAddSO({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      customer: (parsed.customer || "").trim(),
      jobSite: (parsed.jobSite || "").trim(),
      soNumber: (parsed.soNumber || "").trim(),
      lineItems: (parsed.lineItems || []).filter(li => (li.name || "").trim()).map(li => ({
        name: (li.name || "").trim(), qty: Number(li.qty) || 0, unit: (li.unit || "").trim()
      })),
      addedAt: Date.now()
    });
    reset();
  };

  return (
    <div style={{ background: "#000000", borderBottom: "1px solid #2a2a2a", padding: "12px 14px" }}>
      {images.length > 0 && (
        <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ position: "relative", display: "inline-block" }}>
              <img src={img.preview} alt="" style={{ height: 80, maxWidth: 100, border: "1px solid rgba(255,255,255,0.06)", display: "block", objectFit: "cover" }} />
              <button onClick={() => removeImage(idx)} style={{ position: "absolute", top: 2, right: 2, background: "#000000", border: "1px solid rgba(255,255,255,0.06)", color: "#e5e5e7", cursor: "pointer", fontSize: "0.7rem", padding: "0px 4px", lineHeight: "16px" }}>x</button>
              <div style={{ position: "absolute", bottom: 2, left: 2, background: "#000000", color: "#666666", fontSize: "0.6rem", padding: "0 3px", fontWeight: 700 }}>{"P" + (idx + 1)}</div>
            </div>
          ))}
        </div>
      )}
      {!parsed && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); parse(); } }}
            placeholder={images.length > 0 ? images.length + " photo" + (images.length > 1 ? "s" : "") + " — add more or hit GO" : "Snap an SO / will-call, or type items"}
            rows={2} style={{ ...inp, flex: 1, resize: "none", background: "#000000", fontSize: "0.9rem" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => fileRef.current?.click()} style={{ background: images.length > 0 ? "#1a2d5a" : "#141414", border: "1px solid rgba(255,255,255,0.06)", color: images.length > 0 ? "#7aa8f0" : "#666666", padding: "7px 11px", fontFamily: "'Courier New',monospace", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>{images.length > 0 ? "+" + images.length : "PHOTO"}</button>
            <button onClick={parse} disabled={loading || (!input.trim() && images.length === 0)} style={{ background: loading ? "#141414" : "#ffffff", color: loading ? "#2d4a8a" : "#0a0a0a", border: "none", padding: "7px 11px", fontFamily: "'Courier New',monospace", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "default" : "pointer" }}>{loading ? "..." : "GO"}</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: "none" }} />
      {error && <div style={{ marginTop: 8, color: "#ff4444", fontSize: "0.82rem", padding: "6px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid #1a0000" }}>{error}</div>}
      {parsed && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px", marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#5b8fff", fontWeight: 700, fontSize: "0.76rem", letterSpacing: "0.1em" }}>SALES ORDER</span>
            <button onClick={reset} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 26, height: 26, color: "#555555", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 150px" }}><label style={lbl}>CUSTOMER</label><input value={parsed.customer || ""} onChange={e => updateField("customer", e.target.value)} style={{ ...inp, background: "#000000" }} /></div>
            <div style={{ flex: "1 1 90px" }}><label style={lbl}>SO #</label><input value={parsed.soNumber || ""} onChange={e => updateField("soNumber", e.target.value)} style={{ ...inp, background: "#000000" }} /></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>JOB SITE / LOT</label><input value={parsed.jobSite || ""} onChange={e => updateField("jobSite", e.target.value)} style={{ ...inp, background: "#000000" }} /></div>
          <label style={{ ...lbl, marginBottom: 6 }}>LINE ITEMS</label>
          {(parsed.lineItems || []).map((li, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 56px 56px 22px", gap: 5, marginBottom: 5 }}>
              <NameInput value={li.name} onChange={v => updateLine(idx, "name", v)} placeholder="Item name" knownItems={knownItems} />
              <input value={li.qty || ""} onChange={e => updateLine(idx, "qty", e.target.value)} placeholder="Qty" style={{ ...inp, background: "#000000", fontSize: "0.88rem", padding: "5px 7px" }} />
              <input value={li.unit || ""} onChange={e => updateLine(idx, "unit", e.target.value)} placeholder="Unit" style={{ ...inp, background: "#000000", fontSize: "0.88rem", padding: "5px 7px" }} />
              <button onClick={() => removeLine(idx)} style={{ background: "none", border: "none", color: "#4a0000", cursor: "pointer", fontSize: "0.94rem", padding: 0, alignSelf: "center" }}>x</button>
            </div>
          ))}
          <button onClick={addLine} style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", color: "#666666", padding: "3px 10px", fontFamily: "'Courier New',monospace", fontSize: "0.72rem", cursor: "pointer", marginTop: 2, marginBottom: 12 }}>+ LINE</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirm} style={{ background: "#5b8fff", color: "#0a0a0a", border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: 700, fontSize: "0.86rem", letterSpacing: "0.06em", cursor: "pointer" }}>ADD TO PULL</button>
            <button onClick={reset} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#666666", padding: "9px 14px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.82rem", cursor: "pointer" }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}
