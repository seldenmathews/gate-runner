export async function getItem(key: string): Promise<string | null> {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  globalThis.localStorage.setItem(key, value);
}
