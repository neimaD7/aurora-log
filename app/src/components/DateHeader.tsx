import React from 'react';
import { formatDateHeading } from '../utils';

interface DateHeaderProps {
  dateStr: string;
}

/**
 * Date separator component for log entries.
 * Displays formatted date with decorative lines.
 */
export function DateHeader({ dateStr }: DateHeaderProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "24px 0 12px"
    }}>
      <div style={{
        flex: 1,
        height: 1,
        background: "rgba(255,255,255,0.06)"
      }} />
      <span style={{
        color: "#555555",
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.16em",
        whiteSpace: "nowrap"
      }}>
        {formatDateHeading(dateStr).toUpperCase()}
      </span>
      <div style={{
        flex: 1,
        height: 1,
        background: "rgba(255,255,255,0.06)"
      }} />
    </div>
  );
}