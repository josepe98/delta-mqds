import { useState } from 'react';
import { UserSettings, StatusLevel, STATUS_THRESHOLDS, MQDEntry } from '../types';
import { createCard, exportData, importData } from '../store';
import { formatMQDs } from '../utils/formatters';

interface Props {
  settings: UserSettings;
  entries: MQDEntry[];
  onSettingsChange: (settings: UserSettings) => void;
  onEntriesChange: (entries: MQDEntry[]) => void;
}

export function Settings({ settings, entries, onSettingsChange, onEntriesChange }: Props) {
  const [newCategory, setNewCategory] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardSpend, setNewCardSpend] = useState(0);
  const [newCardRate, setNewCardRate] = useState(10);

  function handleTargetChange(level: StatusLevel) {
    onSettingsChange({ ...settings, targetLevel: level });
  }

  function handleCustomTarget(val: number) {
    onSettingsChange({ ...settings, customTarget: val });
  }

  function addCategory() {
    if (newCategory && !settings.customCategories.includes(newCategory)) {
      onSettingsChange({
        ...settings,
        customCategories: [...settings.customCategories, newCategory],
      });
      setNewCategory('');
    }
  }

  function removeCategory(cat: string) {
    onSettingsChange({
      ...settings,
      customCategories: settings.customCategories.filter((c) => c !== cat),
    });
  }

  function addCard() {
    if (newCardName) {
      onSettingsChange({
        ...settings,
        cards: [...settings.cards, createCard(newCardName, newCardSpend, newCardRate)],
      });
      setNewCardName('');
      setNewCardSpend(0);
      setNewCardRate(10);
    }
  }

  function removeCard(id: string) {
    onSettingsChange({
      ...settings,
      cards: settings.cards.filter((c) => c.id !== id),
    });
  }

  function updateCard(id: string, field: string, value: number | string) {
    onSettingsChange({
      ...settings,
      cards: settings.cards.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  }

  function handleExport() {
    const json = exportData(entries, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mqd-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = importData(text);
      if (data) {
        onSettingsChange(data.settings);
        onEntriesChange(data.entries);
      }
    };
    input.click();
  }

  function handleClearData() {
    if (confirm('This will delete all your data. Are you sure?')) {
      onEntriesChange([]);
    }
  }

  return (
    <div className="settings-panel">
      <h2>Settings</h2>

      <div className="card">
        <h3>Status Target</h3>
        <div className="target-grid">
          {(Object.keys(STATUS_THRESHOLDS) as Exclude<StatusLevel, 'Custom'>[]).map((level) => (
            <button
              key={level}
              className={`target-btn ${settings.targetLevel === level ? 'active' : ''}`}
              onClick={() => handleTargetChange(level)}
            >
              <span className="target-level">{level}</span>
              <span className="target-amount">{formatMQDs(STATUS_THRESHOLDS[level])}</span>
            </button>
          ))}
          <button
            className={`target-btn ${settings.targetLevel === 'Custom' ? 'active' : ''}`}
            onClick={() => handleTargetChange('Custom')}
          >
            <span className="target-level">Custom</span>
            {settings.targetLevel === 'Custom' && (
              <input
                type="number"
                className="custom-target-input"
                value={settings.customTarget || ''}
                onChange={(e) => handleCustomTarget(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                placeholder="Amount"
              />
            )}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Credit Cards (for spending forecast)</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Card</th>
              <th className="num">Monthly Spend</th>
              <th className="num">$ per MQD</th>
              <th className="num">MQDs/mo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {settings.cards.map((card) => (
              <tr key={card.id}>
                <td>
                  <input
                    value={card.name}
                    onChange={(e) => updateCard(card.id, 'name', e.target.value)}
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    value={card.monthlySpend}
                    onChange={(e) => updateCard(card.id, 'monthlySpend', Number(e.target.value))}
                    style={{ width: '6em' }}
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    value={card.mqdRate}
                    onChange={(e) => updateCard(card.id, 'mqdRate', Number(e.target.value))}
                    style={{ width: '4em' }}
                  />
                </td>
                <td className="num">
                  {formatMQDs(Math.round(card.monthlySpend / card.mqdRate))}
                </td>
                <td>
                  <button className="btn-icon danger" onClick={() => removeCard(card.id)}>
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-row compact">
          <input placeholder="Card name" value={newCardName} onChange={(e) => setNewCardName(e.target.value)} />
          <input type="number" placeholder="Monthly spend" value={newCardSpend || ''} onChange={(e) => setNewCardSpend(Number(e.target.value))} />
          <input type="number" placeholder="$ per MQD" value={newCardRate || ''} onChange={(e) => setNewCardRate(Number(e.target.value))} />
          <button className="btn" onClick={addCard}>Add Card</button>
        </div>
      </div>

      <div className="card">
        <h3>Custom MQD Categories</h3>
        <p className="card-description">
          Add categories for any additional Delta incentives or promotions that earn MQDs.
        </p>
        {settings.customCategories.length > 0 && (
          <div className="tag-list">
            {settings.customCategories.map((cat) => (
              <span key={cat} className="tag">
                {cat}
                <button className="tag-remove" onClick={() => removeCategory(cat)}>
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="form-row compact">
          <input
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <button className="btn" onClick={addCategory}>Add</button>
        </div>
      </div>

      <div className="card">
        <h3>Data Management</h3>
        <div className="button-row">
          <button className="btn" onClick={handleExport}>Export Backup (JSON)</button>
          <button className="btn" onClick={handleImport}>Import Backup</button>
          <button className="btn danger" onClick={handleClearData}>Clear All Data</button>
        </div>
      </div>
    </div>
  );
}
