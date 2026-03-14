import React, { useState, useEffect, useRef } from 'react';
import { Entry, KnownItem, SalesOrder, SyncState, PullItem, ParsedDocument, LineItem } from './types';
import { DEFAULT_PULL_PRIORITY } from './constants';
import { today, normalizeForMatch, matchPriority, getApiKey } from './utils';
import { GitHubSync } from './sync/GitHubSync';
import { AIIntake } from './components/AIIntake';
import { PullIntake } from './components/PullIntake';
import { PullItemRow } from './components/PullItemRow';
import { PullPriorityModal } from './components/PullPriorityModal';
import { PullSOCard } from './components/PullSOCard';
import { EntryCard } from './components/EntryCard';
import { UpcomingCard } from './components/UpcomingCard';
import { DateHeader } from './components/DateHeader';
import { AddModal } from './components/AddModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ItemDictModal } from './components/ItemDictModal';
import { LabelMakerModal } from './components/LabelMakerModal';
import { SyncTokenModal } from './components/SyncTokenModal';
import { SyncStatusBar } from './components/SyncStatusBar';
import { SearchPanel } from './components/SearchPanel';
import './styles/index.css';

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [upcoming, setUpcoming] = useState<Entry[]>([]);
  const [knownItems, setKnownItems] = useState<KnownItem[]>([]);
  const [pullQueue, setPullQueue] = useState<SalesOrder[]>([]);
  const [pullPriority, setPullPriority] = useState<string[]>([...DEFAULT_PULL_PRIORITY]);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [tab, setTab] = useState("po");
  const [showIntake, setShowIntake] = useState(false);
  const [showPullIntake, setShowPullIntake] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDict, setShowDict] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showSOList, setShowSOList] = useState(false);
  const [showSyncToken, setShowSyncToken] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [dataLost, setDataLost] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle", lastSync: null, error: null });

  const entriesRef = useRef(entries);
  const upcomingRef = useRef(upcoming);
  const knownItemsRef = useRef(knownItems);
  useEffect(() => { entriesRef.current = entries; }, [entries]);
  useEffect(() => { upcomingRef.current = upcoming; }, [upcoming]);
  useEffect(() => { knownItemsRef.current = knownItems; }, [knownItems]);

  useEffect(() => {
    const unsub = GitHubSync.onStatusChange(setSyncState);

    (async () => {
      let localEntries: Entry[] = [], localUpcoming: Entry[] = [], localKnown: KnownItem[] = [];
      try { const r = await window.storage.get("entries"); if (r?.value) { localEntries = JSON.parse(r.value); setEntries(localEntries); } } catch { /* storage unavailable */ }
      try { const r = await window.storage.get("upcoming"); if (r?.value) { localUpcoming = JSON.parse(r.value); setUpcoming(localUpcoming); } } catch { /* storage unavailable */ }
      try { const r = await window.storage.get("known_items"); if (r?.value) {
        localKnown = JSON.parse(r.value);
        let migrated = false;
        localKnown = localKnown.map(k => {
          if (!k.modifiedAt) { migrated = true; return { ...k, modifiedAt: Date.now() }; }
          return k;
        });
        if (migrated) { try { await window.storage.set("known_items", JSON.stringify(localKnown)); } catch { /* quota exceeded */ } }
        setKnownItems(localKnown);
      } } catch { /* storage unavailable */ }
      try { const r = await window.storage.get("pull_queue"); if (r?.value) setPullQueue(JSON.parse(r.value)); } catch { /* storage unavailable */ }
      try { const r = await window.storage.get("pull_priority"); if (r?.value) { const v = JSON.parse(r.value); if (Array.isArray(v) && v.length > 0) setPullPriority(v); } } catch { /* storage unavailable */ }
      setLoaded(true);
      window._appMounted = true;
      if (window._dataLost) setDataLost(true);
      if (!getApiKey()) setTimeout(() => setShowApiKey(true), 300);

      if (GitHubSync.isConfigured()) {
        try {
          await GitHubSync.fullSync(
            (key) => {
              if (key === "entries") return localEntries;
              if (key === "upcoming") return localUpcoming;
              if (key === "known_items") return localKnown;
              return [];
            },
            (key, merged) => {
              if (key === "entries") { localEntries = merged as Entry[]; setEntries(merged as Entry[]); window.storage.set("entries", JSON.stringify(merged)); }
              if (key === "upcoming") { localUpcoming = merged as Entry[]; setUpcoming(merged as Entry[]); window.storage.set("upcoming", JSON.stringify(merged)); }
              if (key === "known_items") { localKnown = merged as KnownItem[]; setKnownItems(merged as KnownItem[]); window.storage.set("known_items", JSON.stringify(merged)); }
            }
          );
        } catch(e) { console.error("Initial sync failed:", e); }
      }
    })();

    return unsub;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (syncState.lastSync) setSyncState(s => ({ ...s }));
    }, 30000);
    return () => clearInterval(interval);
  }, [syncState.lastSync]);

  // Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const persist = async (next: Entry[]) => {
    setEntries(next);
    try { await window.storage.set("entries", JSON.stringify(next)); } catch { /* quota exceeded */ }
    GitHubSync.debouncedPush("entries", next);
  };
  const persistUpcoming = async (next: Entry[]) => {
    setUpcoming(next);
    try { await window.storage.set("upcoming", JSON.stringify(next)); } catch { /* quota exceeded */ }
    GitHubSync.debouncedPush("upcoming", next);
  };
  const persistKnown = async (next: KnownItem[]) => {
    try { await window.storage.set("known_items", JSON.stringify(next)); } catch { /* quota exceeded */ }
    GitHubSync.debouncedPush("known_items", next);
  };
  const persistPullQueue = async (next: SalesOrder[]) => { setPullQueue(next); try { await window.storage.set("pull_queue", JSON.stringify(next)); } catch { /* quota exceeded */ } };
  const persistPullPriority = async (next: string[]) => { setPullPriority(next); try { await window.storage.set("pull_priority", JSON.stringify(next)); } catch { /* quota exceeded */ } };

  const learnItems = (lineItems: LineItem[]) => {
    const updated = [...knownItems];
    let changed = false;
    for (const li of (lineItems || [])) {
      const name = (li.name || "").trim();
      if (!name) continue;
      const existingIdx = updated.findIndex(k => normalizeForMatch(k.name) === normalizeForMatch(name));
      if (existingIdx === -1) { updated.push({ name, unit: (li.unit || "").trim(), modifiedAt: Date.now() }); changed = true; }
      else if (updated[existingIdx]._deleted) { updated[existingIdx] = { ...updated[existingIdx], _deleted: false, modifiedAt: Date.now() }; changed = true; }
    }
    if (changed) { updated.sort((a, b) => a.name.localeCompare(b.name)); setKnownItems(updated); persistKnown(updated); }
  };

  const makeEntry = (data: ParsedDocument): Entry => ({
    id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
    type: data.type, party: (data.party || "").trim(), docId: (data.docId || "").trim(),
    date: data.date || today(),
    lineItems: (data.lineItems || []).filter((li: LineItem) => (li.name || "").trim()),
    notes: (data.notes || "").trim(), createdAt: Date.now(), modifiedAt: Date.now()
  });

  const addEntry = (data: ParsedDocument) => {
    const entry = makeEntry(data);
    persist([entry, ...entries]);
    learnItems(entry.lineItems);
    setShowIntake(false);
  };

  const addUpcoming = (data: ParsedDocument) => {
    const entry = makeEntry(data);
    persistUpcoming([entry, ...upcoming]);
    learnItems(entry.lineItems);
    setShowIntake(false);
  };

  const confirmUpcoming = (upEntry: Entry) => {
    const updatedUpcoming = upcoming.map(u => u.id === upEntry.id ? { ...u, _deleted: true, modifiedAt: Date.now() } : u);
    persistUpcoming(updatedUpcoming);
    const entry = { ...upEntry, _deleted: false, date: today(), createdAt: Date.now(), modifiedAt: Date.now() };
    persist([entry, ...entries]);
  };

  const deleteUpcoming = (id: string) => {
    const updated = upcoming.map(u => u.id === id ? { ...u, _deleted: true, modifiedAt: Date.now() } : u);
    persistUpcoming(updated);
  };
  const deleteEntry = (id: string) => {
    const updated = entries.map(e => e.id === id ? { ...e, _deleted: true, modifiedAt: Date.now() } : e);
    persist(updated);
  };

  const handleEdit = (entry: Entry) => { setEditEntry(entry); setEditMode("entry"); setShowAdd(true); };
  const handleEditUpcoming = (entry: Entry) => { setEditEntry(entry); setEditMode("upcoming"); setShowAdd(true); };

  const handleSaveEdit = (data: ParsedDocument) => {
    if (editMode === "upcoming") {
      const updated = upcoming.map(e => e.id === editEntry!.id ? {
        ...e, type: data.type, party: (data.party || "").trim(), docId: (data.docId || "").trim(),
        date: data.date || today(), lineItems: (data.lineItems || []).filter((li: LineItem) => (li.name || "").trim()), notes: (data.notes || "").trim(),
        modifiedAt: Date.now()
      } : e);
      persistUpcoming(updated);
    } else {
      const updated = entries.map(e => e.id === editEntry!.id ? {
        ...e, type: data.type, party: (data.party || "").trim(), docId: (data.docId || "").trim(),
        date: data.date || today(), lineItems: (data.lineItems || []).filter((li: LineItem) => (li.name || "").trim()), notes: (data.notes || "").trim(),
        modifiedAt: Date.now()
      } : e);
      persist(updated);
    }
    learnItems((data.lineItems || []).filter((li: LineItem) => (li.name || "").trim()));
    setEditEntry(null); setEditMode(null); setShowAdd(false);
  };

  const closeModal = () => { setShowAdd(false); setEditEntry(null); setEditMode(null); };

  const handleSyncSaved = () => {
    if (GitHubSync.isConfigured()) {
      let snapEntries = [...entriesRef.current];
      let snapUpcoming = [...upcomingRef.current];
      let snapKnown = [...knownItemsRef.current];
      GitHubSync.fullSync(
        (key) => {
          if (key === "entries") return snapEntries;
          if (key === "upcoming") return snapUpcoming;
          if (key === "known_items") return snapKnown;
          return [];
        },
        (key, merged) => {
          if (key === "entries") { snapEntries = merged as Entry[]; setEntries(merged as Entry[]); window.storage.set("entries", JSON.stringify(merged)); }
          if (key === "upcoming") { snapUpcoming = merged as Entry[]; setUpcoming(merged as Entry[]); window.storage.set("upcoming", JSON.stringify(merged)); }
          if (key === "known_items") { snapKnown = merged as KnownItem[]; setKnownItems(merged as KnownItem[]); window.storage.set("known_items", JSON.stringify(merged)); }
        }
      ).catch(e => console.error("Sync after token save failed:", e));
    }
  };

  /* ===== PULL SHEET LOGIC ===== */
  const loadDemoSOs = () => {
    const demoSOs: SalesOrder[] = [
      {
        id: "demo1", customer: "Martinez Concrete", jobSite: "Lot 14 — Bethany Ridge", soNumber: "SO-40821",
        lineItems: [
          { name: '24" Stakes', qty: 50, unit: "pcs" },
          { name: '18" Stakes', qty: 30, unit: "pcs" },
          { name: "Bag Ties", qty: 4, unit: "rolls" },
          { name: "Form Oil", qty: 2, unit: "pails" },
          { name: "Dobies", qty: 200, unit: "pcs" },
          { name: "#4 Rebar 20' Grade 60", qty: 25, unit: "pcs" }
        ], addedAt: Date.now()
      },
      {
        id: "demo2", customer: "Willamette Builders", jobSite: "Block 7 — River Terrace", soNumber: "SO-40835",
        lineItems: [
          { name: '24" Stakes', qty: 30, unit: "pcs" },
          { name: "Dobies", qty: 150, unit: "pcs" },
          { name: 'Anchor Bolts 1/2" x 10"', qty: 40, unit: "pcs" },
          { name: "Form Clips", qty: 100, unit: "pcs" },
          { name: 'Snap Ties 8"', qty: 75, unit: "pcs" },
          { name: 'Pier Papers 12"', qty: 20, unit: "pcs" }
        ], addedAt: Date.now() + 1
      },
      {
        id: "demo3", customer: "JR Foundations", jobSite: "8824 SW Durham Rd", soNumber: "SO-40847",
        lineItems: [
          { name: "Bag Ties", qty: 2, unit: "rolls" },
          { name: "Form Oil", qty: 1, unit: "pails" },
          { name: '18" Stakes', qty: 20, unit: "pcs" },
          { name: 'Snap Ties 8"', qty: 50, unit: "pcs" },
          { name: "Flat Ties", qty: 30, unit: "pcs" }
        ], addedAt: Date.now() + 2
      }
    ];
    persistPullQueue(demoSOs);
    setCheckedItems({});
    setExpandedItems({});
  };
  const addSO = (so: SalesOrder) => { persistPullQueue([...pullQueue, so]); setShowPullIntake(false); };
  const removeSO = (id: string) => { persistPullQueue(pullQueue.filter(s => s.id !== id)); };
  const clearPull = () => { persistPullQueue([]); setCheckedItems({}); setExpandedItems({}); setShowSOList(false); };

  const mergedPullItems: PullItem[] = (() => {
    const map: Record<string, PullItem> = {};
    for (const so of pullQueue) {
      for (const li of (so.lineItems || [])) {
        const key = normalizeForMatch(li.name);
        if (!key) continue;
        if (!map[key]) {
          map[key] = { name: li.name, totalQty: 0, unit: li.unit || "", sources: [] };
        }
        map[key].totalQty += (Number(li.qty) || 0);
        if (!map[key].unit && li.unit) map[key].unit = li.unit;
        map[key].sources.push({ soId: so.id, customer: so.customer, jobSite: so.jobSite, soNumber: so.soNumber, qty: Number(li.qty) || 0 });
      }
    }
    const items = Object.values(map);
    items.sort((a, b) => {
      const pa = matchPriority(a.name, pullPriority);
      const pb = matchPriority(b.name, pullPriority);
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    });
    return items;
  })();

  const pullCheckedCount = mergedPullItems.filter((_, i) => checkedItems[i]).length;
  const pullTotalCount = mergedPullItems.length;

  const toggleCheck = (idx: number) => setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  const toggleExpand = (idx: number) => setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }));

  /* ===== VIEW LOGIC ===== */
  const activeEntries = entries.filter(e => !e._deleted);
  const activeUpcoming = upcoming.filter(e => !e._deleted);

  const visible = tab === "po" ? activeEntries.filter(e => e.type === "PO") : tab === "transfers" ? activeEntries.filter(e => e.type === "Transfer In" || e.type === "Transfer Out") : [];
  const grouped = (() => {
    const map: Record<string, Entry[]> = {};
    visible.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  })();
  const poCount = activeEntries.filter(e => e.type === "PO").length;
  const trCount = activeEntries.filter(e => e.type !== "PO").length;
  const upCount = activeUpcoming.length;
  const plCount = pullQueue.length;

  const tabBtn = (id: string, label: string, count: number, highlight?: string) => (
    <button onClick={() => setTab(id)} style={{
      background: tab === id ? (highlight ? highlight : "#ffffff") : "transparent",
      border: "none", borderRadius: 10,
      color: tab === id ? (highlight ? "#000000" : "#000000") : "#555555",
      padding: "8px 0", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: tab === id ? 700 : 500,
      fontSize: "0.72rem", letterSpacing: "0.04em", cursor: "pointer", whiteSpace: "nowrap", flex: "1 1 0", textAlign: "center",
      transition: "all 0.2s ease", position: "relative", zIndex: 1
    }}>
      {label}
      {count > 0 && <span style={{ marginLeft: 3, fontSize: "0.58rem", opacity: tab === id ? 0.7 : 0.5 }}>{count}</span>}
    </button>
  );

  const isPullTab = tab === "pull";

  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#e5e5e7", fontFamily: "'Courier New', monospace", maxWidth: 660, margin: "0 auto" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "18px 16px 16px", display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setShowDict(true)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: knownItems.filter(k => !k._deleted).length > 0 ? "#777777" : "#444444", padding: "7px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>
              DICT{knownItems.filter(k => !k._deleted).length > 0 && <span style={{ fontSize: "0.56rem", color: "#555555", marginLeft: 3 }}>{knownItems.filter(k => !k._deleted).length}</span>}
          </button>
          <button onClick={() => setShowSearch(true)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#666666", padding: "7px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>🔍</button>
          {isPullTab ? (
            <React.Fragment>
              <button onClick={() => setShowPullIntake(s => !s)} style={{ background: showPullIntake ? "rgba(91,143,255,0.12)" : "rgba(255,255,255,0.06)", border: "1px solid " + (showPullIntake ? "rgba(91,143,255,0.3)" : "rgba(255,255,255,0.06)"), borderRadius: 10, color: showPullIntake ? "#5b8fff" : "#666666", padding: "7px 12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}>{showPullIntake ? "HIDE" : "+ SO"}</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button onClick={() => setShowIntake(s => !s)} style={{ background: showIntake ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)", border: "1px solid " + (showIntake ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"), borderRadius: 10, color: showIntake ? "#ffffff" : "#666666", padding: "7px 12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer" }}>{showIntake ? "HIDE" : "SCAN"}</button>
              <button onClick={() => { setEditEntry(null); setEditMode(null); setShowAdd(true); }} style={{ background: "#ffffff", color: "#0a0a0a", border: "none", borderRadius: 10, padding: "7px 12px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}>+ LOG</button>
            </React.Fragment>
          )}
        </div>
      </div>

      {dataLost && (
        <div style={{ background: "#2a1000", border: "1px solid #c9a84c", padding: "10px 14px" }}>
          <div style={{ color: "#c9a84c", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.08em", marginBottom: 4 }}>DATA CORRUPTION DETECTED</div>
          <div style={{ color: "#999", fontSize: "0.76rem", lineHeight: 1.5, marginBottom: 8 }}>Both main and backup data were corrupted and could not be recovered. Corrupted data was saved to a recovery key.</div>
          <button onClick={() => setDataLost(false)} style={{ background: "none", border: "1px solid #3a3020", color: "#c9a84c", padding: "4px 12px", fontFamily: "'Courier New',monospace", fontSize: "0.72rem", cursor: "pointer" }}>DISMISS</button>
        </div>
      )}

      {showIntake && !isPullTab && <AIIntake onSave={addEntry} onSaveUpcoming={addUpcoming} knownItems={knownItems} />}
      {showPullIntake && isPullTab && <PullIntake onAddSO={addSO} knownItems={knownItems} />}

      <div style={{ padding: "10px 16px 6px" }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 3, gap: 3 }}>
          {tabBtn("po", "POs", poCount)}
          {tabBtn("transfers", "XFERS", trCount)}
          {tabBtn("upcoming", "UPCOMING", upCount, "#c9a84c")}
          {tabBtn("pull", "PULL", plCount, "#5b8fff")}
        </div>
      </div>

      <div style={{ padding: "0 12px calc(80px + env(safe-area-inset-bottom))" }}>
        {!loaded ? (
          <div style={{ padding: "80px 30px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 16, animation: "pulse 1.5s infinite" }}>📋</div>
            <div style={{ color: "#444444", fontSize: "0.84rem" }}>Loading...</div>
          </div>
        ) : tab === "pull" ? (
          pullQueue.length === 0 ? (
            <div style={{ padding: "80px 30px", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 16, opacity: 0.3 }}>📋</div>
              <div style={{ color: "#555555", fontSize: "0.92rem", fontWeight: 600, marginBottom: 6 }}>No sales orders</div>
              <div style={{ color: "#333333", fontSize: "0.76rem", marginBottom: 24, lineHeight: 1.5 }}>Tap + SO to scan or enter a sales order</div>
              <button onClick={loadDemoSOs} style={{ background: "rgba(91,143,255,0.1)", border: "1px solid rgba(91,143,255,0.2)", borderRadius: 12, color: "#5b8fff", padding: "10px 20px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em" }}>LOAD DEMO</button>
            </div>
          ) : (
            <div>
              <div style={{ margin: "16px 0 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ color: "#5b8fff", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em" }}>
                    {pullCheckedCount} / {pullTotalCount}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setShowSOList(s => !s)} style={{ background: "rgba(91,143,255,0.1)", border: "1px solid rgba(91,143,255,0.2)", borderRadius: 8, color: "#5b8fff", padding: "4px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.64rem", fontWeight: 600, cursor: "pointer" }}>
                      {pullQueue.length} SO{pullQueue.length !== 1 ? "s" : ""}
                    </button>
                    <button onClick={() => setShowPriority(true)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#666666", padding: "4px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.64rem", cursor: "pointer" }}>ORDER</button>
                    <button onClick={() => { if (confirm("Clear all SOs from pull sheet?")) clearPull(); }} style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.15)", borderRadius: 8, color: "#aa4444", padding: "4px 10px", fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontSize: "0.64rem", fontWeight: 600, cursor: "pointer" }}>CLEAR</button>
                  </div>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", width: "100%", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: 4, borderRadius: 2, background: pullCheckedCount === pullTotalCount && pullTotalCount > 0 ? "#00c853" : "#5b8fff", width: pullTotalCount > 0 ? ((pullCheckedCount / pullTotalCount) * 100) + "%" : "0%", transition: "width 0.3s ease, background 0.3s ease" }} />
                </div>
              </div>

              {showSOList && (
                <div style={{ marginBottom: 12, padding: "8px 0" }}>
                  <div style={{ fontSize: "0.68rem", color: "#555555", letterSpacing: "0.1em", marginBottom: 6 }}>LOADED ORDERS</div>
                  {pullQueue.map(so => <PullSOCard key={so.id} so={so} onRemove={removeSO} />)}
                </div>
              )}

              {pullCheckedCount === pullTotalCount && pullTotalCount > 0 && (
                <div style={{ background: "rgba(0,200,83,0.08)", border: "1px solid rgba(0,200,83,0.15)", borderRadius: 14, padding: "14px 16px", marginBottom: 12, textAlign: "center" }}>
                  <div style={{ color: "#00c853", fontWeight: 700, fontSize: "0.86rem", letterSpacing: "0.06em" }}>ALL ITEMS PULLED</div>
                  <div style={{ color: "#335533", fontSize: "0.7rem", marginTop: 4 }}>Tap CLEAR when orders are loaded out.</div>
                </div>
              )}
              {mergedPullItems.map((item, idx) => (
                <PullItemRow key={item.name} item={item} checked={!!checkedItems[idx]}
                  onToggle={() => toggleCheck(idx)} expanded={!!expandedItems[idx]}
                  onExpand={() => toggleExpand(idx)} />
              ))}
            </div>
          )
        ) : tab === "upcoming" ? (
          activeUpcoming.length === 0 ? (
            <div style={{ padding: "80px 30px", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 16, opacity: 0.3 }}>📦</div>
              <div style={{ color: "#555555", fontSize: "0.92rem", fontWeight: 600, marginBottom: 6 }}>No upcoming orders</div>
              <div style={{ color: "#333333", fontSize: "0.76rem", lineHeight: 1.5 }}>Orders staged here will appear when you tap UPCOMING during intake</div>
            </div>
          ) : (
            activeUpcoming.map(entry => <UpcomingCard key={entry.id} entry={entry} onConfirm={confirmUpcoming} onDelete={deleteUpcoming} onEdit={handleEditUpcoming} />)
          )
        ) : grouped.length === 0 ? (
          <div style={{ padding: "80px 30px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 16, opacity: 0.3 }}>{tab === "po" ? "📝" : "🔄"}</div>
            <div style={{ color: "#555555", fontSize: "0.92rem", fontWeight: 600, marginBottom: 6 }}>{"No " + (tab === "po" ? "purchase orders" : "transfers") + " yet"}</div>
            <div style={{ color: "#333333", fontSize: "0.76rem", lineHeight: 1.5 }}>Tap SCAN to photograph a document or + LOG to enter manually</div>
          </div>
        ) : (
          grouped.map(([date, dayEntries]) => (
            <div key={date}>
              <DateHeader dateStr={date} />
              {dayEntries.map(entry => <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} onEdit={handleEdit} />)}
            </div>
          ))
        )}
      </div>

      <SyncStatusBar syncState={syncState} />

      {showAdd && <AddModal onClose={closeModal} onSave={editEntry ? handleSaveEdit : addEntry} onSaveUpcoming={addUpcoming} defaultType={tab === "po" ? "PO" : tab === "transfers" ? "Transfer In" : "PO"} editEntry={editEntry} editMode={editMode} knownItems={knownItems} />}
      {showApiKey && <ApiKeyModal onClose={() => setShowApiKey(false)} />}
      {showDict && <ItemDictModal onClose={() => setShowDict(false)} knownItems={knownItems} setKnownItems={setKnownItems} persistKnown={persistKnown} onOpenLabels={() => setShowLabels(true)} onOpenApiKey={() => setShowApiKey(true)} onOpenSync={() => setShowSyncToken(true)} />}
      {showLabels && <LabelMakerModal onClose={() => setShowLabels(false)} knownItems={knownItems} />}
      {showPriority && <PullPriorityModal onClose={() => setShowPriority(false)} priority={pullPriority} onSave={persistPullPriority} />}
      {showSyncToken && <SyncTokenModal onClose={() => setShowSyncToken(false)} onSaved={handleSyncSaved} />}
      {showSearch && <SearchPanel entries={entries} upcoming={upcoming} onClose={() => setShowSearch(false)} />}
    </div>
  );
}
