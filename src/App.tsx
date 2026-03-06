import { useState, useEffect } from 'react';
import { MQDEntry, UserSettings, Tab } from './types';
import { loadEntries, saveEntries, loadSettings, saveSettings } from './store';
import { Dashboard } from './components/Dashboard';
import { ActivityTable } from './components/ActivityTable';
import { ImportPanel } from './components/ImportPanel';
import { Settings } from './components/Settings';
import './App.css';

export default function App() {
  const [entries, setEntries] = useState<MQDEntry[]>(() => loadEntries());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const totalMQDs = entries.reduce((s, e) => s + e.totalMQDs, 0);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Delta MQD Tracker</h1>
          <span className="header-total">${totalMQDs.toLocaleString()} MQDs</span>
        </div>
        <nav className="tab-nav">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
            Dashboard
          </button>
          <button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>
            Activity
          </button>
          <button className={tab === 'import' ? 'active' : ''} onClick={() => setTab('import')}>
            Import
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
            Settings
          </button>
        </nav>
      </header>

      <main className="app-main">
        {tab === 'dashboard' && <Dashboard entries={entries} settings={settings} />}
        {tab === 'activity' && (
          <ActivityTable
            entries={entries}
            customCategories={settings.customCategories}
            onEntriesChange={setEntries}
          />
        )}
        {tab === 'import' && <ImportPanel entries={entries} onEntriesChange={setEntries} onNavigate={setTab} />}
        {tab === 'settings' && (
          <Settings
            settings={settings}
            entries={entries}
            onSettingsChange={setSettings}
            onEntriesChange={setEntries}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>All data stays in your browser. Nothing is sent to any server.</p>
      </footer>
    </div>
  );
}
