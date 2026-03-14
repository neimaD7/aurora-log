import React, { useState, Fragment } from 'react';
import { UpcomingCardProps } from '../types';

/**
 * Card component for displaying upcoming/staged entries.
 * Shows entry details with RECEIVED/SENT confirmation button and edit/delete actions.
 */
export function UpcomingCard({ entry, onConfirm, onDelete, onEdit }: UpcomingCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPO = entry.type === "PO";
  const isTransferIn = entry.type === "Transfer In";
  const isTransferOut = entry.type === "Transfer Out";

  const partyLabel = isPO ? entry.party : isTransferIn ? `From ${entry.party}` : `To ${entry.party}`;
  const confirmLabel = isTransferOut ? "SENT" : "RECEIVED";

  const filteredItems = (entry.lineItems || []).filter(li => li.name);

  return (
    <div style={{
      background: "rgba(201,168,76,0.06)",
      border: "1px solid rgba(201,168,76,0.15)",
      borderRadius: 16,
      padding: "14px 16px",
      marginBottom: 10,
      animation: "fadeIn 0.3s ease"
    }}>
      {/* Header with type and party */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            color: "#c9a84c",
            fontWeight: 600,
            fontSize: "0.68rem",
            letterSpacing: "0.1em"
          }}>
            {(entry.type || "").toUpperCase()}
          </span>
          <div style={{
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "1rem",
            marginTop: 3,
            letterSpacing: "-0.01em"
          }}>
            {partyLabel}
          </div>
          {entry.docId && (
            <span style={{
              color: "#444444",
              fontSize: "0.72rem"
            }}>
              {entry.docId}
            </span>
          )}
          <div style={{
            color: "#3a3a3a",
            fontSize: "0.66rem",
            marginTop: 3
          }}>
            Staged {entry.date || ""}
          </div>
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
      <div style={{ marginBottom: 12, paddingLeft: 0 }}>
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
          marginBottom: 10,
          fontSize: "0.76rem",
          color: "#555555",
          fontStyle: "italic"
        }}>
          {entry.notes}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={() => onConfirm(entry)}
        style={{
          background: "#c9a84c",
          color: "#0a0a0a",
          border: "none",
          borderRadius: 12,
          padding: "10px 20px",
          fontFamily: "'SF Mono','Menlo','Courier New',monospace",
          fontWeight: 700,
          fontSize: "0.86rem",
          letterSpacing: "0.06em",
          cursor: "pointer",
          width: "100%"
        }}
      >
        {confirmLabel}
      </button>
    </div>
  );
}