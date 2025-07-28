export function Slug(name: string): string {
  return name.replace(/\s+/g, '-').toLowerCase();
}
