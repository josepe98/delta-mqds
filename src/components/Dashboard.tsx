import { useState } from 'react';
import { MQDEntry, UserSettings, AnticipatedTrip, STATUS_THRESHOLDS, STATUS_COLORS } from '../types';
import { formatMQDs, formatPercent, getMonthName } from '../utils/formatters';

interface Props {
  entries: MQDEntry[];
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
}

export function Dashboard({ entries, settings, onSettingsChange }: Props) {
  const [newTripDesc, setNewTripDesc] = useState('');
  const [newTripMQDs, setNewTripMQDs] = useState('');
  const target =
    settings.targetLevel === 'Custom'
      ? settings.customTarget || 28000
      : STATUS_THRESHOLDS[settings.targetLevel];

  const completeMQDs = entries
    .filter((e) => e.status === 'Complete')
    .reduce((sum, e) => sum + e.totalMQDs, 0);
  const pendingMQDs = entries
    .filter((e) => e.status === 'Pending')
    .reduce((sum, e) => sum + e.totalMQDs, 0);
  const totalMQDs = completeMQDs + pendingMQDs;

  // By category
  const categories = new Map<string, { complete: number; pending: number }>();
  for (const e of entries) {
    const cat = categories.get(e.category) || { complete: 0, pending: 0 };
    if (e.status === 'Complete') cat.complete += e.totalMQDs;
    else cat.pending += e.totalMQDs;
    categories.set(e.category, cat);
  }

  // Monthly timeline
  const monthlyEarned = new Map<number, number>();
  const monthlyPending = new Map<number, number>();
  for (const e of entries) {
    const month = parseInt(e.date.split('-')[1]);
    if (e.status === 'Complete') {
      monthlyEarned.set(month, (monthlyEarned.get(month) || 0) + e.totalMQDs);
    } else {
      monthlyPending.set(month, (monthlyPending.get(month) || 0) + e.totalMQDs);
    }
  }
  let cumulative = 0;
  const timeline = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const earned = monthlyEarned.get(month) || 0;
    const pending = monthlyPending.get(month) || 0;
    cumulative += earned + pending;
    return { month, earned, pending, cumulative };
  });

  // Spending forecast
  const monthlyBoostMQDs = settings.cards.reduce(
    (sum, card) => sum + card.monthlySpend / card.mqdRate,
    0
  );
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const monthsRemaining = 12 - currentMonth;
  const projectedBoostMQDs = Math.round(monthlyBoostMQDs * monthsRemaining);
  const anticipatedTripMQDs = settings.anticipatedTrips.reduce((sum, t) => sum + t.mqds, 0);
  const totalProjectedMQDs = projectedBoostMQDs + anticipatedTripMQDs;
  const projectedTotal = totalMQDs + totalProjectedMQDs;

  const addTrip = () => {
    const mqds = parseInt(newTripMQDs);
    if (!newTripDesc.trim() || !mqds) return;
    const trip: AnticipatedTrip = { id: crypto.randomUUID(), description: newTripDesc.trim(), mqds };
    onSettingsChange({ ...settings, anticipatedTrips: [...settings.anticipatedTrips, trip] });
    setNewTripDesc('');
    setNewTripMQDs('');
  };

  const removeTrip = (id: string) => {
    onSettingsChange({ ...settings, anticipatedTrips: settings.anticipatedTrips.filter(t => t.id !== id) });
  };

  // By trip
  const trips = new Map<string, { mqds: number; status: string }>();
  for (const e of entries) {
    if (e.trip) {
      const t = trips.get(e.trip) || { mqds: 0, status: 'Complete' };
      t.mqds += e.totalMQDs;
      if (e.status === 'Pending') t.status = 'Pending';
      trips.set(e.trip, t);
    }
  }

  return (
    <div className="dashboard">
      <div
        className="hero-card"
        style={settings.targetLevel !== 'Custom'
          ? { '--tier-color': STATUS_COLORS[settings.targetLevel] } as React.CSSProperties
          : undefined}
      >
        <div className="hero-title-row">
          {settings.targetLevel !== 'Custom' && <span className="tier-badge large" />}
          <h2>{settings.targetLevel} Medallion Target</h2>
        </div>
        <div className="hero-numbers">
          <div className="hero-stat">
            <span className="hero-label">Target</span>
            <span className="hero-value">{formatMQDs(target)}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-label">Earned</span>
            <span className="hero-value earned">{formatMQDs(completeMQDs)}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-label">Pending</span>
            <span className="hero-value pending">{formatMQDs(pendingMQDs)}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-label">Total</span>
            <span className="hero-value">{formatMQDs(totalMQDs)}</span>
          </div>
        </div>
        {(() => {
          const barMax = Math.max(target, totalMQDs);
          const overTarget = totalMQDs > target;
          return (
            <>
              <div className="progress-bar-container">
                <div className="progress-bar earned-segment" style={{ width: `${(completeMQDs / barMax) * 100}%` }} />
                <div className="progress-bar pending-segment" style={{ width: `${(pendingMQDs / barMax) * 100}%`, left: `${(completeMQDs / barMax) * 100}%` }} />
                {overTarget && <div className="target-marker" data-label={`${formatMQDs(target)} Target`} style={{ left: `${(target / barMax) * 100}%` }} />}
              </div>
              <p className="progress-text">
                {formatPercent(totalMQDs / target)} of target
                {totalMQDs < target
                  ? ` \u2014 ${formatMQDs(target - totalMQDs)} still needed`
                  : ` \u2014 ${formatMQDs(totalMQDs - target)} above target`}
              </p>
            </>
          );
        })()}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>MQDs by Category</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Complete</th>
                <th className="num">Pending</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...categories.entries()].map(([cat, vals]) => (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td className="num">{formatMQDs(vals.complete)}</td>
                  <td className="num">{formatMQDs(vals.pending)}</td>
                  <td className="num">{formatMQDs(vals.complete + vals.pending)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total</td>
                <td className="num">{formatMQDs(completeMQDs)}</td>
                <td className="num">{formatMQDs(pendingMQDs)}</td>
                <td className="num">{formatMQDs(totalMQDs)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {trips.size > 0 && (
          <div className="card">
            <h3>MQDs by Trip</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th className="num">MQDs</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...trips.entries()].map(([trip, vals]) => (
                  <tr key={trip}>
                    <td>{trip}</td>
                    <td className="num">{formatMQDs(vals.mqds)}</td>
                    <td>
                      <span className={`status-badge ${vals.status.toLowerCase()}`}>
                        {vals.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card">
          <h3>Monthly Timeline</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="num">Earned</th>
                <th className="num">Pending</th>
                <th className="num">Cumulative</th>
                <th className="num">% of Target</th>
              </tr>
            </thead>
            <tbody>
              {timeline
                .filter((m) => m.earned > 0 || m.pending > 0 || m.month <= currentMonth)
                .map((m) => (
                  <tr key={m.month}>
                    <td>{getMonthName(m.month)}</td>
                    <td className="num">{formatMQDs(m.earned)}</td>
                    <td className="num">{m.pending ? formatMQDs(m.pending) : ''}</td>
                    <td className="num">{formatMQDs(m.cumulative)}</td>
                    <td className="num">{formatPercent(m.cumulative / target)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

      </div>

      <div
        className="hero-card projection-card"
        style={settings.targetLevel !== 'Custom'
          ? { '--tier-color': STATUS_COLORS[settings.targetLevel] } as React.CSSProperties
          : undefined}
      >
        <div className="hero-title-row">
          <h2>Projected Year-End</h2>
        </div>
        <div className="hero-numbers">
          <div className="hero-stat">
            <span className="hero-label">Earned</span>
            <span className="hero-value earned">{formatMQDs(completeMQDs)}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-label">Pending</span>
            <span className="hero-value pending">{formatMQDs(pendingMQDs)}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-label">Projected</span>
            <span className="hero-value projected">{formatMQDs(totalProjectedMQDs)}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-label">Total</span>
            <span className="hero-value">{formatMQDs(Math.round(projectedTotal))}</span>
          </div>
        </div>
        {(() => {
          const barMax = Math.max(target, projectedTotal);
          const overTarget = projectedTotal > target;
          return (
            <>
              <div className="progress-bar-container">
                <div className="progress-bar earned-segment" style={{ width: `${(completeMQDs / barMax) * 100}%` }} />
                <div className="progress-bar pending-segment" style={{ width: `${(pendingMQDs / barMax) * 100}%`, left: `${(completeMQDs / barMax) * 100}%` }} />
                <div className="progress-bar projected-segment" style={{ width: `${(totalProjectedMQDs / barMax) * 100}%`, left: `${((completeMQDs + pendingMQDs) / barMax) * 100}%` }} />
                {overTarget && <div className="target-marker" data-label={`${formatMQDs(target)} Target`} style={{ left: `${(target / barMax) * 100}%` }} />}
              </div>
              <p className="progress-text">
                {formatPercent(projectedTotal / target)} of target
                {projectedTotal < target
                  ? ` \u2014 ${formatMQDs(target - Math.round(projectedTotal))} still needed`
                  : ` \u2014 ${formatMQDs(Math.round(projectedTotal) - target)} above target`}
              </p>
            </>
          );
        })()}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Spending Forecast</h3>
          <div className="forecast-grid">
            {settings.cards.map((card) => (
              <div key={card.id} className="forecast-item">
                <span className="forecast-label">{card.name}</span>
                <span className="forecast-value">
                  ${card.monthlySpend.toLocaleString()}/mo = ~$
                  {Math.round(card.monthlySpend / card.mqdRate).toLocaleString()} MQDs/mo
                </span>
              </div>
            ))}
            <div className="forecast-item">
              <span className="forecast-label">Projected MQD Boost/mo</span>
              <span className="forecast-value">{formatMQDs(Math.round(monthlyBoostMQDs))}</span>
            </div>
            <div className="forecast-item">
              <span className="forecast-label">Months remaining</span>
              <span className="forecast-value">{monthsRemaining}</span>
            </div>
            <div className="forecast-item highlight">
              <span className="forecast-label">Projected card boost</span>
              <span className="forecast-value">{formatMQDs(projectedBoostMQDs)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Anticipated Trips</h3>
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Trip</th>
                <th className="num">MQDs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {settings.anticipatedTrips.map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.description}</td>
                  <td className="num">{formatMQDs(trip.mqds)}</td>
                  <td className="actions">
                    <button className="btn-icon danger" onClick={() => removeTrip(trip.id)}>✕</button>
                  </td>
                </tr>
              ))}
              {settings.anticipatedTrips.length > 0 && (
                <tr className="total-row">
                  <td>Total</td>
                  <td className="num">{formatMQDs(anticipatedTripMQDs)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="form-row compact">
            <label>
              Trip
              <input type="text" value={newTripDesc} onChange={e => setNewTripDesc(e.target.value)} placeholder="e.g. ATL → LAX roundtrip" />
            </label>
            <label>
              MQDs
              <input type="number" value={newTripMQDs} onChange={e => setNewTripMQDs(e.target.value)} placeholder="0" style={{ width: '5rem' }} />
            </label>
            <button className="btn primary" style={{ alignSelf: 'flex-end' }} onClick={addTrip}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
