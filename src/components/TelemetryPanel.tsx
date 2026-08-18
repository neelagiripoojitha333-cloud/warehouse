import { mockOrders, mockBins } from '../data/mockData';

function computeKpis() {
  const totalOrders = mockOrders.length;
  const criticalOrders = mockOrders.filter(o => {
    const minsLeft = (new Date(o.dispatchCutoff).getTime() - Date.now()) / 60000;
    return minsLeft <= 30;
  }).length;

  const lowStockBins = mockBins.filter(b => b.quantityAvailable <= 10).length;
  const avgPickFrequency = Math.round(
    mockBins.reduce((sum, b) => sum + b.pickFrequencyScore, 0) / mockBins.length
  );

  // Simulated on-time SLA % — based on how many orders are NOT critical
  const onTimeSlaPct = Math.round(((totalOrders - criticalOrders) / totalOrders) * 100);

  return { totalOrders, criticalOrders, lowStockBins, avgPickFrequency, onTimeSlaPct };
}

export default function TelemetryPanel() {
  const kpis = computeKpis();

  const bottleneckMessage =
    kpis.criticalOrders > 0
      ? `${kpis.criticalOrders} order(s) at CRITICAL SLA risk — allocation engine is actively rebalancing stock to protect dispatch windows.`
      : 'No active bottlenecks detected. All orders on track.';

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Executive Telemetry</h2>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{kpis.totalOrders}</div>
          <div className="kpi-label">Orders in Queue</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value kpi-critical">{kpis.criticalOrders}</div>
          <div className="kpi-label">Critical SLA Risk</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.onTimeSlaPct}%</div>
          <div className="kpi-label">On-Time Dispatch SLA</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value kpi-warn">{kpis.lowStockBins}</div>
          <div className="kpi-label">Low-Stock Bins</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.avgPickFrequency}</div>
          <div className="kpi-label">Avg Pick Frequency</div>
        </div>
      </div>

      <div className="bottleneck-alert">⚠ {bottleneckMessage}</div>
    </section>
  );
}