const memory = new Map<string, string>();

export async function getItem(key: string): Promise<string | null> {
  return memory.get(key) ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  memory.set(key, value);
}
