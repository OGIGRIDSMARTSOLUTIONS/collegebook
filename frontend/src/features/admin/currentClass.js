/**
 * The class new students are attached to. Mirrors the backend rule in
 * student.service (getImportAcademicSet / adminCreateStudent) exactly:
 * an ACTIVE, institution-wide set (no department), newest first.
 * Department-specific cohorts (for example the one created by seed.js)
 * are never used for new students, so they must not show as "current".
 */
export function isInstitutionClass(set) {
  return !set?.departmentId && (set?.status ?? 'ACTIVE') === 'ACTIVE';
}

export function pickCurrentClass(sets) {
  return [...(sets ?? [])]
    .filter(isInstitutionClass)
    .sort((a, b) => Number(b.startYear ?? 0) - Number(a.startYear ?? 0)
      || String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))[0] ?? null;
}
