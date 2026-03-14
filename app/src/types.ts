// TypeScript interfaces for Aurora Log application

export interface LineItem {
  name: string;
  qty: number | string;
  unit?: string;
  _matched?: boolean; // Added by AI parsing when matched to known item
}

export interface Entry {
  id: string;
  type: 'PO' | 'Transfer In' | 'Transfer Out';
  party: string; // vendor for PO, store name for transfers
  docId?: string; // document/order number
  date: string; // YYYY-MM-DD format
  lineItems: LineItem[];
  notes?: string;
  createdAt?: number;
  modifiedAt: number;
  _deleted?: boolean; // Soft delete flag
}

// Same structure as Entry, used for staged items
export type UpcomingEntry = Entry;

export interface KnownItem {
  name: string;
  unit?: string;
  category?: string;
  modifiedAt?: number;
  _deleted?: boolean; // Soft delete flag
}

export interface SalesOrder {
  id: string;
  customer: string;
  jobSite?: string;
  soNumber?: string;
  lineItems: LineItem[];
  addedAt: number;
}

export interface PullItemSource {
  soId: string;
  customer: string;
  jobSite?: string;
  soNumber?: string;
  qty: number;
}

export interface PullItem {
  name: string;
  totalQty: number;
  unit: string;
  sources: PullItemSource[];
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSync: number | null;
  error: string | null;
}

export interface ParsedDocument {
  type: 'PO' | 'Transfer In' | 'Transfer Out';
  party: string;
  docId?: string;
  date: string;
  lineItems: LineItem[];
  notes?: string;
}

export interface ParsedSalesOrder {
  customer: string;
  jobSite?: string;
  soNumber?: string;
  lineItems: LineItem[];
}

export interface ImageData {
  base64: string;
  mediaType: string;
  preview: string;
}

// Component prop types
export interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  knownItems?: KnownItem[];
  inputStyle?: React.CSSProperties;
}

export interface AIIntakeProps {
  onSave: (data: ParsedDocument) => void;
  onSaveUpcoming: (data: ParsedDocument) => void;
  knownItems: KnownItem[];
}

export interface PullIntakeProps {
  onAddSO: (so: SalesOrder) => void;
  knownItems: KnownItem[];
}

export interface EntryCardProps {
  entry: Entry;
  onDelete: (id: string) => void;
  onEdit: (entry: Entry) => void;
}

export interface UpcomingCardProps {
  entry: UpcomingEntry;
  onConfirm: (entry: UpcomingEntry) => void;
  onDelete: (id: string) => void;
  onEdit: (entry: UpcomingEntry) => void;
}

export interface PullItemRowProps {
  item: PullItem;
  checked: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
}

export interface SyncStatusBarProps {
  syncState: SyncState;
}

export interface PullPriorityModalProps {
  onClose: () => void;
  priority: string[];
  onSave: (priority: string[]) => void;
}

export interface PullSOCardProps {
  so: SalesOrder;
  onRemove: (id: string) => void;
}

export interface AddModalProps {
  onClose: () => void;
  onSave: (data: ParsedDocument) => void;
  onSaveUpcoming: (data: ParsedDocument) => void;
  defaultType?: 'PO' | 'Transfer In' | 'Transfer Out';
  editEntry?: Entry | null;
  editMode?: boolean;
  knownItems: KnownItem[];
}

export interface ItemDictModalProps {
  onClose: () => void;
  knownItems: KnownItem[];
  setKnownItems: (items: KnownItem[]) => void;
  persistKnown: () => void;
  onOpenLabels: () => void;
  onOpenApiKey: () => void;
  onOpenSync: () => void;
}

export interface LabelMakerModalProps {
  onClose: () => void;
  knownItems: KnownItem[];
}

// Storage types
export type StorageKey = 'entries' | 'upcoming' | 'known_items' | 'pull_queue' | 'pull_priority';

export interface StorageResult {
  key: string;
  value: string;
}

export interface WindowStorage {
  get(key: string): Promise<StorageResult>;
  set(key: string, value: string): Promise<StorageResult>;
}

// Global window extensions
declare global {
  interface Window {
    storage: WindowStorage;
    _appMounted: boolean;
    _dataLost: boolean;
  }
}