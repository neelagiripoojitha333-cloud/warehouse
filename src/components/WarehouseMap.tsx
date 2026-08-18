import { mockBins } from '../data/mockData';

// Layout grid: each bin gets a fixed (x, y) position by zone for the visual map
const ZONE_LAYOUT: Record<string, { x: number; y: number }> = {
  'A-04': { x: 60, y: 60 },
  'A-09': { x: 60, y: 140 },
  'B-12': { x: 260, y: 100 },
  'C-02': { x: 460, y: 100 },
};

const ZONE_COLORS: Record<string, string> = {
  A: '#58a6ff',
  B: '#d29922',
  C: '#3fb950',
  OVERFLOW: '#f85149',
};

export default function WarehouseMap() {
  // Pick path: sequence through bins in a simple order for the demo
  const pickSequence = ['A-04', 'A-09', 'B-12', 'C-02'];
  const pathPoints = pickSequence
    .map(id => ZONE_LAYOUT[id])
    .filter(Boolean)
    .map(p => `${p.x + 30},${p.y + 20}`)
    .join(' ');

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Digital Twin — Warehouse Layout & Pick Path</h2>
      </div>

      <svg viewBox="0 0 600 220" className="warehouse-svg">
        {/* Zone background bands */}
        <rect x="20" y="30" width="120" height="160" rx="8" className="zone-band zone-a" />
        <rect x="220" y="30" width="120" height="160" rx="8" className="zone-band zone-b" />
        <rect x="420" y="30" width="120" height="160" rx="8" className="zone-band zone-c" />

        <text x="80" y="20" className="zone-label">ZONE A</text>
        <text x="280" y="20" className="zone-label">ZONE B</text>
        <text x="480" y="20" className="zone-label">ZONE C (Overflow)</text>

        {/* Pick path line */}
        <polyline points={pathPoints} className="pick-path" />

        {/* Bins */}
        {mockBins.map(bin => {
          const pos = ZONE_LAYOUT[bin.binId];
          if (!pos) return null;
          const isLow = bin.quantityAvailable <= 10;
          return (
            <g key={bin.binId}>
              <rect
                x={pos.x}
                y={pos.y}
                width="60"
                height="40"
                rx="6"
                className={isLow ? 'bin-box bin-low' : 'bin-box'}
                stroke={ZONE_COLORS[bin.zone]}
              />
              <text x={pos.x + 30} y={pos.y + 18} className="bin-id">{bin.binId}</text>
              <text x={pos.x + 30} y={pos.y + 32} className="bin-qty">{bin.quantityAvailable} avail</text>
            </g>
          );
        })}
      </svg>

      <div className="map-legend">
        <span><span className="legend-dot" style={{ background: '#f85149' }} /> Low stock (≤10 units)</span>
        <span><span className="legend-dot" style={{ background: '#58a6ff' }} /> Pick path route</span>
      </div>
    </section>
  );
}