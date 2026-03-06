import { MQDEntry, UserSettings, CardConfig } from './types';

function generateId(): string {
  return crypto.randomUUID();
}

export function defaultSettings(): UserSettings {
  return {
    targetLevel: 'Diamond',
    cards: [],
    customCategories: [],
    anticipatedTrips: [],
  };
}

// Known card MQD rates: dollars spent per $1 MQD
const KNOWN_CARD_RATES: Record<string, number> = {
  'reserve': 10,
  'platinum': 20,
  'gold': 20,
  'blue': 20,
};

function detectMqdRate(cardName: string): number {
  const lower = cardName.toLowerCase();
  for (const [keyword, rate] of Object.entries(KNOWN_CARD_RATES)) {
    if (lower.includes(keyword)) return rate;
  }
  return 10; // default
}

function normalizeCardName(description: string): string {
  // Normalize "Delta AmEx" vs "Delta Amex" casing
  return description.replace(/AmEx/g, 'Amex');
}

export function extractCardsFromEntries(entries: MQDEntry[], existingCards: CardConfig[]): CardConfig[] {
  const cardNames = new Set<string>();
  for (const e of entries) {
    if (e.category === 'MQD Boost' || e.category === 'MQD Headstart') {
      const name = normalizeCardName(e.description);
      if (name) cardNames.add(name);
    }
  }

  const existingNames = new Set(existingCards.map((c) => c.name.toLowerCase()));
  const merged = [...existingCards];

  for (const name of cardNames) {
    if (!existingNames.has(name.toLowerCase())) {
      merged.push({
        id: generateId(),
        name,
        monthlySpend: 0,
        mqdRate: detectMqdRate(name),
      });
      existingNames.add(name.toLowerCase());
    }
  }

  return merged;
}

export function createCard(name: string, monthlySpend: number, mqdRate: number): CardConfig {
  return { id: generateId(), name, monthlySpend, mqdRate };
}

export function createEntry(partial: Omit<MQDEntry, 'id'>): MQDEntry {
  return { ...partial, id: generateId() };
}

function csvEscape(value: string): string {
  // Guard against formula injection in Excel/Sheets
  if (/^[=+\-@]/.test(value)) {
    value = "'" + value;
  }
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes("'")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportCSV(entries: MQDEntry[]): string {
  const headers = ['Date', 'Category', 'Description', 'Origin', 'Destination', 'Flight', 'Base MQDs', 'Bonus MQDs', 'Total MQDs', 'Status', 'Trip'];
  const rows = entries.map(e => [
    e.date,
    e.category,
    e.description,
    e.origin || '',
    e.destination || '',
    e.flightNumber || '',
    String(e.baseMQDs),
    String(e.bonusMQDs),
    String(e.totalMQDs),
    e.status,
    e.trip || '',
  ].map(csvEscape).join(','));
  return [headers.join(','), ...rows].join('\n');
}
