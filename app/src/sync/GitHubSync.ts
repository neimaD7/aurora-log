import { Entry, KnownItem, SyncState, StorageKey } from '../types';
import { GITHUB_CONFIG, SYNC_DEBOUNCE_MS, REAP_AGE_MS } from '../constants';
import { normalizeForMatch } from '../utils';

type StatusListener = (state: SyncState) => void;
// Union of all syncable data types
type SyncEntry = Entry | KnownItem;
type GetLocalFn = (key: StorageKey) => SyncEntry[];
type SetLocalFn = (key: StorageKey, data: SyncEntry[]) => void;

interface GitHubFileContent {
  sha: string;
  content: string;
}

interface GitHubPutBody {
  message: string;
  content: string;
  sha?: string;
}

interface GitHubPutResponse {
  content: { sha: string };
  conflict?: boolean;
}

/**
 * GitHub sync module for Aurora Log data synchronization.
 * Handles bidirectional sync with GitHub repository.
 */
class GitHubSyncModule {
  private readonly OWNER = GITHUB_CONFIG.owner;
  private readonly REPO = GITHUB_CONFIG.repo;
  private _shas: Record<string, string> = {};
  private _debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  private _listeners: StatusListener[] = [];
  private _status: SyncState['status'] = 'idle';
  private _lastSync: number | null = null;
  private _error: string | null = null;

  /**
   * Get GitHub sync token from localStorage
   */
  getToken(): string {
    return localStorage.getItem("aurora_sync_token") || "";
  }

  /**
   * Set GitHub sync token in localStorage
   */
  setToken(token: string): void {
    localStorage.setItem("aurora_sync_token", token);
  }

  /**
   * Check if sync is configured with a valid token
   */
  isConfigured(): boolean {
    return !!this.getToken();
  }

  /**
   * Notify all status listeners of state changes
   */
  private _notifyListeners(): void {
    const state: SyncState = {
      status: this._status,
      lastSync: this._lastSync,
      error: this._error
    };
    this._listeners.forEach(fn => {
      try {
        fn(state);
      } catch {
        // Ignore listener errors
      }
    });
  }

