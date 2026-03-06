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
    cards: [
      { id: generateId(), name: 'Delta Amex Reserve', monthlySpend: 9000, mqdRate: 10 },
      { id: generateId(), name: 'Delta Amex Platinum', monthlySpend: 1000, mqdRate: 20 },
    ],
    customCategories: [],
  };
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
