

import { useState } from 'react';
import type { Order } from './types';
import { scoreOrder } from './engine/scoring';
import { allocateStockForSku, type AllocationResult } from './engine/allocation';
import { mockOrders, mockBins } from './data/mockData';
import './App.css';
import ExceptionPanel from './components/ExceptionPanel';
import WarehouseMap from './components/WarehouseMap';
import TelemetryPanel from './components/TelemetryPanel';
import ChaosSimulator from './components/ChaosSimulator';



function tierBadgeClass(tier: string) {
  if (tier === 'VIP') return 'badge badge-vip';
  if (tier === 'ENTERPRISE') return 'badge badge-enterprise';
  return 'badge badge-standard';
}

function riskBadgeClass(risk: string) {
  if (risk === 'CRITICAL') return 'badge badge-critical';
  if (risk === 'AT_RISK') return 'badge badge-atrisk';
  return 'badge badge-ontrack';
}

export default function App() {
  const [orders] = useState<Order[]>(mockOrders);
  const [allocationLog, setAllocationLog] = useState<AllocationResult[] | null>(null);

  const now = new Date();
  const scoredOrders = orders
    .map(o => ({ order: o, breakdown: scoreOrder(o, now) }))
    .sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

  function runAllocationDemo() {
    const binsCopy = JSON.parse(JSON.stringify(mockBins));
    const competingForSku001 = orders.filter(o =>
      o.lineItems.some(l => l.sku === 'SKU-001')
    );
    const results = allocateStockForSku('SKU-001', competingForSku001, binsCopy, now);
    setAllocationLog(results);
  }

  return (
    <div className="app">
      <header className="header">
        <h1>NexusWMS</h1>
        <span className="subtitle">Autonomous Fulfillment Decision Engine</span>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Order Queue — Prioritized</h2>
          <button className="btn-primary" onClick={runAllocationDemo}>
            Run Allocation Engine (SKU-001 Conflict)
          </button>
        </div>

        <table className="order-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Tier</th>
              <th>Delivery</th>
              <th>Priority Score</th>
              <th>Risk</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {scoredOrders.map(({ order, breakdown }) => (
              <tr key={order.orderId}>
                <td>{order.orderId}</td>
                <td><span className={tierBadgeClass(order.customerTier)}>{order.customerTier}</span></td>
                <td>{order.deliveryMethod.replace('_', ' ')}</td>
                <td className="score-cell">{breakdown.totalScore.toFixed(1)}</td>
                <td><span className={riskBadgeClass(breakdown.riskLevel)}>{breakdown.riskLevel.replace('_', ' ')}</span></td>
                <td>{order.lineItems.map(l => `${l.sku} x${l.qtyRequested}`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <ChaosSimulator />
      <TelemetryPanel />
      <WarehouseMap />
      <ExceptionPanel />
      {allocationLog && (
        <section className="panel">
          <h2>Allocation Decision Log</h2>
          {allocationLog.map(r => (
            <div key={r.orderId} className="allocation-result">
              <div className="allocation-result-title">
                {r.orderId} — requested {r.qtyRequested}, allocated {r.qtyAllocated}
                <span className={r.fullyAllocated ? 'badge badge-ontrack' : 'badge badge-critical'}>
                  {r.fullyAllocated ? 'FULLY ALLOCATED' : 'SHORTFALL'}
                </span>
              </div>
              {r.logs.map(log => (
                <div key={log.logId} className="allocation-reason">→ {log.reason}</div>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}