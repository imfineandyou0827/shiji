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
