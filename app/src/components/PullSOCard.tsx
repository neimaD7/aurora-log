import React, { useState } from 'react';
import { SalesOrder } from '../types';

interface PullSOCardProps {
  so: SalesOrder;
  onRemove: (id: string) => void;
}

export function PullSOCard({ so, onRemove }: PullSOCardProps) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div style={{ background: "rgba(91,143,255,0.04)", border: "1px solid rgba(91,143,255,0.1)", borderRadius: 12, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: "#e5e5e7", fontWeight: 700, fontSize: "0.82rem" }}>{so.customer || "Unknown"}</span>
        {so.soNumber && <span style={{ color: "#3a3a3a", fontSize: "0.68rem", marginLeft: 8 }}>SO {so.soNumber}</span>}
        {so.jobSite && <div style={{ color: "#444444", fontSize: "0.68rem", marginTop: 2 }}>{so.jobSite}</div>}
        <div style={{ color: "#333333", fontSize: "0.64rem", marginTop: 2 }}>{(so.lineItems || []).length} items</div>
      </div>
      {confirmDel ? (
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <button onClick={() => onRemove(so.id)} style={{ background: "rgba(255,68,68,0.15)", color: "#ff4444", border: "none", borderRadius: 8, padding: "4px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>DEL</button>
          <button onClick={() => setConfirmDel(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "#666666", padding: "4px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.68rem", cursor: "pointer" }}>NO</button>
        </div>
      ) : (
        <button onClick={() => setConfirmDel(true)} style={{ background: "none", border: "none", color: "#2a2a2a", cursor: "pointer", fontSize: "0.88rem", padding: "2px 4px", flexShrink: 0 }}>×</button>
      )}
    </div>
  );
}
