import { MQDEntry, UserSettings, CardConfig } from './types';

const ENTRIES_KEY = 'mqd-tracker-entries';
const SETTINGS_KEY = 'mqd-tracker-settings';

function generateId(): string {
  return crypto.randomUUID();
}

export function loadEntries(): MQDEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: MQDEntry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
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

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings(), ...JSON.parse(raw) } : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function createCard(name: string, monthlySpend: number, mqdRate: number): CardConfig {
  return { id: generateId(), name, monthlySpend, mqdRate };
}

export function createEntry(partial: Omit<MQDEntry, 'id'>): MQDEntry {
  return { ...partial, id: generateId() };
}

export function exportData(entries: MQDEntry[], settings: UserSettings): string {
  return JSON.stringify({ entries, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export function importData(json: string): { entries: MQDEntry[]; settings: UserSettings } | null {
  try {
    const data = JSON.parse(json);
    if (data.entries && data.settings) {
      return { entries: data.entries, settings: data.settings };
    }
    return null;
  } catch {
    return null;
  }
}