  /**
   * Add status change listener
   */
  onStatusChange(fn: StatusListener): () => void {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(f => f !== fn);
    };
  }

  /**
   * Set sync status and notify listeners
   */
  private _setStatus(status: SyncState['status'], error?: string): void {
    this._status = status;
    if (error) {
      this._error = error;
    }
    if (status === "synced") {
      this._lastSync = Date.now();
      this._error = null;
    }
    this._notifyListeners();
  }

  /**
   * Make authenticated GET request to GitHub API
   */
  private async _apiGet(path: string): Promise<GitHubFileContent | null> {
    const url = `https://api.github.com/repos/${this.OWNER}/${this.REPO}/contents/${path}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": "Bearer " + this.getToken(),
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (response.status === 404) return null;
    if (response.status === 403 || response.status === 429) {
      throw new Error("Rate limited");
    }
    if (!response.ok) {
      throw new Error("GitHub API error: " + response.status);
    }

    return response.json() as Promise<GitHubFileContent>;
  }

  /**
   * Make authenticated PUT request to GitHub API
   */
  private async _apiPut(path: string, content: string, sha?: string): Promise<GitHubPutResponse> {
    const url = `https://api.github.com/repos/${this.OWNER}/${this.REPO}/contents/${path}`;
    const body: GitHubPutBody = {
      message: "sync " + path,
      content: btoa(unescape(encodeURIComponent(content)))
    };
    if (sha) body.sha = sha;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + this.getToken(),
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (response.status === 409) {
      return { conflict: true, content: { sha: "" } };
    }
    if (response.status === 403 || response.status === 429) {
      throw new Error("Rate limited");
    }
    if (!response.ok) {
      throw new Error("GitHub PUT error: " + response.status);
    }

    const data = await response.json() as GitHubPutResponse;
    this._shas[path] = data.content.sha;
    return data;
  }

  /**
   * Pull data from GitHub for given data type
   */
  async pull(dataType: string): Promise<SyncEntry[] | null> {
    const path = dataType + ".json";
    try {
      const file = await this._apiGet(path);
      if (!file) return null;

      this._shas[path] = file.sha;
      const decoded = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
      return JSON.parse(decoded) as SyncEntry[];
    } catch(e) {
      console.error("Sync pull error (" + dataType + "):", e);
      throw e;
    }
  }

  /**
   * Push local data to GitHub with merge logic
   */
  async push(dataType: string, localData: SyncEntry[]): Promise<SyncEntry[]> {
    if (!this.isConfigured()) return localData;

    const path = dataType + ".json";
    try {
      this._setStatus("syncing");

      // Get current remote data for SHA and merge
      let remoteData: SyncEntry[] | null = null;
      try {
        const file = await this._apiGet(path);
        if (file) {
          this._shas[path] = file.sha;
          const decoded = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
          remoteData = JSON.parse(decoded) as SyncEntry[];
        }
      } catch {
        // File doesn't exist yet, that's fine
      }

      // Merge local and remote data
      let merged: SyncEntry[];
      if (dataType === "known_items") {
        merged = this._mergeKnownItems(localData as KnownItem[], remoteData as KnownItem[] | null);
      } else {
        merged = this._mergeEntries(localData as Entry[], remoteData as Entry[] | null);
      }

      const content = JSON.stringify(merged, null, 2);
      const result = await this._apiPut(path, content, this._shas[path]);

      if (result && result.conflict) {
        // SHA mismatch — re-pull and retry once
        const file = await this._apiGet(path);
        if (file) {
          this._shas[path] = file.sha;
          const decoded = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
          remoteData = JSON.parse(decoded) as SyncEntry[];
          merged = dataType === "known_items"
            ? this._mergeKnownItems(localData as KnownItem[], remoteData as KnownItem[])
            : this._mergeEntries(localData as Entry[], remoteData as Entry[]);
          await this._apiPut(path, JSON.stringify(merged, null, 2), this._shas[path]);
        }
      }

      this._setStatus("synced");
      return merged;
    } catch(e) {
      console.error("Sync push error (" + dataType + "):", e);
      this._setStatus("error", (e as Error).message);
      throw e;
    }
  }

  /**
   * Merge entries using last-modified-wins strategy
   */
  private _mergeEntries(local: Entry[] | null, remote: Entry[] | null): Entry[] {
    if (!remote) return local || [];
    if (!local) return remote;

    const map: Record<string, Entry> = {};

    // Add remote entries first
    for (const entry of remote) {
      map[entry.id] = entry;
    }

    // Overlay local entries — last-modified wins
    for (const entry of local) {
      const existing = map[entry.id];
      if (!existing || (entry.modifiedAt || 0) >= (existing.modifiedAt || 0)) {
        map[entry.id] = entry;
      }
    }

    return Object.values(map);
  }

  /**
   * Merge known items by normalized name with last-modified-wins
   */
  private _mergeKnownItems(local: KnownItem[] | null, remote: KnownItem[] | null): KnownItem[] {
    if (!remote) return local || [];
    if (!local) return remote;

    const map: Record<string, KnownItem> = {};

    // Add remote items first
    for (const item of remote) {
      map[normalizeForMatch(item.name)] = item;
    }

    // Overlay local items — last-modified wins
    for (const item of local) {
      const key = normalizeForMatch(item.name);
      const existing = map[key];
      if (!existing) {
        map[key] = item;
      } else {
        if ((item.modifiedAt || 0) > (existing.modifiedAt || 0)) {
          map[key] = item;
        }
      }
    }

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Debounced push to avoid excessive API calls
   */
  debouncedPush(dataType: string, localData: SyncEntry[]): void {
    if (!this.isConfigured()) return;

    if (this._debounceTimers[dataType]) {
      clearTimeout(this._debounceTimers[dataType]);
    }

    this._debounceTimers[dataType] = setTimeout(() => {
      this.push(dataType, localData).catch(() => {
        // Error already logged and status set in push()
      });
    }, SYNC_DEBOUNCE_MS);
  }

  /**
   * Full bidirectional sync on app start
   */
  async fullSync(getLocal: GetLocalFn, setLocal: SetLocalFn): Promise<void> {
    if (!this.isConfigured()) return;

    this._setStatus("syncing");
    const types = [
      { key: "entries" as StorageKey, storageKey: "entries" as StorageKey },
      { key: "upcoming" as StorageKey, storageKey: "upcoming" as StorageKey },
      { key: "known_items" as StorageKey, storageKey: "known_items" as StorageKey }
    ];

    // Phase 1: Pull and merge only
    for (const t of types) {
      try {
        const remoteData = await this.pull(t.key);
        if (remoteData) {
          const localData = getLocal(t.storageKey);
          let merged: SyncEntry[];
          if (t.key === "known_items") {
            merged = this._mergeKnownItems(localData as KnownItem[], remoteData as KnownItem[]);
          } else {
            merged = this._mergeEntries(localData as Entry[], remoteData as Entry[]);
          }
          setLocal(t.storageKey, merged);
        }
      } catch(e) {
        console.error("fullSync pull error for " + t.key + ":", e);
      }
    }

    // Phase 1.5: Reap tombstones older than 24 hours
    const now = Date.now();
    for (const t of types) {
      try {
        const data = getLocal(t.storageKey);
        if (data && data.length > 0) {
          const reaped = (data as (Entry & KnownItem)[]).filter(
            item => !(item._deleted && item.modifiedAt && (now - item.modifiedAt) > REAP_AGE_MS)
          );
          if (reaped.length < data.length) {
            console.log("Reaped " + (data.length - reaped.length) + " tombstones from " + t.key);
            setLocal(t.storageKey, reaped);
          }
        }
      } catch(e) {
        console.error("Reap error for " + t.key + ":", e);
      }
    }

    // Phase 2: Push all local data back
    for (const t of types) {
      try {
        const data = getLocal(t.storageKey);
        if (data && data.length > 0) {
          await this.push(t.key, data);
        }
      } catch(e) {
        console.error("fullSync push error for " + t.key + ":", e);
      }
    }

    this._setStatus("synced");
  }
}

// Export singleton instance
export const GitHubSync = new GitHubSyncModule();
