import { useState } from 'react';
import { mockExceptions, type MockException } from '../data/mockData';

function typeLabel(type: MockException['type']) {
  const labels: Record<MockException['type'], string> = {
    ITEM_DAMAGED: 'Item Damaged',
    BIN_COUNT_DISCREPANCY: 'Bin Count Discrepancy',
    MISSING_SKU: 'Missing SKU',
    CARRIER_DELAY: 'Carrier Delay',
  };
  return labels[type];
}

export default function ExceptionPanel() {
  const [exceptions, setExceptions] = useState<MockException[]>(mockExceptions);

  function resolve(exceptionId: string, optionId: string) {
    setExceptions(prev =>
      prev.map(exc =>
        exc.exceptionId === exceptionId
          ? { ...exc, status: 'RESOLVED', chosenResolution: optionId }
          : exc
      )
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Exception & Incident Command Center</h2>
      </div>

      {exceptions.map(exc => (
        <div key={exc.exceptionId} className="exception-card">
          <div className="exception-top">
            <span className="badge badge-critical">{typeLabel(exc.type)}</span>
            <span className="exception-meta">
              Order {exc.orderId} · SKU {exc.sku} · Bin {exc.binId} · Qty affected: {exc.qtyAffected}
            </span>
            {exc.status === 'RESOLVED' && <span className="badge badge-ontrack">RESOLVED</span>}
          </div>

          {exc.status === 'OPEN' ? (
            <div className="resolution-options">
              {exc.resolutionOptions.map((opt, i) => (
                <button
                  key={opt.id}
                  className="btn-option"
                  onClick={() => resolve(exc.exceptionId, opt.id)}
                >
                  [Option {i + 1}] {opt.label}
                  {opt.etaImpactSec > 0 && ` (Adds ${Math.round(opt.etaImpactSec / 60)} min)`}
                </button>
              ))}
            </div>
          ) : (
            <div className="allocation-reason">
              → Resolved via: {exc.resolutionOptions.find(o => o.id === exc.chosenResolution)?.label}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}