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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <img src="/logo-white.svg" alt="MQD Tracker" className="app-logo" />
          <div className="header-text">
            <h1 className="app-title">MQD Tracker</h1>
          </div>
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
        {tab === 'dashboard' && <Dashboard entries={entries} settings={settings} onSettingsChange={setSettings} />}
        {tab === 'activity' && (
          <ActivityTable
            entries={entries}
            customCategories={settings.customCategories}
            onEntriesChange={setEntries}
          />
        )}
        {tab === 'import' && (
          <ImportPanel
            entries={entries}
            settings={settings}
            onEntriesChange={setEntries}
            onSettingsChange={setSettings}
            onNavigate={setTab}
          />
        )}
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
        <p className="disclaimer">
          This site is not affiliated with, endorsed by, or in any way officially connected to Delta Air Lines, Inc.
          All trademarks and service marks are the property of their respective owners.
        </p>
      </footer>
    </div>
  );
}
