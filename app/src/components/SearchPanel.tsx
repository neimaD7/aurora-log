import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Entry } from '../types';
import { inp } from '../constants';

interface SearchPanelProps {
  entries: Entry[];
  upcoming: Entry[];
  onClose: () => void;
}

interface SearchFilters {
  query: string;
  type: string;
  party: string;
  dateFrom: string;
  dateTo: string;
}

interface SearchResult {
  entry: Entry;
  source: 'entries' | 'upcoming';
  matchedItems: string[];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fuzzyMatch(needle: string, haystack: string): boolean {
  const n = normalize(needle);
  const h = normalize(haystack);
  if (!n) return true;
  return h.includes(n);
}

export function SearchPanel({ entries, upcoming, onClose }: SearchPanelProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '', type: '', party: '', dateFrom: '', dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [summaryMode, setSummaryMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo(() => {
    const allEntries: { entry: Entry; source: 'entries' | 'upcoming' }[] = [
      ...entries.filter(e => !e._deleted).map(e => ({ entry: e, source: 'entries' as const })),
      ...upcoming.filter(e => !e._deleted).map(e => ({ entry: e, source: 'upcoming' as const }))
    ];

    return allEntries.filter(({ entry }) => {
      // Type filter
      if (filters.type && entry.type !== filters.type) return false;

      // Party filter
      if (filters.party && !fuzzyMatch(filters.party, entry.party || '')) return false;

      // Date range
      if (filters.dateFrom && entry.date < filters.dateFrom) return false;
      if (filters.dateTo && entry.date > filters.dateTo) return false;

      // Text query - search across item names, party, notes, docId
      if (filters.query.trim()) {
        const q = filters.query.trim();
        const itemMatch = (entry.lineItems || []).some(li => fuzzyMatch(q, li.name || ''));
        const partyMatch = fuzzyMatch(q, entry.party || '');
        const notesMatch = fuzzyMatch(q, entry.notes || '');
        const docMatch = fuzzyMatch(q, entry.docId || '');
        if (!itemMatch && !partyMatch && !notesMatch && !docMatch) return false;
      }

      return true;
    }).map(({ entry, source }) => {
      const matchedItems = filters.query.trim()
        ? (entry.lineItems || []).filter(li => fuzzyMatch(filters.query.trim(), li.name || '')).map(li => li.name)
        : [];
      return { entry, source, matchedItems } as SearchResult;
    }).sort((a, b) => b.entry.date.localeCompare(a.entry.date));
  }, [entries, upcoming, filters]);

  // Aggregation summary
  const summary = useMemo(() => {
    if (!summaryMode || results.length === 0) return null;
    const itemMap: Record<string, { qty: number; unit: string; count: number }> = {};
    const partyMap: Record<string, number> = {};

    for (const { entry } of results) {
      partyMap[entry.party || 'Unknown'] = (partyMap[entry.party || 'Unknown'] || 0) + 1;
      for (const li of (entry.lineItems || [])) {
        const key = (li.name || '').trim();
        if (!key) continue;
        if (!itemMap[key]) itemMap[key] = { qty: 0, unit: li.unit || '', count: 0 };
        itemMap[key].qty += Number(li.qty) || 0;
        itemMap[key].count++;
        if (!itemMap[key].unit && li.unit) itemMap[key].unit = li.unit;
      }
    }

    const items = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty);
    const parties = Object.entries(partyMap).sort((a, b) => b[1] - a[1]);
    return { items, parties };
  }, [results, summaryMode]);

  const set = (k: keyof SearchFilters, v: string) => setFilters(f => ({ ...f, [k]: v }));

  const typeAccent: Record<string, string> = { "PO": "#aaaaaa", "Transfer In": "#00e676", "Transfer Out": "#ff3d3d" };

  const activeFilterCount = [filters.type, filters.party, filters.dateFrom, filters.dateTo].filter(Boolean).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          ref={inputRef}
          value={filters.query}
          onChange={e => set('query', e.target.value)}
          placeholder="Search items, vendors, stores, notes..."
          style={{ ...inp, flex: 1, background: '#0a0a0a', fontSize: '0.9rem', padding: '10px 12px' }}
        />
        <button onClick={() => setShowFilters(s => !s)} style={{
          background: activeFilterCount > 0 ? 'rgba(91,143,255,0.12)' : 'rgba(255,255,255,0.06)',
          border: '1px solid ' + (activeFilterCount > 0 ? 'rgba(91,143,255,0.3)' : 'rgba(255,255,255,0.06)'),
          borderRadius: 10, color: activeFilterCount > 0 ? '#5b8fff' : '#666666',
          padding: '8px 10px', fontFamily: "'SF Mono','Menlo','Courier New',monospace",
          fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
        }}>
          {activeFilterCount > 0 ? `FILTER (${activeFilterCount})` : 'FILTER'}
        </button>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
          color: '#666666', padding: '8px 12px', fontFamily: "'SF Mono','Menlo','Courier New',monospace",
          fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
        }}>✕</button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 120px', minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', color: '#555', letterSpacing: '0.1em', marginBottom: 3 }}>TYPE</div>
            <select value={filters.type} onChange={e => set('type', e.target.value)} style={{ ...inp, background: '#0a0a0a', padding: '6px 8px', fontSize: '0.8rem', width: '100%' }}>
              <option value="">All</option>
              <option value="PO">PO</option>
              <option value="Transfer In">Transfer In</option>
              <option value="Transfer Out">Transfer Out</option>
            </select>
          </div>
          <div style={{ flex: '1 1 120px', minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', color: '#555', letterSpacing: '0.1em', marginBottom: 3 }}>STORE/VENDOR</div>
            <input value={filters.party} onChange={e => set('party', e.target.value)} placeholder="Any" style={{ ...inp, background: '#0a0a0a', padding: '6px 8px', fontSize: '0.8rem' }} />
          </div>
          <div style={{ flex: '1 1 100px', minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', color: '#555', letterSpacing: '0.1em', marginBottom: 3 }}>FROM</div>
            <input type="date" value={filters.dateFrom} onChange={e => set('dateFrom', e.target.value)} style={{ ...inp, background: '#0a0a0a', padding: '6px 8px', fontSize: '0.8rem', width: '100%' }} />
          </div>
          <div style={{ flex: '1 1 100px', minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', color: '#555', letterSpacing: '0.1em', marginBottom: 3 }}>TO</div>
            <input type="date" value={filters.dateTo} onChange={e => set('dateTo', e.target.value)} style={{ ...inp, background: '#0a0a0a', padding: '6px 8px', fontSize: '0.8rem', width: '100%' }} />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => setFilters(f => ({ ...f, type: '', party: '', dateFrom: '', dateTo: '' }))} style={{
              background: 'none', border: 'none', color: '#ff4444', fontSize: '0.7rem',
              fontFamily: "'SF Mono','Menlo','Courier New',monospace", cursor: 'pointer', alignSelf: 'flex-end', padding: '6px 0'
            }}>CLEAR FILTERS</button>
          )}
        </div>
      )}

      {/* Results bar */}
      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <span style={{ color: '#555', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
        <button onClick={() => setSummaryMode(s => !s)} style={{
          background: summaryMode ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
          border: '1px solid ' + (summaryMode ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'),
          borderRadius: 8, color: summaryMode ? '#c9a84c' : '#555',
          padding: '4px 10px', fontFamily: "'SF Mono','Menlo','Courier New',monospace",
          fontSize: '0.64rem', fontWeight: 600, cursor: 'pointer'
        }}>{summaryMode ? 'SUMMARY ✓' : 'SUMMARY'}</button>
      </div>

      {/* Summary view */}
      {summaryMode && summary && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', maxHeight: '40vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.66rem', color: '#c9a84c', letterSpacing: '0.1em', marginBottom: 6 }}>ITEM TOTALS</div>
            {summary.items.slice(0, 20).map(([name, data]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: '#ccc', fontSize: '0.78rem' }}>{name}</span>
                <span style={{ color: '#888', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {data.qty} {data.unit} <span style={{ color: '#555', fontSize: '0.66rem' }}>({data.count}x)</span>
                </span>
              </div>
            ))}
            {summary.items.length > 20 && (
              <div style={{ color: '#555', fontSize: '0.7rem', marginTop: 4 }}>+{summary.items.length - 20} more items</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.66rem', color: '#c9a84c', letterSpacing: '0.1em', marginBottom: 6 }}>BY VENDOR/STORE</div>
            {summary.parties.map(([name, count]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: '#ccc', fontSize: '0.78rem' }}>{name}</span>
                <span style={{ color: '#888', fontSize: '0.78rem' }}>{count} entries</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {results.length === 0 && (filters.query || activeFilterCount > 0) ? (
          <div style={{ padding: '60px 30px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>🔍</div>
            <div style={{ color: '#555', fontSize: '0.84rem' }}>No results found</div>
            <div style={{ color: '#333', fontSize: '0.74rem', marginTop: 4 }}>Try different search terms or adjust filters</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '60px 30px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>🔍</div>
            <div style={{ color: '#555', fontSize: '0.84rem' }}>Search your warehouse log</div>
            <div style={{ color: '#333', fontSize: '0.74rem', marginTop: 4 }}>Type an item name, vendor, store, or doc number</div>
          </div>
        ) : (
          results.map(({ entry, source, matchedItems }) => (
            <div key={entry.id} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '12px 14px', marginTop: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: typeAccent[entry.type] || '#fff', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em' }}>
                    {(entry.type || '').toUpperCase()}
                  </span>
                  {source === 'upcoming' && (
                    <span style={{ color: '#c9a84c', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em' }}>UPCOMING</span>
                  )}
                </div>
                <span style={{ color: '#555', fontSize: '0.72rem' }}>{entry.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#ccc', fontSize: '0.84rem', fontWeight: 600 }}>{entry.party || '—'}</span>
                {entry.docId && <span style={{ color: '#555', fontSize: '0.72rem' }}>#{entry.docId}</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(entry.lineItems || []).map((li, idx) => {
                  const isMatch = matchedItems.includes(li.name);
                  return (
                    <span key={idx} style={{
                      background: isMatch ? 'rgba(91,143,255,0.12)' : 'rgba(255,255,255,0.04)',
                      border: '1px solid ' + (isMatch ? 'rgba(91,143,255,0.25)' : 'rgba(255,255,255,0.06)'),
                      borderRadius: 6, padding: '2px 7px', fontSize: '0.7rem',
                      color: isMatch ? '#7aa8f0' : '#888'
                    }}>
                      {li.name} {li.qty ? `×${li.qty}` : ''} {li.unit || ''}
                    </span>
                  );
                })}
              </div>
              {entry.notes && (
                <div style={{ marginTop: 6, color: '#555', fontSize: '0.72rem', fontStyle: 'italic' }}>{entry.notes}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
