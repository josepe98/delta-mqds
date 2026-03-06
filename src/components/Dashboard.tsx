import { MQDEntry, UserSettings, STATUS_THRESHOLDS } from '../types';
import { formatMQDs, formatPercent, getMonthName } from '../utils/formatters';

interface Props {
  entries: MQDEntry[];
  settings: UserSettings;
}

export function Dashboard({ entries, settings }: Props) {
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
  const progress = Math.min(totalMQDs / target, 1);
  const remaining = Math.max(target - totalMQDs, 0);

  // By category
  const categories = new Map<string, { complete: number; pending: number }>();
  for (const e of entries) {
    const cat = categories.get(e.category) || { complete: 0, pending: 0 };
    if (e.status === 'Complete') cat.complete += e.totalMQDs;
    else cat.pending += e.totalMQDs;
    categories.set(e.category, cat);
  }

  // Monthly timeline
  const monthly = new Map<number, number>();
  for (const e of entries) {
    const month = parseInt(e.date.split('-')[1]);
    monthly.set(month, (monthly.get(month) || 0) + e.totalMQDs);
  }
  let cumulative = 0;
  const timeline = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const mqds = monthly.get(month) || 0;
    cumulative += mqds;
    return { month, mqds, cumulative };
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
  const projectedTotal = totalMQDs + projectedBoostMQDs;

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
      <div className="hero-card">
        <h2>{settings.targetLevel} Medallion Target</h2>
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
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="progress-text">
          {formatPercent(progress)} of target
          {remaining > 0
            ? ` \u2014 ${formatMQDs(remaining)} still needed`
            : ` \u2014 ${formatMQDs(totalMQDs - target)} above target`}
        </p>
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
                <th className="num">MQDs</th>
                <th className="num">Cumulative</th>
                <th className="num">% of Target</th>
              </tr>
            </thead>
            <tbody>
              {timeline
                .filter((m) => m.mqds > 0 || m.month <= currentMonth)
                .map((m) => (
                  <tr key={m.month}>
                    <td>{getMonthName(m.month)}</td>
                    <td className="num">{formatMQDs(m.mqds)}</td>
                    <td className="num">{formatMQDs(m.cumulative)}</td>
                    <td className="num">{formatPercent(m.cumulative / target)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

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
            <div className="forecast-item">
              <span className="forecast-label">Projected boost (rest of year)</span>
              <span className="forecast-value">{formatMQDs(projectedBoostMQDs)}</span>
            </div>
            <div className="forecast-item highlight">
              <span className="forecast-label">Projected year-end total</span>
              <span className="forecast-value">{formatMQDs(Math.round(projectedTotal))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
