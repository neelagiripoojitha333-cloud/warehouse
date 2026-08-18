import { useState } from 'react';
import type { Order, InventoryBin } from '../types';
import { allocateStockForSku, type AllocationResult } from '../engine/allocation';
import { scoreOrder } from '../engine/scoring';

function makeOrder(id: string, tier: Order['customerTier'], qty: number, minsToCutoff: number, sku = 'SKU-001'): Order {
  const now = new Date();
  return {
    orderId: id,
    customerId: `cust-${id}`,
    customerTier: tier,
    deliveryMethod: minsToCutoff <= 60 ? 'SAME_DAY' : 'NEXT_DAY',
    slaDeadline: new Date(now.getTime() + minsToCutoff * 60000).toISOString(),
    dispatchCutoff: new Date(now.getTime() + minsToCutoff * 60000).toISOString(),
    orderValue: 100 + Math.random() * 300,
    lineItems: [{
      lineId: `${id}-line1`, sku, qtyRequested: qty, qtyAllocated: 0, qtyPicked: 0,
      allowPartialFulfillment: true, sourceBinAllocations: [],
    }],
    status: 'PRIORITIZED', priorityScore: 0,
    priorityBreakdown: { tierScore: 0, slaUrgencyScore: 0, deliveryMethodScore: 0, orderValueScore: 0, totalScore: 0, riskLevel: 'ON_TRACK' },
    createdAt: now.toISOString(), exceptions: [],
  };
}

function makeBins(qty: number): InventoryBin[] {
  return [{
    binId: 'A-04', zone: 'A', aisle: '4', rack: '1', shelf: '1', sku: 'SKU-001',
    quantityOnHand: qty, quantityReserved: 0, quantityAvailable: qty,
    isOverflow: false, lastCycleCountAt: new Date().toISOString(), pickFrequencyScore: 0,
  }];
}

type ScenarioResult = {
  title: string;
  summary: string;
  allocations: AllocationResult[];
};

export default function ChaosSimulator() {
  const [result, setResult] = useState<ScenarioResult | null>(null);

  function runStockShortage() {
    const orders = [
      makeOrder('VIP-1', 'VIP', 10, 20),
      makeOrder('STD-1', 'STANDARD', 5, 180),
      makeOrder('STD-2', 'STANDARD', 5, 180),
    ];
    const allocations = allocateStockForSku('SKU-001', orders, makeBins(5), new Date());
    setResult({
      title: 'Stock Shortage Conflict',
      summary: '1 VIP order + 2 Standard orders competing for the last 5 units of SKU-001.',
      allocations,
    });
  }

  function runFlashRush() {
    const orders: Order[] = [];
    for (let i = 1; i <= 50; i++) {
      const tier = i % 10 === 0 ? 'VIP' : i % 3 === 0 ? 'ENTERPRISE' : 'STANDARD';
      orders.push(makeOrder(`RUSH-${i}`, tier, Math.ceil(Math.random() * 3), 120));
    }
    const allocations = allocateStockForSku('SKU-001', orders, makeBins(80), new Date());
    const critical = orders.filter(o => scoreOrder(o, new Date()).riskLevel === 'CRITICAL').length;
    const fulfilled = allocations.filter(a => a.fullyAllocated).length;
    setResult({
      title: 'Flash Rush Hour',
      summary: `50 orders ingested with strict 2-hour dispatch SLAs. ${fulfilled}/50 fully allocated, ${critical} flagged critical.`,
      allocations: allocations.slice(0, 8), // show top 8 for readability
    });
  }

  function runDamagedItem() {
    setResult({
      title: 'Damaged Item on Pick',
      summary: 'Picker reported a broken unit at Bin A-04 during final packing for ORD-1002. System generated resolution options — see Exception & Incident Command Center below to resolve live.',
      allocations: [],
    });
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Chaos Simulator — Judge Demo Scenarios</h2>
      </div>

      <div className="chaos-buttons">
        <button className="btn-chaos" onClick={runStockShortage}>⚡ Stock Shortage Conflict</button>
        <button className="btn-chaos" onClick={runDamagedItem}>🔧 Damaged Item on Pick</button>
        <button className="btn-chaos" onClick={runFlashRush}>🚀 Flash Rush Hour (50 orders)</button>
      </div>

      {result && (
        <div className="chaos-result">
          <div className="chaos-result-title">{result.title}</div>
          <div className="exception-meta">{result.summary}</div>

          {result.allocations.map(r => (
            <div key={r.orderId} className="allocation-result">
              <div className="allocation-result-title">
                {r.orderId} — requested {r.qtyRequested}, allocated {r.qtyAllocated}
                <span className={r.fullyAllocated ? 'badge badge-ontrack' : 'badge badge-critical'}>
                  {r.fullyAllocated ? 'FULFILLED' : 'SHORTFALL'}
                </span>
              </div>
              {r.logs.map(log => (
                <div key={log.logId} className="allocation-reason">→ {log.reason}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}