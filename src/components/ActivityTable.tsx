import { useState } from 'react';
import { MQDEntry, DEFAULT_CATEGORIES } from '../types';
import { formatMQDs, formatMiles, formatDate } from '../utils/formatters';
import { createEntry } from '../store';

interface Props {
  entries: MQDEntry[];
  customCategories: string[];
  onEntriesChange: (entries: MQDEntry[]) => void;
}

export function ActivityTable({ entries, customCategories, onEntriesChange }: Props) {
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const filtered =
    filter === 'all' ? entries : entries.filter((e) => e.category === filter);

  const categories = [...new Set(entries.map((e) => e.category))];

  function handleDelete(id: string) {
    onEntriesChange(entries.filter((e) => e.id !== id));
  }

  function handleUpdate(updated: MQDEntry) {
    onEntriesChange(entries.map((e) => (e.id === updated.id ? updated : e)));
    setEditingId(null);
  }

  function handleAdd(entry: Omit<MQDEntry, 'id'>) {
    const newEntry = createEntry(entry);
    const updated = [...entries, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    onEntriesChange(updated);
    setShowAdd(false);
  }

  return (
    <div className="activity-panel">
      <div className="activity-header">
        <h2>Account Activity</h2>
        <div className="activity-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => setShowAdd(!showAdd)}>
            + Add Entry
          </button>
        </div>
      </div>

      {showAdd && (
        <AddEntryForm
          categories={allCategories}
          onAdd={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Route</th>
              <th className="num">Miles</th>
              <th className="num">MQDs</th>
              <th>Trip</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) =>
              editingId === e.id ? (
                <EditRow
                  key={e.id}
                  entry={e}
                  categories={allCategories}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.category}</td>
                  <td className="desc-cell">{e.description}</td>
                  <td>{e.origin && e.destination ? `${e.origin}-${e.destination}` : ''}</td>
                  <td className="num">{e.totalMiles ? formatMiles(e.totalMiles) : ''}</td>
                  <td className="num">{formatMQDs(e.totalMQDs)}</td>
                  <td>{e.trip || ''}</td>
                  <td>
                    <span className={`status-badge ${e.status.toLowerCase()}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-icon" title="Edit" onClick={() => setEditingId(e.id)}>
                      &#9998;
                    </button>
                    <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(e.id)}>
                      &times;
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <p className="entry-count">
        {filtered.length} entries &middot; Total MQDs: {formatMQDs(filtered.reduce((s, e) => s + e.totalMQDs, 0))}
      </p>
    </div>
  );
}

function AddEntryForm({
  categories,
  onAdd,
  onCancel,
}: {
  categories: string[];
  onAdd: (entry: Omit<MQDEntry, 'id'>) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [totalMQDs, setTotalMQDs] = useState(0);
  const [totalMiles, setTotalMiles] = useState(0);
  const [trip, setTrip] = useState('');
  const [status, setStatus] = useState<'Complete' | 'Pending'>('Complete');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      date,
      category,
      description,
      origin: origin || undefined,
      destination: destination || undefined,
      baseMiles: 0,
      bonusMiles: 0,
      totalMiles,
      baseMQDs: totalMQDs,
      bonusMQDs: 0,
      totalMQDs,
      trip: trip || undefined,
      status,
    });
  }

  return (
    <form className="add-entry-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
      </div>
      <div className="form-row">
        <label>
          Origin
          <input value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} maxLength={3} placeholder="ATL" />
        </label>
        <label>
          Destination
          <input value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} maxLength={3} placeholder="SFO" />
        </label>
        <label>
          MQDs
          <input type="number" value={totalMQDs} onChange={(e) => setTotalMQDs(Number(e.target.value))} required />
        </label>
        <label>
          Miles
          <input type="number" value={totalMiles} onChange={(e) => setTotalMiles(Number(e.target.value))} />
        </label>
        <label>
          Trip
          <input value={trip} onChange={(e) => setTrip(e.target.value)} placeholder="Optional" />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as 'Complete' | 'Pending')}>
            <option value="Complete">Complete</option>
            <option value="Pending">Pending</option>
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn primary">Add</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function EditRow({
  entry,
  categories,
  onSave,
  onCancel,
}: {
  entry: MQDEntry;
  categories: string[];
  onSave: (e: MQDEntry) => void;
  onCancel: () => void;
}) {
  const [e, setE] = useState({ ...entry });

  return (
    <tr className="edit-row">
      <td>
        <input type="date" value={e.date} onChange={(ev) => setE({ ...e, date: ev.target.value })} />
      </td>
      <td>
        <select value={e.category} onChange={(ev) => setE({ ...e, category: ev.target.value })}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>
      <td>
        <input value={e.description} onChange={(ev) => setE({ ...e, description: ev.target.value })} />
      </td>
      <td>
        <input
          value={e.origin || ''}
          onChange={(ev) => setE({ ...e, origin: ev.target.value.toUpperCase() })}
          maxLength={3}
          style={{ width: '3em' }}
        />
        -
        <input
          value={e.destination || ''}
          onChange={(ev) => setE({ ...e, destination: ev.target.value.toUpperCase() })}
          maxLength={3}
          style={{ width: '3em' }}
        />
      </td>
      <td>
        <input
          type="number"
          value={e.totalMiles}
          onChange={(ev) => setE({ ...e, totalMiles: Number(ev.target.value) })}
          style={{ width: '5em' }}
        />
      </td>
      <td>
        <input
          type="number"
          value={e.totalMQDs}
          onChange={(ev) => setE({ ...e, totalMQDs: Number(ev.target.value) })}
          style={{ width: '5em' }}
        />
      </td>
      <td>
        <input value={e.trip || ''} onChange={(ev) => setE({ ...e, trip: ev.target.value })} style={{ width: '6em' }} />
      </td>
      <td>
        <select value={e.status} onChange={(ev) => setE({ ...e, status: ev.target.value as 'Complete' | 'Pending' })}>
          <option value="Complete">Complete</option>
          <option value="Pending">Pending</option>
        </select>
      </td>
      <td className="actions">
        <button className="btn-icon" title="Save" onClick={() => onSave(e)}>&#10003;</button>
        <button className="btn-icon" title="Cancel" onClick={onCancel}>&times;</button>
      </td>
    </tr>
  );
}
