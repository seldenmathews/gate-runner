import Storage from 'expo-sqlite/kv-store';

export function getItem(key: string): Promise<string | null> {
  return Storage.getItem(key);
}

export function setItem(key: string, value: string): Promise<void> {
  return Storage.setItem(key, value);
}
