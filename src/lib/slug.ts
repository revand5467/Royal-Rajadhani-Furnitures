export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/**
 * Returns `slug`, `slug-2`, `slug-3`… until `isTaken` reports a free slot.
 * Used so two products with the same name still get distinct URLs.
 */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
  fallback = "item",
): Promise<string> {
  const seed = slugify(base) || fallback;
  let candidate = seed;
  let suffix = 2;
  while (await isTaken(candidate)) {
    candidate = `${seed}-${suffix}`;
    suffix += 1;
    if (suffix > 200) throw new Error("Could not generate a unique slug");
  }
  return candidate;
}
