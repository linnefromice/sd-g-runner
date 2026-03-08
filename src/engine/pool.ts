/**
 * Acquire an inactive slot from a pre-allocated entity pool.
 * Returns the slot with `active = true` and all properties from `template` applied,
 * or `null` if no slot is available.
 */
export function acquireFromPool<T extends { active: boolean }>(
  pool: T[],
  template: T,
): T | null {
  const slot = pool.find((e) => !e.active);
  if (!slot) return null;
  Object.assign(slot, template);
  slot.active = true;
  return slot;
}
