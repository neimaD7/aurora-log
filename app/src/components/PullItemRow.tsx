import React from 'react';
import { PullItemRowProps } from '../types';

export function PullItemRow({ item, checked, onToggle, expanded, onExpand }: PullItemRowProps) {
  return (
    <div style={{ background: checked ? "rgba(0,200,83,0.06)" : "rgba(255,255,255,0.04)", border: "1px solid " + (checked ? "rgba(0,200,83,0.12)" : "rgba(255,255,255,0.06)"), borderRadius: 14, marginBottom: 8, transition: "all 0.15s ease" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, border: "2px solid " + (checked ? "#00c853" : "rgba(255,255,255,0.15)"),
          background: checked ? "#00c853" : "transparent", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, transition: "all 0.15s"
        }}>
          {checked && <span style={{ color: "#0a0a0a", fontWeight: 700, fontSize: "1rem", lineHeight: 1 }}>✓</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: checked ? "#557755" : "#e5e5e7", fontSize: "0.92rem", fontWeight: 700, textDecoration: checked ? "line-through" : "none", overflowWrap: "anywhere" }}>{item.name}</div>
          <div style={{ color: checked ? "#335533" : "#5b8fff", fontWeight: 600, fontSize: "0.82rem", marginTop: 3 }}>
            {item.totalQty}{item.unit ? " " + item.unit : ""}
            {item.sources.length > 1 && <span style={{ color: "#444444", fontWeight: 400, fontSize: "0.7rem", marginLeft: 8 }}>{item.sources.length} orders</span>}
          </div>
        </div>
        {item.sources.length > 1 && (
          <button onClick={(e) => { e.stopPropagation(); onExpand(); }} style={{
            background: expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: expanded ? "#ffffff" : "#555555",
            padding: "4px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.66rem", cursor: "pointer", flexShrink: 0
          }}>{expanded ? "HIDE" : "SPLIT"}</button>
        )}
      </div>
      {expanded && item.sources.length > 1 && (
        <div style={{ padding: "0 13px 10px 51px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {item.sources.map((src, si) => (
            <div key={si} style={{ display: "flex", gap: 10, padding: "5px 0", alignItems: "baseline", borderBottom: si < item.sources.length - 1 ? "1px solid #151515" : "none" }}>
              <span style={{ color: "#5b8fff", fontWeight: 700, fontSize: "0.78rem", whiteSpace: "nowrap", minWidth: 44 }}>{src.qty}{item.unit ? " " + item.unit : ""}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: "#cccccc", fontSize: "0.8rem" }}>{src.customer}</span>
                {src.jobSite && <span style={{ color: "#444444", fontSize: "0.7rem", marginLeft: 6 }}>{src.jobSite}</span>}
                {src.soNumber && <span style={{ color: "#3a3a3a", fontSize: "0.66rem", marginLeft: 6 }}>SO {src.soNumber}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
