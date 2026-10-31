/** `?autodrive=1` plays the level with the scripted advisor. Used by web preview and simulator QA. */
export function isAutodriveParam(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === '1';
}
