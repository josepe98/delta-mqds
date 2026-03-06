import { useState, useRef } from 'react';
import { MQDEntry, UserSettings } from '../types';
import { parseDeltaPDF } from '../utils/pdfParser';
import { deduplicateEntries, mergeEntries } from '../utils/dedup';
import { extractCardsFromEntries } from '../store';
import { formatMQDs, formatDate } from '../utils/formatters';

interface Props {
  entries: MQDEntry[];
  settings: UserSettings;
  onEntriesChange: (entries: MQDEntry[]) => void;
  onSettingsChange: (settings: UserSettings) => void;
  onNavigate: (tab: 'dashboard') => void;
}

type ImportState = 'idle' | 'parsing' | 'review' | 'error';

export function ImportPanel({ entries, settings, onEntriesChange, onSettingsChange, onNavigate }: Props) {
  const currentYear = new Date().getFullYear();
  const [state, setState] = useState<ImportState>('idle');
  const [error, setError] = useState('');
  const [filterYear, setFilterYear] = useState(currentYear);
  const [parsed, setParsed] = useState<MQDEntry[]>([]);
  const [dedupResult, setDedupResult] = useState<{
    newEntries: MQDEntry[];
    duplicates: MQDEntry[];
    updated: MQDEntry[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState('parsing');
    setError('');
    try {
      const results = await parseDeltaPDF(file, filterYear);
      setParsed(results);
      const dedup = deduplicateEntries(entries, results);
      setDedupResult(dedup);
      setState('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse PDF');
      setState('error');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFile(file);
    }
  }

  function handleImport() {
    if (!dedupResult) return;
    const merged = mergeEntries(entries, dedupResult.newEntries, dedupResult.updated);
    onEntriesChange(merged);
    const updatedCards = extractCardsFromEntries(merged, settings.cards);
    if (updatedCards.length !== settings.cards.length) {
      onSettingsChange({ ...settings, cards: updatedCards });
    }
    setState('idle');
    setParsed([]);
    setDedupResult(null);
    onNavigate('dashboard');
  }

  function reset() {
    setState('idle');
    setParsed([]);
    setDedupResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="import-panel">
      <h2>Import Delta Account Activity</h2>
      <p className="import-instructions">
        Export your account activity from{' '}
        <strong>delta.com &rarr; My SkyMiles &rarr; Account Activity</strong>,
        then print/save as PDF. Drop or select the PDF below.
      </p>

      {state === 'idle' && (
        <>
          <div className="import-year-filter">
            <label>
              Import year:
              <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
                <option value={0}>All years</option>
              </select>
            </label>
            <span className="year-hint">
              Delta PDFs often include prior-year data. Filtering avoids double-counting.
            </span>
          </div>
          <div
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <p className="drop-text">Drop PDF here or click to select</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </>
      )}

      {state === 'parsing' && (
        <div className="import-status">
          <p>Parsing PDF...</p>
        </div>
      )}

      {state === 'error' && (
        <div className="import-status error">
          <p>Error: {error}</p>
          <button onClick={reset}>Try Again</button>
        </div>
      )}

      {state === 'review' && dedupResult && (
        <div className="import-review">
          <div className="review-summary">
            <h3>Import Summary</h3>
            <p>
              Parsed <strong>{parsed.length}</strong> entries from PDF
              {filterYear ? ` (${filterYear} only)` : ''}.
            </p>
            <div className="review-counts">
              <span className="review-badge new">
                {dedupResult.newEntries.length} new
              </span>
              <span className="review-badge updated">
                {dedupResult.updated.length} updated
              </span>
              <span className="review-badge duplicate">
                {dedupResult.duplicates.length} duplicates (skipped)
              </span>
            </div>
          </div>

          <div className="review-actions">
            <button className="btn primary" onClick={handleImport}>
              Import {dedupResult.newEntries.length + dedupResult.updated.length} entries
            </button>
            <button className="btn" onClick={reset}>
              Cancel
            </button>
          </div>

          {dedupResult.newEntries.length > 0 && (
            <div className="review-section">
              <h4>New Entries</h4>
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="num">MQDs</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dedupResult.newEntries.map((e) => (
                    <tr key={e.id}>
                      <td>{formatDate(e.date)}</td>
                      <td>{e.category}</td>
                      <td>{e.description}</td>
                      <td className="num">{formatMQDs(e.totalMQDs)}</td>
                      <td>
                        <span className={`status-badge ${e.status.toLowerCase()}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {dedupResult.updated.length > 0 && (
            <div className="review-section">
              <h4>Updated (Pending &rarr; Complete)</h4>
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="num">MQDs</th>
                  </tr>
                </thead>
                <tbody>
                  {dedupResult.updated.map((e) => (
                    <tr key={e.id}>
                      <td>{formatDate(e.date)}</td>
                      <td>{e.category}</td>
                      <td>{e.description}</td>
                      <td className="num">{formatMQDs(e.totalMQDs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
