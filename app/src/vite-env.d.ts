/// <reference types="vite/client" />

interface WindowStorage {
  get(key: string): Promise<{ key: string; value: string }>;
  set(key: string, value: string): Promise<{ key: string; value: string }>;
}

interface Window {
  _appMounted: boolean;
  _dataLost: boolean;
  storage: WindowStorage;
}
