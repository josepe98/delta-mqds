import { useState } from 'react';
import { MQDEntry, UserSettings, Tab } from './types';
import { defaultSettings } from './store';
import { Dashboard } from './components/Dashboard';
import { ActivityTable } from './components/ActivityTable';
import { ImportPanel } from './components/ImportPanel';
import { Settings } from './components/Settings';
import { HowToUse } from './components/HowToUse';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

export default function App() {
  const [entries, setEntries] = useState<MQDEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [tipDismissed, setTipDismissed] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-pill">
            <img src="/logo-white.svg" alt="MQD Tracker" className="app-logo" />
          </div>
          <div className="header-text">
            <h1 className="app-title">MQD Tracker <span className="beta-badge">Beta</span></h1>
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
          <button className={tab === 'how-to-use' ? 'active' : ''} onClick={() => setTab('how-to-use')}>
            How to Use
          </button>
        </nav>
      </header>

      <main className="app-main">
        {entries.length === 0 && !tipDismissed && tab !== 'import' && tab !== 'how-to-use' && (
          <div className="getting-started-tip">
            <span>
              Get started by uploading your MQD Account Activity PDF
              {' '}<button className="tip-link" onClick={() => setTab('import')}>Go to Import &rarr;</button>
            </span>
            <button className="tip-dismiss" onClick={() => setTipDismissed(true)}>&times;</button>
          </div>
        )}
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
        {tab === 'how-to-use' && <HowToUse />}
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 Erik Josephson. All rights reserved.</p>
        <p>No data is stored or sent anywhere. When you leave the page, all data is gone.</p>
        <p className="disclaimer">
          This site is not affiliated with, endorsed by, or in any way officially connected to Delta Air Lines, Inc.
          All trademarks and service marks are the property of their respective owners.
        </p>
      </footer>
      <Analytics />
    </div>
  );
}
