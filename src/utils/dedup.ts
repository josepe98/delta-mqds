import { MQDEntry } from '../types';

function entryFingerprint(e: MQDEntry): string {
  // For flights: date + origin + destination + flight number + MQDs
  if (e.category === 'Flight') {
    return `flight|${e.date}|${e.origin}|${e.destination}|${e.flightNumber || ''}|${e.totalMQDs}`;
  }
  // For MQD Boost: date + description + MQDs (multiple boosts on same day with same amount are separate)
  if (e.category === 'MQD Boost' || e.category === 'MQD Headstart') {
    return `${e.category}|${e.date}|${e.description}|${e.totalMQDs}`;
  }
  // For Cars & Stays: date + MQDs + miles
  if (e.category === 'Delta Cars & Stays') {
    return `cars|${e.date}|${e.totalMQDs}|${e.totalMiles}`;
  }
  // Generic fallback
  return `${e.category}|${e.date}|${e.description}|${e.totalMQDs}|${e.totalMiles}`;
}

export function deduplicateEntries(
  existing: MQDEntry[],
  incoming: MQDEntry[]
): { newEntries: MQDEntry[]; duplicates: MQDEntry[]; updated: MQDEntry[] } {
  const existingFingerprints = new Map<string, MQDEntry>();
  for (const e of existing) {
    existingFingerprints.set(entryFingerprint(e), e);
  }

  const newEntries: MQDEntry[] = [];
  const duplicates: MQDEntry[] = [];
  const updated: MQDEntry[] = [];

  for (const entry of incoming) {
    const fp = entryFingerprint(entry);
    const match = existingFingerprints.get(fp);

    if (match) {
      // If existing is Pending and incoming is Complete, update it
      if (match.status === 'Pending' && entry.status === 'Complete') {
        updated.push({ ...entry, id: match.id, trip: match.trip });
      } else {
        duplicates.push(entry);
      }
    } else {
      newEntries.push(entry);
    }
  }

  return { newEntries, duplicates, updated };
}

export function mergeEntries(
  existing: MQDEntry[],
  newEntries: MQDEntry[],
  updated: MQDEntry[]
): MQDEntry[] {
  const updatedIds = new Set(updated.map((e) => e.id));
  const merged = existing.map((e) => {
    if (updatedIds.has(e.id)) {
      return updated.find((u) => u.id === e.id)!;
    }
    return e;
  });
  return [...merged, ...newEntries].sort((a, b) => a.date.localeCompare(b.date));
}
