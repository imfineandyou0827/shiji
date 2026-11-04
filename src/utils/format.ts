export function parseTags(value: string): string[] {
  return value
    .split(/[,，、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i);
}

export function tagsToInput(tags: string[]): string {
  return tags.join(', ');
}

export function pluralCount(n: number): string {
  return `${n} 项`;
}

export function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeWebUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return isWebUrl(withScheme) ? withScheme : '';
}
