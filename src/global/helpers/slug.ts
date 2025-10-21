export function Slug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // &  →  -  (and any other symbol)
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}
