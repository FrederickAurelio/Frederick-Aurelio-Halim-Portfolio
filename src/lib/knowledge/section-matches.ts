/** Match exact section id or numbered suffix (e.g. tech-stack → 4-tech-stack). */
export function sectionMatches(sectionId: string, requested: string): boolean {
  return (
    sectionId === requested ||
    sectionId.endsWith(`-${requested}`) ||
    requested.endsWith(`-${sectionId}`)
  );
}
