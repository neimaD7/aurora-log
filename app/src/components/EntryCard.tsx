import React, { useState, Fragment } from 'react';
import { EntryCardProps } from '../types';

/**
 * Card component for displaying logged entries (POs and transfers).
 * Shows entry details with edit/delete actions.
 */
export function EntryCard({ entry, onDelete, onEdit }: EntryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPO = entry.type === "PO";
  const isTransferIn = entry.type === "Transfer In";

  const accentColor = isPO ? "#333333" : isTransferIn ? "#00c853" : "#cc0000";
  const partyColor = isPO ? "#ffffff" : isTransferIn ? "#00e676" : "#ff3d3d";
  const partyLabel = isPO ? entry.party : isTransferIn ? `From ${entry.party}` : `To ${entry.party}`;

  const filteredItems = (entry.lineItems || []).filter(li => li.name);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16,
      padding: "14px 16px",
      marginBottom: 10,
      animation: "fadeIn 0.3s ease"
    }}>
      {/* Header with party and actions */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 2
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accentColor,
              flexShrink: 0
            }} />
            <span style={{
              color: partyColor,
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "-0.01em"
            }}>
              {partyLabel}
            </span>
          </div>
          {entry.docId && (
            <span style={{
              color: "#444444",
              fontSize: "0.72rem",
              marginLeft: 16
            }}>
              {entry.docId}
            </span>
          )}
        </div>

        <div style={{
          flexShrink: 0,
          marginLeft: 8,
          display: "flex",
          gap: 6,
          alignItems: "center"
        }}>
          {confirmDelete ? (
            <div style={{ display: "flex", gap: 5 }}>
              <button
                onClick={() => onDelete(entry.id)}
                style={{
                  background: "rgba(255,68,68,0.15)",
                  color: "#ff4444",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontFamily: "'SF Mono','Menlo','Courier New',monospace",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                DEL
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 8,
                  color: "#666666",
                  padding: "4px 10px",
                  fontFamily: "'SF Mono','Menlo','Courier New',monospace",
                  fontSize: "0.68rem",
                  cursor: "pointer"
                }}
              >
                NO
              </button>
            </div>
          ) : (
            <Fragment>
              <button
                onClick={() => onEdit(entry)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#444444",
                  cursor: "pointer",
                  fontSize: "0.7rem",
                  padding: "2px 4px",
                  fontFamily: "'SF Mono','Menlo','Courier New',monospace"
                }}
              >
                EDIT
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2a2a2a",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  padding: "2px 4px"
                }}
              >
                ×
              </button>
            </Fragment>
          )}
        </div>
      </div>

      {/* Line items */}
      <div style={{ paddingLeft: 16 }}>
        {filteredItems.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: 10,
              padding: "3px 0",
              alignItems: "baseline"
            }}
          >
            {(item.qty || item.unit) && (
              <span style={{
                color: "#5b8fff",
                fontWeight: 600,
                fontSize: "0.82rem",
                whiteSpace: "nowrap",
                flexShrink: 0,
                minWidth: 52
              }}>
                {item.qty}{item.unit ? ` ${item.unit}` : ""}
              </span>
            )}
            <span style={{
              color: "#e5e5e7",
              fontSize: "0.92rem",
              lineHeight: 1.45,
              overflowWrap: "anywhere"
            }}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Notes */}
      {entry.notes && (
        <div style={{
          marginTop: 8,
          fontSize: "0.76rem",
          color: "#555555",
          fontStyle: "italic",
          paddingLeft: 16
        }}>
          {entry.notes}
        </div>
      )}
    </div>
  );
}